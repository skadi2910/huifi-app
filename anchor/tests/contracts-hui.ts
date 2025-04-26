import * as anchor from '@coral-xyz/anchor';
import { Program, Idl, AnchorProvider, ProgramAccount } from '@coral-xyz/anchor';
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from '@solana/spl-token';
import { assert } from 'chai';

// Import the IDL properly
import idlJSON from '../target/idl/contracts_hui.json';

// Define an interface that matches your program's structure
interface ContractsHuiAccounts {
  // Define each account to have a fetch method that returns the correct type
  protocolSettings: {
    fetch(address: PublicKey): Promise<ProtocolSettings>;
  };
  huifiPool: {
    fetch(address: PublicKey): Promise<HuifiPool>;
  };
  userAccount: {
    fetch(address: PublicKey): Promise<UserAccount>;
  };
  vault: any;
  bid: any;
  roundResult: any;
}

// Create a custom Program type with the right account structure
type ContractsHuiProgram = Program<Idl> & {
  account: ContractsHuiAccounts;
};

// Need to manually add the missing required properties to match the Idl interface
// Use explicit casting through unknown to resolve TypeScript complaints
const completeIdl = {
  ...idlJSON,
  address: "5S8b4n1VwN3wasBcheSdUKSMyvVPLMgMe9FLxWLfBT8t",
  metadata: {
    name: "contracts_hui",
    version: "0.1.0",
    spec: "0.1.0",
    description: "HuiFi Rotating Savings Protocol"
  }
} as unknown as Idl;

describe('HuiFi Rotating Savings Tests', () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // Access the program from the workspace
  const program = anchor.workspace.ContractsHui as ContractsHuiProgram;

  // Generate keypairs for testing
  const admin = Keypair.generate();
  const treasury = Keypair.generate();
  let tokenMint: PublicKey;
  let protocolSettingsPDA: PublicKey;
  let protocolSettingsBump: number;

  // Setup before running tests
  before(async () => {
    // Airdrop SOL to admin for gas
    const airdropSig = await provider.connection.requestAirdrop(
      admin.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Create a token mint for testing
    tokenMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6 // 6 decimals like USDC
    );

    // Find protocol settings PDA
    [protocolSettingsPDA, protocolSettingsBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("huifi-protocol")],
        program.programId
      );
  });

  it('Initialize Protocol', async () => {
    // Protocol fee is set to 1% (100 basis points)
    const protocolFeeBps = 100;

    await program.methods
      .initialize_protocol(protocolFeeBps) // Use snake_case as it appears in the IDL
      .accounts({
        admin: admin.publicKey,
        protocol_settings: protocolSettingsPDA, // Use snake_case for account names too
        treasury: treasury.publicKey,
        token_mint: tokenMint,
        token_program: TOKEN_PROGRAM_ID,
        system_program: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([admin, treasury])
      .rpc();

    // Fetch the protocol settings - use the name as it appears in the IDL
    const protocolSettings = await program.account.protocolSettings.fetch(protocolSettingsPDA);

    // Match field names to the actual contract implementation
    assert.equal(protocolSettings.admin.toString(), admin.publicKey.toString());
    assert.equal(protocolSettings.treasury.toString(), treasury.publicKey.toString());
    assert.equal(protocolSettings.token_mint.toString(), tokenMint.toString());
    assert.equal(protocolSettings.protocol_fee_bps, protocolFeeBps);
  });

  it('Create User Account', async () => {
    const user = Keypair.generate();

    // Airdrop SOL for gas
    const airdropSig = await provider.connection.requestAirdrop(
      user.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Find user account PDA
    const [userAccountPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("huifi-member"), user.publicKey.toBuffer()],
      program.programId
    );

    // Use the method name as defined in the IDL (snake_case)
    await program.methods
      .create_user_account() // Use snake_case as it appears in the IDL
      .accounts({
        user_account: userAccountPDA, // Use snake_case for account names too
        user: user.publicKey,
        system_program: anchor.web3.SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    // Fetch user account using the correct account name from the IDL
    const userAccount = await program.account.userAccount.fetch(userAccountPDA);

    // Access fields as defined in your Rust contract
    assert.equal(userAccount.owner.toString(), user.publicKey.toString());
    assert.equal(userAccount.pools_joined, 0);
    assert.equal(userAccount.active_pools, 0);
    assert.equal(userAccount.total_contribution.toNumber(), 0);
    assert.equal(userAccount.total_winnings.toNumber(), 0);
    assert.equal(userAccount.experience_points, 0);
  });

  it('Create Pool', async () => {
    const creator = Keypair.generate();

    // Airdrop SOL for gas
    const airdropSig = await provider.connection.requestAirdrop(
      creator.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);

    // Pool configuration - use snake_case for struct field names
    const maxParticipants = 5;
    const contributionAmount = new anchor.BN(10_000_000); // 10 USDC
    const cycleDurationSeconds = new anchor.BN(24 * 60 * 60); // 1 day
    const payoutDelaySeconds = new anchor.BN(24 * 60 * 60); // 1 day
    const earlyWithdrawalFeeBps = 500; // 5%
    const collateralRequirementBps = 10000; // 100%
    const yieldStrategy = { none: {} };

    // Find pool PDA
    const [poolPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("huifi-pool"),
        tokenMint.toBuffer(),
        creator.publicKey.toBuffer(),
        Buffer.from([maxParticipants])
      ],
      program.programId
    );

    // Find vault PDA
    const [vaultPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("huifi-vault"), poolPDA.toBuffer()],
      program.programId
    );

    // Create pool with parameters that match your contract
    await program.methods
      .create_pool({ // Use snake_case as in IDL
        max_participants: maxParticipants,
        contribution_amount: contributionAmount,
        cycle_duration_seconds: cycleDurationSeconds,
        payout_delay_seconds: payoutDelaySeconds,
        early_withdrawal_fee_bps: earlyWithdrawalFeeBps,
        collateral_requirement_bps: collateralRequirementBps,
        yield_strategy: yieldStrategy
      })
      .accounts({
        creator: creator.publicKey,
        group_account: poolPDA, // Use snake_case for account names
        token_mint: tokenMint,
        vault: vaultPDA,
        protocol_settings: protocolSettingsPDA,
        token_program: TOKEN_PROGRAM_ID,
        system_program: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([creator])
      .rpc();

    // Fetch pool using the name from IDL - note the capitalization!
    const pool = await program.account.huifiPool.fetch(poolPDA);

    assert.equal(pool.creator.toString(), creator.publicKey.toString());
    assert.equal(pool.token_mint.toString(), tokenMint.toString());
    assert.equal(pool.max_participants, maxParticipants);
    assert.equal(pool.contribution_amount.toString(), contributionAmount.toString());
    assert.equal(pool.current_participants, 1); // Creator is first participant
    assert.equal(pool.status, 0);
  });
});

// Define the account types
export type ProtocolSettings = {
    admin: PublicKey,
    treasury: PublicKey,
    token_mint: PublicKey,
    protocol_fee_bps: number,
    bump: number,
}

export type HuifiPool = {
    creator: PublicKey,
    token_mint: PublicKey,
    max_participants: number,
    current_participants: number,
    contribution_amount: anchor.BN,
    cycle_duration_seconds: anchor.BN,
    payout_delay_seconds: anchor.BN,
    early_withdrawal_fee_bps: number,
    collateral_requirement_bps: number,
    status: number,
    total_value: number,
    current_round: number,
    next_payout_timestamp: number,
    startTime: number,
    yield_basis_points: number,
    yield_strategy: number,
    participants: PublicKey[],
    bump: number,
}

export type UserAccount = {
    owner: PublicKey,
    pools_joined: number,
    active_pools: number,
    total_contribution: anchor.BN,
    total_winnings: anchor.BN,
    experience_points: number,
    bump: number,
}