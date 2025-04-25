import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const useEarlyPayout = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const requestEarlyPayoutMutation = useMutation({
    mutationKey: ['request-early-payout', { pool: poolAddress.toString() }],
    mutationFn: async (): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        const signature = await program.methods
          .requestEarlyPayout()
          .accounts({
            groupAccount: poolAddress,
            user: publicKey,
            // Add other required accounts
          })
          .rpc();

        addTransaction(signature, 'Request Early Payout');
        return signature;
      } catch (error) {
        console.error('Error requesting early payout:', error);
        throw error;
      }
    }
  });

  return { requestEarlyPayoutMutation };
}; 