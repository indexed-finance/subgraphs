import { Address } from '@graphprotocol/graph-ts'
import { ADDRESS_ZERO, BIG_INT_ONE } from 'const'
import {
  ProtocolAdapterAdded,
  ProtocolAdapterRemoved,
  TokenAdapterAdded,
  TokenAdapterRemoved,
  TokenSupportAdded,
  TokenSupportRemoved
} from '../generated/AdapterRegistry/AdapterRegistry'
import {
  Erc20Adapter as TokenAdapterContract,
} from '../generated/AdapterRegistry/Erc20Adapter'
import { AdapterFrozen, AdapterUnfrozen, MarketFrozen, MarketUnfrozen } from '../generated/AdapterRegistry/ProtocolAdapter'
import { FrozenAdapter, FrozenToken, TokenAdapter } from '../generated/schema'
import { ProtocolAdapter as ProtocolAdapterTemplate } from '../generated/templates'
import {
  getOrCreateUnderlyingToken,
  getOrCreateProtocolAdapter,
  getOrCreateWrapperToken,
  getRegistry,
  removeProtocolAdapter,
  removeUnderlyingToken,
  removeTokenAdapter,
  getRegistryContract
} from './utils'

export function protocolAdapterAdded(event: ProtocolAdapterAdded): void {
  let id = event.params.protocolId
  getOrCreateProtocolAdapter(id)
}

export function protocolAdapterRemoved(event: ProtocolAdapterRemoved): void {
  removeProtocolAdapter(event.params.protocolId)
}

export function tokenAdapterAdded(event: TokenAdapterAdded): void {
  let address = event.params.adapter
  let adapter = TokenAdapter.load(address.toString())
  let registry = getRegistry()
  let protocolAdapter = getOrCreateProtocolAdapter(event.params.protocolId)
  let underlying = getOrCreateUnderlyingToken(event.params.underlying)
  if (adapter === null) {
    adapter = new TokenAdapter(address.toString())
    let adapterContract = TokenAdapterContract.bind(address)
    let wrapper = getOrCreateWrapperToken(address, underlying, protocolAdapter)
    adapter.name = adapterContract.name()
    adapter.protocol = protocolAdapter.id
    adapter.underlying = underlying.id
    adapter.wrapper = wrapper.id
  }
  adapter.registry = registry.id
  adapter.save()
  registry.tokenAdaptersCount = registry.tokenAdaptersCount.plus(BIG_INT_ONE)
  registry.save()
  underlying.tokenAdaptersCount = underlying.tokenAdaptersCount.plus(BIG_INT_ONE)
  underlying.save()
}


export function tokenAdapterRemoved(event: TokenAdapterRemoved): void {
  removeTokenAdapter(event.params.adapter)
}


export function tokenSupportAdded(event: TokenSupportAdded): void {
  getOrCreateUnderlyingToken(event.params.underlying)
}


export function tokenSupportRemoved(event: TokenSupportRemoved): void {
  removeUnderlyingToken(event.params.underlying)
}

export function tokenFrozen(event: MarketFrozen): void {
  let registry = getRegistryContract()
  let protocolId = registry.protocolAdapterIds(event.address).toString()
  let token = event.params.token.toString()
  let id = protocolId.toString().concat('-').concat(token)
  let frozenToken = FrozenToken.load(id)
  if (frozenToken === null) {
    frozenToken = new FrozenToken(id)
  }
  frozenToken.token = token
  frozenToken.protocol = protocolId
  frozenToken.save()
}

export function tokenUnfrozen(event: MarketUnfrozen): void {
  let registry = getRegistryContract()
  let protocolId = registry.protocolAdapterIds(event.address).toString()
  let token = event.params.token.toString()
  let id = protocolId.toString().concat('-').concat(token)
  let frozenToken = FrozenToken.load(id)
  if (frozenToken === null) {
    frozenToken = new FrozenToken(id)
  }
  frozenToken.token = ADDRESS_ZERO.toString()
  frozenToken.protocol = ADDRESS_ZERO.toString()
  frozenToken.save()
}

export function adapterFrozen(event: AdapterFrozen): void {
  let adapter = TokenAdapter.load(event.params.adapter.toString()) as TokenAdapter
  let id = adapter.protocol.concat('-').concat(adapter.id)
  let frozenAdapter = FrozenAdapter.load(id)
  if (frozenAdapter === null) {
    frozenAdapter = new FrozenAdapter(id)
  }
  frozenAdapter.adapter = adapter.id
  frozenAdapter.protocol = adapter.protocol
  frozenAdapter.save()
}

export function adapterUnfrozen(event: AdapterUnfrozen): void {
  let adapter = TokenAdapter.load(event.params.adapter.toString()) as TokenAdapter
  let id = adapter.protocol.concat('-').concat(adapter.id)
  let frozenAdapter = FrozenAdapter.load(id)
  if (frozenAdapter === null) {
    frozenAdapter = new FrozenAdapter(id)
  }
  frozenAdapter.adapter = ADDRESS_ZERO.toString()
  frozenAdapter.protocol = ADDRESS_ZERO.toString()
  frozenAdapter.save()
}