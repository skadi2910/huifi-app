import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const usePoolContribution = (poolAddress: PublicKey) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  // Mutation for making a contribution to the pool
  const contributeMutation = useMutation({
    mutationKey: ['contribute-pool', { pool: poolAddress.toString() }],
    mutationFn: async (amount: number): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
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