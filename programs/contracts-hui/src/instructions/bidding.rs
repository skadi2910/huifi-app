use anchor_lang::prelude::*;
use crate::state::*;
use crate::constants::*;
use crate::errors::*;

pub fn submit_bid(ctx: Context<SubmitBid>, bid_amount: u64) -> Result<()> {
    let bid_state = &mut ctx.accounts.bid_state;

    require!(bid_amount > 0, HuiFiError::InvalidBidAmount);
    require!(
        !bid_state.bids.iter().any(|b| b.bidder == ctx.accounts.bidder.key()),
        HuiFiError::AlreadyBid
    );

    bid_state.bids.push(BidEntry {
        bidder: ctx.accounts.bidder.key(),
        amount: bid_amount,
    });

    msg!(
        "🪙 Bid submitted: {} by {}",
        bid_amount,
        ctx.accounts.bidder.key()
    );

    Ok(())
}
pub fn finalize_bidding(ctx: Context<FinalizeBidding>) -> Result<()> {
    let bid_state = &mut ctx.accounts.bid_state;

    require!(!bid_state.bids.is_empty(), HuiFiError::NoBids);

    // 1. Sort first (mutable borrow)
    bid_state.bids.sort_by(|a, b| b.amount.cmp(&a.amount));

    // 2. Clone winner outside of borrow scope
    let winner_entry = bid_state
        .bids
        .first()
        .cloned()   // Clone the entry to avoid reference
        .ok_or(HuiFiError::NoBids)?;

    // 3. Mutate state
    bid_state.winner = Some(winner_entry.bidder);

    let group_account = &mut ctx.accounts.group_account;
    group_account.current_winner = Some(winner_entry.bidder);
    group_account.current_bid_amount = Some(winner_entry.amount);

    let member = &mut ctx.accounts.winner_member_account;
    member.eligible_for_payout = true;
    msg!(
        "🏆 Bidding finalized for pool {} cycle {}. Winner: {}, Amount: {}",
        group_account.key(),
        group_account.current_cycle,
        winner_entry.bidder,
        winner_entry.amount
    );
    Ok(())
}

#[derive(Accounts)]
pub struct SubmitBid<'info> {
    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(
        mut,
        seeds = [b"bid", group_account.key().as_ref(), &[group_account.current_cycle]],
        bump = bid_state.bump
    )]
    pub bid_state: Account<'info, BidState>,

    #[account(
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
    )]
    pub group_account: Account<'info, GroupAccount>,
}

#[derive(Accounts)]
pub struct FinalizeBidding<'info> {
    #[account(mut)]
    pub authority: Signer<'info>, // Optional: make this admin or allow any cranker

    #[account(
        mut,
        seeds = [b"bid", group_account.key().as_ref(), &[group_account.current_cycle]],
        bump = bid_state.bump
    )]
    pub bid_state: Account<'info, BidState>,

    #[account(
        mut,
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
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
