import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const usePoolBidding = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  
  // Mutation for placing a bid
  const placeBidMutation = useMutation({
    mutationKey: ['place-bid', { pool: poolAddress.toString() }],
    mutationFn: async ({ round, amount }: { round: number; amount: number }): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        // Fetch the pool to get token mint
        const poolAccount = await program.account.huifiPool.fetch(poolAddress);
        const tokenMint = poolAccount.tokenMint;
        
        // Calculate bid PDA
        const [bidPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('bid'), poolAddress.toBuffer(), publicKey.toBuffer(), Buffer.from([round])],
          program.programId
        );
        
        // Get bidder's token account
        const bidderTokenAccount = getAssociatedTokenAddressSync(
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
          .placeBid(round, amountLamports)
          .accounts({
            bid: bidPda,
            groupAccount: poolAddress,
            bidder: publicKey,
            bidderTokenAccount,
            poolTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
          
        addTransaction(signature, `Place Bid - Round ${round}`);
        return signature;
      } catch (error) {
        console.error('Error placing bid:', error);
        throw error;
      }
    }
  });
  
  return { placeBidMutation };
};