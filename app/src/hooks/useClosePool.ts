import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const useClosePool = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  
  // Mutation for closing a pool
  const closePoolMutation = useMutation({
    mutationKey: ['close-pool', { pool: poolAddress.toString() }],
    mutationFn: async (): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        const signature = await program.methods
          .closePool()
          .accounts({
            groupAccount: poolAddress,
            creator: publicKey,
          })
          .rpc();
          
        addTransaction(signature, 'Close Pool');
        return signature;
      } catch (error) {
        console.error('Error closing pool:', error);
        throw error;
      }
    }
  });
  
  return { closePoolMutation };
};