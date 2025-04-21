import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';

export type HuifiPool = {
  admin: PublicKey;
  name: string;
  description: string;
  currency: string;
  maxParticipants: number;
  currentParticipants: number;
  contributionAmount: BN;
  totalValue: BN;
  frequency: BN; // in seconds
  status: number; // 0 = Active, 1 = Filling, 2 = Completed
  nextPayoutTimestamp: BN;
  currentRound: number;
  yieldBasisPoints: number;
  creationTimestamp: BN;
};

export type UserAccount = {
  owner: PublicKey;
  joinedPools: PublicKey[];
  currentContributions: PublicKey[];
  xp: number;
  level: number;
  totalContributed: BN;
  totalWon: BN;
};

export type BidAccount = {
  bidder: PublicKey;
  pool: PublicKey;
  round: number;
  amount: BN;
  timestamp: BN;
};

export type RoundResult = {
  pool: PublicKey;
  round: number;
  winner: PublicKey;
  amount: BN;
  timestamp: BN;
};

export type ParticipantStatus = 'Winner' | 'Next' | 'Waiting' | 'Confirmed';
export type PoolStatus = 'Active' | 'Filling' | 'Completed';