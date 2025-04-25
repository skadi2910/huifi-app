import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useMemo } from 'react';

// Define USDC addresses for different networks
const USDC_ADDRESSES = {
  mainnet: '',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', 
  testnet: '', 
  localnet: '4MDdpZdAoPhgiPydiMYTqCs52qgi5e5AfGnYimPdW2g8',
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

      // Determine which network we're on
      const currentNetwork = connection.rpcEndpoint.includes('devnet') 
        ? 'devnet' 
        : connection.rpcEndpoint.includes('testnet')
          ? 'testnet'
          : connection.rpcEndpoint.includes('localhost') || connection.rpcEndpoint.includes('127.0.0.1')
            ? 'localnet'
            : 'mainnet';
      
      // Use correct USDC address for network
      const tokenMintAddress = USDC_ADDRESSES[currentNetwork];
      const tokenMint = new PublicKey(tokenMintAddress);
      
      console.log(`Using ${currentNetwork} USDC address: ${tokenMintAddress}`);

      // Verify token mint exists
      try {
        const tokenMintInfo = await connection.getAccountInfo(tokenMint);
        if (!tokenMintInfo) {
          throw new Error(`Token mint account for ${currentNetwork} USDC does not exist or could not be found. You may need to create your own test token.`);
        }
      } catch (err) {
        console.error(`Error checking token mint (${tokenMintAddress}):`, err);
        throw new Error(`Failed to verify token mint on ${currentNetwork}. If using devnet/testnet, you may need to create your own test token.`);
      }

      // Derive the groupAccount PDA
      const groupPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from('huifi-pool'),
          tokenMint.toBuffer(),
          publicKey.toBuffer(),
          Buffer.from([params.maxPlayers]) 
        ],
        program.programId
      )[0];

      // Derive vault PDA
      const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from('huifi-vault'), groupPda.toBuffer()],
        program.programId
      )[0];

      // Get vault token account address
      const vaultTokenAccount = await getAssociatedTokenAddress(
        tokenMint,        // mint
        vaultPda,         // owner
        true              // allowOwnerOffCurve: true for PDA as owner
      );

      const contributionAmount = new BN(params.entryFee * 1_000_000); // Assuming 6 decimals for USDC
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
        vaultTokenAccount: vaultTokenAccount.toBase58(),
        poolConfig,
      });

      try {
        // Create the pool
        const signature = await program.methods
          .createPool(poolConfig)
          .accounts({
            creator: publicKey,
            groupAccount: groupPda,
            tokenMint: tokenMint,
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
      } catch (error) {
        console.error('Error creating pool:', error);
        throw error;
      }
    },
  });

  return { createPoolMutation };
};