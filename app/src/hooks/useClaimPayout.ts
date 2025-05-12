import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const useClaimPayout = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  
  // Mutation for claiming a jackpot
  const claimPayoutMutation = useMutation({
    mutationKey: ['claim-payout', { pool: poolAddress.toString() }],
    mutationFn: async ({amount}: {amount: number}): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        // Log available account types to debug
        console.log('Available account types:', Object.keys(program.account));
        
        // Fetch the pool account to get token mint
        // Use group_account instead of huifiPool based on the Rust struct name
        const poolAccount = await program.account.HuifiPool.fetch(poolAddress);
        const tokenMint = poolAccount.tokenMint;
        
        // Calculate round result PDA
        // const [roundResultPda] = PublicKey.findProgramAddressSync(
        //   [Buffer.from('round_result'), poolAddress.toBuffer(), Buffer.from([round])],
        //   program.programId
        // );
        
        // Get winner's token account
        const winnerTokenAccount = getAssociatedTokenAddressSync(
          tokenMint,
          publicKey
        );
        
        // Get pool's token account
        const [poolTokenAccount] = PublicKey.findProgramAddressSync(
          [Buffer.from('token_account'), poolAddress.toBuffer()],
          program.programId
        );
        
        // Get user account PDA
        const [userAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('user'), publicKey.toBuffer()],
          program.programId
        );
        
        const signature = await program.methods
          .claimPayout(amount)
          .accounts({
            groupAccount: poolAddress,
            winner: publicKey,
            winnerTokenAccount,
            poolTokenAccount,
            userAccount: userAccountPda,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
          .rpc();
          
        addTransaction(signature, `Claim Payout`);
        return signature;
      } catch (error) {
        console.error('Error claiming jackpot:', error);
        throw error;
      }
    }
  });
  
  return { claimPayoutMutation };
};