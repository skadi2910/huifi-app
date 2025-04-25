import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const usePoolWhitelist = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const addToWhitelistMutation = useMutation({
    mutationKey: ['add-to-whitelist', poolAddress.toString()],
    mutationFn: async (addresses: PublicKey[]): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        const signature = await program.methods
          .updateWhitelist(addresses)
          .accounts({
            pool: poolAddress,
            authority: publicKey,
          })
          .rpc();

        addTransaction(signature, 'Update Whitelist');
        return signature;
      } catch (error) {
        console.error('Error updating whitelist:', error);
        throw error;
      }
    }
  });

  return { addToWhitelistMutation };
}; 