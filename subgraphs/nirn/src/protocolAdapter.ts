import { ADDRESS_ZERO } from 'const'
import { AdapterFrozen, AdapterUnfrozen, MarketFrozen, MarketUnfrozen } from '../generated/AdapterRegistry/ProtocolAdapter'
import { FrozenAdapter, FrozenToken, TokenAdapter } from '../generated/schema'
import { getRegistryContract } from './utils'

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