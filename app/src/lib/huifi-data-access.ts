import { PublicKey, Transaction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { BN, Program, AnchorProvider } from '@project-serum/anchor';
import { findPoolAddress, findUserAccountAddress, findBidAddress, findRoundResultAddress, findVaultAddress, findProtocolSettingsAddress } from './pda';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { USDC_MINT } from './constants';

// Update the PoolConfig interface to match the Solana program exactly
export interface PoolConfig {
  maxParticipants: number;
  contributionAmount: BN;
  cycleDurationSeconds: BN;
  payoutDelaySeconds: BN;
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  yieldStrategy: { none: {} } | { jitoSol: {} };
  isPrivate: boolean; // This will be handled separately, not part of the on-chain struct
}

// Create pool function
export const createPool = async (
  program: Program,
  creator: PublicKey,
  name: string,
  description: string,
  poolConfig: PoolConfig,
  tokenMint: PublicKey
) => {
  // Find PDAs with bump seeds
  const [poolAddress, poolBump] = findPoolAddress(
    tokenMint, 
    creator, 
    poolConfig.maxParticipants
  );
  
  const [vaultAddress] = findVaultAddress(poolAddress);
  
  try {
    // Create a formatted pool config that exactly matches the Solana program's expected structure
    const formattedPoolConfig = {
      max_participants: poolConfig.maxParticipants,
      contribution_amount: poolConfig.contributionAmount,
      cycle_duration_seconds: poolConfig.cycleDurationSeconds,
      payout_delay_seconds: poolConfig.payoutDelaySeconds,
      early_withdrawal_fee_bps: Math.min(poolConfig.earlyWithdrawalFeeBps, 10000),
      collateral_requirement_bps: Math.min(poolConfig.collateralRequirementBps, 65535),
      yield_strategy: { none: {} }
    };

    // Debug log to check values
    console.log("Creating pool with config:", {
      maxParticipants: formattedPoolConfig.max_participants,
      contributionAmount: formattedPoolConfig.contribution_amount.toString(),
      cycleDurationSeconds: formattedPoolConfig.cycle_duration_seconds.toString(),
      payoutDelaySeconds: formattedPoolConfig.payout_delay_seconds.toString(),
      earlyWithdrawalFeeBps: formattedPoolConfig.early_withdrawal_fee_bps,
      collateralRequirementBps: formattedPoolConfig.collateral_requirement_bps,
      yieldStrategy: "none",
      isPrivate: poolConfig.isPrivate // Only for logging
    });
    
    // Get the protocol settings account
    const [protocolSettingsAddress] = findProtocolSettingsAddress();
    
    // Fix: Rename groupAccount to pool as expected by the Anchor program
    const tx = await program.methods
      .createPool(
        formattedPoolConfig,
        name,
        description
      )
      .accounts({
        creator: creator,
        pool: poolAddress, // Changed from 'groupAccount' to 'pool'
        tokenMint: tokenMint,       
        vault: vaultAddress,
        protocolSettings: protocolSettingsAddress,
        tokenProgram: TOKEN_PROGRAM_ID, 
        systemProgram: SystemProgram.programId, 
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc();
      
    return tx;
  } catch (error) {
    console.error("Error in createPool transaction:", error);
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      if ('logs' in error) {
        console.error("Program logs:", (error as any).logs);
      }
    }
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
        groupAccount: poolAddress,
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
          groupAccount: poolAddress,
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
      groupAccount: poolAddress,
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
      groupAccount: poolAddress,
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
      groupAccount: poolAddress,
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