import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { PoolWithKey } from './useHuifiPools';
import { useTransactionToast } from '@/components/ui/ui-layout';
export interface AdvanceCycleParams {
  pool: PoolWithKey;
}

export const useAdvanceCycle = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const transactionToast = useTransactionToast();
  const advanceCycleMutation = useMutation({
    mutationKey: ['advance-cycle'],
    mutationFn: async (params: AdvanceCycleParams): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        const pool = params.pool;
        const groupPda = pool.publicKey;
        
        // Find the bid state PDA based on the current cycle
        const [bidStatePda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-bid-state'), groupPda.toBuffer()],
          program.programId
        );

        console.log('Advancing cycle for pool:', {
          authority: publicKey.toString(),
          groupAccount: groupPda.toString(),
          bidState: bidStatePda.toString(),
          currentCycle: pool.account.currentCycle
        });

        // Call the advance_cycle instruction
        const signature = await program.methods
          .forceAdvanceCycle()
          .accounts({
            authority: publicKey,
            groupAccount: groupPda,
            bidState: bidStatePda,
            // winnerMemberAccount is optional, so we don't include it for now
          })
          .rpc();

        console.log('Cycle advanced successfully:', signature);
        await connection.confirmTransaction(signature);
        addTransaction(signature, 'Advance Pool Cycle');
        transactionToast(signature);
        return signature;
      } catch (error) {
        console.error('Error advancing cycle:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
          console.error('Error object:', JSON.stringify(error, null, 2));
        }
        throw error;
      }
    }
  });

  return { advanceCycleMutation };
};