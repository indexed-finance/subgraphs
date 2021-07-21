import { Address, BigInt } from '@graphprotocol/graph-ts'
import { ADAPTER_REGISTRY_ADDRESS, ADDRESS_ZERO, BIG_INT_ONE } from 'const'
import { BIG_INT_ZERO } from 'const/index.template'
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
  let token = UnderlyingToken.load(address.toString()) as UnderlyingToken
  let registry = getRegistry()
  token.registry = ADDRESS_ZERO.toString()
  token.save()
  registry.supportedTokensCount = registry.supportedTokensCount.minus(BIG_INT_ONE)
  registry.save()
}

export function removeProtocolAdapter(id: BigInt): void {
  let adapter = ProtocolAdapter.load(id.toString()) as ProtocolAdapter
  let registry = getRegistry()
  adapter.registry = ADDRESS_ZERO.toString()
  adapter.save()
  registry.protocolAdaptersCount = registry.protocolAdaptersCount.minus(BIG_INT_ONE)
  registry.save()
}

export function removeTokenAdapter(address: Address): void {
  let adapter = TokenAdapter.load(address.toString()) as TokenAdapter
  let underlying = getOrCreateUnderlyingToken(Address.fromString(adapter.underlying))
  let registry = getRegistry()
  adapter.registry = ADDRESS_ZERO.toString()
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
  let registry = Registry.load(ADAPTER_REGISTRY_ADDRESS.toString())
  if (registry === null) {
    registry = new Registry(ADAPTER_REGISTRY_ADDRESS.toString())
    registry.protocolAdaptersCount = BIG_INT_ZERO
    registry.tokenAdaptersCount = BIG_INT_ZERO
    registry.supportedTokensCount = BIG_INT_ZERO
    registry.save()
  }
  return registry
}

export function getProtocolIdForAdapter(adapter: Address): BigInt {
  let registry = getRegistryContract()
  let protocolAdapterAddress = registry.getProtocolForTokenAdapter(adapter)
  let protocolAdapterId = registry.protocolAdapterIds(protocolAdapterAddress)
  return protocolAdapterId
}

export function getOrCreateProtocolAdapter(id: BigInt): ProtocolAdapter {
  let adapter = ProtocolAdapter.load(id.toString())
  let registry = getRegistry()
  if (adapter === null) {
    adapter = new ProtocolAdapter(id.toString())
    let registryContract = getRegistryContract()
    let adapterAddress = registryContract.protocolAdapters(id)
    ProtocolAdapterTemplate.create(adapterAddress)
    let adapterContract = ProtocolAdapterContract.bind(adapterAddress)
    adapter.address = adapterAddress
    adapter.name = adapterContract.protocol()
    adapter.tokenAdaptersCount = BIG_INT_ZERO
    adapter.registry = registry.id
    adapter.save()
    registry.protocolAdaptersCount = registry.protocolAdaptersCount.plus(BIG_INT_ONE)
    registry.save()
  } else if (Address.fromString(adapter.registry).equals(ADDRESS_ZERO)) {
    adapter.registry = registry.id
    adapter.save()
    registry.protocolAdaptersCount = registry.protocolAdaptersCount.plus(BIG_INT_ONE)
    registry.save()
  }
  return adapter
}

export function getOrCreateUnderlyingToken(address: Address): UnderlyingToken {
  let token = UnderlyingToken.load(address.toString())
  let registry = getRegistry()
  if (token === null) {
    token = new UnderlyingToken(address.toString())
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
  return token
}

export function getOrCreateWrapperToken(
  address: Address,
  underlying: UnderlyingToken,
  protocol: ProtocolAdapter
): WrapperToken {
  let wrapper = WrapperToken.load(address.toString())
  if (wrapper === null) {
    wrapper = new WrapperToken(address.toString())
    wrapper.decimals = getDecimals(address)
    wrapper.name = getName(address)
    wrapper.symbol = getSymbol(address)
    wrapper.underlying = underlying.id
    wrapper.protocol = protocol.id
    wrapper.save()
  }
  return wrapper
}
//#endregion getters