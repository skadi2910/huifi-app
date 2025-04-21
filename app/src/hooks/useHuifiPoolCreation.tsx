import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { USDC_MINT } from '@/lib/constants';
import { useHuifiProgram } from './useHuifiProgram';
import { PublicKey } from '@solana/web3.js';
import { createPool } from '@/lib/huifi-data-access';
import { findPoolAddress } from '@/lib/pda';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';

// Protocol constants defined to mirror smart contract requirements
const MIN_PARTICIPANTS = 3;
const MAX_PARTICIPANTS = 20;
const MIN_CONTRIBUTION_AMOUNT = 1_000_000; // 1 USDC (in raw units)
const MAX_CONTRIBUTION_AMOUNT = 1_000_000_000; // 1000 USDC (in raw units)
const MIN_CYCLE_DURATION = 24 * 60 * 60; // 1 day in seconds
const MAX_CYCLE_DURATION = 30 * 24 * 60 * 60; // 30 days in seconds
const MIN_COLLATERAL_REQUIREMENT_BPS = 10000; // 100%
const MAX_EARLY_WITHDRAWAL_FEE_BPS = 1000; // 10%

// Mapping from UI frequency options to seconds
const frequencyToSeconds = {
  daily: 24 * 60 * 60,      // 1 day
  weekly: 7 * 24 * 60 * 60, // 1 week
  biweekly: 14 * 24 * 60 * 60, // 2 weeks
  monthly: 30 * 24 * 60 * 60, // 30 days
};

// Mapping from UI payout methods to contract configurations
const payoutMethodToConfig = {
  predetermined: {
    collateralRequirementBps: MIN_COLLATERAL_REQUIREMENT_BPS, // Updated to meet minimum requirement
  },
  bidding: {
    collateralRequirementBps: 20000, // 200% collateral requirement
  }
};

// Mapping from UI penalty types to contract values
const penaltyToBps = {
  none: 0,
  low: 100,  // 1%
  medium: 500, // 5%
  high: 1000, // 10%
};

export type PoolCreationParams = {
  name: string;
  description: string;
  maxPlayers: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  entryFee: number;
  currency: string; // Should be a token mint address in production
  payoutMethod: 'predetermined' | 'bidding';
  latePenalty: 'none' | 'low' | 'medium' | 'high';
  privacy: 'public' | 'private';
  creator: PublicKey;
};

export function useHuifiPoolCreation() {
  const program = useHuifiProgram();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const createPoolMutation = useMutation({
    mutationFn: async (params: PoolCreationParams) => {
      if (!program || !publicKey || !connection) {
        throw new Error("Wallet not connected or program not loaded");
      }
      
      // Additional validation for required parameters
      if (!params) {
        throw new Error("Invalid arguments: params not provided");
      }
      
      if (!params.name) {
        throw new Error("Invalid arguments: name not provided");
      }
      
      // Updated validation to match contract requirements
      if (!params.maxPlayers || params.maxPlayers < MIN_PARTICIPANTS || params.maxPlayers > MAX_PARTICIPANTS) {
        throw new Error(`Invalid arguments: maxPlayers must be between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS}`);
      }
      
      // Validate entry fee
      const rawContributionAmount = params.entryFee * 1_000_000; // Convert to USDC's 6 decimals
      if (!params.entryFee || rawContributionAmount < MIN_CONTRIBUTION_AMOUNT || rawContributionAmount > MAX_CONTRIBUTION_AMOUNT) {
        throw new Error(`Invalid arguments: entryFee must be between ${MIN_CONTRIBUTION_AMOUNT / 1_000_000} and ${MAX_CONTRIBUTION_AMOUNT / 1_000_000} USDC`);
      }
      
      // Use USDC as default token mint
      const tokenMint = new PublicKey(USDC_MINT);
      
      // Convert UI parameters to contract parameters
       const contributionAmount = Math.floor(rawContributionAmount);
      const cycleDurationSeconds = frequencyToSeconds[params.frequency];
      
      // Ensure cycle duration is within bounds
      if (cycleDurationSeconds < MIN_CYCLE_DURATION || cycleDurationSeconds > MAX_CYCLE_DURATION) {
        throw new Error("Invalid frequency: cycle duration must be between 1 and 30 days");
      }
      
      const payoutDelaySeconds = 24 * 60 * 60; // 1 day delay by default
      
      // Ensure these values are within acceptable ranges (typically u16 max = 65535)
      const earlyWithdrawalFeeBps = Math.min(penaltyToBps[params.latePenalty], MAX_EARLY_WITHDRAWAL_FEE_BPS);
      
      // Ensure collateral requirement meets the minimum but doesn't exceed u16 max
      const collateralRequirementBps = Math.min(
        Math.max(
          payoutMethodToConfig[params.payoutMethod].collateralRequirementBps,
          MIN_COLLATERAL_REQUIREMENT_BPS
        ),
        65535
      );
      
      const isPrivate = params.privacy === 'private';

      try {
        const [poolAddress] = findPoolAddress(
          tokenMint,
          publicKey,
          params.maxPlayers
        );
      
        // Create a properly structured pool_config object matching the IDL definition
        const poolConfig = {
          maxParticipants: params.maxPlayers,
          contributionAmount: new BN(contributionAmount),
          cycleDurationSeconds: new BN(cycleDurationSeconds),
          payoutDelaySeconds: new BN(payoutDelaySeconds),
          earlyWithdrawalFeeBps: earlyWithdrawalFeeBps,
          collateralRequirementBps: collateralRequirementBps,
          yieldStrategy: { none: {} },
          isPrivate: isPrivate
        };
      
        console.log("Pool config before passing to createPool:", {
          ...poolConfig,
          contributionAmount: poolConfig.contributionAmount.toString(),
          cycleDurationSeconds: poolConfig.cycleDurationSeconds.toString(),
          payoutDelaySeconds: poolConfig.payoutDelaySeconds.toString(),
        });
      
        const tx = await createPool(
          program,
          publicKey,
          params.name,
          params.description,
          poolConfig,
          tokenMint
        );
      
        return tx;
      } catch (error) {
        console.error("Error creating pool:", error);
        throw error;
      }
    },
  });

  return { createPoolMutation };
}