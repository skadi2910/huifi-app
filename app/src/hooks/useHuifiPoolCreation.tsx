import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { USDC_MINT } from '@/lib/constants';
import { useHuifiProgram } from './useHuifiProgram';
import { PublicKey } from '@solana/web3.js';
import { createPool } from '@/lib/huifi-data-access';
import { findPoolAddress } from '@/lib/pda';

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
    collateralRequirementBps: 0, // No collateral needed for predetermined
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
      
      if (!params.maxPlayers || params.maxPlayers < 2) {
        throw new Error("Invalid arguments: maxPlayers must be at least 2");
      }
      
      if (!params.entryFee || params.entryFee <= 0) {
        throw new Error("Invalid arguments: entryFee must be positive");
      }
      
      // Use USDC as default token mint
      const tokenMint = new PublicKey(USDC_MINT);
      
      // Convert UI parameters to contract parameters
      const contributionAmount = params.entryFee * 1_000_000; // Convert to USDC's 6 decimals
      const cycleDurationSeconds = frequencyToSeconds[params.frequency];
      const payoutDelaySeconds = 24 * 60 * 60; // 1 day delay by default
      const earlyWithdrawalFeeBps = penaltyToBps[params.latePenalty];
      const collateralRequirementBps = payoutMethodToConfig[params.payoutMethod].collateralRequirementBps;
      const yieldStrategy = 0; // No yield strategy by default (0 = None)
      const isPrivate = params.privacy === 'private';

      try {
        // Calculate the pool address using findPoolAddress from pda.ts
        const [poolAddress] = findPoolAddress(
          tokenMint,
          publicKey,
          params.maxPlayers
        );

        // Use the existing createPool function from huifi-data-access.ts with the added poolAddress
        const tx = await createPool(
          program,
          publicKey,
          params.name,
          params.description,
          params.maxPlayers,
          contributionAmount,
          cycleDurationSeconds,
          payoutDelaySeconds,
          earlyWithdrawalFeeBps,
          collateralRequirementBps,
          yieldStrategy,
          isPrivate,
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