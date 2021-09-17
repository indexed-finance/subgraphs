import { DividendsDistributed, DividendsWithdrawn } from '../generated/ERC20DividendsOwned/ERC20DividendsOwned'
import { Disbursal } from '../generated/schema'
import { BIG_INT_ONE } from 'const'
import { getContractDNDX, getOrCreateDNDX } from './utils'

export function dividendsDistributed(event: DividendsDistributed): void {
  let dndx = getOrCreateDNDX()
  let contract = getContractDNDX()
  let disbursal = new Disbursal(dndx.numDisbursals.toString())
  disbursal.sender = event.params.by
  disbursal.dndx = dndx.id
  disbursal.disbursedAt = event.block.timestamp
  disbursal.ethDistributed = event.params.dividendsDistributed
  disbursal.totalDividendShares = contract.totalSupply()
  disbursal.save()
  dndx.numDisbursals = dndx.numDisbursals.plus(BIG_INT_ONE)
  dndx.totalEthDistributed = dndx.totalEthDistributed.plus(event.params.dividendsDistributed)
  dndx.save()
}

export function dividendsWithdrawn(event: DividendsWithdrawn): void {
  let dndx = getOrCreateDNDX()
  dndx.totalEthWithdrawn = dndx.totalEthWithdrawn.plus(event.params.fundsWithdrawn)
  dndx.save()
}