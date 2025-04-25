import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum PoolStatus {
  Filling = 0,
  Active = 1,
  Completed = 2,
}

export enum YieldPlatform {
  None = 0,
  JitoSol = 1,
  Kamino = 2,
}

export interface HuifiPool {
  creator: PublicKey;
  tokenMint: PublicKey;
  maxParticipants: number;
  currentParticipants: number;
  contributionAmount: BN;
  cycleDurationSeconds: BN;
  payoutDelaySeconds: BN;
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  status: PoolStatus;
  totalValue: BN;
  currentRound: number;
  nextPayoutTimestamp: BN;
  startTime: BN;
  yieldBasisPoints: number;
  yieldStrategy: YieldPlatform;
  participants: PublicKey[];
  bump: number;
  name: string;
  description: string;
  frequency: string;
}

export interface UserAccount {
  owner: PublicKey;
  poolsJoined: number;
  activePools: number;
  totalContribution: BN;
  totalWinnings: BN;
  experiencePoints: number;
  bump: number;
}

export interface ProtocolSettings {
  admin: PublicKey;
  treasury: PublicKey;
  tokenMint: PublicKey;
  protocolFeeBps: number;
  bump: number;
}

export interface Bid {
  bidder: PublicKey;
  pool: PublicKey;
  round: number;
  amount: BN;
  timestamp: BN;
  bump: number;
}

export interface RoundResult {
  pool: PublicKey;
  round: number;
  winner: PublicKey;
  paid: boolean;
  payoutAmount: BN;
  payoutTimestamp: BN;
  bump: number;
}

export interface Vault {
  pool: PublicKey;
  bump: number;
}