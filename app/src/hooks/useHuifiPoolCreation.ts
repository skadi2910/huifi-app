import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useMemo } from 'react';

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
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useHuifiProgram();
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

      // Constants
      const tokenMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC

      // Derive the groupAccount PDA using correct seeds
      const groupPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from('huifi-pool'),
          tokenMint.toBuffer(),
          publicKey.toBuffer(),
          Buffer.from([params.maxPlayers]) 
        ],
        program.programId
      )[0];

      // Derive vault PDA using groupPda
      const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from('huifi-vault'), groupPda.toBuffer()],
        program.programId
      )[0];

      const contributionAmount = new BN(params.entryFee * 1_000_000);
      const cycleDuration = getFrequencyInSeconds(params.frequency);

      const yieldStrategy = { none: {} };

      const poolConfig = {
        maxParticipants: params.maxPlayers,
        contributionAmount,
        cycleDurationSeconds: new BN(cycleDuration),
        payoutDelaySeconds: new BN(3600), // 1 hour
        earlyWithdrawalFeeBps: new BN(500), // 5%
        collateralRequirementBps: new BN(1000), // 10%
        yieldStrategy,
      };

      console.log('Creating pool with:', {
        creator: publicKey.toBase58(),
        groupPda: groupPda.toBase58(),
        vaultPda: vaultPda.toBase58(),
        poolConfig,
      });

      const signature = await program.methods
        .createPool(poolConfig)
        .accounts({
          creator: publicKey,
          groupAccount: groupPda,
          tokenMint,
          vault: vaultPda,
          protocolSettings: protocolSettingsPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      await connection.confirmTransaction(signature);
      addTransaction(signature, 'Create Pool');

      return signature;
    },
  });

  return { createPoolMutation };
};
