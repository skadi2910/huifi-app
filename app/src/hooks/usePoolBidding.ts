import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN, Program, Idl } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { HuifiPool } from '@/lib/types/program-types';

export const usePoolBidding = (poolAddress: PublicKey, isNativeSol: boolean) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  
  const placeBidMutation = useMutation({
    mutationKey: ['place-bid', { pool: poolAddress.toString() }],
    mutationFn: async ({ round, amount, uuid }: { round: number; amount: number; uuid: number[] }): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        // Get the correct token accounts based on pool type
        const accounts = isNativeSol 
          ? await getSolBidAccounts(poolAddress, publicKey, program)
          : await getSplBidAccounts(poolAddress, publicKey, program);
        
        const amountLamports = new BN(amount * 1_000_000);
        
        const signature = await program.methods
          .placeBid(round, amountLamports)
          .accounts(accounts)
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

const getSolBidAccounts = async (
  poolAddress: PublicKey,
  bidder: PublicKey,
  program: Program
) => {
  const [bidAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("bid"),
      bidder.toBuffer(),
      poolAddress.toBuffer(),
      Buffer.from([0]) // current round, assuming 0 for now
    ],
    program.programId
  );

  return {
    bid: bidAddress,
    groupAccount: poolAddress,
    bidder,
    systemProgram: SystemProgram.programId
  };
};

const getSplBidAccounts = async (
  poolAddress: PublicKey,
  bidder: PublicKey,
  program: Program
) => {
  // Use program.account as any to bypass TypeScript checks
  const poolAccount = (program.account as any);
  const pool = await poolAccount.huifiPool.fetch(poolAddress);
  
  // Manually access fields using snake_case (to match IDL fields)
  const tokenMint = pool.token_mint;
  const bidderTokenAccount = getAssociatedTokenAddressSync(tokenMint, bidder);
  const poolTokenAccount = getAssociatedTokenAddressSync(tokenMint, poolAddress);

  const [bidAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("bid"),
      bidder.toBuffer(),
      poolAddress.toBuffer(),
      Buffer.from([0]) // current round, assuming 0 for now
    ],
    program.programId
  );

  return {
    bid: bidAddress,
    groupAccount: poolAddress,
    bidder,
    bidderTokenAccount,
    poolTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId
  };
};