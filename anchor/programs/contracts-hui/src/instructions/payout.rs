use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct ProcessPayout<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        constraint = matches!(
            group_account.status,
            PoolStatus::Active { phase: CyclePhase::ReadyForPayout }
        ) @ HuiFiError::InvalidPhase,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
        bump = recipient_account.bump,
        constraint = Some(recipient.key()) == group_account.current_winner @ HuiFiError::NotPoolWinner,
        constraint = recipient_account.eligible_for_payout @ HuiFiError::NotEligibleForPayout,
        constraint = !recipient_account.has_received_payout @ HuiFiError::AlreadyReceivedPayout,
    )]
    pub recipient_account: Account<'info, MemberAccount>,

    /// CHECK: Recipient of the payout
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    /// CHECK: This is the pool's SOL vault
    #[account(
        mut,
        seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault_sol: AccountInfo<'info>,

    #[account(
        seeds = [PROTOCOL_SEED],
        bump = protocol_settings.bump,
    )]
    pub protocol_settings: Account<'info, ProtocolSettings>,

    /// CHECK: Protocol treasury to receive fees
    #[account(mut)]
    pub protocol_treasury: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

pub fn process_payout(ctx: Context<ProcessPayout>, uuid: [u8; 6], required_collateral: Option<u64>) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let recipient_account = &mut ctx.accounts.recipient_account;
    let current_timestamp = Clock::get()?.unix_timestamp;

    // Basic validations
    require!(recipient_account.eligible_for_payout, HuiFiError::NotEligibleForPayout);
    require!(!recipient_account.has_received_payout, HuiFiError::AlreadyReceivedPayout);
    require!(current_timestamp >= group_account.next_payout_timestamp, HuiFiError::PayoutDelayNotElapsed);

    // Check if this is the final cycle
    let is_final_cycle = group_account.current_cycle == group_account.total_cycles - 1;

    // For non-final cycles, check collateral requirements first
    if !is_final_cycle {
        // First check if collateral has been deposited
        require!(
            recipient_account.has_deposited_collateral,
            HuiFiError::CollateralNotDeposited
        );

        // Then verify the collateral amount
        let required_collateral = required_collateral.ok_or(HuiFiError::CollateralRequired)?;
        require!(
            recipient_account.collateral_staked >= required_collateral,
            HuiFiError::InsufficientCollateral
        );

        msg!("✅ Collateral verification passed");
    } else {
        msg!("ℹ️ Final cycle - no collateral required");
    }

    // Calculate payout amounts
    let total_payout = group_account.total_contributions;

    // Check if vault has enough funds
    require!(
        ctx.accounts.vault_sol.lamports() >= total_payout,
        HuiFiError::InsufficientVaultFunds
    );

    // Calculate fee for early payout
    let fee_amount = if !is_final_cycle {
        total_payout
            .saturating_mul(group_account.config.early_withdrawal_fee_bps as u64)
            .saturating_div(BASIS_POINTS_DIVISOR)
    } else {
        0
    };

    // Process transfers
    let payout_amount = total_payout.saturating_sub(fee_amount);

    // Transfer SOL from vault to recipient
    **ctx.accounts.vault_sol.try_borrow_mut_lamports()? = ctx.accounts.vault_sol.lamports()
        .checked_sub(payout_amount)
        .ok_or(HuiFiError::InsufficientVaultFunds)?;
    
    **ctx.accounts.recipient.try_borrow_mut_lamports()? = ctx.accounts.recipient.lamports()
        .checked_add(payout_amount)
        .ok_or(HuiFiError::Overflow)?;

    // Transfer fee if applicable
    if fee_amount > 0 {
        **ctx.accounts.vault_sol.try_borrow_mut_lamports()? = ctx.accounts.vault_sol.lamports()
            .checked_sub(fee_amount)
            .ok_or(HuiFiError::InsufficientVaultFunds)?;
        
        **ctx.accounts.protocol_treasury.try_borrow_mut_lamports()? = ctx.accounts.protocol_treasury.lamports()
            .checked_add(fee_amount)
            .ok_or(HuiFiError::Overflow)?;
    }

    // Update accounts
    recipient_account.has_received_payout = true;
    recipient_account.eligible_for_payout = false;
    recipient_account.status = MemberStatus::Withdrawed;

    // Log the transaction details
    msg!("✅ Processed payout of {} SOL to {}", 
        payout_amount as f64 / LAMPORTS_PER_SOL as f64,
        ctx.accounts.recipient.key()
    );

    if fee_amount > 0 {
        msg!("💰 Fee paid: {} SOL", 
            fee_amount as f64 / LAMPORTS_PER_SOL as f64
        );
    }

    // Emit event
    emit!(PayoutProcessed {
        pool: group_account.key(),
        recipient: ctx.accounts.recipient.key(),
        amount: payout_amount,
        cycle: group_account.current_cycle,
        timestamp: current_timestamp,
    });

    Ok(())
}

#[event]
pub struct PayoutProcessed {
    pub pool: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub cycle: u8,
    pub timestamp: i64,
}



//====== OLD PAYOUT LOGIC ======
// use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Transfer};

// use crate::state::*;
// use crate::constants::*;
// use crate::errors::*;

// #[derive(Accounts)]
// pub struct RequestEarlyPayout<'info> {
//     #[account(mut)]
//     pub member: Signer<'info>,
    
//     #[account(
//         mut,
//         seeds = [POOL_SEED, group_account.token_mint.as_ref(), group_account.creator.as_ref(), &[group_account.total_cycles]],
//         bump = group_account.bump,
//         constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
//     )]
//     pub group_account: Account<'info, GroupAccount>,
    
//     #[account(
//         mut,
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), member.key().as_ref()],
//         bump = member_account.bump,
//         constraint = member_account.owner == member.key() @ HuiFiError::Unauthorized,
//         constraint = member_account.pool == group_account.key() @ HuiFiError::MemberNotFound,
//         constraint = !member_account.has_received_early_payout @ HuiFiError::AlreadyReceivedPayout,
//     )]
//     pub member_account: Account<'info, MemberAccount>,
    
//     #[account(
//         mut,
//         constraint = member_token_account.owner == member.key() @ HuiFiError::InvalidTokenAccountOwner,
//         constraint = member_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub member_token_account: Account<'info, TokenAccount>,
    
//     #[account(
//         mut,
//         constraint = collateral_token_account.owner == member.key() @ HuiFiError::InvalidTokenAccountOwner,
//         constraint = collateral_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub collateral_token_account: Account<'info, TokenAccount>,
    
//     #[account(
//         mut,
//         seeds = [VAULT_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault: Account<'info, TokenAccount>,
    
//     #[account(
//         seeds = [PROTOCOL_SEED],
//         bump = protocol_settings.bump,
//     )]
//     pub protocol_settings: Account<'info, ProtocolSettings>,
    
//     #[account(
//         mut,
//         constraint = protocol_treasury.owner == protocol_settings.key() @ HuiFiError::Unauthorized,
//         constraint = protocol_treasury.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub protocol_treasury: Account<'info, TokenAccount>,
    
//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
// }

// pub fn request_early_payout(ctx: Context<RequestEarlyPayout>) -> Result<()> {
//     let group_account = &mut ctx.accounts.group_account;
//     let member_account = &mut ctx.accounts.member_account;
//     let current_timestamp = Clock::get()?.unix_timestamp;
    
//     // Calculate required collateral based on pool configuration
//     let total_payout = group_account.config.contribution_amount
//         .saturating_mul(group_account.total_cycles as u64);
        
//     let required_collateral = total_payout
//         .saturating_mul(group_account.config.collateral_requirement_bps as u64)
//         .saturating_div(BASIS_POINTS_DIVISOR);
    
//     // Check if member has enough collateral
//     require!(
//         ctx.accounts.collateral_token_account.amount >= required_collateral,
//         HuiFiError::InsufficientCollateral
//     );
    
//     // Check if the pool has enough funds for payout
//     require!(
//         ctx.accounts.vault.amount >= total_payout,
//         HuiFiError::InsufficientVaultFunds
//     );
    
//     // Check if member is in the payout order for the current cycle
//     require!(
//         group_account.payout_order[group_account.current_cycle as usize] == member_account.owner,
//         HuiFiError::NotEligibleForPayout
//     );
    
//     // Check if payout delay has passed since last cycle
//     if group_account.current_cycle > 0 {
//         let min_payout_time = group_account.last_cycle_timestamp
//             .saturating_add(group_account.config.payout_delay_seconds as i64);
            
//         require!(
//             current_timestamp >= min_payout_time,
//             HuiFiError::PayoutDelayNotElapsed
//         );
//     }
    
//     // Transfer collateral from member to pool vault (handled in process_payout)
    
//     // Mark member as requested early payout
//     // In a full implementation, we would store this in a pending requests list
//     // For simplicity, we'll just use has_received_early_payout flag for now
//     member_account.status = MemberStatus::ReceivedPayout;
    
//     // Set the next payout timestamp
//     group_account.next_payout_timestamp = current_timestamp
//         .saturating_add(group_account.config.payout_delay_seconds as i64);
    
//     msg!("Early payout requested by {}", ctx.accounts.member.key());
    
//     Ok(())
// }

// #[derive(Accounts)]
// pub struct ProcessPayout<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,
    
//     #[account(
//         mut,
//         seeds = [POOL_SEED, group_account.token_mint.as_ref(), group_account.creator.as_ref(), &[group_account.total_cycles]],
//         bump = group_account.bump,
//         constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
//     )]
//     pub group_account: Account<'info, GroupAccount>,
    
//     #[account(
//         mut,
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), recipient.key().as_ref()],
//         bump = recipient_account.bump,
//         constraint = recipient_account.pool == group_account.key() @ HuiFiError::MemberNotFound,
//         constraint = !recipient_account.has_received_early_payout @ HuiFiError::AlreadyReceivedPayout,
//     )]
//     pub recipient_account: Account<'info, MemberAccount>,
    
//     /// CHECK: Recipient of the payout
//     pub recipient: AccountInfo<'info>,
    
//     #[account(
//         mut,
//         constraint = recipient_token_account.owner == recipient.key() @ HuiFiError::InvalidTokenAccountOwner,
//         constraint = recipient_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub recipient_token_account: Account<'info, TokenAccount>,
    
//     #[account(
//         mut,
//         constraint = collateral_token_account.owner == recipient.key() @ HuiFiError::InvalidTokenAccountOwner,
//         constraint = collateral_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub collateral_token_account: Account<'info, TokenAccount>,
    
//     #[account(
//         mut,
//         seeds = [VAULT_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault: Account<'info, TokenAccount>,
    
//     #[account(
//         seeds = [PROTOCOL_SEED],
//         bump = protocol_settings.bump,
//     )]
//     pub protocol_settings: Account<'info, ProtocolSettings>,
    
//     #[account(
//         mut,
//         constraint = protocol_treasury.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub protocol_treasury: Account<'info, TokenAccount>,
    
//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
// }

// pub fn process_payout(ctx: Context<ProcessPayout>) -> Result<()> {
//     let group_account = &mut ctx.accounts.group_account;
//     let recipient_account = &mut ctx.accounts.recipient_account;
//     let current_timestamp = Clock::get()?.unix_timestamp;
    
//     // Check if payout delay has passed
//     require!(
//         current_timestamp >= group_account.next_payout_timestamp,
//         HuiFiError::PayoutDelayNotElapsed
//     );
    
//     // Calculate payout amount
//     let total_payout = group_account.config.contribution_amount
//         .saturating_mul(group_account.total_cycles as u64);
    
//     // Check if the pool has enough funds
//     require!(
//         ctx.accounts.vault.amount >= total_payout,
//         HuiFiError::InsufficientVaultFunds
//     );
    
//     // Calculate fee if this is an early payout
//     let fee_amount = if group_account.current_cycle < group_account.total_cycles - 1 {
//         total_payout
//             .saturating_mul(group_account.config.early_withdrawal_fee_bps as u64)
//             .saturating_div(BASIS_POINTS_DIVISOR)
//     } else {
//         0
//     };
    
//     // Calculate required collateral if this is an early payout
//     let required_collateral = if group_account.current_cycle < group_account.total_cycles - 1 {
//         total_payout
//             .saturating_mul(group_account.config.collateral_requirement_bps as u64)
//             .saturating_div(BASIS_POINTS_DIVISOR)
//     } else {
//         0
//     };
    
//     // For early payout, transfer collateral from recipient
//     if required_collateral > 0 {
//         // Check if recipient has enough collateral
//         require!(
//             ctx.accounts.collateral_token_account.amount >= required_collateral,
//             HuiFiError::InsufficientCollateral
//         );
        
//         // Transfer collateral to the pool vault
//         let cpi_accounts = Transfer {
//             from: ctx.accounts.collateral_token_account.to_account_info(),
//             to: ctx.accounts.vault.to_account_info(),
//             authority: ctx.accounts.recipient.to_account_info(),
//         };
        
//         let cpi_program = ctx.accounts.token_program.to_account_info();
//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
//         token::transfer(cpi_ctx, required_collateral)?;
        
//         // Store collateral amount in member account
//         recipient_account.collateral_staked = required_collateral;
//     }
    
//     // Transfer payout amount minus fee to recipient
//     let payout_amount = total_payout.saturating_sub(fee_amount);
//     let vault_key = group_account.key();
//     let seeds = &[VAULT_SEED, vault_key.as_ref(), &[ctx.bumps.vault]];
//     let signer = &[&seeds[..]];
    
//     let cpi_accounts = Transfer {
//         from: ctx.accounts.vault.to_account_info(),
//         to: ctx.accounts.recipient_token_account.to_account_info(),
//         authority: ctx.accounts.vault.to_account_info(),
//     };
    
//     let cpi_program = ctx.accounts.token_program.to_account_info();
//     let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
    
//     token::transfer(cpi_ctx, payout_amount)?;
    
//     // If there's a fee, transfer it to the protocol treasury
//     if fee_amount > 0 {
//         let cpi_accounts = Transfer {
//             from: ctx.accounts.vault.to_account_info(),
//             to: ctx.accounts.protocol_treasury.to_account_info(),
//             authority: ctx.accounts.vault.to_account_info(),
//         };
        
//         let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer);
        
//         token::transfer(cpi_ctx, fee_amount)?;
//     }
    
//     // Update member account
//     recipient_account.has_received_early_payout = true;
//     recipient_account.status = MemberStatus::ReceivedPayout;
    
//     // Update pool account
//     group_account.current_cycle = group_account.current_cycle.saturating_add(1);
//     group_account.last_cycle_timestamp = current_timestamp;
    
//     // If all cycles are complete, mark pool as completed
//     if group_account.current_cycle >= group_account.total_cycles {
//         group_account.status = PoolStatus::Completed;
//     } else {
//         // Set the next payout timestamp
//         group_account.next_payout_timestamp = current_timestamp
//             .saturating_add(group_account.config.cycle_duration_seconds as i64);
//     }
    
//     msg!("Processed payout of {} tokens to {}", 
//         payout_amount, 
//         ctx.accounts.recipient.key()
//     );
    
//     Ok(())
// }