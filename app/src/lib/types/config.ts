import { BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { YieldPlatform } from './program-types';

export interface PoolConfig {
  maxParticipants: number;
  contributionAmount: BN;
  cycleDurationSeconds: BN;
  payoutDelaySeconds: BN;
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  yieldStrategy: YieldPlatform;
} 