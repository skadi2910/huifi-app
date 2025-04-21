use anchor_lang::prelude::*;

#[account]
#[derive(Default)]
pub struct ProtocolSettings {
    pub authority: Pubkey,          // Admin address that can update protocol settings
    pub treasury: Pubkey,           // Treasury account to collect fees
    pub fee_bps: u16,               // Protocol fee in basis points (1/100 of 1%)
    pub total_fees_collected: u64,  // Total fees collected by the protocol
    pub yield_generated: u64,       // Total yield generated 
    pub reserve_buffer: u64,        // Reserve buffer for emergencies
    pub bump: u8,                   // PDA bump
}