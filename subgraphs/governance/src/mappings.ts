import { Bytes, log } from "@graphprotocol/graph-ts";
import {
  ProposalCreated,
  ProposalCanceled,
  ProposalQueued,
  ProposalExecuted,
  VoteCast
} from "../generated/GovernorAlpha/GovernorAlpha";
import {
  DelegateChanged,
  DelegateVotesChanged,
  Transfer
} from "../generated/IndexedToken/IndexedToken";
import {
  getOrCreateTokenHolder,
  getOrCreateDelegate,
  getOrCreateProposal,
  getOrCreateVote,
  getGovernanceEntity
} from "./helpers";
import {
  ADDRESS_ZERO,
  BIG_INT_ONE,
  BIG_INT_ZERO,
  STATUS_ACTIVE,
  STATUS_QUEUED,
  STATUS_PENDING,
  STATUS_EXECUTED,
  STATUS_CANCELLED,
  BIG_INT_18
} from "const";
import { convertTokenToDecimal } from "utils";

// - event: ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)
//   handler: handleProposalCreated

export function handleProposalCreated(event: ProposalCreated): void {
  let proposal = getOrCreateProposal(event.params.id.toString());
  let proposer = getOrCreateDelegate(
    event.params.proposer.toHexString(),
    false
  );

  // checking if the proposer was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to propose anything without first being "created"
  if (proposer == null) {
    log.error("Delegate {} not found on ProposalCreated. tx_hash: {}", [
      event.params.proposer.toHexString(),
      event.transaction.hash.toHexString()
    ]);
  }

  // Creating it anyway since we will want to account for this event data, even though it should've never happened
  proposer = getOrCreateDelegate(event.params.proposer.toHexString());

  proposal.proposer = proposer.id;
  proposal.targets = event.params.targets as Bytes[];
  proposal.values = event.params.values;
  proposal.signatures = event.params.signatures;
  proposal.calldatas = event.params.calldatas;
  proposal.startBlock = event.params.startBlock;
  proposal.endBlock = event.params.endBlock;
  proposal.description = event.params.description;
  proposal.status =
    event.block.number >= proposal.startBlock ? STATUS_ACTIVE : STATUS_PENDING;

  proposal.save();
}

// - event: ProposalCanceled(uint256)
//   handler: handleProposalCanceled

export function handleProposalCanceled(event: ProposalCanceled): void {
  let proposal = getOrCreateProposal(event.params.id.toString());

  proposal.status = STATUS_CANCELLED;
  proposal.save();
}

// - event: ProposalQueued(uint256,uint256)
//   handler: handleProposalQueued

export function handleProposalQueued(event: ProposalQueued): void {
  let governance = getGovernanceEntity();
  let proposal = getOrCreateProposal(event.params.id.toString());

  proposal.status = STATUS_QUEUED;
  proposal.executionETA = event.params.eta;
  proposal.save();

  governance.proposalsQueued = governance.proposalsQueued.plus(BIG_INT_ONE);
  governance.save();
}

// - event: ProposalExecuted(uint256)
//   handler: handleProposalExecuted

export function handleProposalExecuted(event: ProposalExecuted): void {
  let governance = getGovernanceEntity();
  let proposal = getOrCreateProposal(event.params.id.toString());

  proposal.status = STATUS_EXECUTED;
  proposal.executionETA = null;
  proposal.save();

  governance.proposalsQueued = governance.proposalsQueued.minus(BIG_INT_ONE);
  governance.save();
}

// - event: VoteCast(address,uint256,bool,uint256)
//   handler: handleVoteCast

export function handleVoteCast(event: VoteCast): void {
  let proposal = getOrCreateProposal(event.params.proposalId.toString());
  let voteId = event.params.voter
    .toHexString()
    .concat("-")
    .concat(event.params.proposalId.toString());
  let vote = getOrCreateVote(voteId);
  let voter = getOrCreateDelegate(event.params.voter.toHexString(), false);

  // checking if the voter was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to vote without first being "created"
  if (voter == null) {
    log.error("Delegate {} not found on VoteCast. tx_hash: {}", [
      event.params.voter.toHexString(),
      event.transaction.hash.toHexString()
    ]);
  }

  // Creating it anyway since we will want to account for this event data, even though it should've never happened
  voter = getOrCreateDelegate(event.params.voter.toHexString());

  vote.proposal = proposal.id;
  vote.voter = voter.id;
  vote.votesRaw = event.params.votes;
  vote.votes = convertTokenToDecimal(event.params.votes, BIG_INT_18);
  vote.support = event.params.support;

  vote.save();

  if (proposal.status == STATUS_PENDING) {
    proposal.status = STATUS_ACTIVE;
    proposal.save();
  }
}

// - event: DelegateChanged(indexed address,indexed address,indexed address)
//   handler: handleDelegateChanged

export function handleDelegateChanged(event: DelegateChanged): void {
  let tokenHolder = getOrCreateTokenHolder(
    event.params.delegator.toHexString()
  );
  let previousDelegate = getOrCreateDelegate(
    event.params.fromDelegate.toHexString()
  );
  let newDelegate = getOrCreateDelegate(event.params.toDelegate.toHexString());

  tokenHolder.delegate = newDelegate.id;
  tokenHolder.save();

  previousDelegate.tokenHoldersRepresentedAmount =
    previousDelegate.tokenHoldersRepresentedAmount - 1;
  newDelegate.tokenHoldersRepresentedAmount =
    newDelegate.tokenHoldersRepresentedAmount + 1;
  previousDelegate.save();
  newDelegate.save();
}

// - event: DelegateVotesChanged(indexed address,uint256,uint256)
//   handler: handleDelegateVotesChanged

export function handleDelegateVotesChanged(event: DelegateVotesChanged): void {
  let governance = getGovernanceEntity();
  let delegate = getOrCreateDelegate(event.params.delegate.toHexString());
  let votesDifference = event.params.newBalance.minus(event.params.previousBalance);

  delegate.delegatedVotesRaw = event.params.newBalance;
  delegate.delegatedVotes = convertTokenToDecimal(event.params.newBalance, BIG_INT_18);
  delegate.save();

  if (
    event.params.previousBalance == BIG_INT_ZERO &&
    event.params.newBalance > BIG_INT_ZERO
  ) {
    governance.currentDelegates = governance.currentDelegates.plus(BIG_INT_ONE);
  }
  if (event.params.newBalance == BIG_INT_ZERO) {
    governance.currentDelegates = governance.currentDelegates.minus(BIG_INT_ONE);
  }
  governance.delegatedVotesRaw = governance.delegatedVotesRaw.plus(votesDifference);
  governance.delegatedVotes = convertTokenToDecimal(governance.delegatedVotesRaw, BIG_INT_18);
  governance.save();
}

// - event: Transfer(indexed address,indexed address,uint256)
//   handler: handleTransfer

export function handleTransfer(event: Transfer): void {
  let fromHolder = getOrCreateTokenHolder(event.params.from.toHexString());
  let toHolder = getOrCreateTokenHolder(event.params.to.toHexString());
  let governance = getGovernanceEntity();

  // fromHolder
  if (!event.params.from.equals(ADDRESS_ZERO)) {
    let fromHolderPreviousBalance = fromHolder.tokenBalanceRaw;
    fromHolder.tokenBalanceRaw =
      fromHolder.tokenBalanceRaw.minus(event.params.amount);
    fromHolder.tokenBalance = convertTokenToDecimal(fromHolder.tokenBalanceRaw, BIG_INT_18);

    if (fromHolder.tokenBalanceRaw < BIG_INT_ZERO) {
      log.error("Negative balance on holder {} with balance {}", [
        fromHolder.id,
        fromHolder.tokenBalanceRaw.toString()
      ]);
    }

    if (
      fromHolder.tokenBalanceRaw == BIG_INT_ZERO &&
      fromHolderPreviousBalance > BIG_INT_ZERO
    ) {
      governance.currentTokenHolders =
        governance.currentTokenHolders.minus(BIG_INT_ONE);
      governance.save();
    } else if (
      fromHolder.tokenBalanceRaw > BIG_INT_ZERO &&
      fromHolderPreviousBalance == BIG_INT_ZERO
    ) {
      governance.currentTokenHolders =
        governance.currentTokenHolders.plus(BIG_INT_ONE);
      governance.save();
    }

    fromHolder.save();
  }

  // toHolder
  let toHolderPreviousBalance = toHolder.tokenBalanceRaw;
  toHolder.tokenBalanceRaw = toHolder.tokenBalanceRaw.plus(event.params.amount);
  toHolder.tokenBalance = convertTokenToDecimal(toHolder.tokenBalanceRaw, BIG_INT_18);
  toHolder.totalTokensHeldRaw = toHolder.totalTokensHeldRaw.plus(event.params.amount);
  toHolder.totalTokensHeld = convertTokenToDecimal(toHolder.totalTokensHeldRaw, BIG_INT_18);

  if (
    toHolder.tokenBalanceRaw == BIG_INT_ZERO &&
    toHolderPreviousBalance > BIG_INT_ZERO
  ) {
    governance.currentTokenHolders = governance.currentTokenHolders.minus(BIG_INT_ONE);
    governance.save();
  } else if (
    toHolder.tokenBalanceRaw > BIG_INT_ZERO &&
    toHolderPreviousBalance == BIG_INT_ZERO
  ) {
    governance.currentTokenHolders = governance.currentTokenHolders.plus(BIG_INT_ONE);
    governance.save();
  }

  toHolder.save();
}
