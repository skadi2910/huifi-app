use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(pool_config: PoolConfig)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + 32 + 32 + 32 + std::mem::size_of::<PoolConfig>() + 32 * pool_config.max_participants as usize * 2 + 1 + 1 + 1 + 8 + 8 + 8 + 1 + 8,
        seeds = [POOL_SEED, token_mint.key().as_ref(), creator.key().as_ref(), &[pool_config.max_participants]],
        bump,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = group_account,
        seeds = [VAULT_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    
    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_settings.bump,
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_pool(
    ctx: Context<CreatePool>,
    pool_config: PoolConfig,
) -> Result<()> {
    // Validate pool configuration
    validate_pool_config(&pool_config)?;
    
    let current_timestamp = Clock::get()?.unix_timestamp;
    let group_account = &mut ctx.accounts.group_account;
    let bump = ctx.bumps.group_account;
    
    // Initialize the group account
    group_account.creator = ctx.accounts.creator.key();
    group_account.token_mint = ctx.accounts.token_mint.key();
    group_account.vault = ctx.accounts.vault.key();
    group_account.config = pool_config.clone();
    group_account.member_addresses = Vec::new();
    group_account.payout_order = Vec::new();
    group_account.current_cycle = 0;
    group_account.total_cycles = pool_config.max_participants;
    group_account.status = PoolStatus::Initializing;
    group_account.total_contributions = 0;
    group_account.last_cycle_timestamp = current_timestamp;
    group_account.next_payout_timestamp = 0; // Will be set when pool becomes active
    group_account.bump = bump;
    
    // Add creator as the first member
    group_account.member_addresses.push(ctx.accounts.creator.key());
    
    msg!("Pool created with max participants: {}", pool_config.max_participants);
    
    Ok(())
}

fn validate_pool_config(config: &PoolConfig) -> Result<()> {
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

#[derive(Accounts)]
pub struct JoinPool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, group_account.token_mint.as_ref(), group_account.creator.as_ref(), &[group_account.total_cycles]],
        bump = group_account.bump,
        constraint = group_account.status == PoolStatus::Initializing @ HuiFiError::InvalidPoolStatus,
        constraint = group_account.member_addresses.len() < group_account.total_cycles as usize @ HuiFiError::PoolFull,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    #[account(
        init,
        payer = user,
        space = 8 + std::mem::size_of::<MemberAccount>(),
        seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
        bump,
    )]
    pub member_account: Account<'info, MemberAccount>,
    
    // User's token account (to verify they have funds)
    #[account(
        constraint = user_token_account.owner == user.key() @ HuiFiError::InvalidTokenAccountOwner,
        constraint = user_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
        constraint = user_token_account.amount >= group_account.config.contribution_amount @ HuiFiError::InsufficientContribution,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    let user_key = ctx.accounts.user.key();
    
    // Check if user is already a member
    require!(
        !group_account.member_addresses.contains(&user_key),
        HuiFiError::MemberAlreadyJoined
    );
    
    // Initialize the member account
    let _current_timestamp = Clock::get()?.unix_timestamp;
    let bump = ctx.bumps.member_account;
    
    member_account.owner = user_key;
    member_account.pool = group_account.key();
    member_account.contributions_made = 0;
    member_account.status = MemberStatus::Active;
    member_account.has_received_early_payout = false;
    member_account.collateral_staked = 0;
    member_account.reputation_points = 0;
    member_account.last_contribution_timestamp = 0; // No contributions yet
    member_account.bump = bump;
    
    // Add user to the pool's member list
    group_account.member_addresses.push(user_key);
    
    // If the pool is now full, change status to Active and set payout order
    if group_account.member_addresses.len() as u8 == group_account.total_cycles {
        group_account.status = PoolStatus::Active;
        
        // For now, we'll use the order of joining as the payout order
        // In a more advanced implementation, you might want to randomize this
        group_account.payout_order = group_account.member_addresses.clone();
    }
    
    msg!("User joined pool: {}", user_key);
    msg!("Current member count: {}/{}", 
        group_account.member_addresses.len(),
        group_account.total_cycles
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, group_account.token_mint.as_ref(), group_account.creator.as_ref(), &[group_account.total_cycles]],
        bump = group_account.bump,
        constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
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
        seeds = [VAULT_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    
    // Validate the contribution amount
    require!(
        amount == group_account.config.contribution_amount,
        HuiFiError::InsufficientContribution
    );
    
    let current_timestamp = Clock::get()?.unix_timestamp;
    
    // Transfer tokens from contributor to pool vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.contributor_token_account.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
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
    
    // Check if all members have contributed for the current cycle
    // This would be implemented in a more sophisticated way in a production system
    // For example, you would maintain a list of who has contributed in the current cycle
    
    msg!("Contribution of {} tokens received from {}", 
        amount, 
        ctx.accounts.contributor.key()
    );
    
    Ok(())
}