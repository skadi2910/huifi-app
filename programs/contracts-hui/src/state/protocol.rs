use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ProtocolSettings {
    pub authority: Pubkey,          // Admin address that can update protocol settings
    // pub treasury: Pubkey,           // Treasury account to collect fees
    pub treasury_accounts: Vec<TreasuryAccount>,
    pub penalty_bps: u16,           // Penalty fee in basis points (1/100 of 1%)
    pub fee_bps: u16,               // Protocol fee in basis points (1/100 of 1%)
    pub create_pool_fee: u64,      // Create pool fee in SOL
    pub total_fees_collected: u64,  // Total fees collected by the protocol
    pub yield_generated: u64,       // Total yield generated 
    pub reserve_buffer: u64,        // Reserve buffer for emergencies
    pub bump: u8,                   // PDA bump
}

// Treasury entry for each token mint
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TreasuryAccount {
    pub token_mint: Option<Pubkey>,
    pub treasury: Pubkey,
    pub total_collected: u64,
    pub is_native_sol: bool,
}