import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const useCollateral = (poolAddress: PublicKey, isNativeSol: boolean) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const depositCollateralMutation = useMutation({
    mutationKey: ['deposit-collateral', { pool: poolAddress.toString() }],
    mutationFn: async ({ uuid, amount }: { uuid: number[]; amount: number }): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        const amountLamports = new BN(amount * 1_000_000);
        
        const signature = isNativeSol
          ? await program.methods
              .depositSolCollateral(uuid, amountLamports)
              .accounts({
                groupAccount: poolAddress,
                user: publicKey,
                // Add other required accounts
              })
              .rpc()
          : await program.methods
              .depositSplCollateral(uuid, amountLamports)
              .accounts({
                groupAccount: poolAddress,
                user: publicKey,
                // Add other required accounts
              })
              .rpc();

        addTransaction(signature, 'Deposit Collateral');
        return signature;
      } catch (error) {
        console.error('Error depositing collateral:', error);
        throw error;
      }
    }
  });

  return { depositCollateralMutation };
}; 