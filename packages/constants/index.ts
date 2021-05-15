import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

/** ========= Numbers & Bytes ========= */

export const ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export const BIG_DECIMAL_1E6 = BigDecimal.fromString('1e6')

export const BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export const BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')

export const BIG_DECIMAL_ZERO = BigDecimal.fromString('0')

export const BIG_DECIMAL_ONE = BigDecimal.fromString('1')

export const BIG_INT_ONE = BigInt.fromI32(1)

export const BIG_INT_TWO = BigInt.fromI32(2)

export const BIG_INT_ONE_HUNDRED = BigInt.fromI32(100)

export const BIG_INT_ONE_DAY_SECONDS = BigInt.fromI32(86400)

export const BIG_INT_ZERO = BigInt.fromI32(0)

export const NULL_CALL_RESULT_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export const MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('0')

// minimum liquidity for price to get tracked
export const MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('5')

/** ========= Tokens ========= */

export const REWARDS_TOKEN_ADDRESS = Address.fromString('0x86772b1409b61c639eaac9ba0acfbb6e238e5f83')

export const WETH_ADDRESS = Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')

export const USDT_ADDRESS = Address.fromString('0xdac17f958d2ee523a2206206994597c13d831ec7')

export const USDC_ADDRESS = Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

export const DAI_ADDRESS = Address.fromString('0x6b175474e89094c44da98b954eedeac495271d0f')

/** ========= Factories ========= */

export const UNISWAP_FACTORY_ADDRESS = Address.fromString('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f')

/** ========= Other ========= */

export const MULTI_TOKEN_STAKING_ADDRESS = Address.fromString('')

/** ========= Uniswap Pairs ========= */

export const USDC_WETH_PAIR = Address.fromString('0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc')

export const DAI_WETH_PAIR = Address.fromString('0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11')

export const USDT_WETH_PAIR = Address.fromString('0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852')