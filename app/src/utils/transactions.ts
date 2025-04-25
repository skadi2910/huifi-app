import {
  Transaction,
  TransactionInstruction,
  PublicKey,
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { findVaultAddress } from './pda';

export const buildContributionTransaction = async (
  program: any,
  poolAddress: PublicKey,
  userAddress: PublicKey,
  amount: BN,
  isNativeSol: boolean
): Promise<Transaction> => {
  const instructions: TransactionInstruction[] = [];
  
  // Add necessary instructions based on pool type
  if (isNativeSol) {
    const [vaultAddress] = findVaultAddress(poolAddress, true);
    
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userAddress,
        toPubkey: vaultAddress,
        lamports: amount.toNumber()
      })
    );
    
    instructions.push(
      await program.methods
        .contributeSol(amount)
        .accounts({
          pool: poolAddress,
          vault: vaultAddress,
          contributor: userAddress,
          systemProgram: SystemProgram.programId
        })
        .instruction()
    );
  } else {
    const [vaultAddress] = findVaultAddress(poolAddress, false);
    const pool = await program.account.huifiPool.fetch(poolAddress);
    const userAta = await getAssociatedTokenAddress(pool.tokenMint, userAddress);
    const vaultAta = await getAssociatedTokenAddress(pool.tokenMint, vaultAddress);
    
    instructions.push(
      await program.methods
        .contributeSpl(amount)
        .accounts({
          pool: poolAddress,
          vault: vaultAddress,
          contributor: userAddress,
          userTokenAccount: userAta,
          vaultTokenAccount: vaultAta,
          tokenProgram: TOKEN_PROGRAM_ID
        })
        .instruction()
    );
  }

  return new Transaction().add(...instructions);
};

export const buildBidTransaction = async (
  program: any,
  poolAddress: PublicKey,
  userAddress: PublicKey,
  round: number,
  amount: BN,
  isNativeSol: boolean
): Promise<Transaction> => {
  const instructions: TransactionInstruction[] = [];
  
  const [vaultAddress] = findVaultAddress(poolAddress, isNativeSol);
  
  if (isNativeSol) {
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: userAddress,
        toPubkey: vaultAddress,
        lamports: amount.toNumber()
      })
    );
  }
  
  instructions.push(
    await program.methods
      .placeBid(round, amount)
      .accounts({
        pool: poolAddress,
        vault: vaultAddress,
        bidder: userAddress,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .instruction()
  );
  
  return new Transaction().add(...instructions);
};

// Add more transaction builders as needed 