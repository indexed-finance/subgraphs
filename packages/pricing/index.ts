import {
  ADDRESS_ZERO,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_1E6,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  UNISWAP_FACTORY_ADDRESS,
  USDT_WETH_PAIR,
  USDT_ADDRESS,
  WETH_ADDRESS,
  REWARDS_TOKEN_ADDRESS,
  DAI_ADDRESS,
  BIG_INT_ZERO
} from 'const'
import { convertTokenToDecimal } from 'utils'
import { Address, Bytes, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts'

import { Factory as FactoryContract } from 'multitokenstaking/generated/MultiTokenStaking/Factory'
import { Pair as PairContract } from 'multitokenstaking/generated/MultiTokenStaking/Pair'

function getDecimals(address: Address): BigInt {
  let  contract = PairContract.bind(address)

  // try types uint8 for decimals
  let decimalValue = null

  let decimalResult = contract.try_decimals()

  if (!decimalResult.reverted) {
    decimalValue = decimalResult.value
  }

  return BigInt.fromI32(decimalValue as i32)
}

export function getPairReserves(
  token: Address,
  tokenDecimals: BigInt,
  quoteToken: Address,
  quoteTokenDecimals: BigInt
): BigDecimal[] {
  let sorted = sortTokens(token, quoteToken);
  let pairAddress = getPairAddress(token, quoteToken)
  let pair = PairContract.bind(pairAddress)
  let reserves = pair.try_getReserves()
  if (reserves.reverted) {
    return [BIG_DECIMAL_ZERO, BIG_DECIMAL_ZERO]
  }
  let ret = new Array<BigDecimal>()
  if (sorted[0].toHexString() == token.toHexString()) {
    ret.push(convertTokenToDecimal(reserves.value.value0, tokenDecimals))
    ret.push(convertTokenToDecimal(reserves.value.value1, quoteTokenDecimals))
  } else {
    ret.push(convertTokenToDecimal(reserves.value.value1, tokenDecimals))
    ret.push(convertTokenToDecimal(reserves.value.value0, quoteTokenDecimals))
  }
  return ret;
}

// Returns the price of `token` in terms of `quoteToken`
export function getTokenPrice(
  token: Address,
  tokenDecimals: BigInt,
  quoteToken: Address,
  quoteTokenDecimals: BigInt
): BigDecimal {
  if (token.equals(quoteToken)) {
    return BIG_DECIMAL_ONE;
  }
  let reserves = getPairReserves(token, tokenDecimals, quoteToken, quoteTokenDecimals);
  if (reserves[0].equals(BIG_DECIMAL_ZERO)) {
    return BIG_DECIMAL_ZERO
  }
  // Price of token is quoteReserves / tokenReserves
  return reserves[1].div(reserves[0]);
}

// Returns the price of ether in terms of USDT
export function getEthPriceUsd(): BigDecimal {
  return getTokenPrice(
    WETH_ADDRESS,
    BigInt.fromString('18'),
    USDT_ADDRESS,
    BigInt.fromString('18')
  );
}

// Returns the price of USDT in terms of ether
export function getUsdPriceEth(): BigDecimal {
  return getTokenPrice(
    USDT_ADDRESS,
    BigInt.fromString('18'),
    WETH_ADDRESS,
    BigInt.fromString('18')
  );
}

// Address, tokenDecimals: BigInt
export function getTokenPriceUSD(token: Address, decimals: BigInt): BigDecimal {
  // Get the price of the token in terms of eth
  let tokenPriceEth = getTokenPrice(
    token,
    decimals,
    WETH_ADDRESS,
    BigInt.fromString('18'),
  );
  let ethPriceUsd = getEthPriceUsd();
  return tokenPriceEth.times(ethPriceUsd);
}


export function getUSDRate(token: Address, decimals: BigInt): BigDecimal {
  log.info('Getting USD Rate for: {}', [token.toHexString()])
  let usdt = BIG_DECIMAL_ONE
  // Check if the token is a Uniswap pair

  let tokenAsPair = PairContract.bind(token)
  let reservesResult = tokenAsPair.try_getReserves()

  if (reservesResult.reverted) {
    // If it isn't a Uniswap pair, get the price using the ETH price vs. the price of ETH
    return getTokenPriceUSD(token, decimals)
    // if (token != USDT_ADDRESS) {
    //   let address = USDT_WETH_PAIR
  
    //   let tokenPriceETH = getEthRate(token)

    //   if (tokenPriceETH.equals(BIG_DECIMAL_ZERO)) {
    //     return tokenPriceETH
    //   }
  
    //   let pair = PairContract.bind(address)
  
    //   let reserves = pair.getReserves()
  
    //   let reserve0 = reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18)
  
    //   let reserve1 = reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18)
  
    //   let ethPriceUSD = reserve1.div(reserve0).div(BIG_DECIMAL_1E6).times(BIG_DECIMAL_1E18)
  
    //   return ethPriceUSD.times(tokenPriceETH)
    // }
  } else {
    // If it is a Uniswap pair, get the price using the underlying tokens
    let totalSupply = tokenAsPair.totalSupply()
    if (totalSupply.equals(BIG_INT_ZERO)) {
      return BIG_DECIMAL_ZERO
    }
    let share = BIG_DECIMAL_ONE.div(totalSupply.toBigDecimal())

    let token0Amount = reservesResult.value.value0.toBigDecimal().times(share)

    let token1Amount = reservesResult.value.value1.toBigDecimal().times(share)

    let token0 = tokenAsPair.token0()
    let token1 = tokenAsPair.token1()
    let token0PriceUSD = getUSDRate(token0, getDecimals(token0))

    let token1PriceUSD = getUSDRate(token1, getDecimals(token1))

    let token0USD = token0Amount.times(token0PriceUSD)

    let token1USD = token1Amount.times(token1PriceUSD)

    return token0USD.plus(token1USD)
  }

  return usdt
}

export function sortTokens(tokenA: Address, tokenB: Address): Address[] {
  let ret = new Array<Address>()
  let a = BigInt.fromUnsignedBytes(Bytes.fromHexString(tokenA.toHexString()).reverse() as Bytes)
  let b = BigInt.fromUnsignedBytes(Bytes.fromHexString(tokenB.toHexString()).reverse() as Bytes)
  if (a.lt(b)) {
    ret.push(tokenA)
    ret.push(tokenB)
  } else {
    ret.push(tokenB)
    ret.push(tokenA)
  }
  return ret
}

export function getPairAddress(tokenA: Address, tokenB: Address): Address {
  let factory = FactoryContract.bind(UNISWAP_FACTORY_ADDRESS)
  let sorted = sortTokens(tokenA, tokenB)
  let pairAddress = factory.getPair(sorted[0], sorted[1])

  // Not handled because all tokens in current subgraph necessarily have an eth pair
  // if (pairAddress.toHexString() == ADDRESS_ZERO) {
  //   return null
  // }
  return pairAddress
}

export function getEthRate(token: Address): BigDecimal {
  let eth = BIG_DECIMAL_ONE

  if (token != WETH_ADDRESS) {
    let address = getPairAddress(token, WETH_ADDRESS)

    if (address == ADDRESS_ZERO) {
      log.info('Adress ZERO...', [])
      return BIG_DECIMAL_ZERO
    }

    let pair = PairContract.bind(address)

    let reserves = pair.getReserves()

    eth =
      pair.token0().equals(WETH_ADDRESS)
        ? reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value1.toBigDecimal())
        : reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal())

    return eth.div(BIG_DECIMAL_1E18)
  }

  return eth
}

export function getRewardsTokenPrice(): BigDecimal {
  return getUSDRate(REWARDS_TOKEN_ADDRESS, BigInt.fromString('18'))
}