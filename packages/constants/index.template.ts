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

export const REWARDS_TOKEN_ADDRESS = Address.fromString('{{ rewards_token_address }}')

export const WETH_ADDRESS = Address.fromString('{{ weth_address }}')

export const USDT_ADDRESS = Address.fromString('{{ usdt_address }}')

export const USDC_ADDRESS = Address.fromString('{{ usdc_address }}')

export const DAI_ADDRESS = Address.fromString('{{ dai_address }}')

/** ========= Factories ========= */

export const UNISWAP_FACTORY_ADDRESS = Address.fromString('{{ uniswap_factory_address }}')

/** ========= Other ========= */

export const MULTI_TOKEN_STAKING_ADDRESS = Address.fromString('{{ multi_token_staking_address }}')

/** ========= Uniswap Pairs ========= */

export const USDC_WETH_PAIR = Address.fromString('{{ usdc_weth_pair }}')

export const DAI_WETH_PAIR = Address.fromString('{{ dai_weth_pair }}')

export const USDT_WETH_PAIR = Address.fromString('{{ usdt_weth_pair }}')