use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<ProtocolSettings>(),
        seeds = [PROTOCOL_SEED],
        bump,
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,
    
    #[account(
        init,
        payer = admin,
        token::mint = token_mint,
        token::authority = protocol_settings,
    )]
    pub treasury: Account<'info, TokenAccount>,
    
    pub token_mint: Account<'info, anchor_spl::token::Mint>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize_protocol(
    ctx: Context<InitializeProtocol>,
    protocol_fee_bps: u16,
) -> Result<()> {
    // Validate the protocol fee (maximum 10%)
    require!(
        protocol_fee_bps <= 1000,
        HuiFiError::InvalidPoolConfig
    );
    
    let protocol_settings = &mut ctx.accounts.protocol_settings;
    let bump = ctx.bumps.protocol_settings;
    
    protocol_settings.authority = ctx.accounts.admin.key();
    protocol_settings.treasury = ctx.accounts.treasury.key();
    protocol_settings.fee_bps = protocol_fee_bps;
    protocol_settings.total_fees_collected = 0;
    protocol_settings.yield_generated = 0;
    protocol_settings.reserve_buffer = 0;
    protocol_settings.bump = bump;
    
    msg!("Protocol initialized with fee: {}", protocol_fee_bps);
    
    Ok(())
}
