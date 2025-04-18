import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ContractsHui } from "../target/types/contracts_hui";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getTokenAccountBalance } from "@solana/spl-token";
import { assert } from "chai";

describe("HuiFi Protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.ContractsHui as Program<ContractsHui>;

  let mint: PublicKey;
  let mintAuthority: Keypair;
  let protocolPda: PublicKey;
  let protocolBump: number;
  let treasuryKeypair: Keypair;
  let creator: Keypair;
  let creatorTokenAccount: PublicKey;
  let user1: Keypair;
  let user1TokenAccount: PublicKey;
  let user2: Keypair;
  let user2TokenAccount: PublicKey;

  // Global setup for mint and keypairs
  before(async () => {
    mintAuthority = Keypair.generate();
    mint = await createMint(
      provider.connection,
      provider.wallet.payer,
      mintAuthority.publicKey,
      null,
      9 // 9 decimals
    );

    [protocolPda, protocolBump] = await PublicKey.findProgramAddress(
      [Buffer.from("protocol")],
      program.programId
    );

    treasuryKeypair = Keypair.generate();

    creator = Keypair.generate();
    await provider.connection.requestAirdrop(creator.publicKey, 2_000_000_000); // 2 SOL
    creatorTokenAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      creator.publicKey
    );
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      creatorTokenAccount,
      mintAuthority,
      1_000_000_000_000 // 1000 tokens
    );

    user1 = Keypair.generate();
    await provider.connection.requestAirdrop(user1.publicKey, 2_000_000_000);
    user1TokenAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      user1.publicKey
    );
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      user1TokenAccount,
      mintAuthority,
      1_000_000_000_000
    );

    user2 = Keypair.generate();
    await provider.connection.requestAirdrop(user2.publicKey, 2_000_000_000);
    user2TokenAccount = await createAccount(
      provider.connection,
      provider.wallet.payer,
      mint,
      user2.publicKey
    );
    await mintTo(
      provider.connection,
      provider.wallet.payer,
      mint,
      user2TokenAccount,
      mintAuthority,
      1_000_000_000_000
    );
  });

  it("Initializes the protocol", async () => {
    await program.methods
      .initializeProtocol(100) // 1% fee
      .accounts({
        admin: provider.wallet.publicKey,
        protocolSettings: protocolPda,
        treasury: treasuryKeypair.publicKey,
        tokenMint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([treasuryKeypair])
      .rpc();

    const protocolAccount = await program.account.protocolSettings.fetch(protocolPda);
    assert.equal(protocolAccount.authority.toBase58(), provider.wallet.publicKey.toBase58(), "Authority should match admin");
    assert.equal(protocolAccount.treasury.toBase58(), treasuryKeypair.publicKey.toBase58(), "Treasury should match");
    assert.equal(protocolAccount.feeBps, 100, "Fee should be 1%");
    assert.equal(protocolAccount.totalFeesCollected, 0, "Total fees collected should be 0");
    assert.equal(protocolAccount.yieldGenerated, 0, "Yield generated should be 0");
    assert.equal(protocolAccount.reserveBuffer, 0, "Reserve buffer should be 0");
    assert.equal(protocolAccount.bump, protocolBump, "Bump should match");
  });

  it("Creates a pool", async () => {
    const poolConfig = {
      maxParticipants: 3,
      contributionAmount: new anchor.BN(100_000_000_000), // 100 tokens
      cycleDurationSeconds: new anchor.BN(10), // 10 seconds for testing
      payoutDelaySeconds: new anchor.BN(5), // 5 seconds
      earlyWithdrawalFeeBps: 200, // 2%
      collateralRequirementBps: 20000, // 200%
      yieldStrategy: { none: {} },
    };

    const [groupAccountPda, groupBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("pool"),
        mint.toBuffer(),
        creator.publicKey.toBuffer(),
        new anchor.BN(poolConfig.maxParticipants).toBuffer("le", 1),
      ],
      program.programId
    );

    const [vaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), groupAccountPda.toBuffer()],
      program.programId
    );

    await program.methods
      .createPool(poolConfig)
      .accounts({
        creator: creator.publicKey,
        groupAccount: groupAccountPda,
        tokenMint: mint,
        vault: vaultPda,
        protocolSettings: protocolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const groupAccount = await program.account.groupAccount.fetch(groupAccountPda);
    assert.equal(groupAccount.creator.toBase58(), creator.publicKey.toBase58(), "Creator should match");
    assert.equal(groupAccount.tokenMint.toBase58(), mint.toBase58(), "Token mint should match");
    assert.equal(groupAccount.vault.toBase58(), vaultPda.toBase58(), "Vault should match");
    assert.equal(groupAccount.config.maxParticipants, 3, "Max participants should be 3");
    assert.equal(groupAccount.memberAddresses.length, 1, "Should have 1 member (creator)");
    assert.equal(groupAccount.memberAddresses[0].toBase58(), creator.publicKey.toBase58(), "Creator should be first member");
    assert.deepEqual(groupAccount.status, { initializing: {} }, "Status should be Initializing");
  });

  it("Joins the pool", async () => {
    const poolConfig = {
      maxParticipants: 3,
      contributionAmount: new anchor.BN(100_000_000_000),
      cycleDurationSeconds: new anchor.BN(10),
      payoutDelaySeconds: new anchor.BN(5),
      earlyWithdrawalFeeBps: 200,
      collateralRequirementBps: 20000,
      yieldStrategy: { none: {} },
    };

    const [groupAccountPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("pool"),
        mint.toBuffer(),
        creator.publicKey.toBuffer(),
        new anchor.BN(poolConfig.maxParticipants).toBuffer("le", 1),
      ],
      program.programId
    );

    const [vaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), groupAccountPda.toBuffer()],
      program.programId
    );

    await program.methods
      .createPool(poolConfig)
      .accounts({
        creator: creator.publicKey,
        groupAccount: groupAccountPda,
        tokenMint: mint,
        vault: vaultPda,
        protocolSettings: protocolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const [memberAccountPda1] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinPool()
      .accounts({
        user: user1.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda1,
        userTokenAccount: user1TokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();

    const [memberAccountPda2] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinPool()
      .accounts({
        user: user2.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda2,
        userTokenAccount: user2TokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user2])
      .rpc();

    const groupAccount = await program.account.groupAccount.fetch(groupAccountPda);
    assert.equal(groupAccount.memberAddresses.length, 3, "Should have 3 members");
    assert.deepEqual(groupAccount.status, { active: {} }, "Status should be Active");
    assert.deepEqual(
      groupAccount.payoutOrder.map(pk => pk.toBase58()),
      groupAccount.memberAddresses.map(pk => pk.toBase58()),
      "Payout order should match member addresses"
    );

    const memberAccount1 = await program.account.memberAccount.fetch(memberAccountPda1);
    assert.equal(memberAccount1.owner.toBase58(), user1.publicKey.toBase58(), "Member 1 owner should match");
    assert.equal(memberAccount1.contributionsMade, 0, "Member 1 contributions should be 0");
    assert.deepEqual(memberAccount1.status, { active: {} }, "Member 1 status should be Active");
  });

  it("Contributes to the pool", async () => {
    const poolConfig = {
      maxParticipants: 3,
      contributionAmount: new anchor.BN(100_000_000_000),
      cycleDurationSeconds: new anchor.BN(10),
      payoutDelaySeconds: new anchor.BN(5),
      earlyWithdrawalFeeBps: 200,
      collateralRequirementBps: 20000,
      yieldStrategy: { none: {} },
    };

    const [groupAccountPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("pool"),
        mint.toBuffer(),
        creator.publicKey.toBuffer(),
        new anchor.BN(poolConfig.maxParticipants).toBuffer("le", 1),
      ],
      program.programId
    );

    const [vaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), groupAccountPda.toBuffer()],
      program.programId
    );

    await program.methods
      .createPool(poolConfig)
      .accounts({
        creator: creator.publicKey,
        groupAccount: groupAccountPda,
        tokenMint: mint,
        vault: vaultPda,
        protocolSettings: protocolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const [memberAccountPdaCreator] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), creator.publicKey.toBuffer()],
      program.programId
    );
    const [memberAccountPda1] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );
    const [memberAccountPda2] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinPool()
      .accounts({
        user: user1.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda1,
        userTokenAccount: user1TokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .joinPool()
      .accounts({
        user: user2.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda2,
        userTokenAccount: user2TokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user2])
      .rpc();

    await program.methods
      .contribute(new anchor.BN(100_000_000_000))
      .accounts({
        contributor: creator.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPdaCreator,
        contributorTokenAccount: creatorTokenAccount,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    await program.methods
      .contribute(new anchor.BN(100_000_000_000))
      .accounts({
        contributor: user1.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda1,
        contributorTokenAccount: user1TokenAccount,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .contribute(new anchor.BN(100_000_000_000))
      .accounts({
        contributor: user2.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda2,
        contributorTokenAccount: user2TokenAccount,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user2])
      .rpc();

    const vaultBalance = await getTokenAccountBalance(provider.connection, vaultPda);
    assert.equal(vaultBalance.value.uiAmount, 300, "Vault should have 300 tokens");

    const memberAccountCreator = await program.account.memberAccount.fetch(memberAccountPdaCreator);
    assert.equal(memberAccountCreator.contributionsMade, 1, "Creator contributions should be 1");
  });

  it("Requests and processes early payout", async () => {
    const poolConfig = {
      maxParticipants: 3,
      contributionAmount: new anchor.BN(100_000_000_000),
      cycleDurationSeconds: new anchor.BN(10),
      payoutDelaySeconds: new anchor.BN(5),
      earlyWithdrawalFeeBps: 200,
      collateralRequirementBps: 20000,
      yieldStrategy: { none: {} },
    };

    const [groupAccountPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("pool"),
        mint.toBuffer(),
        creator.publicKey.toBuffer(),
        new anchor.BN(poolConfig.maxParticipants).toBuffer("le", 1),
      ],
      program.programId
    );

    const [vaultPda] = await PublicKey.findProgramAddress(
      [Buffer.from("vault"), groupAccountPda.toBuffer()],
      program.programId
    );

    await program.methods
      .createPool(poolConfig)
      .accounts({
        creator: creator.publicKey,
        groupAccount: groupAccountPda,
        tokenMint: mint,
        vault: vaultPda,
        protocolSettings: protocolPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    const [memberAccountPdaCreator] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), creator.publicKey.toBuffer()],
      program.programId
    );
    const [memberAccountPda1] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), user1.publicKey.toBuffer()],
      program.programId
    );
    const [memberAccountPda2] = await PublicKey.findProgramAddress(
      [Buffer.from("member"), groupAccountPda.toBuffer(), user2.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .joinPool()
      .accounts({
        user: user1.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda1,
        userTokenAccount: user1TokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .joinPool()
      .accounts({
        user: user2.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda2,
        userTokenAccount: user2TokenAccount,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .signers([user2])
      .rpc();

    await program.methods
      .contribute(new anchor.BN(100_000_000_000))
      .accounts({
        contributor: creator.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPdaCreator,
        contributorTokenAccount: creatorTokenAccount,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([creator])
      .rpc();

    await program.methods
      .contribute(new anchor.BN(100_000_000_000))
      .accounts({
        contributor: user1.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda1,
        contributorTokenAccount: user1TokenAccount,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .contribute(new anchor.BN(100_000_000_000))
      .accounts({
        contributor: user2.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPda2,
        contributorTokenAccount: user2TokenAccount,
        vault: vaultPda,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([user2])
      .rpc();

    const initialBalance = (await getTokenAccountBalance(provider.connection, creatorTokenAccount)).value.uiAmount;

    await program.methods
      .requestEarlyPayout()
      .accounts({
        member: creator.publicKey,
        groupAccount: groupAccountPda,
        memberAccount: memberAccountPdaCreator,
        memberTokenAccount: creatorTokenAccount,
        collateralTokenAccount: creatorTokenAccount,
        vault: vaultPda,
        protocolSettings: protocolPda,
        protocolTreasury: treasuryKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([creator])
      .rpc();

    const memberAccountBefore = await program.account.memberAccount.fetch(memberAccountPdaCreator);
    assert.deepEqual(memberAccountBefore.status, { receivedPayout: {} }, "Status should be ReceivedPayout");

    await new Promise(resolve => setTimeout(resolve, 6000)); // Wait 6 seconds for payout delay

    await program.methods
      .processPayout()
      .accounts({
        user: provider.wallet.publicKey,
        groupAccount: groupAccountPda,
        recipientAccount: memberAccountPdaCreator,
        recipient: creator.publicKey,
        recipientTokenAccount: creatorTokenAccount,
        collateralTokenAccount: creatorTokenAccount,
        vault: vaultPda,
        protocolSettings: protocolPda,
        protocolTreasury: treasuryKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([])
      .rpc();

    const finalBalance = (await getTokenAccountBalance(provider.connection, creatorTokenAccount)).value.uiAmount;
    const payoutAmount = 300 - (300 * 0.02); // 300 tokens - 2% fee
    const collateralAmount = 300 * 2; // 200% collateral
    assert.approximately(finalBalance - initialBalance, payoutAmount - collateralAmount, 0.1, "Balance should reflect payout minus collateral");

    const groupAccount = await program.account.groupAccount.fetch(groupAccountPda);
    assert.equal(groupAccount.currentCycle, 1, "Current cycle should increment");
  });
});