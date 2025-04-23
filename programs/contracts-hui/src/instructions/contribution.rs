use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::state::*;
use crate::constants::*;
use crate::errors::*;

// ==================== CONTRIBUTE FUNCTIONS ====================

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct ContributeSol<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
        constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), contributor.key().as_ref()],
        bump = member_account.bump,
        constraint = member_account.owner == contributor.key() @ HuiFiError::Unauthorized,
        constraint = member_account.pool == group_account.key() @ HuiFiError::MemberNotFound,
        constraint = member_account.contributions_made < group_account.current_cycle + 1 @ HuiFiError::AlreadyContributed,
    )]
    pub member_account: Account<'info, MemberAccount>,
    
    /// CHECK: This is a PDA that holds SOL
    #[account(
        mut,
        seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault_sol: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn contribute_sol(ctx: Context<ContributeSol>, uuid: [u8; 6], amount: u64) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    
    // Validate the contribution amount
    require!(
        amount == group_account.config.contribution_amount,
        HuiFiError::InsufficientContribution
    );
    
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Transfer SOL from contributor to pool vault
    let ix = system_instruction::transfer(
        &ctx.accounts.contributor.key(),
        &ctx.accounts.vault_sol.key(),
        amount,
    );
    
    invoke(
        &ix,
        &[
            ctx.accounts.contributor.to_account_info(),
            ctx.accounts.vault_sol.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;
    
    // Update member account
    member_account.contributions_made = member_account.contributions_made.saturating_add(1);
    member_account.last_contribution_timestamp = current_timestamp;
    
    // Update pool account
    group_account.total_contributions = group_account.total_contributions.saturating_add(amount);
    
    msg!("Contribution of {} SOL received from {}", 
        amount, 
        ctx.accounts.contributor.key()
    );
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct ContributeSpl<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
        constraint = !group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), contributor.key().as_ref()],
        bump = member_account.bump,
        constraint = member_account.owner == contributor.key() @ HuiFiError::Unauthorized,
        constraint = member_account.pool == group_account.key() @ HuiFiError::MemberNotFound,
        constraint = member_account.contributions_made < group_account.current_cycle + 1 @ HuiFiError::AlreadyContributed,
    )]
    pub member_account: Account<'info, MemberAccount>,
    
    #[account(
        mut,
        constraint = contributor_token_account.owner == contributor.key() @ HuiFiError::InvalidTokenAccountOwner,
        constraint = contributor_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
    )]
    pub contributor_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        seeds = [VAULT_SPL_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault_spl: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn contribute_spl(ctx: Context<ContributeSpl>, uuid: [u8; 6], amount: u64) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    
    // Validate the contribution amount
    require!(
        amount == group_account.config.contribution_amount,
        HuiFiError::InsufficientContribution
    );
    
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Transfer SPL tokens from contributor to pool vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.contributor_token_account.to_account_info(),
        to: ctx.accounts.vault_spl.to_account_info(),
        authority: ctx.accounts.contributor.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    token::transfer(cpi_ctx, amount)?;
    
    // Update member account
    member_account.contributions_made = member_account.contributions_made.saturating_add(1);
    member_account.last_contribution_timestamp = current_timestamp;
    
    // Update pool account
    group_account.total_contributions = group_account.total_contributions.saturating_add(amount);
    
    msg!("Contribution of {} tokens received from {}", 
        amount, 
        ctx.accounts.contributor.key()
    );
    
    Ok(())
}