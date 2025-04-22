import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { BN, Program, AnchorProvider } from '@project-serum/anchor';
import { findPoolAddress, findUserAccountAddress, findBidAddress, findRoundResultAddress, findVaultAddress, findProtocolSettingsAddress } from './pda';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { USDC_MINT } from './constants';
import { POOL_SEED} from './constants';

// Update the PoolConfig interface to match the Solana program exactly
export interface PoolConfig {
  max_participants: number;
  contribution_amount: BN;
  cycle_duration_seconds: BN;
  payout_delay_seconds: BN;
  early_withdrawal_fee_bps: number;
  collateral_requirement_bps: number;
  yield_strategy: { none: {} } | { jitoSol: {} };
  is_private: boolean;
}

// Create pool function
// Update the createPool function with better error handling
export const createPool = async (
  program: Program,
  creator: PublicKey,
  poolConfig: PoolConfig,
  tokenMint: PublicKey | string
) => {
  
  // Ensure tokenMint is a PublicKey object
  const tokenMintKey = typeof tokenMint === 'string' 
    ? new PublicKey(tokenMint) 
    : tokenMint;
  
  // Find PDAs with bump seeds
  const [poolAddress, poolBump] = findPoolAddress(
    tokenMintKey, 
    creator, 
    poolConfig.max_participants
  );
  
  const [vaultAddress] = findVaultAddress(poolAddress);
  const [protocolSettingsAddress] = findProtocolSettingsAddress();
  
  try {
    // Check if the creator has enough SOL balance for the transaction
    const { connection } = program.provider;
    const balance = await connection.getBalance(creator);
    const minimumBalance = 10000000; // 0.01 SOL, adjust as needed
    
    if (balance < minimumBalance) {
      throw new Error(`Insufficient SOL balance. You need at least 0.01 SOL to create a pool. Current balance: ${balance / 1_000_000_000} SOL`);
    }
    
    // Check if protocol settings exist
    try {
      await program.account.protocolSettings.fetch(protocolSettingsAddress);
    } catch (err) {
      console.log('Protocol settings not initialized. Initialize protocol first.');
      throw new Error('Protocol not initialized. Please initialize protocol first.');
    }
    
    // Import necessary tokens dynamically to avoid circular dependencies
    const { TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
    const { SystemProgram, SYSVAR_RENT_PUBKEY } = await import('@solana/web3.js');
    
    console.log("Sending createPool transaction with:", {
      creator: creator.toString(),
      pool_config: {
        max_participants: poolConfig.max_participants,
        contribution_amount: poolConfig.contribution_amount.toString(),
        cycle_duration_seconds: poolConfig.cycle_duration_seconds.toString(),
        payout_delay_seconds: poolConfig.payout_delay_seconds.toString(),
        early_withdrawal_fee_bps: poolConfig.early_withdrawal_fee_bps,
        collateral_requirement_bps: poolConfig.collateral_requirement_bps,
        yield_strategy: poolConfig.yield_strategy,
        is_private: poolConfig.is_private
      }
    });
    
    // Create the transaction with properly formatted account names to match the IDL
    const tx = await program.methods
      .createPool(poolConfig)
      .accounts({
        creator: creator,
        group_account: poolAddress, 
        token_mint: tokenMintKey,
        vault: vaultAddress,
        protocol_settings: protocolSettingsAddress,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc({
        commitment: 'confirmed',
        skipPreflight: false // Set to true if you want to bypass simulation
      });
      
    return tx;
  } catch (error) {
    console.error("Error in createPool transaction:", error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      
      // Check for specific error messages
      if (error.message.includes('debit an account but found no record of a prior credit')) {
        throw new Error('Insufficient SOL balance for transaction. Please add more SOL to your wallet.');
      }
      
      if (error.message.includes('Custom program error')) {
        throw new Error(`Solana program error: ${error.message}`);
      }
    }
    
    throw error;
  }
};

export const initializeProtocol = async (
  program: Program,
  admin: PublicKey,
  protocolFeeBps: number = 100
) => {
  const [protocolSettingsAddress] = findProtocolSettingsAddress();
  
  try {
    // Import necessary packages
    const { TOKEN_PROGRAM_ID } = await import('@solana/spl-token');
    const { SystemProgram, SYSVAR_RENT_PUBKEY, Keypair } = await import('@solana/web3.js');
    
    // Create a treasury keypair as required by the program
    const treasuryKeypair = Keypair.generate();
    
    console.log("Protocol settings address:", protocolSettingsAddress.toString());
    console.log("Treasury keypair public key:", treasuryKeypair.publicKey.toString());
    console.log("Admin:", admin.toString());
    console.log("Protocol fee bps:", protocolFeeBps);
    
    // Execute the transaction with snake_case account names
    const tx = await program.methods
      .initializeProtocol(
        protocolFeeBps
      )
      .accounts({
        admin: admin,
        protocol_settings: protocolSettingsAddress,  // Use snake_case to match IDL
        treasury: treasuryKeypair.publicKey,
        token_mint: USDC_MINT,
        token_program: TOKEN_PROGRAM_ID,
        system_program: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([treasuryKeypair])  // Include treasury keypair as a signer
      .rpc({ 
        commitment: 'confirmed',
        skipPreflight: false  // Better for error debugging
      });
      
    console.log("Protocol initialized successfully with signature:", tx);
    return tx;
  } catch (error) {
    console.error("Error in initializeProtocol transaction:", error);
    
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