import { Address, BigInt, log } from '@graphprotocol/graph-ts'
import { ADAPTER_REGISTRY_ADDRESS, ADDRESS_ZERO, BIG_INT_ZERO, BIG_INT_ONE } from 'const'
import { getDecimals, getName, getSymbol } from '../../../packages/utils'
import {
  AdapterRegistry as RegistryContract,
} from '../generated/AdapterRegistry/AdapterRegistry'
import {
  ProtocolAdapter as ProtocolAdapterContract,
} from '../generated/AdapterRegistry/ProtocolAdapter'
import {
  Registry,
  ProtocolAdapter,
  UnderlyingToken,
  WrapperToken,
  TokenAdapter
} from '../generated/schema'
import { ProtocolAdapter as ProtocolAdapterTemplate } from '../generated/templates'
//#region 

//#region removers
export function removeUnderlyingToken(address: Address): void {
  let token = UnderlyingToken.load(address.toHexString()) as UnderlyingToken
  let registry = getRegistry()
  token.unset('registry')
  token.save()
  registry.supportedTokensCount = registry.supportedTokensCount.minus(BIG_INT_ONE)
  registry.save()
}

export function removeProtocolAdapter(id: BigInt): void {
  let adapter = ProtocolAdapter.load(id.toHexString()) as ProtocolAdapter
  let registry = getRegistry()
  adapter.unset('registry')
  adapter.save()
  registry.protocolAdaptersCount = registry.protocolAdaptersCount.minus(BIG_INT_ONE)
  registry.save()
}

export function removeTokenAdapter(address: Address): void {
  let adapter = TokenAdapter.load(address.toHexString()) as TokenAdapter
  let underlying = getOrCreateUnderlyingToken(Address.fromString(adapter.underlying))
  let registry = getRegistry()
  adapter.unset('registry')
  adapter.save()
  underlying.tokenAdaptersCount = underlying.tokenAdaptersCount.minus(BIG_INT_ONE)
  underlying.save()
  registry.tokenAdaptersCount = registry.tokenAdaptersCount.minus(BIG_INT_ONE)
  registry.save()
}
//#endregion removers

//#region getters
export function getRegistryContract(): RegistryContract {
  return RegistryContract.bind(ADAPTER_REGISTRY_ADDRESS)
}

export function getRegistry(): Registry {
  let registry = Registry.load(ADAPTER_REGISTRY_ADDRESS.toHexString())
  if (registry === null) {
    registry = new Registry(ADAPTER_REGISTRY_ADDRESS.toHexString())
    registry.protocolAdaptersCount = BIG_INT_ZERO
    registry.tokenAdaptersCount = BIG_INT_ZERO
    registry.supportedTokensCount = BIG_INT_ZERO
    registry.save()
  }
  return registry as Registry
}

export function getProtocolIdForAdapter(adapter: Address): BigInt {
  let registry = getRegistryContract()
  let protocolAdapterAddress = registry.getProtocolForTokenAdapter(adapter)
  let protocolAdapterId = registry.protocolAdapterIds(protocolAdapterAddress)
  return protocolAdapterId
}

export function getOrCreateProtocolAdapter(id: BigInt): ProtocolAdapter {
  log.info('Getting or creating protocol adapter: {}', [id.toString()])
  let adapter = ProtocolAdapter.load(id.toString())
  let registry = getRegistry()
  if (adapter === null) {
    log.info('Creating protocol adapter: {}', [id.toString()])
    adapter = new ProtocolAdapter(id.toString())
    let registryContract = getRegistryContract()
    let adapterAddress = registryContract.protocolAdapters(id)
    log.info('Got protocol adapter address: {}', [adapterAddress.toHexString()])
    ProtocolAdapterTemplate.create(adapterAddress)
    let adapterContract = ProtocolAdapterContract.bind(adapterAddress)
    adapter.address = adapterAddress
    if (adapterAddress.equals(Address.fromString('0xd80526efbcc066b771028d96b4eb8354124556e4'))) {
      adapter.name = "Fulcrum"
    } else {
      adapter.name = adapterContract.protocol()
    }
    adapter.tokenAdaptersCount = BIG_INT_ZERO
    adapter.registry = registry.id
    adapter.save()
    registry.protocolAdaptersCount = registry.protocolAdaptersCount.plus(BIG_INT_ONE)
    registry.save()
  }
  // if (Address.fromString(adapter.registry) === ADDRESS_ZERO) {
  //   adapter.registry = registry.id
  //   adapter.save()
  //   registry.protocolAdaptersCount = registry.protocolAdaptersCount.plus(BIG_INT_ONE)
  //   registry.save()
  // }
  return adapter as ProtocolAdapter
}

export function getOrCreateUnderlyingToken(address: Address): UnderlyingToken {
  let token = UnderlyingToken.load(address.toHexString())
  let registry = getRegistry()
  if (token === null) {
    token = new UnderlyingToken(address.toHexString())
    token.decimals = getDecimals(address)
    token.name = getName(address)
    token.symbol = getSymbol(address)
    token.tokenAdaptersCount = BIG_INT_ZERO
    token.registry = registry.id
    token.save()
    registry.supportedTokensCount = registry.supportedTokensCount.plus(BIG_INT_ONE)
    registry.save()
  } else if (Address.fromString(token.registry).equals(ADDRESS_ZERO)) {
    token.registry = registry.id
    token.save()
    registry.supportedTokensCount = registry.supportedTokensCount.plus(BIG_INT_ONE)
    registry.save()
  }
  return token as UnderlyingToken
}

export function getOrCreateWrapperToken(
  address: Address,
  underlying: UnderlyingToken,
  protocol: ProtocolAdapter
): WrapperToken {
  let wrapper = WrapperToken.load(address.toHexString())
  if (wrapper === null) {
    wrapper = new WrapperToken(address.toHexString())
    wrapper.decimals = getDecimals(address)
    wrapper.name = getName(address)
    wrapper.symbol = getSymbol(address)
    wrapper.underlying = underlying.id
    wrapper.protocol = protocol.id
    wrapper.save()
  }
  return wrapper as WrapperToken
}
//#endregion getters