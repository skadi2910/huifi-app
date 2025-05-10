import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useMemo } from 'react';
import { generateRandomUUID } from '@/lib/types/utils';
import { YieldPlatform } from '@/lib/types/program-types';
import useCustomConnection from '@/hooks/useCustomConnection';
import { useWallet as useCustomWallet } from '@/hooks/useWallet';
// Define USDC addresses for different networks
const USDC_ADDRESSES = {
  mainnet: '',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', 
  testnet: '', 
  localnet: '',
};

interface CreatePoolParams {
  name: string;
  description: string;
  maxPlayers: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  entryFee: number;
  currency: string;
  payoutMethod: 'predetermined' | 'bidding';
  latePenalty: 'none' | 'small' | 'moderate' | 'strict';
  privacy: 'public' | 'private';
  creator: PublicKey;
}

function getFrequencyInSeconds(frequency: string): number {
  switch (frequency) {
    case 'daily': return 60 * 60 * 24;
    case 'weekly': return 60 * 60 * 24 * 7;
    case 'biweekly': return 60 * 60 * 24 * 14;
    case 'monthly': return 60 * 60 * 24 * 30;
    default: return 60 * 60 * 24;
  }
}

export const useHuifiPoolCreation = () => {
  // const { publicKey } = useWallet();
  // const { connection } = useConnection();
  const { activePublicKey,lazorError, lazorSignMessage } = useCustomWallet();
  console.log("activePublicKey",activePublicKey);
  // const publicKey = new PublicKey(activePublicKey);
  const publicKey = activePublicKey;
  const { connection } = useCustomConnection();
  const { program } = useHuifiProgram();
  console.log("program",program);
  const { addTransaction } = useTransactions();

  const protocolSettingsPda = useMemo(() => {
    if (!program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('huifi-protocol')],
      program.programId
    )[0];
  }, [program]);

  const createPoolMutation = useMutation({
    mutationKey: ['create-pool'],
    mutationFn: async (params: CreatePoolParams): Promise<string> => {
      if (!publicKey || !program || !protocolSettingsPda) {
        throw new Error('Wallet not connected or program not loaded');
      }

      // Generate a 6-byte UUID for the pool
      const uuid = generateRandomUUID(6);  // Keep as Uint8Array
      const uuidArray = Array.from(uuid);  // Convert to number[] only for program method
      console.log('Generated UUID:', uuidArray);

      // Determine whitelist based on privacy setting
      const whitelist = params.privacy === 'private' ? [] : null;
      
      // Derive the group account PDA with the UUID
      const groupPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from('huifi-pool'),
          uuid  // Use Uint8Array here
          ],
          program.programId
      )[0];

      // Derive vault SOL PDA
      const vaultSolPda = PublicKey.findProgramAddressSync(
        [Buffer.from('huifi-vault-sol'), groupPda.toBuffer()],
        program.programId
      )[0];

      const contributionAmount = new BN(params.entryFee * 1_000_000_000); // Convert to lamports
      const cycleDuration = getFrequencyInSeconds(params.frequency);

      // Create pool config object based on IDL structure
      const poolConfig = {
        maxParticipants: params.maxPlayers,
        contributionAmount,
        cycleDurationSeconds: new BN(cycleDuration),
        payoutDelaySeconds: new BN(86400), // Changed to 1 day (min allowed)
        earlyWithdrawalFeeBps: 500, // 5%
        collateralRequirementBps: 10000, // 100%
        yieldStrategy: { none: {} },
        isNativeSol: true,
        isPrivate: params.privacy === 'private',
        // feedId: ,
        status: 0 // This is PoolStatus.Initializing
      };

      console.log('Creating SOL pool with:', {
        creator: publicKey.toBase58(),
        groupPda: groupPda.toBase58(),
        vaultSolPda: vaultSolPda.toBase58(),
        poolConfig,
        uuid: uuidArray,
        whitelist: whitelist ? 'Private' : 'Public'
      });

      try {
        // Create the SOL pool using the new create_sol_pool instruction
        const signature = await program.methods
          .createSolPool(poolConfig, uuidArray, whitelist)  
          .accounts({
            creator: publicKey,
            groupAccount: groupPda,
            vaultSol: vaultSolPda,
            protocolSettings: protocolSettingsPda,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        console.log("signature",signature);
        await lazorSignMessage(signature);
        await connection.confirmTransaction(signature);
        addTransaction(signature, 'Create SOL Pool');

        return signature;
      } catch (error) {
        console.error('Error creating SOL pool:', error);
        console.error("error",lazorError);
        throw error;
      }
    },
  });

  return { createPoolMutation };
};