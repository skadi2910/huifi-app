import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface CollateralDepositedEvent {
  pool: PublicKey;
  user: PublicKey;
  amount: BN;
}

export interface EarlyPayoutRequestedEvent {
  pool: PublicKey;
  user: PublicKey;
}

export interface PayoutProcessedEvent {
  pool: PublicKey;
  recipient: PublicKey;
  amount: BN;
  isEarlyPayout: boolean;
}

export interface PoolCreatedEvent {
  pool: PublicKey;
  creator: PublicKey;
  maxParticipants: number;
  contributionAmount: BN;
  cycleDuration: BN;
  isNativeSol: boolean;
  isPrivate: boolean;
}

export interface UserAccountCreatedEvent {
  user: PublicKey;
  timestamp: BN;
}

export interface PoolJoinedEvent {
  pool: PublicKey;
  user: PublicKey;
  participantsCount: number;
}

export interface ContributionEvent {
  pool: PublicKey;
  user: PublicKey;
  amount: BN;
  totalPoolValue: BN;
  isNativeSol: boolean;
}

export interface BidPlacedEvent {
  pool: PublicKey;
  bidder: PublicKey;
  round: number;
  amount: BN;
}

export interface JackpotClaimedEvent {
  pool: PublicKey;
  winner: PublicKey;
  round: number;
  amount: BN;
}

export interface PoolClosedEvent {
  pool: PublicKey;
  creator: PublicKey;
  totalValue: BN;
} 