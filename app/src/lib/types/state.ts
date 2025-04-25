import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export interface PoolState {
  lastUpdateTimestamp: BN;
  lastContributionRound: number;
  missedContributions: number;
  totalContributed: BN;
  totalWithdrawn: BN;
  collateralLocked: BN;
  earlyPayoutRequested: boolean;
  bidPlaced: boolean;
}

export interface UserState {
  poolStates: Map<string, PoolState>;
  totalPoolsJoined: number;
  totalContributions: BN;
  totalWinnings: BN;
  reputation: number;
}

export interface SystemState {
  totalPools: number;
  totalUsers: number;
  totalValueLocked: BN;
  protocolFees: BN;
  activePools: number;
} 