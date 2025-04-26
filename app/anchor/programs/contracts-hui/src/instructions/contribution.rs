use {
    anchor_lang::{
        prelude::*,
        solana_program::{program::invoke,native_token::LAMPORTS_PER_SOL,system_instruction},
    },
    anchor_spl::token::{self, Token, TokenAccount, Transfer},
    pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2},
    crate::state::*,
    crate::constants::*,
    crate::errors::*,
};

// ==================== CONTRIBUTE FUNCTIONS ====================

#[derive(Accounts)]
#[instruction(uuid: [u8; 6], amount: u64)]
pub struct ContributeSol<'info> {
    #[account(mut)]
    pub contributor: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
                // Modified constraint to check specific phase
        constraint = matches!(
            group_account.status,
            PoolStatus::Active { phase: CyclePhase::Contributing }
        ) @ HuiFiError::InvalidPhase,
        constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
        // constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
        // constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
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
    pub vault_sol: AccountInfo<'info>,
    ///CHECK: This is a PDA that holds the price update
    pub price_update: Account<'info, PriceUpdateV2>,
    pub system_program: Program<'info, System>,
}

pub fn contribute_sol(ctx: Context<ContributeSol>, uuid: [u8; 6], amount: u64) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    
    // 🛡️ Enforce UUID matches
    require!(
        group_account.uuid == uuid, 
        HuiFiError::InvalidPoolUUID
    );    

    let discount = if Some(ctx.accounts.contributor.key()) == group_account.current_winner {
        group_account.current_bid_amount.unwrap_or(0)
    } else {
        0
    };
    
    let required_contribution = group_account
        .config
        .contribution_amount
        .saturating_sub(discount);
    // Validate the contribution amount
    require!(
        amount == required_contribution,
        HuiFiError::InsufficientContribution
    );

    
    let current_timestamp = Clock::get()?.unix_timestamp;
    let price_update = &mut ctx.accounts.price_update;
    let price = price_update.get_price_no_older_than(
        &Clock::get()?,
        MAXIMUM_AGE,
        &group_account.price_feed_id,
    )?;

    // let amount_in_lamports = LAMPORTS_PER_SOL
    //     .checked_mul(10_u64.pow(price.exponent.abs().try_into().unwrap()))
    //     .unwrap()
    //     .checked_mul(amount_in_usd)
    //     .unwrap()
    //     .checked_div(price.price.try_into().unwrap())
    //     .unwrap();

    let transfer_instruction = system_instruction::transfer(
        ctx.accounts.contributor.key,
        ctx.accounts.vault_sol.key,
        amount,
    );        
    invoke(
        &transfer_instruction,
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
    // After successful contribution
    msg!("💰 Contribution received: {} (Winner discount: {})", 
        amount,
        group_account.current_bid_amount.unwrap_or(0)
    );    
    // After successful contribution, check if all members have contributed
    if group_account.all_members_contributed() {
        msg!("✅ All members have contributed for cycle {}", group_account.current_cycle);
    }    
    Ok(())
}

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6], amount: u64)]
// pub struct ContributeSpl<'info> {
//     #[account(mut)]
//     pub contributor: Signer<'info>,
    
//     #[account(
//         mut,
//         seeds = [POOL_SEED, uuid.as_ref()],
//         bump = group_account.bump,
//         constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
//         constraint = !group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
//     )]
//     pub group_account: Account<'info, GroupAccount>,
    
//     #[account(
//         mut,
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), contributor.key().as_ref()],
//         bump = member_account.bump,
//         constraint = member_account.owner == contributor.key() @ HuiFiError::Unauthorized,
//         constraint = member_account.pool == group_account.key() @ HuiFiError::MemberNotFound,
//         constraint = member_account.contributions_made < group_account.current_cycle + 1 @ HuiFiError::AlreadyContributed,
//     )]
//     pub member_account: Account<'info, MemberAccount>,
    
//     #[account(
//         mut,
//         constraint = contributor_token_account.owner == contributor.key() @ HuiFiError::InvalidTokenAccountOwner,
//         constraint = contributor_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub contributor_token_account: Account<'info, TokenAccount>,
    
//     #[account(
//         mut,
//         seeds = [VAULT_SPL_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault_spl: Account<'info, TokenAccount>,
    
//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
// }

// pub fn contribute_spl(ctx: Context<ContributeSpl>, uuid: [u8; 6], amount: u64) -> Result<()> {
//     let group_account = &mut ctx.accounts.group_account;
//     let member_account = &mut ctx.accounts.member_account;
//     let discount = if Some(ctx.accounts.contributor.key()) == group_account.current_winner {
//         group_account.current_bid_amount.unwrap_or(0)
//     } else {
//         0
//     };
//     // 🛡️ Enforce UUID matches
//     require!(
//         group_account.uuid == uuid,
//         HuiFiError::InvalidPoolUUID
//     );    
//     let required_contribution = group_account
//         .config
//         .contribution_amount
//         .saturating_sub(discount);
//     // Validate the contribution amount
//     require!(
//         amount == required_contribution,
//         HuiFiError::InsufficientContribution
//     );

    
//     let current_timestamp = Clock::get()?.unix_timestamp;
    
//     // Transfer SPL tokens from contributor to pool vault
//     let cpi_accounts = Transfer {
//         from: ctx.accounts.contributor_token_account.to_account_info(),
//         to: ctx.accounts.vault_spl.to_account_info(),
//         authority: ctx.accounts.contributor.to_account_info(),
//     };
    
//     let cpi_program = ctx.accounts.token_program.to_account_info();
//     let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
//     token::transfer(cpi_ctx, amount)?;
    
//     // Update member account
//     member_account.contributions_made = member_account.contributions_made.saturating_add(1);
//     member_account.last_contribution_timestamp = current_timestamp;
    
//     // Update pool account
//     group_account.total_contributions = group_account.total_contributions.saturating_add(amount);
    
//     msg!("Contribution of {} tokens received from {}", 
//         amount, 
//         ctx.accounts.contributor.key()
//     );
    
//     Ok(())
// }