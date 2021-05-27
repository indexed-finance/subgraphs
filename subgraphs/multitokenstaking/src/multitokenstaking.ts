import {
  Deposit,
  Withdraw,
  EmergencyWithdraw,
  MultiTokenStaking as MultiTokenStakingContract,
  OwnershipTransferred,
  LogSetPool,
  LogUpdatePool,
  LogPoolAddition,
  PointsAllocatorSet,
  Harvest,
  RewardsAdded,
} from '../generated/MultiTokenStaking/MultiTokenStaking'
import { Address, BigDecimal, BigInt, dataSource, ethereum, log } from '@graphprotocol/graph-ts'
import {
  BIG_DECIMAL_1E12,
  BIG_DECIMAL_1E18,
  BIG_DECIMAL_ZERO,
  BIG_INT_ONE,
  BIG_INT_ONE_DAY_SECONDS,
  BIG_INT_ZERO,
  MULTI_TOKEN_STAKING_ADDRESS,
  ADDRESS_ZERO,
} from 'const'
import { History, MultiTokenStaking, Pool, PoolHistory, User } from '../generated/schema'
import { getRewardsTokenPrice, getUSDRate } from 'pricing'

import { ERC20 as ERC20Contract } from '../generated/MultiTokenStaking/ERC20'
import { Pair as PairContract } from '../generated/MultiTokenStaking/Pair'
import { RewardsSchedule as RewardsScheduleContract } from '../generated/MultiTokenStaking/RewardsSchedule'
import {  getName, getSymbol } from 'utils'
import { getDecimals } from 'pricing'

function getMultiTokenStaking(block: ethereum.Block): MultiTokenStaking {
  let staking = MultiTokenStaking.load(MULTI_TOKEN_STAKING_ADDRESS.toHex())

  if (staking === null) {
    let contract = MultiTokenStakingContract.bind(MULTI_TOKEN_STAKING_ADDRESS)
    staking = new MultiTokenStaking(MULTI_TOKEN_STAKING_ADDRESS.toHex())

    staking.owner = contract.owner()
    staking.pointsAllocator = ADDRESS_ZERO
    let rewardsSchedule = contract.rewardsSchedule()
    staking.rewardsSchedule = rewardsSchedule

    let scheduleContract = RewardsScheduleContract.bind(rewardsSchedule)
    staking.startBlock = scheduleContract.startBlock()
    staking.endBlock = scheduleContract.endBlock()

    staking.totalRewardsReceived = BIG_INT_ZERO

    // poolInfo ...
    staking.rewardsToken = contract.rewardsToken()

    staking.totalAllocPoint = BIG_INT_ZERO

    // userInfo ...
    staking.poolCount = BIG_INT_ZERO

    staking.updatedAt = block.timestamp

    // Staking info
    staking.stakedBalance = BIG_DECIMAL_ZERO
    staking.stakedAge = BIG_DECIMAL_ZERO
    staking.stakedAgeRemoved = BIG_DECIMAL_ZERO
    staking.stakedDeposited = BIG_DECIMAL_ZERO
    staking.stakedWithdrawn = BIG_DECIMAL_ZERO

    staking.save()
  }

  return staking as MultiTokenStaking
}

export function getPool(id: BigInt, block: ethereum.Block): Pool {
  let pool = Pool.load(id.toString())

  if (pool === null) {
    let staking = getMultiTokenStaking(block)

    let stakingContract = MultiTokenStakingContract.bind(MULTI_TOKEN_STAKING_ADDRESS)

    // Create new pool.
    pool = new Pool(id.toString())

    // Set relation
    pool.owner = staking.id

    let token = stakingContract.lpToken(id)
    pool.token = token

    let rewarder = stakingContract.rewarder(id)
    pool.rewarder = rewarder

    let poolInfo = stakingContract.poolInfo(id)

    let tokenAsPair = PairContract.bind(token)
    let reservesResult = tokenAsPair.try_getReserves()
    if (!reservesResult.reverted) {
      pool.isPairToken = true
      pool.decimals = BigInt.fromI32(18)
      let t0 = tokenAsPair.token0()
      let t1 = tokenAsPair.token1()
      pool.token0 = t0
      pool.token1 = t1
      let token0Symbol = getSymbol(t0)
      let token1Symbol = getSymbol(t1)
      pool.symbol = token0Symbol.concat('-').concat(token1Symbol)
      pool.name = 'Uniswap V2: '.concat(token0Symbol).concat('-').concat(token1Symbol)
    } else {
      pool.isPairToken = false
      pool.decimals = getDecimals(token)
      pool.symbol = getSymbol(token)
      pool.name = getName(token)
    }

    pool.accRewardsPerShare = poolInfo.value0
    pool.lastRewardBlock = poolInfo.value1
    pool.allocPoint = poolInfo.value2

    // Total supply of LP tokens
    pool.balance = BIG_INT_ZERO
    pool.userCount = BIG_INT_ZERO

    pool.stakedBalance = BIG_DECIMAL_ZERO
    pool.stakedAge = BIG_DECIMAL_ZERO
    pool.stakedAgeRemoved = BIG_DECIMAL_ZERO
    pool.stakedDeposited = BIG_DECIMAL_ZERO
    pool.stakedWithdrawn = BIG_DECIMAL_ZERO

    pool.timestamp = block.timestamp
    pool.block = block.number

    pool.updatedAt = block.timestamp
    pool.entryUSD = BIG_DECIMAL_ZERO
    pool.exitUSD = BIG_DECIMAL_ZERO
    pool.rewardsHarvested = BIG_DECIMAL_ZERO
    pool.rewardsHarvestedUSD = BIG_DECIMAL_ZERO
    pool.save()
  }

  return pool as Pool
}

function getHistory(owner: string, block: ethereum.Block): History {
  let day = block.timestamp.div(BIG_INT_ONE_DAY_SECONDS)

  let id = owner.concat(day.toString())

  let history = History.load(id)

  if (history === null) {
    history = new History(id)
    history.owner = owner
    history.stakedBalance = BIG_DECIMAL_ZERO
    history.stakedAge = BIG_DECIMAL_ZERO
    history.stakedAgeRemoved = BIG_DECIMAL_ZERO
    history.stakedDeposited = BIG_DECIMAL_ZERO
    history.stakedWithdrawn = BIG_DECIMAL_ZERO
    history.timestamp = block.timestamp
    history.block = block.number
  }

  return history as History
}

function getPoolHistory(pool: Pool, block: ethereum.Block): PoolHistory {
  let day = block.timestamp.div(BIG_INT_ONE_DAY_SECONDS)

  let id = pool.id.concat(day.toString())

  let history = PoolHistory.load(id)

  if (history === null) {
    history = new PoolHistory(id)
    history.pool = pool.id
    history.stakedBalance = BIG_DECIMAL_ZERO
    history.stakedAge = BIG_DECIMAL_ZERO
    history.stakedAgeRemoved = BIG_DECIMAL_ZERO
    history.stakedDeposited = BIG_DECIMAL_ZERO
    history.stakedWithdrawn = BIG_DECIMAL_ZERO
    history.timestamp = block.timestamp
    history.block = block.number
    history.entryUSD = BIG_DECIMAL_ZERO
    history.exitUSD = BIG_DECIMAL_ZERO
    history.rewardsHarvested = BIG_DECIMAL_ZERO
    history.rewardsHarvestedUSD = BIG_DECIMAL_ZERO
    history.userCount = BIG_INT_ZERO
  }

  return history as PoolHistory
}

export function getUser(pid: BigInt, address: Address, block: ethereum.Block): User {
  let uid = address.toHex()
  let id = pid.toString().concat('-').concat(uid)

  let user = User.load(id)

  if (user === null) {
    user = new User(id)
    user.pool = null
    user.address = address
    user.amount = BIG_INT_ZERO
    user.rewardDebt = BIG_INT_ZERO
    user.rewardsHarvested = BIG_DECIMAL_ZERO
    user.rewardsHarvestedUSD = BIG_DECIMAL_ZERO
    user.entryUSD = BIG_DECIMAL_ZERO
    user.exitUSD = BIG_DECIMAL_ZERO
    user.timestamp = block.timestamp
    user.block = block.number
    user.save()
  }

  return user as User
}

export function logPoolAddition(event: LogPoolAddition): void {
  log.info('Adding Pool #{}', [event.params.pid.toString()])
  let staking = getMultiTokenStaking(event.block)

  // log.info('Add pool #{}', [staking.poolCount.toString()])

  let pool = getPool(event.params.pid, event.block)

  // Update MultiTokenStaking.
  staking.totalAllocPoint = staking.totalAllocPoint.plus(pool.allocPoint)
  staking.poolCount = staking.poolCount.plus(BIG_INT_ONE)
  staking.save()
}

export function pointsAllocatorSet(event: PointsAllocatorSet): void {
  let staking = getMultiTokenStaking(event.block)
  staking.pointsAllocator = event.params.pointsAllocator
  staking.save()
}

// Calls
export function logSetPool(event: LogSetPool): void {
  // log.info('Set pool id: {} allocPoint: {} withUpdate: {}', [
  //   call.inputs._pid.toString(),
  //   call.inputs._allocPoint.toString(),
  //   call.inputs._withUpdate ? 'true' : 'false',
  // ])

  let pool = getPool(event.params.pid, event.block)

  let staking = getMultiTokenStaking(event.block)
  staking.totalAllocPoint = staking.totalAllocPoint.minus(pool.allocPoint).plus(event.params.allocPoint)
  staking.save()

  // Update pool
  pool.allocPoint = event.params.allocPoint
  pool.rewarder = event.params.rewarder
  pool.save()
}

export function logUpdatePool(event: LogUpdatePool): void {
  log.info('Update pool id {}', [event.params.pid.toString()])

  let staking = MultiTokenStakingContract.bind(MULTI_TOKEN_STAKING_ADDRESS)
  let poolInfo = staking.poolInfo(event.params.pid)
  let pool = getPool(event.params.pid, event.block)
  pool.accRewardsPerShare = poolInfo.value0
  pool.lastRewardBlock = poolInfo.value1
  pool.save()
}

// Events
export function deposit(event: Deposit): void {
  // if (event.params.amount == BIG_INT_ZERO) {
  //   log.info('Deposit zero transaction, input {} hash {}', [
  //     event.transaction.input.toHex(),
  //     event.transaction.hash.toHex(),
  //   ])
  // }

  let amount = event.params.amount.divDecimal(BIG_DECIMAL_1E18)

  // log.info('{} has deposited {} staked tokens to pool #{}', [
  //   event.params.user.toHex(),
  //   event.params.amount.toString(),
  //   event.params.pid.toString(),
  // ])


  let staking = getMultiTokenStaking(event.block)

  let stakingContract = MultiTokenStakingContract.bind(MULTI_TOKEN_STAKING_ADDRESS)

  let poolInfo = stakingContract.poolInfo(event.params.pid)

  let pool = getPool(event.params.pid, event.block)
  log.info('Depositing some tokens to pool # {}', [ event.params.pid.toString() ])
  let poolHistory = getPoolHistory(pool, event.block)

  let pairContract = ERC20Contract.bind(pool.token as Address)
  pool.balance = pairContract.balanceOf(MULTI_TOKEN_STAKING_ADDRESS)

  pool.accRewardsPerShare = poolInfo.value0
  pool.lastRewardBlock = poolInfo.value1

  let poolDays = event.block.timestamp.minus(pool.updatedAt).divDecimal(BigDecimal.fromString('86400'))
  pool.stakedAge = pool.stakedAge.plus(poolDays.times(pool.stakedBalance))

  pool.stakedDeposited = pool.stakedDeposited.plus(amount)
  pool.stakedBalance = pool.stakedBalance.plus(amount)

  pool.updatedAt = event.block.timestamp

  let userInfo = stakingContract.userInfo(event.params.pid, event.params.user)

  let user = getUser(event.params.pid, event.params.user, event.block)

  // If not currently in pool and depositing staked token
  if (!user.pool && event.params.amount.gt(BIG_INT_ZERO)) {
    user.pool = pool.id
    pool.userCount = pool.userCount.plus(BIG_INT_ONE)
  }


  user.amount = userInfo.value0
  user.rewardDebt = userInfo.value1

  if (event.params.amount.gt(BIG_INT_ZERO)) {
    let entryUSD = amount.times(getUSDRate(pool.token as Address, pool.decimals))
    user.entryUSD = user.entryUSD.plus(entryUSD)
    pool.entryUSD = pool.entryUSD.plus(entryUSD)
    poolHistory.entryUSD = pool.entryUSD
  }

  user.save()
  pool.save()

  let masterChefDays = event.block.timestamp.minus(staking.updatedAt).divDecimal(BigDecimal.fromString('86400'))
  staking.stakedAge = staking.stakedAge.plus(masterChefDays.times(staking.stakedBalance))

  staking.stakedDeposited = staking.stakedDeposited.plus(amount)
  staking.stakedBalance = staking.stakedBalance.plus(amount)

  staking.updatedAt = event.block.timestamp
  staking.save()

  let history = getHistory(MULTI_TOKEN_STAKING_ADDRESS.toHex(), event.block)
  history.stakedAge = staking.stakedAge
  history.stakedBalance = staking.stakedBalance
  history.stakedDeposited = history.stakedDeposited.plus(amount)
  history.save()

  poolHistory.stakedAge = pool.stakedAge
  poolHistory.stakedBalance = pool.balance.divDecimal(BIG_DECIMAL_1E18)
  poolHistory.stakedDeposited = poolHistory.stakedDeposited.plus(amount)
  poolHistory.userCount = pool.userCount
  poolHistory.save()
}

export function harvest(event: Harvest): void {
  log.info('Got harvest event for pool # {}', [ event.params.pid.toString() ])
  let pool = getPool(event.params.pid, event.block)
  let poolHistory = getPoolHistory(pool, event.block)
  let user = getUser(event.params.pid, event.params.user, event.block)

  let amount = event.params.amount.divDecimal(BIG_DECIMAL_1E18)
  log.info('Harvesting {} REWARDS', [amount.toString()])

  // Calculate SUSHI being paid out
  if (event.params.amount.gt(BIG_INT_ZERO)) {
    if (amount.gt(BIG_DECIMAL_ZERO)) {
      let rewardsHarvestedUSD = amount.times(getRewardsTokenPrice())
      user.rewardsHarvested = user.rewardsHarvested.plus(amount)
      user.rewardsHarvestedUSD = user.rewardsHarvestedUSD.plus(rewardsHarvestedUSD)
      pool.rewardsHarvested = pool.rewardsHarvested.plus(amount)
      pool.rewardsHarvestedUSD = pool.rewardsHarvestedUSD.plus(rewardsHarvestedUSD)
      poolHistory.rewardsHarvested = pool.rewardsHarvested
      poolHistory.rewardsHarvestedUSD = pool.rewardsHarvestedUSD
    }
  }
  user.save()
  pool.save()
  poolHistory.save()
}

export function withdraw(event: Withdraw): void {
  // if (event.params.amount == BIG_INT_ZERO && User.load(event.params.user.toHex()) !== null) {
  //   log.info('Withdrawal zero transaction, input {} hash {}', [
  //     event.transaction.input.toHex(),
  //     event.transaction.hash.toHex(),
  //   ])
  // }

  let amount = event.params.amount.divDecimal(BIG_DECIMAL_1E18)

  // log.info('{} has withdrawn {} staked tokens from pool #{}', [
  //   event.params.user.toHex(),
  //   amount.toString(),
  //   event.params.pid.toString(),
  // ])

  let staking = getMultiTokenStaking(event.block)

  let stakingContract = MultiTokenStakingContract.bind(MULTI_TOKEN_STAKING_ADDRESS)

  let poolInfo = stakingContract.poolInfo(event.params.pid)

  let pool = getPool(event.params.pid, event.block)

  let poolHistory = getPoolHistory(pool, event.block)

  let pairContract = ERC20Contract.bind(pool.token as Address)
  pool.balance = pairContract.balanceOf(MULTI_TOKEN_STAKING_ADDRESS)
  pool.accRewardsPerShare = poolInfo.value0
  pool.lastRewardBlock = poolInfo.value1

  let poolDays = event.block.timestamp.minus(pool.updatedAt).divDecimal(BigDecimal.fromString('86400'))
  let poolAge = pool.stakedAge.plus(poolDays.times(pool.stakedBalance))
  let poolAgeRemoved = poolAge.div(pool.stakedBalance).times(amount)
  pool.stakedAge = poolAge.minus(poolAgeRemoved)
  pool.stakedAgeRemoved = pool.stakedAgeRemoved.plus(poolAgeRemoved)
  pool.stakedWithdrawn = pool.stakedWithdrawn.plus(amount)
  pool.stakedBalance = pool.stakedBalance.minus(amount)
  pool.updatedAt = event.block.timestamp

  let user = getUser(event.params.pid, event.params.user, event.block)

  // if (event.block.number.gt(staking.startBlock) && user.amount.gt(BIG_INT_ZERO)) {
  //   let pending = user.amount
  //     .toBigDecimal()
  //     .times(pool.accRewardsPerShare.toBigDecimal())
  //     .div(BIG_DECIMAL_1E12)
  //     .minus(user.rewardDebt.toBigDecimal())
  //     .div(BIG_DECIMAL_1E18)
  //   // log.info('Withdraw: User amount is more than zero, we should harvest {} sushi - block: {}', [
  //   //   pending.toString(),
  //   //   event.block.number.toString(),
  //   // ])
  //   // log.info('SUSHI PRICE {}', [getRewardsTokenPrice(event.block).toString()])
  //   if (pending.gt(BIG_DECIMAL_ZERO)) {
  //     // log.info('Harvesting {} SUSHI (CURRENT SUSHI PRICE {})', [
  //     //   pending.toString(),
  //     //   getRewardsTokenPrice(event.block).toString(),
  //     // ])
  //     let rewardsHarvestedUSD = pending.times(getRewardsTokenPrice())
  //     user.rewardsHarvested = user.rewardsHarvested.plus(pending)
  //     user.rewardsHarvestedUSD = user.rewardsHarvestedUSD.plus(rewardsHarvestedUSD)
  //     pool.rewardsHarvested = pool.rewardsHarvested.plus(pending)
  //     pool.rewardsHarvestedUSD = pool.rewardsHarvestedUSD.plus(rewardsHarvestedUSD)
  //     poolHistory.rewardsHarvested = pool.rewardsHarvested
  //     poolHistory.rewardsHarvestedUSD = pool.rewardsHarvestedUSD
  //   }
  // }

  let userInfo = stakingContract.userInfo(event.params.pid, event.params.user)

  user.amount = userInfo.value0
  user.rewardDebt = userInfo.value1

  if (event.params.amount.gt(BIG_INT_ZERO)) {
    let exitUSD = amount.times(getUSDRate(pool.token as Address, pool.decimals))

    pool.exitUSD = pool.exitUSD.plus(exitUSD)

    poolHistory.exitUSD = pool.exitUSD

    // log.info('User {} has withdrawn {} staked token tokens {} {} (${}) and {} {} (${}) at a combined value of ${}', [
    //   user.address.toHex(),
    //   amount.toString(),
    //   token0Amount.toString(),
    //   token0USD.toString(),
    //   pairContract.token0().toHex(),
    //   token1Amount.toString(),
    //   token1USD.toString(),
    //   pairContract.token1().toHex(),
    //   exitUSD.toString(),
    // ])

    user.exitUSD = user.exitUSD.plus(exitUSD)
  }

  // If staked token amount equals zero, remove from pool and reduce userCount
  if (user.amount.equals(BIG_INT_ZERO)) {
    user.pool = null
    pool.userCount = pool.userCount.minus(BIG_INT_ONE)
  }

  user.save()
  pool.save()

  let days = event.block.timestamp.minus(staking.updatedAt).divDecimal(BigDecimal.fromString('86400'))
  let stakedAge = staking.stakedAge.plus(days.times(staking.stakedBalance))
  let stakedAgeRemoved = stakedAge.div(staking.stakedBalance).times(amount)
  staking.stakedAge = stakedAge.minus(stakedAgeRemoved)
  staking.stakedAgeRemoved = staking.stakedAgeRemoved.plus(stakedAgeRemoved)

  staking.stakedWithdrawn = staking.stakedWithdrawn.plus(amount)
  staking.stakedBalance = staking.stakedBalance.minus(amount)
  staking.updatedAt = event.block.timestamp
  staking.save()

  let history = getHistory(MULTI_TOKEN_STAKING_ADDRESS.toHex(), event.block)
  history.stakedAge = staking.stakedAge
  history.stakedAgeRemoved = history.stakedAgeRemoved.plus(stakedAgeRemoved)
  history.stakedBalance = staking.stakedBalance
  history.stakedWithdrawn = history.stakedWithdrawn.plus(amount)
  history.save()

  poolHistory.stakedAge = pool.stakedAge
  poolHistory.stakedAgeRemoved = poolHistory.stakedAgeRemoved.plus(stakedAgeRemoved)
  poolHistory.stakedBalance = pool.balance.divDecimal(BIG_DECIMAL_1E18)
  poolHistory.stakedWithdrawn = poolHistory.stakedWithdrawn.plus(amount)
  poolHistory.userCount = pool.userCount
  poolHistory.save()
}

export function emergencyWithdraw(event: EmergencyWithdraw): void {
  log.info('User {} emergancy withdrawal of {} from pool #{}', [
    event.params.user.toHex(),
    event.params.amount.toString(),
    event.params.pid.toString(),
  ])

  let pool = getPool(event.params.pid, event.block)

  let pairContract = ERC20Contract.bind(pool.token as Address)
  pool.balance = pairContract.balanceOf(MULTI_TOKEN_STAKING_ADDRESS)
  pool.save()

  // Update user
  let user = getUser(event.params.pid, event.params.user, event.block)
  user.amount = BIG_INT_ZERO
  user.rewardDebt = BIG_INT_ZERO

  user.save()
}

export function ownershipTransferred(event: OwnershipTransferred): void {
  log.info('Ownership transfered from previous owner: {} to new owner: {}', [
    event.params.previousOwner.toHex(),
    event.params.newOwner.toHex(),
  ])
  let staking = getMultiTokenStaking(event.block)
  staking.owner = event.params.newOwner
  staking.save()
}

export function rewardsAdded(event: RewardsAdded): void {
  let staking = getMultiTokenStaking(event.block)
  staking.totalRewardsReceived = staking.totalRewardsReceived.plus(event.params.amount)
  staking.save()
}