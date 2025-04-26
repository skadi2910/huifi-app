use anchor_lang::prelude::*;

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
    pub is_private: bool, // Whether the pool is private
    pub is_native_sol: bool, // Whether the pool is native SOL
    pub feed_id: [u8; 32], // Price feed ID
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
            is_private: false,
            is_native_sol: false,
            feed_id: [0; 32],
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
    pub unclaimed_payout: u64,          // Unclaimed payout
    pub last_cycle_timestamp: i64,      // Timestamp of the last cycle
    pub next_payout_timestamp: i64,     // Timestamp when next payout is available
    pub price_feed_id: [u8; 32],        // Price feed ID
    pub current_winner: Option<Pubkey>,  // Current winner
    pub current_bid_amount: Option<u64>, // Current bid amount
    pub bump: u8,                       // PDA bump
}
