import { BigInt } from "@graphprotocol/graph-ts";
import { BIG_INT_ONE, BIG_INT_ZERO } from "const";
import { TimeLock } from "../generated/schema";
import { EmergencyUnlockTriggered, FeeRecipientSet, FeesReceived, LockCreated, LockDestroyed, MinimumDepositSet, PartialWithdrawal } from "../generated/SharesTimeLock/SharesTimeLock";
import { getContractTimeLock, getOrCreateDNDX } from "./utils";

export function lockCreated(event: LockCreated): void {
  let dndx = getOrCreateDNDX()
  let lock = new TimeLock(event.params.lockId.toString())
  lock.ndxAmount = event.params.amountLocked
  lock.createdAt = event.block.timestamp
  lock.duration = event.params.duration
  lock.dndxShares = event.params.dividendShares
  lock.dndx = dndx.id
  lock.owner = event.params.account
  lock.save()
  dndx.numLocks = dndx.numLocks.plus(BIG_INT_ONE)
  dndx.totalDeposits = dndx.totalDeposits.plus(event.params.amountLocked)
  dndx.totalDividendShares = dndx.totalDividendShares.plus(event.params.dividendShares)
  dndx.save()
}

function getAmountWithdrawn(lock: TimeLock): BigInt {
  let contract = getContractTimeLock()
  let id = BigInt.fromString(lock.id)
  let res = contract.locks(id)
  let newAmount = res.value0
  return lock.ndxAmount.minus(newAmount)
}

export function lockDestroyed(event: LockDestroyed): void {
  let dndx = getOrCreateDNDX()
  let lock = TimeLock.load(event.params.lockId.toString()) as TimeLock
  dndx.totalDeposits = dndx.totalDeposits.minus(lock.ndxAmount)
  dndx.totalDividendShares = dndx.totalDividendShares.minus(lock.dndxShares)
  dndx.save()
  lock.ndxAmount = BIG_INT_ZERO
  lock.dndxShares = BIG_INT_ZERO
  lock.save()
}

//totalEarlyWithdrawalFees
export function partialWithdrawal(event: PartialWithdrawal): void {
  let dndx = getOrCreateDNDX()
  let lock = TimeLock.load(event.params.lockId.toString()) as TimeLock
  let ndxAmount = getAmountWithdrawn(lock)
  let dividendShares = event.params.dividendShares
  dndx.totalDeposits = dndx.totalDeposits.minus(ndxAmount)
  dndx.totalDividendShares = dndx.totalDividendShares.minus(dividendShares)
  dndx.save()
  lock.ndxAmount = lock.ndxAmount.minus(ndxAmount)
  lock.dndxShares = lock.dndxShares.minus(dividendShares)
  lock.save()
}

export function minimumDepositSet(event: MinimumDepositSet): void {
  let dndx = getOrCreateDNDX()
  dndx.minimumDeposit = event.params.minimumDeposit
  dndx.save()
}

export function feeRecipientSet(event: FeeRecipientSet): void {
  let dndx = getOrCreateDNDX()
  dndx.feeRecipient = event.params.feeRecipient
  dndx.save()
}

export function feesReceived(event: FeesReceived): void {
  let dndx = getOrCreateDNDX()
  dndx.totalEarlyWithdrawalFees = event.params.amount
  dndx.save()
}

export function emergencyUnlockTriggered(event: EmergencyUnlockTriggered): void {
  let dndx = getOrCreateDNDX()
  dndx.unlocked = true
  dndx.save()
}
