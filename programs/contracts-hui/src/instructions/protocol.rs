use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Mint};

use crate::state::{ProtocolSettings, TreasuryAccount};
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    //PROTOCOL SETTINGS
    #[account(
        init,
        payer = admin,
        // space = 8 + std::mem::size_of::<ProtocolSettings>(),
        space = 8 + 5000, // Estimate to hold protocol + ~50 treasury entries
        seeds = [PROTOCOL_SEED],
        bump,
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,

    //TREASURY
    // #[account(
    //     init,
    //     payer = admin,
    //     token::mint = token_mint,
    //     token::authority = protocol_settings,
    // )]
    // pub treasury: Account<'info, TokenAccount>,

    //TREASURY SETTINGS
    //SOL PDA TREASURY
    #[account(
        mut,
        seeds = [TREASURY_SEED,b"sol"],
        bump,
        owner = system_program.key(),
    )]
    pub treasury_sol: AccountInfo<'info>,

    //USDC TREASURY
    #[account(
        init,
        payer = admin,
        token::mint = mint_usdc,
        token::authority = protocol_settings,
    )]
    pub treasury_usdc: Account<'info, TokenAccount>,

     //USDT TREASURY
     #[account(
        init,
        payer = admin,
        token::mint = mint_usdt,
        token::authority = protocol_settings,
    )]
    pub treasury_usdt: Account<'info, TokenAccount>,   


    //JITOSOL TREASURY
    #[account(
        init,
        payer = admin,
        token::mint = mint_jitosol,
        token::authority = protocol_settings,
    )]
    pub treasury_jitosol: Account<'info, TokenAccount>,

    //MINTS
    pub mint_usdc: Account<'info, Mint>,
    pub mint_usdt: Account<'info, Mint>,
    pub mint_jitosol: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

}

pub fn initialize_protocol(
    ctx: Context<InitializeProtocol>,
    protocol_fee_bps: u16,
    create_pool_fee: u64,
    penalty_bps: u16,
) -> Result<()> {
    // Validate the protocol fee (maximum 10%)
    require!(
        protocol_fee_bps <= 1000,
        HuiFiError::InvalidPoolConfig
    );
    
    let protocol_settings = &mut ctx.accounts.protocol_settings;
    let bump = ctx.bumps.protocol_settings;
    
    protocol_settings.authority = ctx.accounts.admin.key();
    // protocol_settings.treasury = ctx.accounts.treasury.key();
    protocol_settings.penalty_bps = penalty_bps;
    protocol_settings.fee_bps = protocol_fee_bps;
    protocol_settings.create_pool_fee = create_pool_fee;
    protocol_settings.total_fees_collected = 0;
    protocol_settings.yield_generated = 0;
    protocol_settings.reserve_buffer = 0;
    protocol_settings.bump = bump;
    
    protocol_settings.treasury_accounts = vec![
        TreasuryAccount {
            token_mint: None,
            treasury: ctx.accounts.treasury_sol.key(),
            total_collected: 0,
            is_native_sol: true,
        },
        TreasuryAccount {
            token_mint: Some(ctx.accounts.mint_usdc.key()),
            treasury: ctx.accounts.treasury_usdc.key(),
            total_collected: 0,
            is_native_sol: false,
        },
        TreasuryAccount {
            token_mint: Some(ctx.accounts.mint_usdt.key()),
            treasury: ctx.accounts.treasury_usdt.key(),
            total_collected: 0,
            is_native_sol: false,
        },
        TreasuryAccount {
            token_mint: Some(ctx.accounts.mint_jitosol.key()),
            treasury: ctx.accounts.treasury_jitosol.key(),
            total_collected: 0,
            is_native_sol: false,
        },
    ];
    msg!("Protocol initialized with fee_bps: {}, pool_fee: {}", protocol_fee_bps, create_pool_fee);
    
    Ok(())
}

//UPDATE PROTOCOL TREASURY ACCOUNT SPL TOKEN
#[derive(Accounts)]
pub struct UpdateTreasuryAccount<'info>{
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_settings.bump,
        constraint = protocol_settings.authority == admin.key() @ HuiFiError::Unauthorized
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,

    #[account(mut)]
    pub new_treasury_account: Account<'info, TokenAccount>,
    pub new_mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}
pub fn update_treasury_account(ctx: Context<UpdateTreasuryAccount>)->Result<()>{
    let protocol = &mut ctx.accounts.protocol_settings;
    let mint = ctx.accounts.new_mint.key();

    //Validate new treasury account is not already in the protocol
    require!(
        !protocol.treasury_accounts.iter().any(|t|t.token_mint == Some(mint)),
        HuiFiError::TreasuryAccountAlreadyExists
    );
    //Validate new treasury account is a valid SPL token account
    require!(
        ctx.accounts.new_treasury_account.mint == mint,
        HuiFiError::InvalidTreasuryAccount
    );
    require!(
        *ctx.accounts.new_treasury_account.to_account_info().owner == ctx.accounts.token_program.key(),
        HuiFiError::InvalidTreasuryAccount
    );
    let new_entry = TreasuryAccount{
        token_mint: Some(mint),
        treasury: ctx.accounts.new_treasury_account.key(),
        total_collected: 0,
        is_native_sol: false,
    };
    protocol.treasury_accounts.push(new_entry);
    msg!("Treasury account updated for mint: {}", mint);
    Ok(())
}

//UPDATE PROTOCOL PAYOUT FEE
#[derive(Accounts)]
pub struct UpdateProtocolFee<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_settings.bump,
        constraint = protocol_settings.authority == admin.key() @ HuiFiError::Unauthorized
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,
}

pub fn update_protocol_fee(
    ctx: Context<UpdateProtocolFee>,
    new_fee_bps: u16,
) -> Result<()> {
    // Validate the new fee (maximum 10%)
    require!(
        new_fee_bps <= 1000,
        HuiFiError::InvalidPoolConfig
    );
    let protocol_settings = &mut ctx.accounts.protocol_settings;
    protocol_settings.fee_bps = new_fee_bps;
    msg!("Protocol fee updated to: {}", new_fee_bps);
    Ok(())
}

//UPDATE PROTOCOL CREATE POOL FEE
#[derive(Accounts)]
pub struct UpdateCreatePoolFee<'info>{
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_settings.bump,
        constraint = protocol_settings.authority == admin.key() @ HuiFiError::Unauthorized
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,
}

pub fn update_create_pool_fee(
    ctx: Context<UpdateCreatePoolFee>,
    new_fee_lamports: u64,
) -> Result<()> {
    //Validate new fee (maximum 10%)
    // require!(
    //     new_fee_bps <= 1000,
    //     HuiFiError::InvalidPoolConfig
    // );
    let protocol_settings = &mut ctx.accounts.protocol_settings;
    protocol_settings.create_pool_fee = new_fee_lamports;
    msg!("Create pool fee updated to: {}", new_fee_lamports);
    Ok(())
}

//UPDATE PROTOCOL PENALTY FEE
#[derive(Accounts)]
pub struct UpdatePenaltyFee<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [PROTOCOL_SEED],
        bump = protocol_settings.bump,
        constraint = protocol_settings.authority == admin.key() @ HuiFiError::Unauthorized
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,
}

pub fn update_penalty_fee(
    ctx: Context<UpdatePenaltyFee>,
    new_penalty_bps: u16,
) -> Result<()> {
    //Validate new penalty fee (maximum 10%)
    require!(
        new_penalty_bps <= 1000,
        HuiFiError::InvalidPoolConfig
    );
    let protocol_settings = &mut ctx.accounts.protocol_settings;
    protocol_settings.penalty_bps = new_penalty_bps;
    msg!("Penalty fee updated to: {}", new_penalty_bps);
    Ok(())
}
