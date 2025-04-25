use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};


pub mod constants;
pub mod errors;

use constants::*;
use errors::*;

declare_id!("73N3XxT1FGJt2sZmtVbiuD3TcF2f6bLffMqUi7PJQZk9");

pub fn validate_pool_config(config: &PoolConfig) -> Result<()> {
    // Check number of participants
    require!(
        config.max_participants >= MIN_PARTICIPANTS && config.max_participants <= MAX_PARTICIPANTS,
        HuiFiError::InvalidPoolConfig
    );

    // Check contribution amount
    require!(
        config.contribution_amount >= MIN_CONTRIBUTION_AMOUNT && config.contribution_amount <= MAX_CONTRIBUTION_AMOUNT,
        HuiFiError::InvalidPoolConfig
    );

    // Check cycle duration
    require!(
        config.cycle_duration_seconds >= MIN_CYCLE_DURATION && config.cycle_duration_seconds <= MAX_CYCLE_DURATION,
        HuiFiError::InvalidPoolConfig
    );

    // Check payout delay
    require!(
        config.payout_delay_seconds >= MIN_PAYOUT_DELAY && config.payout_delay_seconds <= MAX_PAYOUT_DELAY,
        HuiFiError::InvalidPoolConfig
    );

    // Check early withdrawal fee
    require!(
        config.early_withdrawal_fee_bps <= MAX_EARLY_WITHDRAWAL_FEE_BPS,
        HuiFiError::InvalidPoolConfig
    );

    // Check collateral requirement
    require!(
        config.collateral_requirement_bps >= MIN_COLLATERAL_REQUIREMENT_BPS,
        HuiFiError::InvalidPoolConfig
    );

    Ok(())
}

#[program]


pub mod contracts_hui {
    use super::*;

    /// Initialize the protocol settings
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        let protocol_settings = &mut ctx.accounts.protocol_settings;
        
        // Check that protocol fee is reasonable (max 10%)
        require!(protocol_fee_bps <= 1000, HuiFiError::ProtocolFeeExceedsLimit);

        protocol_settings.admin = ctx.accounts.admin.key();
        protocol_settings.treasury = ctx.accounts.treasury.key();
        protocol_settings.token_mint = ctx.accounts.token_mint.key();
        protocol_settings.protocol_fee_bps = protocol_fee_bps;
        protocol_settings.bump = ctx.bumps.protocol_settings; // Fixed: use new Anchor bump API

        Ok(())
    }

    pub fn create_sol_pool(
        ctx: Context<CreateSolPool>,
        pool_config: PoolConfig,
        uuid: [u8; 6],
        whitelist: Option<Vec<Pubkey>>,
    ) -> Result<()> {
        // Validate pool configuration
    
        let current_timestamp = Clock::get()?.unix_timestamp;
        let group_account = &mut ctx.accounts.group_account;
        let bump = ctx.bumps.group_account;
        // Create a copy of pool_config instead of modifying the original
        let mut config = pool_config.clone();
        // Mark as SOL pool
        config.is_native_sol = true;
    
        // Initialize the group account
        group_account.uuid = uuid;
        group_account.creator = ctx.accounts.creator.key();
        group_account.whitelist = whitelist.unwrap_or_default();
        group_account.token_mint = anchor_spl::token::spl_token::native_mint::id();
        group_account.vault = ctx.accounts.vault_sol.key();
        group_account.config = config;
        group_account.member_addresses = Vec::new();
        group_account.payout_order = Vec::new();
        group_account.current_cycle = 0;
        group_account.total_cycles = pool_config.max_participants;
        group_account.status = PoolStatus::Initializing;
        group_account.total_contributions = 0;
        // group_account.unclaimed_payout = 0;
        group_account.last_cycle_timestamp = current_timestamp;
        group_account.next_payout_timestamp = 0;
        // group_account.price_feed_id = pool_config.feed_id;
        // group_account.current_bid_amount = None;
        // group_account.current_winner = None;
        group_account.bump = bump;
    
        // Add creator as the first member
        group_account.member_addresses.push(ctx.accounts.creator.key());
    
        msg!("✅ SOL Pool created with UUID: {:?}", uuid);
        msg!("👥 Max participants: {}", pool_config.max_participants);
    
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + ProtocolSettings::INIT_SPACE,
        seeds = [b"huifi-protocol"],
        bump
    )]
    pub protocol_settings: Box<Account<'info, ProtocolSettings>>,

    #[account(mut)]
    pub treasury: Signer<'info>,

    pub token_mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(pool_config: PoolConfig, uuid: [u8; 6])]
pub struct CreateSolPool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<GroupAccount>(),
        seeds = [POOL_SEED, uuid.as_ref()],
        bump,
    )]
    pub group_account: Account<'info, GroupAccount>,

    /// CHECK: This is a PDA that will hold SOL
    #[account(
        mut,
        seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault_sol: UncheckedAccount<'info>,

    #[account(seeds = [PROTOCOL_SEED], bump = protocol_settings.bump)]
    pub protocol_settings: Account<'info, ProtocolSettings>,

    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}



#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PoolStatus {
    Initializing,  // Pool is being set up, accepting members
    Active,        // Pool is active and running cycles
    Completed,     // All cycles completed successfully
    Defaulted,     // Pool defaulted due to member violations
}

impl Default for PoolStatus {
    fn default() -> Self {
        PoolStatus::Initializing
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum YieldPlatform {
    None,
    JitoSol,
    Kamino,
    // Add more platforms as needed
}

impl Default for YieldPlatform {
    fn default() -> Self {
        YieldPlatform::None
    }
}
// Configuration for creating a new pool
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PoolConfig {
    pub max_participants: u8,        // Maximum number of participants (3-10)
    pub contribution_amount: u64,     // Amount each member contributes per cycle
    pub cycle_duration_seconds: u64,  // Duration of each cycle in seconds
    pub payout_delay_seconds: u64,    // Delay before payout to generate yield
    pub early_withdrawal_fee_bps: u16, // Early withdrawal fee in basis points
    pub collateral_requirement_bps: u16, // Collateral requirement in % of payout / Can be 0 for private bool
    pub yield_strategy: YieldPlatform, // Strategy for generating yield
    // pub is_private: bool, // Whether the pool is private
    pub is_native_sol: bool, // Whether the pool is native SOL
    // pub feed_id: [u8; 32], // Price feed ID
}

impl Default for PoolConfig {
    fn default() -> Self {
        Self {
            max_participants: 3,
            contribution_amount: 100,
            cycle_duration_seconds: 3 * 24 * 60 * 60, // 3 days
            payout_delay_seconds: 1 * 24 * 60 * 60,   // 1 day
            early_withdrawal_fee_bps: 200,            // 2%
            collateral_requirement_bps: 20000,        // 200%
            yield_strategy: YieldPlatform::None,
            // is_private: false,
            is_native_sol: false,
            // feed_id: [0; 32],
        }
    }
}
#[account]
#[derive(Default)]
pub struct GroupAccount {
    pub uuid: [u8; 6],                  // NEW: 6-character alphanumeric
    pub whitelist: Vec<Pubkey>,         // NEW: optional whitelist
    pub creator: Pubkey,                // Creator of the pool
    pub token_mint: Pubkey,             // Token used for the pool (SOL, USDC, etc.)
    pub vault: Pubkey,                  // Pool's token vault
    pub config: PoolConfig,             // Pool configuration
    pub member_addresses: Vec<Pubkey>,  // Member addresses
    pub payout_order: Vec<Pubkey>,      // Order of payouts
    pub current_cycle: u8,              // Current cycle (0-indexed)
    pub total_cycles: u8,               // Total cycles (equal to max_participants)
    pub status: PoolStatus,             // Current status of the pool
    pub total_contributions: u64,       // Total contributions made
    // pub unclaimed_payout: u64,          // Unclaimed payout
    pub last_cycle_timestamp: i64,      // Timestamp of the last cycle
    pub next_payout_timestamp: i64,     // Timestamp when next payout is available
    // pub price_feed_id: [u8; 32],        // Price feed ID
    // pub current_winner: Option<Pubkey>,  // Current winner
    // pub current_bid_amount: Option<u64>, // Current bid amount
    pub bump: u8,                       // PDA bump
}

#[account]
#[derive(Default, InitSpace)]
pub struct ProtocolSettings {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub token_mint: Pubkey,
    pub protocol_fee_bps: u16,
    pub bump: u8,
}

// Treasury entry for each token mint
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TreasuryAccount {
    pub token_mint: Option<Pubkey>,
    pub treasury: Pubkey,
    pub total_collected: u64,
    pub is_native_sol: bool,
}

