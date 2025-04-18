import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ContractsHui } from "../target/types/contracts_hui";
import { 
  createMint, 
  getOrCreateAssociatedTokenAccount,
  mintTo, 
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { expect } from 'chai';
import { BN } from "bn.js";

describe("HuiFi Protocol", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.ContractsHui as Program<ContractsHui>;
  
  // Test accounts
  const admin = anchor.web3.Keypair.generate();
  const user1 = anchor.web3.Keypair.generate();
  const user2 = anchor.web3.Keypair.generate();
  const user3 = anchor.web3.Keypair.generate();
  const treasuryKeypair = anchor.web3.Keypair.generate();
  
  let tokenMint;
  let adminTokenAccount;
  let user1TokenAccount;
  let user2TokenAccount;
  let user3TokenAccount;
  let protocolSettingsPDA;
  let protocolSettingsBump;
  let groupAccountPDA;
  let vaultPDA;
  
  // Constants
  const PROTOCOL_SEED = Buffer.from("huifi-protocol");
  const POOL_SEED = Buffer.from("huifi-pool");
  const MEMBER_SEED = Buffer.from("huifi-member");
  const VAULT_SEED = Buffer.from("huifi-vault");
  
  const PROTOCOL_FEE_BPS = 200; // 2%
  const INITIAL_TOKEN_AMOUNT = 10000;
  const CONTRIBUTION_AMOUNT = 100;
  const MAX_PARTICIPANTS = 3;
  const CYCLE_DURATION_SECONDS = 3 * 24 * 60 * 60; // 3 days
  const PAYOUT_DELAY_SECONDS = 1 * 24 * 60 * 60; // 1 day
  const EARLY_WITHDRAWAL_FEE_BPS = 200; // 2%
  const COLLATERAL_REQUIREMENT_BPS = 20000; // 200%
  
  before(async () => {
    // Airdrop SOL to all accounts
    await provider.connection.requestAirdrop(admin.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user3.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(treasuryKeypair.publicKey, 1 * anchor.web3.LAMPORTS_PER_SOL);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    );
    
    // Create token accounts
    adminTokenAccount = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      tokenMint,
      admin.publicKey
    )).address;
    
    user1TokenAccount = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user1,
      tokenMint,
      user1.publicKey
    )).address;
    
    user2TokenAccount = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user2,
      tokenMint,
      user2.publicKey
    )).address;
    
    user3TokenAccount = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      user3,
      tokenMint,
      user3.publicKey
    )).address;
    
    // Mint tokens to users
    await mintTo(
      provider.connection,
      admin,
      tokenMint,
      adminTokenAccount,
      admin.publicKey,
      INITIAL_TOKEN_AMOUNT * 10
    );
    
    await mintTo(
      provider.connection,
      admin,
      tokenMint,
      user1TokenAccount,
      admin.publicKey,
      INITIAL_TOKEN_AMOUNT
    );
    
    await mintTo(
      provider.connection,
      admin,
      tokenMint,
      user2TokenAccount,
      admin.publicKey,
      INITIAL_TOKEN_AMOUNT
    );
    
    await mintTo(
      provider.connection,
      admin,
      tokenMint,
      user3TokenAccount,
      admin.publicKey,
      INITIAL_TOKEN_AMOUNT
    );
    
    // Find PDAs
    [protocolSettingsPDA, protocolSettingsBump] = 
      anchor.web3.PublicKey.findProgramAddressSync(
        [PROTOCOL_SEED],
        program.programId
      );
    
    console.log("Admin:", admin.publicKey.toString());
    console.log("Protocol settings PDA:", protocolSettingsPDA.toString());
    console.log("Token mint:", tokenMint.toString());
    console.log("Treasury keypair:", treasuryKeypair.publicKey.toString());
  });
  
  it("Initializes the protocol", async () => {
    try {
      const tx = await program.methods
        .initializeProtocol(PROTOCOL_FEE_BPS)
        .accounts({
          admin: admin.publicKey,
          protocolSettings: protocolSettingsPDA,
          treasury: treasuryKeypair.publicKey,
          tokenMint: tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([admin, treasuryKeypair])
        .rpc();
      
      console.log("Protocol initialized:", tx);
      
      // Verify protocol settings
      const protocolSettings = await program.account.protocolSettings.fetch(protocolSettingsPDA);
      console.log("Protocol settings:", protocolSettings);
      
      expect(protocolSettings.authority.toString()).to.equal(admin.publicKey.toString());
      expect(protocolSettings.treasury.toString()).to.equal(treasuryKeypair.publicKey.toString());
      expect(protocolSettings.feeBps).to.equal(PROTOCOL_FEE_BPS);
      
      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error initializing protocol:", error);
      throw error;
    }
  });
  
  it("Creates a new pool", async () => {
    try {
      // Find group account PDA
      [groupAccountPDA] = 
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            POOL_SEED,
            tokenMint.toBuffer(),
            user1.publicKey.toBuffer(), 
            Buffer.from([MAX_PARTICIPANTS])
          ],
          program.programId
        );
      
      // Find vault PDA
      [vaultPDA] = anchor.web3.PublicKey.findProgramAddressSync(
        [VAULT_SEED, groupAccountPDA.toBuffer()],
        program.programId
      );
      
      console.log("Group account PDA:", groupAccountPDA.toString());
      console.log("Vault PDA:", vaultPDA.toString());
      
      // Pool configuration
      const poolConfig = {
        maxParticipants: MAX_PARTICIPANTS,
        contributionAmount: new BN(CONTRIBUTION_AMOUNT),
        cycleDurationSeconds: new BN(CYCLE_DURATION_SECONDS),
        payoutDelaySeconds: new BN(PAYOUT_DELAY_SECONDS),
        earlyWithdrawalFeeBps: EARLY_WITHDRAWAL_FEE_BPS,
        collateralRequirementBps: COLLATERAL_REQUIREMENT_BPS,
        yieldStrategy: { none: {} }
      };
      
      // Create pool
      const tx = await program.methods
        .createPool(poolConfig)
        .accounts({
          creator: user1.publicKey,
          groupAccount: groupAccountPDA,
          tokenMint: tokenMint,
          vault: vaultPDA,
          protocolSettings: protocolSettingsPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user1])
        .rpc();
        
      console.log("Pool created:", tx);
      
      // Verify pool creation
      const groupAccount = await program.account.groupAccount.fetch(groupAccountPDA);
      console.log("Group account:", groupAccount);
      
      // Wait for confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error("Error creating pool:", error);
      throw error;
    }
  });
  
  it("Allows users to join the pool", async () => {
    try {
      // Find member account PDA for user2
      const [user2MemberPDA] = 
        anchor.web3.PublicKey.findProgramAddressSync(
          [MEMBER_SEED, groupAccountPDA.toBuffer(), user2.publicKey.toBuffer()],
          program.programId
        );
        
      console.log("User2 member PDA:", user2MemberPDA.toString());
      
      // User2 joins the pool
      const tx = await program.methods
        .joinPool()
        .accounts({
          user: user2.publicKey,
          groupAccount: groupAccountPDA,
          memberAccount: user2MemberPDA,
          userTokenAccount: user2TokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user2])
        .rpc();
        
      console.log("User2 joined pool:", tx);
      
      // Wait for the account to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find member account PDA for user3
      const [user3MemberPDA] = 
        anchor.web3.PublicKey.findProgramAddressSync(
          [MEMBER_SEED, groupAccountPDA.toBuffer(), user3.publicKey.toBuffer()],
          program.programId
        );
        
      console.log("User3 member PDA:", user3MemberPDA.toString());
      
      // User3 joins the pool (last member, will activate the pool)
      const tx2 = await program.methods
        .joinPool()
        .accounts({
          user: user3.publicKey,
          groupAccount: groupAccountPDA,
          memberAccount: user3MemberPDA,
          userTokenAccount: user3TokenAccount,
          systemProgram: anchor.web3.SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .signers([user3])
        .rpc();
        
      console.log("User3 joined pool:", tx2);
      
      // Wait for the account to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error("Error joining pool:", error);
      throw error;
    }
  });
  
  it("Allows users to contribute to the pool", async () => {
    try {
      // Find member account PDA for user1
      const [user1MemberPDA] = 
        anchor.web3.PublicKey.findProgramAddressSync(
          [MEMBER_SEED, groupAccountPDA.toBuffer(), user1.publicKey.toBuffer()],
          program.programId
        );
        
      console.log("User1 member PDA:", user1MemberPDA.toString());
      
      // User1 contributes to the pool
      const tx = await program.methods
        .contribute(new BN(CONTRIBUTION_AMOUNT))
        .accounts({
          contributor: user1.publicKey,
          groupAccount: groupAccountPDA,
          memberAccount: user1MemberPDA,
          contributorTokenAccount: user1TokenAccount,
          vault: vaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user1])
        .rpc();
        
      console.log("User1 contributed to pool:", tx);
      
      // Wait for the transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // User2 contributes to the pool
      const [user2MemberPDA] = 
        anchor.web3.PublicKey.findProgramAddressSync(
          [MEMBER_SEED, groupAccountPDA.toBuffer(), user2.publicKey.toBuffer()],
          program.programId
        );
      
      const tx2 = await program.methods
        .contribute(new BN(CONTRIBUTION_AMOUNT))
        .accounts({
          contributor: user2.publicKey,
          groupAccount: groupAccountPDA,
          memberAccount: user2MemberPDA,
          contributorTokenAccount: user2TokenAccount,
          vault: vaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user2])
        .rpc();
        
      console.log("User2 contributed to pool:", tx2);
      
      // Wait for the transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // User3 contributes to the pool
      const [user3MemberPDA] = 
        anchor.web3.PublicKey.findProgramAddressSync(
          [MEMBER_SEED, groupAccountPDA.toBuffer(), user3.publicKey.toBuffer()],
          program.programId
        );
      
      const tx3 = await program.methods
        .contribute(new BN(CONTRIBUTION_AMOUNT))
        .accounts({
          contributor: user3.publicKey,
          groupAccount: groupAccountPDA,
          memberAccount: user3MemberPDA,
          contributorTokenAccount: user3TokenAccount,
          vault: vaultPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([user3])
        .rpc();
        
      console.log("User3 contributed to pool:", tx3);
      
    } catch (error) {
      console.error("Error contributing to pool:", error);
      throw error;
    }
  });
});