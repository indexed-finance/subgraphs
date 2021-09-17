import { BigInt } from '@graphprotocol/graph-ts'
import { SharesTimeLock } from '../generated/SharesTimeLock/SharesTimeLock'
import { ERC20DividendsOwned } from '../generated/ERC20DividendsOwned/ERC20DividendsOwned'
import { DNDX, TimeLock } from '../generated/schema'
import { ADDRESS_ZERO, BIG_INT_ZERO, DNDX_ADDRESS, TIME_LOCK_ADDRESS } from 'const'

export function getContractDNDX(): ERC20DividendsOwned {
  return ERC20DividendsOwned.bind(DNDX_ADDRESS)
}

export function getContractTimeLock(): SharesTimeLock {
  return SharesTimeLock.bind(TIME_LOCK_ADDRESS)
}

export function getOrCreateDNDX(): DNDX {
  let dndx = DNDX.load(DNDX_ADDRESS.toHexString())
  let timelock = getContractTimeLock()
  if (dndx == null) {
    dndx = new DNDX(DNDX_ADDRESS.toHexString())
    dndx.depositToken = timelock.depositToken()
    dndx.dividendsToken = timelock.dividendsToken()
    dndx.minLockDuration = timelock.minLockDuration()
    dndx.maxLockDuration = timelock.maxLockDuration()
    dndx.minEarlyWithdrawalFee = timelock.minEarlyWithdrawalFee()
    dndx.baseEarlyWithdrawalFee = timelock.baseEarlyWithdrawalFee()
    dndx.maxDividendsBonusMultiplier = timelock.maxDividendsBonusMultiplier()
    dndx.totalDeposits = BIG_INT_ZERO
    dndx.totalDividendShares = BIG_INT_ZERO
    dndx.totalEthDistributed = BIG_INT_ZERO
    dndx.totalEthWithdrawn = BIG_INT_ZERO
    dndx.totalEarlyWithdrawalFees = BIG_INT_ZERO
    dndx.numLocks = BIG_INT_ZERO
    dndx.numDisbursals = BIG_INT_ZERO
    dndx.minimumDeposit = BIG_INT_ZERO
    dndx.feeRecipient = ADDRESS_ZERO
    dndx.unlocked = false
    dndx.save()
  }
  return dndx as DNDX
}