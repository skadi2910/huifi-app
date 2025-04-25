import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface CreatePoolInstructionArgs {
  maxParticipants: number;
  contributionAmount: BN;
  cycleDurationSeconds: BN;
  payoutDelaySeconds: BN;
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  yieldStrategy: number;
  uuid: number[];
  whitelist?: PublicKey[];
}

export interface ContributeInstructionArgs {
  uuid: number[];
  amount: BN;
}

export interface BidInstructionArgs {
  round: number;
  amount: BN;
}

// Add more instruction types as needed 