use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MemberStatus {
    Active,
    // ReceivedPayout,
    Late,
    Defaulted,
    Withdrawed,
}

impl Default for MemberStatus {
    fn default() -> Self {
        MemberStatus::Active
    }
}

#[account]
#[derive(Default)]
pub struct MemberAccount {
    pub owner: Pubkey,                 // Member wallet address
    pub pool: Pubkey,                  // Associated pool
    pub contributions_made: u8,        // Number of contributions made
    pub has_bid: bool,                 // Whether the member has bid
    pub has_contributed: bool,         // Whether the member has contributed
    pub status: MemberStatus,          // Member status
    pub has_received_payout: bool,            // ✅ NEW: Blocks double payout or re-bidding
    pub eligible_for_payout: bool,            // ✅ NEW: Only winner can withdraw
    pub collateral_staked: u64,        // Amount of collateral staked
    pub reputation_points: u64,        // Reputation points (for future use)
    pub last_contribution_timestamp: i64, // Timestamp of last contribution
    pub total_contributions: u64,        // Total contributions made
    pub has_deposited_collateral: bool, // Whether the member has deposited collateral
    pub payout_amount: u64,            // Amount of payout received
    pub bump: u8,                      // PDA bump
}