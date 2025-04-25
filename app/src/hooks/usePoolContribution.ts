import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

<<<<<<< HEAD
export const usePoolContribution = (poolAddress: PublicKey) => {
=======
export const usePoolContribution = (poolAddress: PublicKey, isNativeSol: boolean) => {
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  // Mutation for making a contribution to the pool
  const contributeMutation = useMutation({
    mutationKey: ['contribute-pool', { pool: poolAddress.toString() }],
<<<<<<< HEAD
    mutationFn: async (amount: number): Promise<string> => {
=======
    mutationFn: async ({ uuid, amount }: { uuid: number[]; amount: number }): Promise<string> => {
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
<<<<<<< HEAD
        // Fetch the pool to get token mint
        const poolAccount = await program.account.HuifiPool.fetch(poolAddress);
        const tokenMint = poolAccount.tokenMint;
        
        // Get user account PDA
        const [userAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('user'), publicKey.toBuffer()],
          program.programId
        );
        
        // Get user's token account
        const userTokenAccount = getAssociatedTokenAddressSync(
          tokenMint,
          publicKey
        );
        
        // Get pool's token account
        const [poolTokenAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from('token_account'), poolAddress.toBuffer()],
          program.programId
        );
        
        // Convert amount to lamports (assuming 6 decimals for the token)
        const amountLamports = new BN(amount * 1_000_000);
        
        const signature = await program.methods
          .contribute(amountLamports)
          .accounts({
            groupAccount: poolAddress,
            user: publicKey,
            userAccount: userAccountPda,
            userTokenAccount,
            poolTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
=======
        const amountLamports = new BN(amount * 1_000_000);
        
        const signature = isNativeSol
          ? await program.methods
              .contributeSol(uuid, amountLamports)
              .accounts({
                // ... SOL contribution accounts
              })
              .rpc()
          : await program.methods
              .contributeSpl(uuid, amountLamports)
              .accounts({
                // ... SPL contribution accounts
              })
              .rpc();
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
          
        addTransaction(signature, 'Contribute to Pool');
        return signature;
      } catch (error) {
        console.error('Error contributing to pool:', error);
        throw error;
      }
    }
  });
  
  return { contributeMutation };
};