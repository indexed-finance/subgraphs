import { Address, BigDecimal, BigInt } from '@graphprotocol/graph-ts'

/** ========= Numbers & Bytes ========= */

export let BIG_INT_18 = BigInt.fromI32(18)

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

export let REWARDS_TOKEN_ADDRESS = Address.fromString('0x86772b1409b61c639eaac9ba0acfbb6e238e5f83')

export let WETH_ADDRESS = Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')

export let USDT_ADDRESS = Address.fromString('0xdac17f958d2ee523a2206206994597c13d831ec7')

export let USDC_ADDRESS = Address.fromString('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')

export let DAI_ADDRESS = Address.fromString('0x6b175474e89094c44da98b954eedeac495271d0f')

/** ========= Factories ========= */

export let UNISWAP_FACTORY_ADDRESS = Address.fromString('0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f')

/** ========= Other ========= */

export let ADAPTER_REGISTRY_ADDRESS = Address.fromString('0x5F2945604013Ee9f80aE2eDDb384462B681859C4')

export let MULTI_TOKEN_STAKING_ADDRESS = Address.fromString('0xC46E0E7eCb3EfCC417f6F89b940FFAFf72556382')

export let MASTER_CHEF_ADDRESS = Address.fromString('0xc2edad668740f1aa35e4d8f227fb8e17dca888cd')

export let SUSHI_TOKEN_ADDRESS = Address.fromString('0x6b3595068778dd592e39a122f4f5a5cf09c90fe2')

export let TIME_LOCK_ADDRESS = Address.fromString('0xEE285F0Ef0cb1d103A64A85E5A0EDFEdcB53900f')

export let DNDX_ADDRESS = Address.fromString('0x262cd9ADCE436B6827C01291B84f1871FB8b95A3')

export let MASTER_CHEF_START_BLOCK = BigInt.fromI32(10750000)

export let UNISWAP_SUSHI_ETH_PAIR_FIRST_LIQUDITY_BLOCK = BigInt.fromI32(10750005)

/** ========= Uniswap Pairs ========= */

export let USDC_WETH_PAIR = Address.fromString('0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc')

export let DAI_WETH_PAIR = Address.fromString('0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11')

export let USDT_WETH_PAIR = Address.fromString('0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852')

export let UNISWAP_SUSHI_USDT_PAIR_ADDRESS = Address.fromString('0xe3ffab89e53422f468be955e7011932efe80aa26')

export let SUSHI_USDT_PAIR_ADDRESS = Address.fromString('0x680a025da7b1be2c204d7745e809919bce074026')

/** ========= Governance Status ========= */

export const STATUS_PENDING = "PENDING";

export const STATUS_CANCELLED = "CANCELLED";

export const STATUS_EXECUTED = "EXECUTED";

export const STATUS_QUEUED = "QUEUED";

export const STATUS_ACTIVE = "ACTIVE";