import { log } from "@graphprotocol/graph-ts";
import {
  ExternalVoteSubmitted,
  MetaGovernorCOMP,
  MetaVoteCast
} from "../generated/MetaGovernorCOMP/MetaGovernorCOMP";
import {
  getOrCreateDelegate,
  getGovernanceEntity
} from "./helpers";
import {
  BIG_INT_ONE,
  BIG_INT_18,
  STATUS_ACTIVE,
  STATUS_EXECUTED
} from "const";
import {
  CompMetaProposal,
  CompMetaVote
} from "../generated/schema";
import { convertTokenToDecimal } from "utils";

function getOrCreateMetaProposal(
  id: string,
  createIfNotFound: boolean = true,
  save: boolean = false
): CompMetaProposal {
  let proposal = CompMetaProposal.load(id);

  if (proposal == null && createIfNotFound) {
    proposal = new CompMetaProposal(id);

    let governance = getGovernanceEntity();

    governance.compMetaProposals = governance.compMetaProposals.plus(BIG_INT_ONE);
    governance.save();

    if (save) {
      proposal.save();
    }
  }

  return proposal as CompMetaProposal;
}

export function handleMetaVoteCast(event: MetaVoteCast): void {
  let proposalId = event.params.proposalId.toString();
  let proposal = CompMetaProposal.load(proposalId);
  let voter = getOrCreateDelegate(
    event.params.voter.toHexString(),
    false
  );

  // checking if the proposer was a delegate already accounted for, if not we should log an error
  // since it shouldn't be possible for a delegate to propose anything without first being "created"
  if (voter == null) {
    log.error("Delegate {} not found on MetaVoteCast. tx_hash: {}", [
      event.params.voter.toHexString(),
      event.transaction.hash.toHexString()
    ]);
  }

  if (proposal == null) {
    proposal = new CompMetaProposal(proposalId);

    let governance = getGovernanceEntity();

    governance.compMetaProposals = governance.compMetaProposals.plus(BIG_INT_ONE);
    governance.save();

    let compMetaGovernor = MetaGovernorCOMP.bind(event.address);
    let propData = compMetaGovernor.try_proposals(event.params.proposalId);
    if (propData == null) {
      log.error("Proposal {} not found on MetaVoteCast. tx_hash: {}", [
        proposalId,
        event.transaction.hash.toHexString()
      ])
    }
    proposal.proposer = voter.id;
    proposal.startBlock = propData.value.value0;
    proposal.endBlock = propData.value.value1;
    proposal.status = STATUS_ACTIVE;
  }
  let voteId = event.params.voter.toHexString().concat("-").concat(proposalId);
  let vote = new CompMetaVote(voteId);
  vote.proposal = proposal.id;
  vote.voter = voter.id;
  vote.votesRaw = event.params.votes;
  vote.votes = convertTokenToDecimal(event.params.votes, BIG_INT_18);
  vote.support = event.params.support;
  proposal.save();
  vote.save();
}

export function handleExternalVoteSubmitted(event: ExternalVoteSubmitted): void {
  let proposalId = event.params.proposalId.toString();
  let governance = getGovernanceEntity();
  let proposal = getOrCreateMetaProposal(proposalId);

  proposal.status = STATUS_EXECUTED;
  proposal.save();

  governance.compMetaProposals = governance.compMetaProposals.plus(BIG_INT_ONE);
  governance.save();
}