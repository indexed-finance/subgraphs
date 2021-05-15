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
  REWARDS_TOKEN_ADDRESS
} from 'const'
import { Address, BigDecimal, log } from '@graphprotocol/graph-ts'

import { Factory as FactoryContract } from 'multitokenstaking/generated/MultiTokenStaking/Factory'
import { Pair as PairContract } from 'multitokenstaking/generated/MultiTokenStaking/Pair'

export function getUSDRate(token: Address): BigDecimal {
  let usdt = BIG_DECIMAL_ONE

  // Check if the token is a Uniswap pair

  const tokenAsPair = PairContract.bind(token)
  const reservesResult = tokenAsPair.try_getReserves()

  if (reservesResult.reverted) {
    // If it isn't a Uniswap pair, get the price using the ETH price vs. the price of ETH
    if (token != USDT_ADDRESS) {
      let address = USDT_WETH_PAIR
  
      const tokenPriceETH = getEthRate(token)
  
      const pair = PairContract.bind(address)
  
      const reserves = pair.getReserves()
  
      const reserve0 = reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18)
  
      const reserve1 = reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18)
  
      const ethPriceUSD = reserve1.div(reserve0).div(BIG_DECIMAL_1E6).times(BIG_DECIMAL_1E18)
  
      return ethPriceUSD.times(tokenPriceETH)
    }
  } else {
    // If it is a Uniswap pair, get the price using the underlying tokens
    const totalSupply = tokenAsPair.totalSupply()

    const share = BIG_DECIMAL_ONE.div(totalSupply.toBigDecimal())

    const token0Amount = reservesResult.value.value0.toBigDecimal().times(share)

    const token1Amount = reservesResult.value.value1.toBigDecimal().times(share)

    const token0PriceUSD = getUSDRate(tokenAsPair.token0())

    const token1PriceUSD = getUSDRate(tokenAsPair.token1())

    const token0USD = token0Amount.times(token0PriceUSD)

    const token1USD = token1Amount.times(token1PriceUSD)

    return token0USD.plus(token1USD)
  }

  return usdt
}

export function getEthRate(token: Address): BigDecimal {
  let eth = BIG_DECIMAL_ONE

  if (token != WETH_ADDRESS) {
    const factory = FactoryContract.bind(UNISWAP_FACTORY_ADDRESS)

    const address = factory.getPair(token, WETH_ADDRESS)

    if (address == ADDRESS_ZERO) {
      log.info('Adress ZERO...', [])
      return BIG_DECIMAL_ZERO
    }

    const pair = PairContract.bind(address)

    const reserves = pair.getReserves()

    eth =
      pair.token0() == WETH_ADDRESS
        ? reserves.value0.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value1.toBigDecimal())
        : reserves.value1.toBigDecimal().times(BIG_DECIMAL_1E18).div(reserves.value0.toBigDecimal())

    return eth.div(BIG_DECIMAL_1E18)
  }

  return eth
}

export function getRewardsTokenPrice(): BigDecimal {
  return getUSDRate(REWARDS_TOKEN_ADDRESS)
}