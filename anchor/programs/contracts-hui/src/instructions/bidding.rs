use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;
#[derive(Accounts)]
pub struct SubmitBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(
        mut,
        seeds = [BID_STATE_SEED, group_account.key().as_ref()],
        bump = bid_state.bump
    )]
    pub bid_state: Account<'info, BidState>,

    #[account(
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
        // Add validation for bid amount and check if pool is in bidding phase
        constraint = matches!(
            group_account.status,
            PoolStatus::Active { phase: CyclePhase::Bidding }
        ) @ HuiFiError::InvalidPhase,        
        // constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), bidder.key().as_ref()],
        bump = member_account.bump,
    )]
    pub member_account: Account<'info, MemberAccount>,
}
pub fn submit_bid(ctx: Context<SubmitBid>, bid_amount: u64) -> Result<()> {
    let bid_state = &mut ctx.accounts.bid_state;
    let group_account = &ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    // Basic validations    
    require!(bid_amount > 0, HuiFiError::InvalidBidAmount);

    // Check if member is part of the pool
    require!(
        group_account.member_addresses.contains(&ctx.accounts.bidder.key()),
        HuiFiError::NotPoolMember
    );

    // Check if member has already bid
    require!(
        !member_account.has_bid, 
        HuiFiError::AlreadyBid
    );

    bid_state.bids.push(BidEntry {
        bidder: ctx.accounts.bidder.key(),
        amount: bid_amount,
    });
    // Update member account
    member_account.has_bid = true;
    msg!(
        "🪙 Bid submitted: {} by {}",
        bid_amount,
        ctx.accounts.bidder.key()
    );

    Ok(())
}
pub fn finalize_bidding(ctx: Context<FinalizeBidding>) -> Result<()> {
    let bid_state = &mut ctx.accounts.bid_state;
    let group_account = &mut ctx.accounts.group_account;

    // Ensure we have bids
    require!(!bid_state.bids.is_empty(), HuiFiError::NoBids);

    // Sort bids by amount (highest first)
    bid_state.bids.sort_by(|a, b| b.amount.cmp(&a.amount));

    // Get winner
    let winner_entry = bid_state
        .bids
        .first()
        .cloned()
        .ok_or(HuiFiError::NoBids)?;

    // Update bid state
    bid_state.winner = Some(winner_entry.bidder);

    // Update group account
    group_account.current_winner = Some(winner_entry.bidder);
    group_account.current_bid_amount = Some(winner_entry.amount);

    // Update winner's member account
    let member = &mut ctx.accounts.winner_member_account;
    require!(
        member.owner == winner_entry.bidder,
        HuiFiError::InvalidWinnerAccount
    );
    member.eligible_for_payout = true;

    // // Transition to Contributing phase
    // group_account.status = PoolStatus::Active {
    //     phase: CyclePhase::Contributing
    // };

    // // Set the timestamp for the next phase
    // let clock = Clock::get()?;
    // group_account.last_cycle_timestamp = clock.unix_timestamp;

    msg!(
        "🏆 Bidding finalized for pool {} cycle {}",
        group_account.key(),
        group_account.current_cycle
    );
    msg!("👑 Winner: {}", winner_entry.bidder);
    msg!("💰 Winning bid amount: {}", winner_entry.amount);
    msg!("➡️ Pool entering Contributing phase");

    Ok(())
}



#[derive(Accounts)]
pub struct FinalizeBidding<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // Optional: make this admin or allow any cranker

    #[account(
        mut,
        seeds = [BID_STATE_SEED, group_account.key().as_ref(), &[group_account.current_cycle]],
        bump = bid_state.bump
    )]
    pub bid_state: Account<'info, BidState>,

    #[account(
        mut,
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
        // Add phase validation
        constraint = matches!(
            group_account.status,
            PoolStatus::Active { phase: CyclePhase::Bidding }
        ) @ HuiFiError::InvalidPhase,
    )]
    pub group_account: Account<'info, GroupAccount>,
    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), winner_member_account.owner.as_ref()],
        bump = winner_member_account.bump,
    )]
    pub winner_member_account: Account<'info, MemberAccount>,
}
// ==================== NEW mark_member_eligible.rs ====================

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct MarkEligible<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), member_account.owner.as_ref()],
        bump = member_account.bump,
    )]
    pub member_account: Account<'info, MemberAccount>,
}

pub fn mark_member_eligible(ctx: Context<MarkEligible>) -> Result<()> {
    ctx.accounts.member_account.eligible_for_payout = true;
    msg!("✅ Marked {} as eligible for payout", ctx.accounts.member_account.owner);
    Ok(())
}

pub fn reset_member_flags(member: &mut MemberAccount) {
    member.eligible_for_payout = false;
    member.has_received_payout = false;
    // ❗ Do not reset collateral_staked here, only reset after final withdrawal
    member.status = MemberStatus::Active;
}
