import {
  IndexPool,
  PoolUnderlyingToken,
  PoolInitializer as Initializer,
  InitializerToken,
  TokenSeller
} from '../generated/schema';
import { CategoryAdded, CategorySorted, MarketCapSqrtController, TokenAdded, TokenRemoved } from '../generated/MarketCapSqrtController/MarketCapSqrtController';
import { Category, Token, CategoryManager } from '../generated/schema';

import { IPool, PoolInitializer, UnboundTokenSeller } from '../generated/templates';

import { UnboundTokenSeller as SellerContract } from '../generated/templates/UnboundTokenSeller/UnboundTokenSeller';
import { IPool as IPoolContract } from '../generated/templates/IPool/IPool';
import { PoolInitializer as PoolInitializerContract } from '../generated/templates/PoolInitializer/PoolInitializer';

import {
  NewPoolInitializer,
  PoolInitialized
} from '../generated/MarketCapSqrtController/MarketCapSqrtController';

import { BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import { getName, getSymbol , hexToDecimal} from 'utils';
import { BIG_DECIMAL_ZERO , BIG_INT_ZERO} from 'const'
import { getUSDRate, getDecimals } from 'pricing';
import { getCategoryManager } from './categories';

export function handleNewCategory(event: CategoryAdded): void {
  let categoryManager = getCategoryManager();
  categoryManager.categoryIndex++;
  categoryManager.save();
  let category = new Category(event.params.categoryID.toHexString());
  category.metadataHash = event.params.metadataHash;
  category.tokens = [];
  category.save();
}

export function handleTokenAdded(event: TokenAdded): void {
  let categoryID = event.params.categoryID.toHexString();
  let tokenAddress = event.params.token.toHexString();
  let category = Category.load(categoryID);
  let token = Token.load(tokenAddress);
  if (token == null) {
    token = new Token(tokenAddress);
    token.decimals = getDecimals(event.params.token).toI32();
    token.name = getName(event.params.token);
    token.symbol = getSymbol(event.params.token);
    token.priceUSD = getUSDRate(event.params.token, getDecimals(event.params.token))
    token.save();
  }
  if (category.tokens == null) category.tokens = [];
  category.tokens.push(tokenAddress);
  category.save();
}

export function handleTokenRemoved(event: TokenRemoved): void {
  let categoryID = event.params.categoryID.toHexString();
  let tokenAddress = event.params.token.toHexString();
  let category = Category.load(categoryID);
  let tokensList = new Array<string>();
  let categoryTokens = category.tokens;
  for (let i = 0; i < categoryTokens.length; i++) {
    let token = categoryTokens[i];
    if (token.toString() != tokenAddress) {
      tokensList.push(token);
    }
  }
  category.tokens = tokensList;
  category.save();
}

export function handleCategorySorted(event: CategorySorted): void {
  let category = Category.load(event.params.categoryID.toHexString());
  let oracle = MarketCapSqrtController.bind(event.address);
  let tokens = oracle.getCategoryTokens(event.params.categoryID);
  let arr: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    arr.push(tokens[i].toHexString());
  }
  category.tokens = arr;
  category.save();
}

export function handleNewPool(event: NewPoolInitializer): void {
  let categoryID = event.params.categoryID.toHexString();
  let poolAddress = event.params.pool;
  let initializerAddress = event.params.initializer;

  // Start tracking the new pool contract and its initializer
  IPool.create(poolAddress);
  PoolInitializer.create(initializerAddress);


  let initializerContract = PoolInitializerContract.bind(initializerAddress);

  // Create the PoolInitializer entity
  let initializer = new Initializer(initializerAddress.toHexString());
  initializer.pool = poolAddress.toHexString();
  initializer.totalCreditedWETH = new BigInt(0);
  let desiredTokens = initializerContract.getDesiredTokens();
  let desiredAmounts = initializerContract.getDesiredAmounts(desiredTokens);
  for (let i = 0; i < desiredTokens.length; i++) {
    let tokenAddress = desiredTokens[i];
    let tokenID = initializerAddress
      .toHexString()
      .concat('-')
      .concat(tokenAddress.toHexString());
    let token = new InitializerToken(tokenID);
    token.poolInitializer = initializerAddress.toHexString();
    token.token = tokenAddress.toHexString();
    token.balance = new BigInt(0);
    token.targetBalance = desiredAmounts[i];
    token.amountRemaining = desiredAmounts[i];
    token.save();
  }
  initializer.save();

  // Create the IndexPool entity.
  let pool = new IndexPool(poolAddress.toHexString());
  let ipool = IPoolContract.bind(poolAddress);
  pool.category = categoryID;
  pool.size = event.params.indexSize.toI32();
  pool.totalWeight = new BigInt(0);
  pool.totalSupply = new BigInt(0);
  pool.maxTotalSupply = new BigInt(0);
  pool.feesTotalUSD = BIG_DECIMAL_ZERO
  pool.totalValueLockedUSD = BIG_DECIMAL_ZERO
  pool.totalSwapVolumeUSD = BIG_DECIMAL_ZERO
  pool.totalVolumeUSD = BIG_DECIMAL_ZERO
  pool.isPublic = false;
  pool.initialized = false;
  pool.name = ipool.name();
  pool.symbol = ipool.symbol();
  pool.tokensList = new Array<Bytes>()
  let swapFee = ipool.getSwapFee()
  pool.swapFee = hexToDecimal(swapFee.toHexString(), 18);
  pool.exitFee = BIG_DECIMAL_ZERO;
  pool.save();
}

export function handlePoolInitialized(event: PoolInitialized): void {
  let poolAddress = event.params.pool;
  let sellerAddress = event.params.unboundTokenSeller;
  let categoryManager = getCategoryManager();
  let poolsList = categoryManager.poolsList;
  poolsList.push(poolAddress.toHexString());
  categoryManager.poolsList = poolsList;
  categoryManager.save();

  // Start tracking the token seller contract
  UnboundTokenSeller.create(sellerAddress);

  // Create the TokenSeller entity
  let iseller = SellerContract.bind(sellerAddress);
  let seller = new TokenSeller(sellerAddress.toHexString());
  seller.pool = poolAddress.toHexString();
  seller.premium = iseller.getPremiumPercent();
  seller.save();

  // Update the pool contract
  let ipool = IPoolContract.bind(poolAddress);
  let pool = IndexPool.load(poolAddress.toHexString());
  pool.isPublic = true;
  pool.initialized = true;
  pool.totalWeight = ipool.getTotalDenormalizedWeight();
  pool.totalSupply = ipool.totalSupply();
  let swapFee = ipool.getSwapFee();
  pool.swapFee = hexToDecimal(swapFee.toHexString(), 18);
  pool.exitFee = BIG_DECIMAL_ZERO;
  // Set up the pool tokens
  let tokensList = new Array<Bytes>()
  let tokens = ipool.getCurrentTokens();
  for (let i = 0; i < tokens.length; i++) {
    let tokenAddress = tokens[i];
    let record = ipool.getTokenRecord(tokenAddress);
    let tokenID = poolAddress
      .toHexString()
      .concat('-')
      .concat(tokenAddress.toHexString());
    let token = new PoolUnderlyingToken(tokenID);
    token.token = tokenAddress.toHexString();
    token.denorm = record.denorm;
    token.ready = true;
    token.desiredDenorm = record.desiredDenorm;
    token.balance = record.balance;
    token.pool = poolAddress.toHexString();
    token.save();
    tokensList.push(tokenAddress)
  }
  pool.tokensList = tokensList;
  pool.save();
}
