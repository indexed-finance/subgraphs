import {
  ADDRESS_ZERO,
  BIG_DECIMAL_ONE,
  BIG_DECIMAL_ZERO,
  DAI_WETH_PAIR,
  UNISWAP_FACTORY_ADDRESS,
  MINIMUM_LIQUIDITY_THRESHOLD_ETH,
  USDC_WETH_PAIR,
  USDT_WETH_PAIR,
  WETH_ADDRESS,
} from 'const'
import { WHITELIST } from './exchange-constants'
import { Address, BigDecimal, ethereum, log } from '@graphprotocol/graph-ts'
import { Pair, Token } from '../../generated/schema'

import { Factory as FactoryContract } from '../../generated/templates/Pair/Factory'

export const factoryContract = FactoryContract.bind(UNISWAP_FACTORY_ADDRESS)

export function getEthPrice(): BigDecimal {
  // fetch eth prices for each stablecoin
  const daiPair = Pair.load(DAI_WETH_PAIR) // dai is token0
  const usdcPair = Pair.load(USDC_WETH_PAIR) // usdc is token0
  const usdtPair = Pair.load(USDT_WETH_PAIR) // usdt is token1

  // all 3 have been created, get the weighted average of them
  if (daiPair !== null && usdcPair !== null && usdtPair !== null) {
    const totalLiquidityETH = daiPair.reserve1.plus(usdcPair.reserve1).plus(usdtPair.reserve0)
    const daiWeight = daiPair.reserve1.div(totalLiquidityETH)
    const usdcWeight = usdcPair.reserve1.div(totalLiquidityETH)
    const usdtWeight = usdtPair.reserve0.div(totalLiquidityETH)
    return daiPair.token0Price
      .times(daiWeight)
      .plus(usdcPair.token0Price.times(usdcWeight))
      .plus(usdtPair.token1Price.times(usdtWeight))
    // dai and USDC have been created
  } else if (daiPair !== null && usdcPair !== null) {
    const totalLiquidityETH = daiPair.reserve1.plus(usdcPair.reserve1)
    const daiWeight = daiPair.reserve1.div(totalLiquidityETH)
    const usdcWeight = usdcPair.reserve1.div(totalLiquidityETH)
    return daiPair.token0Price.times(daiWeight).plus(usdcPair.token0Price.times(usdcWeight))
    // USDC is the only pair so far
  } else if (usdcPair !== null) {
    return usdcPair.token0Price
  } else {
    log.warning('No eth pair...', [])
    return BIG_DECIMAL_ZERO
  }
}

export function findEthPerToken(token: Token): BigDecimal {
  if (Address.fromString(token.id) == WETH_ADDRESS) {
    return BIG_DECIMAL_ONE
  }

  // loop through whitelist and check if paired with any
  // TODO: This is slow, and this function is called quite often.
  // What could we do to improve this?
  for (let i = 0; i < WHITELIST.length; ++i) {
    // TODO: Cont. This would be a good start, by avoiding multiple calls to getPair...
    const pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress != ADDRESS_ZERO) {
      const pair = Pair.load(pairAddress.toHex())
      if (pair.token0 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        const token1 = Token.load(pair.token1)
        return pair.token1Price.times(token1.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      }
      if (pair.token1 == token.id && pair.reserveETH.gt(MINIMUM_LIQUIDITY_THRESHOLD_ETH)) {
        const token0 = Token.load(pair.token0)
        return pair.token0Price.times(token0.derivedETH as BigDecimal) // return token0 per our token * ETH per token 0
      }
    }
  }

  return BIG_DECIMAL_ZERO // nothing was found return 0
}
