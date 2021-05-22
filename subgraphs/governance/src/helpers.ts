import {
  TokenHolder,
  Delegate,
  Proposal,
  Governance,
  Vote
} from "../generated/schema";
import {
  ADDRESS_ZERO,
  BIG_INT_ZERO,
  BIG_INT_ONE,
  BIG_DECIMAL_ZERO
} from "const";

export function getOrCreateTokenHolder(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = true
): TokenHolder {
  let tokenHolder = TokenHolder.load(id);

  if (tokenHolder == null && createIfNotFound) {
    tokenHolder = new TokenHolder(id);
    tokenHolder.tokenBalanceRaw = BIG_INT_ZERO;
    tokenHolder.tokenBalance = BIG_DECIMAL_ZERO;
    tokenHolder.totalTokensHeldRaw = BIG_INT_ZERO;
    tokenHolder.totalTokensHeld = BIG_DECIMAL_ZERO;

    if (id != ADDRESS_ZERO.toString()) {
      let governance = getGovernanceEntity();
      governance.totalTokenHolders = governance.totalTokenHolders.plus(BIG_INT_ONE);
      governance.save();
    }

    if (save) {
      tokenHolder.save();
    }
  }

  return tokenHolder as TokenHolder;
}

export function getOrCreateDelegate(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = true
): Delegate {
  let delegate = Delegate.load(id);

  if (delegate == null && createIfNotFound) {
    delegate = new Delegate(id);
    delegate.delegatedVotesRaw = BIG_INT_ZERO;
    delegate.delegatedVotes = BIG_DECIMAL_ZERO;
    delegate.tokenHoldersRepresentedAmount = 0;

    if (id != ADDRESS_ZERO.toString()) {
      let governance = getGovernanceEntity();
      governance.totalDelegates = governance.totalDelegates.plus(BIG_INT_ONE);
      governance.save();
    }

    if (save) {
      delegate.save();
    }
  }

  return delegate as Delegate;
}

export function getOrCreateVote(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = false
): Vote {
  let vote = Vote.load(id);

  if (vote == null && createIfNotFound) {
    vote = new Vote(id);

    if (save) {
      vote.save();
    }
  }

  return vote as Vote;
}

export function getOrCreateProposal(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = false
): Proposal {
  let proposal = Proposal.load(id);

  if (proposal == null && createIfNotFound) {
    proposal = new Proposal(id);

    let governance = getGovernanceEntity();

    governance.proposals = governance.proposals.plus(BIG_INT_ONE);
    governance.save();

    if (save) {
      proposal.save();
    }
  }

  return proposal as Proposal;
}

export function getGovernanceEntity(): Governance {
  let governance = Governance.load("GOVERNANCE");

  if (governance == null) {
    governance = new Governance("GOVERNANCE");
    governance.proposals = BIG_INT_ZERO;
    governance.compMetaProposals = BIG_INT_ZERO;
    governance.uniMetaProposals = BIG_INT_ZERO;
    governance.totalTokenHolders = BIG_INT_ZERO;
    governance.currentTokenHolders = BIG_INT_ZERO;
    governance.currentDelegates = BIG_INT_ZERO;
    governance.totalDelegates = BIG_INT_ZERO;
    governance.delegatedVotesRaw = BIG_INT_ZERO;
    governance.delegatedVotes = BIG_DECIMAL_ZERO;
    governance.proposalsQueued = BIG_INT_ZERO;
  }

  return governance as Governance;
}
