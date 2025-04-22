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

// Updated mapping from UI penalty types to contract values
const penaltyToBps = {
  none: 0,
  small: 100,    // 1%
  moderate: 500,  // 3%
  strict: 1000,   // 10% - maximum penalty
};

export type PoolCreationParams = {
  name: string;
  description: string;
  maxPlayers: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  entryFee: number;
  currency: string; // Should be a token mint address in production
  payoutMethod: 'predetermined' | 'bidding';
  latePenalty: 'none' | 'small' | 'moderate' | 'strict';
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
      
      // Ensure these values are within acceptable ranges with better error handling
      let earlyWithdrawalFeeBps = params.latePenalty ? penaltyToBps[params.latePenalty] : 0;
      if (earlyWithdrawalFeeBps === undefined) {
        console.warn(`Unknown penalty type "${params.latePenalty}", defaulting to 0`);
        earlyWithdrawalFeeBps = 0;
      }
      if (earlyWithdrawalFeeBps > MAX_EARLY_WITHDRAWAL_FEE_BPS) {
        console.warn(`Early withdrawal fee ${earlyWithdrawalFeeBps} exceeds maximum of ${MAX_EARLY_WITHDRAWAL_FEE_BPS}, clamping to maximum.`);
        earlyWithdrawalFeeBps = MAX_EARLY_WITHDRAWAL_FEE_BPS;
      }
      
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
      
        // Ensure all numeric values are proper numbers and within range
        const maxParticipants = Number(params.maxPlayers);
        if (isNaN(maxParticipants) || maxParticipants < MIN_PARTICIPANTS || maxParticipants > MAX_PARTICIPANTS) {
          throw new Error(`maxPlayers must be a valid number between ${MIN_PARTICIPANTS} and ${MAX_PARTICIPANTS}`);
        }
        
        // Ensure currency amount is a proper BN
        const contributionAmountBn = new BN(contributionAmount);
        
        // Ensure cycle duration is a proper BN
        const cycleDurationSecondsBn = new BN(cycleDurationSeconds);
        
        // Ensure payout delay is a proper BN
        const payoutDelaySecondsBn = new BN(payoutDelaySeconds);
        
        // Ensure BPS values are proper numbers and within range with detailed error info
        const earlyWithdrawalFeeBpsNum = Number(earlyWithdrawalFeeBps);
        if (isNaN(earlyWithdrawalFeeBpsNum)) {
          throw new Error(`earlyWithdrawalFeeBps is not a valid number (value: ${earlyWithdrawalFeeBps}, type: ${typeof earlyWithdrawalFeeBps})`);
        }
        
        // Extra validation to make sure earlyWithdrawalFeeBps is not exceeding the max
        if (earlyWithdrawalFeeBpsNum > MAX_EARLY_WITHDRAWAL_FEE_BPS) {
          throw new Error(`earlyWithdrawalFeeBps must be a valid number not exceeding ${MAX_EARLY_WITHDRAWAL_FEE_BPS}`);
        }
        
        const collateralRequirementBpsNum = Number(collateralRequirementBps);
        if (isNaN(collateralRequirementBpsNum) || collateralRequirementBpsNum < MIN_COLLATERAL_REQUIREMENT_BPS) {
          throw new Error(`collateralRequirementBps must be a valid number at least ${MIN_COLLATERAL_REQUIREMENT_BPS}`);
        }
      
        // Create a properly structured pool_config object matching the IDL definition
        const poolConfig = {
          max_participants: Number(maxParticipants), 
          contribution_amount: contributionAmountBn,
          cycle_duration_seconds: cycleDurationSecondsBn,
          payout_delay_seconds: payoutDelaySecondsBn,
          early_withdrawal_fee_bps: Number(earlyWithdrawalFeeBpsNum), 
          collateral_requirement_bps: Number(collateralRequirementBpsNum), 
          yield_strategy: { none: {} }, 
          is_private: Boolean(isPrivate)
        };
      
        console.log("Pool config before passing to createPool:", {
          ...poolConfig,
          contribution_amount: poolConfig.contribution_amount.toString(),
          cycle_duration_seconds: poolConfig.cycle_duration_seconds.toString(),
          payout_delay_seconds: poolConfig.payout_delay_seconds.toString(),
          maxParticipants: poolConfig.max_participants,
          earlyWithdrawalFeeBps: poolConfig.early_withdrawal_fee_bps,
          collateralRequirementBps: poolConfig.collateral_requirement_bps
        });
      
        const tx = await createPool(
          program,
          publicKey,
          poolConfig,
          new PublicKey(USDC_MINT)
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