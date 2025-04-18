import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ContractsHui } from "../target/types/contracts-hui";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import { expect } from 'chai';
import { BN } from "bn.js";

describe("HuiFi Protocol", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ContractsHui as Program<ContractsHui>;
  
  // Test accounts
  const admin = anchor.web3.Keypair.generate();
  const user1 = anchor.web3.Keypair.generate();
  const user2 = anchor.web3.Keypair.generate();
  const user3 = anchor.web3.Keypair.generate();
  
  let tokenMint: anchor.web3.PublicKey;
  let adminTokenAccount: anchor.web3.PublicKey;
  let user1TokenAccount: anchor.web3.PublicKey;
  let user2TokenAccount: anchor.web3.PublicKey;
  let user3TokenAccount: anchor.web3.PublicKey;
  
  let protocolSettingsPDA: anchor.web3.PublicKey;
  let protocolSettingsBump: number;
  let treasuryPDA: anchor.web3.PublicKey;
  
  let groupAccountPDA: anchor.web3.PublicKey;
  let groupAccountBump: number;
  let vaultPDA: anchor.web3.PublicKey;
  
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
    // Airdrop SOL to all test accounts
    await provider.connection.requestAirdrop(admin.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user3.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for confirmation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create token mint
    tokenMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6 // Decimals
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
    
    // Mint initial tokens to users
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
      await anchor.web3.PublicKey.findProgramAddressSync(
        [PROTOCOL_SEED],
        program.programId
      );
      
    // Find treasury PDA
    treasuryPDA = (await getOrCreateAssociatedTokenAccount(
      provider.connection,
      admin,
      tokenMint,
      protocolSettingsPDA,
      true
    )).address;
  });
  
  it("Initializes the protocol", async () => {
    const tx = await program.methods
      .initializeProtocol(PROTOCOL_FEE_BPS)
      .accounts({
        admin: admin.publicKey,
        protocolSettings: protocolSettingsPDA,
        treasury: treasuryPDA,
        tokenMint: tokenMint,
        tokenProgram: anchor.spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([admin])
      .rpc();
      
    console.log("Protocol initialized:", tx);
    
    // Verify protocol settings
    const protocolSettings = await program.account.protocolSettings.fetch(protocolSettingsPDA);
    expect(protocolSettings.authority.toString()).to.equal(admin.publicKey.toString());
    expect(protocolSettings.treasury.toString()).to.equal(treasuryPDA.toString());
    expect(protocolSettings.feeBps).to.equal(PROTOCOL_FEE_BPS);
    expect(protocolSettings.totalFeesCollected.toNumber()).to.equal(0);
    expect(protocolSettings.yieldGenerated.toNumber()).to.equal(0);
    expect(protocolSettings.reserveBuffer.toNumber()).to.equal(0);
  });
  
  it("Creates a new pool", async () => {
    // Find group account PDA
    [groupAccountPDA, groupAccountBump] = 
      await anchor.web3.PublicKey.findProgramAddressSync(
        [
          POOL_SEED,
          tokenMint.toBuffer(),
          user1.publicKey.toBuffer(), 
          Buffer.from([MAX_PARTICIPANTS])
        ],
        program.programId
      );
    
    // Find vault PDA
    [vaultPDA] = await anchor.web3.PublicKey.findProgramAddressSync(
      [VAULT_SEED, groupAccountPDA.toBuffer()],
      program.programId
    );
    
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
        tokenProgram: anchor.spl.TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();
      
    console.log("Pool created:", tx);
    
    // Verify pool creation
    const groupAccount = await program.account.groupAccount.fetch(groupAccountPDA);
    expect(groupAccount.creator.toString()).to.equal(user1.publicKey.toString());
    expect(groupAccount.tokenMint.toString()).to.equal(tokenMint.toString());
    expect(groupAccount.vault.toString()).to.equal(vaultPDA.toString());
    expect(groupAccount.config.maxParticipants).to.equal(MAX_PARTICIPANTS);
    expect(groupAccount.config.contributionAmount.toNumber()).to.equal(CONTRIBUTION_AMOUNT);
    expect(groupAccount.memberAddresses.length).to.equal(1);
    expect(groupAccount.memberAddresses[0].toString()).to.equal(user1.publicKey.toString());
    expect(groupAccount.currentCycle).to.equal(0);
    expect(groupAccount.totalCycles).to.equal(MAX_PARTICIPANTS);
    expect(groupAccount.status.initializing).to.not.be.undefined;
    expect(groupAccount.totalContributions.toNumber()).to.equal(0);
  });
  
  it("Allows users to join the pool", async () => {
    // Find member account PDA for user2
    const [user2MemberPDA] = 
      await anchor.web3.PublicKey.findProgramAddressSync(
        [MEMBER_SEED, groupAccountPDA.toBuffer(), user2.publicKey.toBuffer()],
        program.programId
      );
    
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
    
    // Verify user2 joined
    const groupAccount = await program.account.groupAccount.fetch(groupAccountPDA);
    expect(groupAccount.memberAddresses.length).to.equal(2);
    expect(groupAccount.memberAddresses[1].toString()).to.equal(user2.publicKey.toString());
    
    const memberAccount = await program.account.memberAccount.fetch(user2MemberPDA);
    expect(memberAccount.owner.toString()).to.equal(user2.publicKey.toString());
    expect(memberAccount.pool.toString()).to.equal(groupAccountPDA.toString());
    expect(memberAccount.contributionsMade).to.equal(0);
    expect(memberAccount.hasReceivedEarlyPayout).to.be.false;
    expect(memberAccount.status.active).to.not.be.undefined;
    
    // Find member account PDA for user3
    const [user3MemberPDA] = 
      await anchor.web3.PublicKey.findProgramAddressSync(
        [MEMBER_SEED, groupAccountPDA.toBuffer(), user3.publicKey.toBuffer()],
        program.programId
      );
    
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
    
    // Verify user3 joined and pool is active
    const updatedGroupAccount = await program.account.groupAccount.fetch(groupAccountPDA);
    expect(updatedGroupAccount.memberAddresses.length).to.equal(3);
    expect(updatedGroupAccount.memberAddresses[2].toString()).to.equal(user3.publicKey.toString());
    expect(updatedGroupAccount.status.active).to.not.be.undefined;
    expect(updatedGroupAccount.payoutOrder.length).to.equal(3);
  });
  
  // Additional tests:
  // - Test contributing to the pool
  // - Test requesting early payout
  // - Test processing payout
  // - Test edge cases and error conditions
});