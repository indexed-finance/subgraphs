import { Address, BigDecimal, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { BIG_DECIMAL_1E18, BIG_INT_ZERO } from 'const';
import { getDecimals, getName, getSymbol } from 'utils';
import { Vault, VaultSnapshot } from '../generated/schema';
import {
  AdapterRemoved,
  AllocationsUpdated,
  FeesClaimed,
  NirnVault,
  Rebalanced,
  SetFeeRecipient,
  SetPerformanceFee,
  SetReserveRatio,
  SetRewardsSeller
} from '../generated/templates/NirnVault/NirnVault'

function fractionE18ToPercent(n: BigInt): BigDecimal {
  return n.toBigDecimal().div(BIG_DECIMAL_1E18)
}

function fractionE18sToPercents(arr: BigInt[]): BigDecimal[] {
  let ret: BigDecimal[] = []
  for (let i = 0; i < arr.length; i++) {
    ret.push(fractionE18ToPercent(arr[i]))
  }
  return ret
}

function addressesToStrings(arr: Address[]): string[] {
  let ret: string[] = []
  for (let i = 0; i < arr.length; i++) {
    ret.push(arr[i].toString())
  }
  return ret
}

function writeAdaptersAndWeights(vault: Vault): void {
  let vaultContract = NirnVault.bind(Address.fromString(vault.id))
  let res = vaultContract.getAdaptersAndWeights()
  vault.adapters = addressesToStrings(res.value0)
  vault.weights = fractionE18sToPercents(res.value1)
}

export function getOrCreateVault(address: Address): Vault {
  let vault = Vault.load(address.toString())
  if (vault === null) {
    vault = new Vault(address.toString())
    let vaultContract = NirnVault.bind(address)
    vault.decimals = getDecimals(address)
    vault.name = getName(address)
    vault.symbol = getSymbol(address)
    vault.underlying = vaultContract.underlying().toString()
    vault.feeRecipient = vaultContract.feeRecipient()
    vault.performanceFee = fractionE18ToPercent(vaultContract.performanceFee())
    vault.reserveRatio = fractionE18ToPercent(vaultContract.reserveRatio())
    vault.rewardsSeller = vaultContract.rewardsSeller()
    vault.totalFeesClaimed = BIG_INT_ZERO
    writeAdaptersAndWeights(vault)
    vault.save()
  }
  return vault
}

function writeSnapshot(
  vault: Vault,
  event: ethereum.Event,
  type: "Daily" | "Rebalance"
): void {
  let timestamp = event.block.timestamp
  let snapshotID: string
  if (type === "Daily") {
    let dayID = timestamp.div(BigInt.fromI32(86400))
    snapshotID = vault.id.concat('-').concat(dayID.toString())
  } else {
    snapshotID = vault.id.concat('-').concat(timestamp.toString())
  }
  let snapshot = VaultSnapshot.load(snapshotID)
  if (snapshot === null) {
    snapshot = new VaultSnapshot(snapshotID)
    snapshot.vault = vault.id
    snapshot.type = type
    snapshot.timestamp = timestamp
    snapshot.adapters = [...vault.adapters]
    snapshot.weights = [...vault.weights]
    let vaultContract = NirnVault.bind(Address.fromString(vault.id))
    snapshot.aprs = fractionE18sToPercents(vaultContract.getAPRs())
    snapshot.apr = fractionE18ToPercent(vaultContract.getAPR())
    snapshot.save()
  }
}

export function updateVault(
  address: Address,
  event: ethereum.Event,
  type: "Daily" | "Rebalance"
): Vault {
  let vault = getOrCreateVault(address)
  writeAdaptersAndWeights(vault)
  vault.save()
  writeSnapshot(vault, event, type)
  return vault
}

export function adapterRemoved(event: AdapterRemoved): void {
  updateVault(event.address, event, "Rebalance")
}

export function allocationsUpdated(event: AllocationsUpdated): void {
  updateVault(event.address, event, "Rebalance")
}

export function totalFeesClaimed(event: FeesClaimed): void {
  let vault = updateVault(event.address, event, "Daily")
  vault.totalFeesClaimed = vault.totalFeesClaimed.plus(event.params.sharesMinted)
  vault.save()
}

export function rebalanced(event: Rebalanced): void {
  updateVault(event.address, event, "Rebalance")
}

export function setFeeRecipient(event: SetFeeRecipient): void {
  let vault = updateVault(event.address, event, "Daily")
  vault.feeRecipient = event.params.feeRecipient
  vault.save()
}

export function setPerformanceFee(event: SetPerformanceFee): void {
  let vault = updateVault(event.address, event, "Daily")
  vault.performanceFee = fractionE18ToPercent(event.params.performanceFee)
  vault.save()
}

export function setReserveRatio(event: SetReserveRatio): void {
  let vault = updateVault(event.address, event, "Daily")
  vault.reserveRatio = fractionE18ToPercent(event.params.reserveRatio)
  vault.save()
}

export function setRewardsSeller(event: SetRewardsSeller): void {
  let vault = updateVault(event.address, event, "Daily")
  vault.rewardsSeller = event.params.rewardsSeller
  vault.save()
}

