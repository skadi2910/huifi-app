import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { BN, Program } from '@project-serum/anchor';
import { findPoolAddress, findUserAccountAddress, findBidAddress, findRoundResultAddress, findVaultAddress, findProtocolSettingsAddress } from './pda';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { USDC_MINT } from './constants';

// Create pool function
export const createPool = async (
  program: Program,
  creator: PublicKey,
  name: string,
  description: string,
  maxParticipants: number,
  contributionAmount: number,
  cycleDurationSeconds: number,
  payoutDelaySeconds: number,
  earlyWithdrawalFeeBps: number,
  collateralRequirementBps: number,
  yieldStrategy: number,
  isPrivate: boolean,
) => {
  // Use USDC as default token mint
  const tokenMint = new PublicKey(USDC_MINT);
  
  // Find PDAs with bump seeds
  const [poolAddress, poolBump] = findPoolAddress(tokenMint, creator, maxParticipants);
  const [vaultAddress] = findVaultAddress(poolAddress);
  
  // Protocol settings address 
  const [protocolSettingsAddress] = findProtocolSettingsAddress();
  
  const poolConfig = {
    name,
    description,
    maxParticipants,
    contributionAmount: new BN(contributionAmount),
    cycleDurationSeconds: new BN(cycleDurationSeconds),
    payoutDelaySeconds: new BN(payoutDelaySeconds),
    earlyWithdrawalFeeBps,
    collateralRequirementBps,
    yieldStrategy,
    isPrivate
  };
  
  try {
    // Create the transaction with proper PDA handling
    const tx = await program.methods
      .createPool(poolConfig)
      .accounts({
        creator: creator,
        pool: poolAddress,  
        tokenMint: tokenMint,
        vault: vaultAddress,
        protocolSettings: protocolSettingsAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      // Add this option to skip preflight checks which can help with some PDA validation issues
      .rpc({ skipPreflight: true });
      
    return tx;
  } catch (error) {
    console.error("Error in createPool transaction:", error);
    throw error;
  }
};

// Join pool function
export const joinPool = async (
  program: Program,
  user: PublicKey,
  poolAddress: PublicKey
) => {
  const [userAccountAddress] = findUserAccountAddress(user);
  
  try {
    // First try to join directly, assuming user account exists
    const tx = await program.methods
      .joinPool()
      .accounts({
        pool: poolAddress,
        user: user,
        userAccount: userAccountAddress,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    return tx;
  } catch (err: any) {
    // If error contains account does not exist, create it first
    if (err.message?.includes('Account not found')) {
      // Create user account first
      const createUserTx = await program.methods
        .createUserAccount()
        .accounts({
          userAccount: userAccountAddress,
          user: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      // Then join the pool
      const joinTx = await program.methods
        .joinPool()
        .accounts({
          pool: poolAddress,
          user: user,
          userAccount: userAccountAddress,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      return joinTx;
    } else {
      throw err;
    }
  }
};

// Contribute to pool function
export const contributeToPool = async (
  program: Program,
  user: PublicKey,
  poolAddress: PublicKey,
  mint: PublicKey,
) => {
  const [userAccountAddress] = findUserAccountAddress(user);
  
  // Get the pool data to determine contribution amount
  const poolData = await program.account.pool.fetch(poolAddress);
  const amount = poolData.contributionAmount as BN;
  
  // Get token accounts
  const userTokenAccount = await getAssociatedTokenAddress(
    mint,
    user
  );
  
  const poolTokenAccount = await getAssociatedTokenAddress(
    mint,
    poolAddress,
    true // allowOwnerOffCurve = true for PDA
  );
  
  const tx = await program.methods
    .contribute(amount)
    .accounts({
      pool: poolAddress,
      user: user,
      userAccount: userAccountAddress,
      tokenProgram: TOKEN_PROGRAM_ID,
      userTokenAccount: userTokenAccount,
      poolTokenAccount: poolTokenAccount
    })
    .rpc();
  
  return tx;
};

// Place bid function
export const placeBid = async (
  program: Program,
  bidder: PublicKey,
  poolAddress: PublicKey,
  round: number,
  amount: number,
  mint: PublicKey
) => {
  const [bidAddress] = findBidAddress(bidder, poolAddress, round);
  
  // Get token accounts
  const bidderTokenAccount = await getAssociatedTokenAddress(
    mint,
    bidder
  );
  
  const poolTokenAccount = await getAssociatedTokenAddress(
    mint,
    poolAddress,
    true // allowOwnerOffCurve = true for PDA
  );
  
  const tx = await program.methods
    .placeBid(round, new BN(amount))
    .accounts({
      bid: bidAddress,
      pool: poolAddress,
      bidder: bidder,
      bidderTokenAccount: bidderTokenAccount,
      poolTokenAccount: poolTokenAccount,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
};

// Claim jackpot function
export const claimJackpot = async (
  program: Program,
  winner: PublicKey,
  poolAddress: PublicKey,
  round: number,
  mint: PublicKey
) => {
  const [roundResultAddress] = findRoundResultAddress(poolAddress, round);
  const [userAccountAddress] = findUserAccountAddress(winner);
  
  // Get token accounts
  const winnerTokenAccount = await getAssociatedTokenAddress(
    mint,
    winner
  );
  
  const poolTokenAccount = await getAssociatedTokenAddress(
    mint,
    poolAddress,
    true // allowOwnerOffCurve = true for PDA
  );
  
  const tx = await program.methods
    .claimJackpot(round)
    .accounts({
      pool: poolAddress,
      roundResult: roundResultAddress,
      winner: winner,
      winnerTokenAccount: winnerTokenAccount,
      poolTokenAccount: poolTokenAccount,
      userAccount: userAccountAddress,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
  
  return tx;
};

// Create user account function
export const createUserAccount = async (
  program: Program,
  user: PublicKey
) => {
  const [userAccountAddress] = findUserAccountAddress(user);
  
  const tx = await program.methods
    .createUserAccount()
    .accounts({
      userAccount: userAccountAddress,
      user: user,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  return tx;
};