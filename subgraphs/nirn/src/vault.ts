import { Address, BigDecimal, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts';
import { ADAPTER_REGISTRY_ADDRESS, ADDRESS_ZERO, BIG_DECIMAL_1E18, BIG_DECIMAL_ONE, BIG_DECIMAL_ZERO, BIG_INT_ZERO } from 'const';
import { getDecimals, getName, getSymbol } from 'utils';
import { Erc20Adapter } from '../generated/templates/NirnVault/Erc20Adapter';
import { Vault, VaultAccount, VaultSnapshot } from '../generated/schema';
import {
  AdapterRemoved,
  AllocationsUpdated,
  FeesClaimed,
  NirnVault,
  Rebalanced,
  SetFeeRecipient,
  SetPerformanceFee,
  SetReserveRatio,
  SetRewardsSeller,
  Transfer
} from '../generated/templates/NirnVault/NirnVault'

//#region utils
function fractionE18ToBD(n: BigInt): BigDecimal {
  return n.toBigDecimal().div(BIG_DECIMAL_1E18)
}

function fractionE18ToBDs(arr: BigInt[]): BigDecimal[] {
  let ret: BigDecimal[] = []
  for (let i = 0; i < arr.length; i++) {
    ret.push(fractionE18ToBD(arr[i]))
  }
  return ret
}

function addressesToStrings(arr: Address[]): string[] {
  let ret: string[] = []
  for (let i = 0; i < arr.length; i++) {
    ret.push(arr[i].toHexString())
  }
  return ret
}
//#endregion utils

//#region updates
function writeAdaptersAndWeights(vault: Vault): void {
  let vaultContract = NirnVault.bind(Address.fromString(vault.id))
  let res = vaultContract.getAdaptersAndWeights()
  vault.adapters = addressesToStrings(res.value0)
  vault.weights = fractionE18ToBDs(res.value1)
}

export function updateVault(
  address: Address,
  event: ethereum.Event,
  type: string
): Vault {
  let vault = getOrCreateVault(address)
  let vaultContract = NirnVault.bind(Address.fromString(vault.id))
  vault.price = fractionE18ToBD(vaultContract.getPricePerFullShareWithFee())
  writeAdaptersAndWeights(vault)
  vault.save()
  writeSnapshot(vault, event, type)
  return vault
}

function writeSnapshot(
  vault: Vault,
  event: ethereum.Event,
  type: string
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
    let adapters = vault.adapters
    let weights = vault.weights
    let adaptersArray = new Array<string>()
    let weightsArray = new Array<BigDecimal>()
    let revenueTokensArray = new Array<Bytes>()
    let revenueAPRsArray = new Array<BigDecimal>()
    for (let i = 0; i < adapters.length; i++) {
      adaptersArray.push(adapters[i])
      weightsArray.push(weights[i])
    }
    let vaultContract = NirnVault.bind(Address.fromString(vault.id))
    for (let i = 0; i < adapters.length; i++) {
      let adapterContract = Erc20Adapter.bind(Address.fromString(adapters[i]))
      let breakdown = adapterContract.getRevenueBreakdown()
      let weight = weights[i]
      for (let j = 0; j < breakdown.value0.length; j++) {
        revenueTokensArray.push(breakdown.value0[j])
        let apr = fractionE18ToBD(breakdown.value1[j]).times(weight)
        apr = apr.minus(apr.times(vault.reserveRatio))
        revenueAPRsArray.push(apr)
      }
    }
    snapshot.price = vault.price
    snapshot.adapters = adaptersArray
    snapshot.weights = weightsArray
    snapshot.revenueTokens = revenueTokensArray
    snapshot.revenueAPRs = revenueAPRsArray
    snapshot.apr = fractionE18ToBD(vaultContract.getAPR())
    snapshot.totalValue = vaultContract.balance()
    snapshot.totalFeesClaimed = vault.totalFeesClaimed
    
    snapshot.save()
  }
}

function userUnclaimedInterest(
  vault: Vault,
  account: VaultAccount
): BigDecimal {
  let shares = fractionE18ToBD(account.shares)
  let interest = vault.price.minus(account.averagePricePerShare).times(shares)
  return interest
}
//#endregion updates

//#region getters
export function getOrCreateVault(address: Address): Vault {
  let vault = Vault.load(address.toHexString())
  if (vault === null) {
    vault = new Vault(address.toHexString())
    let vaultContract = NirnVault.bind(address)
    vault.symbol = getSymbol(address)
    vault.name = getName(address)
    vault.decimals = getDecimals(address)
    vault.totalFeesClaimed = BIG_INT_ZERO
    vault.price = BIG_DECIMAL_ONE
    vault.underlying = vaultContract.underlying().toHexString()
    vault.feeRecipient = vaultContract.feeRecipient()
    vault.rewardsSeller = vaultContract.rewardsSeller()
    vault.performanceFee = fractionE18ToBD(vaultContract.performanceFee())
    vault.reserveRatio = fractionE18ToBD(vaultContract.reserveRatio())
    vault.registry = ADAPTER_REGISTRY_ADDRESS.toHexString()
    writeAdaptersAndWeights(vault as Vault)
    vault.save()
  }
  return vault as Vault
}

function getOrCreateVaultAccount(
  vault: Vault,
  account: Address
): VaultAccount {
  let id = vault.id.concat('-').concat(account.toHexString())
  let vaultAccount = VaultAccount.load(id)
  if (vaultAccount === null) {
    vaultAccount = new VaultAccount(id)
    vaultAccount.vault = vault.id
    vaultAccount.account = account
    vaultAccount.shares = BIG_INT_ZERO
    vaultAccount.averagePricePerShare = BIG_DECIMAL_ONE
    vaultAccount.save()
  }
  return vaultAccount as VaultAccount
}
//#endregion getters

function updateAveragePrice(
  vault: Vault,
  userAddress: Address,
  newShares: BigInt
): void {
  let account = getOrCreateVaultAccount(vault, userAddress)
  let oldValue = account.shares.toBigDecimal().times(account.averagePricePerShare)
  let newValue = newShares.toBigDecimal().times(vault.price)
  let totalShares = account.shares.plus(newShares)
  account.shares = totalShares
  account.averagePricePerShare = oldValue.plus(newValue).div(totalShares.toBigDecimal())
  account.save()
}

export function handleTransfer(event: Transfer): void {
  let vault = updateVault(event.address, event, 'Daily')
  if (event.params.src.notEqual(ADDRESS_ZERO)) {
    let sender = getOrCreateVaultAccount(vault, event.params.src)
    sender.shares = sender.shares.minus(event.params.amt)
    sender.save()
  }
  if (event.params.dst.notEqual(ADDRESS_ZERO)) {
    updateAveragePrice(vault, event.params.dst, event.params.amt)
  }
}

export function adapterRemoved(event: AdapterRemoved): void {
  updateVault(event.address, event, "Rebalance")
}

export function allocationsUpdated(event: AllocationsUpdated): void {
  updateVault(event.address, event, "Rebalance")
}

export function feesClaimed(event: FeesClaimed): void {
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
  vault.performanceFee = fractionE18ToBD(event.params.performanceFee)
  vault.save()
}

export function setReserveRatio(event: SetReserveRatio): void {
  let vault = updateVault(event.address, event, "Daily")
  vault.reserveRatio = fractionE18ToBD(event.params.reserveRatio)
  vault.save()
}

export function setRewardsSeller(event: SetRewardsSeller): void {
  let vault = updateVault(event.address, event, "Daily")
  vault.rewardsSeller = event.params.rewardsSeller
  vault.save()
}

