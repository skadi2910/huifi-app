import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const useProcessPayout = (poolAddress: PublicKey, isNativeSol: boolean) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const processPayoutMutation = useMutation({
    mutationKey: ['process-payout', { pool: poolAddress.toString() }],
    mutationFn: async (): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        const signature = isNativeSol
          ? await program.methods
              .processSolPayout()
              .accounts({
                groupAccount: poolAddress,
                recipient: publicKey,
                // Add other required accounts
              })
              .rpc()
          : await program.methods
              .processSplPayout()
              .accounts({
                groupAccount: poolAddress,
                recipient: publicKey,
                // Add other required accounts
              })
              .rpc();

        addTransaction(signature, 'Process Payout');
        return signature;
      } catch (error) {
        console.error('Error processing payout:', error);
        throw error;
      }
    }
  });

  return { processPayoutMutation };
}; 