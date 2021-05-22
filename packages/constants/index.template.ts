import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

/** ========= Numbers & Bytes ========= */

export const BIG_INT_18 = BigInt.fromI32(18)

export let ADDRESS_ZERO = Address.fromString('0x0000000000000000000000000000000000000000')

export let BIG_DECIMAL_1E6 = BigDecimal.fromString('1e6')

export let BIG_DECIMAL_1E12 = BigDecimal.fromString('1e12')

export let BIG_DECIMAL_1E18 = BigDecimal.fromString('1e18')

export let BIG_DECIMAL_ZERO = BigDecimal.fromString('0')

export let BIG_DECIMAL_ONE = BigDecimal.fromString('1')

export let BIG_INT_ONE = BigInt.fromI32(1)

export let BIG_INT_TWO = BigInt.fromI32(2)

export let BIG_INT_ONE_HUNDRED = BigInt.fromI32(100)

export let BIG_INT_ONE_DAY_SECONDS = BigInt.fromI32(86400)

export let BIG_INT_ZERO = BigInt.fromI32(0)

export let NULL_CALL_RESULT_VALUE = '0x0000000000000000000000000000000000000000000000000000000000000001'

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
export let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('0')

// minimum liquidity for price to get tracked
export let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('5')

/** ========= Tokens ========= */

export let REWARDS_TOKEN_ADDRESS = Address.fromString('{{ rewards_token_address }}')

export let WETH_ADDRESS = Address.fromString('{{ weth_address }}')

export let USDT_ADDRESS = Address.fromString('{{ usdt_address }}')

export let USDC_ADDRESS = Address.fromString('{{ usdc_address }}')

export let DAI_ADDRESS = Address.fromString('{{ dai_address }}')

/** ========= Factories ========= */

export let UNISWAP_FACTORY_ADDRESS = Address.fromString('{{ uniswap_factory_address }}')

/** ========= Other ========= */

export let MULTI_TOKEN_STAKING_ADDRESS = Address.fromString('{{ multi_token_staking_address }}')

/** ========= Uniswap Pairs ========= */

export let USDC_WETH_PAIR = Address.fromString('{{ usdc_weth_pair }}')

export let DAI_WETH_PAIR = Address.fromString('{{ dai_weth_pair }}')

export let USDT_WETH_PAIR = Address.fromString('{{ usdt_weth_pair }}')

/** ========= Governance Status ========= */

export const STATUS_PENDING = "PENDING";

export const STATUS_CANCELLED = "CANCELLED";

export const STATUS_EXECUTED = "EXECUTED";

export const STATUS_QUEUED = "QUEUED";

export const STATUS_ACTIVE = "ACTIVE";