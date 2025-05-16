// app/src/hooks/useJoinPool.ts
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useTransactionToast } from '@/components/ui/ui-layout';
export const useJoinPool = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const transactionToast = useTransactionToast();
  const joinPoolMutation = useMutation({
    mutationKey: ['join-sol-pool'],
    mutationFn: async (params: { poolId: PublicKey; uuid: number[] }): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        // Convert the UUID array to a Uint8Array with exactly 6 bytes
        const uuid = new Uint8Array(params.uuid.slice(0, 6));
        
        // Find the group account PDA using the UUID
        const [groupPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-pool'), uuid],
          program.programId
        );

        // Find the member account PDA
        const [memberPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-member'), groupPda.toBuffer(), publicKey.toBuffer()],
          program.programId
        );

        console.log('Joining pool:', {
          user: publicKey.toString(),
          groupAccount: groupPda.toString(),
          memberAccount: memberPda.toString(),
          uuid: Array.from(uuid)
        });

        // Call the join_sol_pool instruction
        const signature = await program.methods
          .joinSolPool(Array.from(uuid))
          .accounts({
            user: publicKey,
            groupAccount: groupPda,
            memberAccount: memberPda,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY
          })
          .rpc();

        console.log('Pool joined successfully:', signature);
        await connection.confirmTransaction(signature);
        addTransaction(signature, 'Join Pool');
        transactionToast(signature);
        return signature;
        // return "uoooo";
      } catch (error) {
        console.error('Error joining pool:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Optionally refresh pool data after successful join
      // If have a context or state that manages pools,
      // can trigger a refresh here
    }
  });

  return { joinPoolMutation };
};