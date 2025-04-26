use anchor_lang::prelude::*;
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

const POOL_STATUS_ACTIVE: u8 = 1;

#[derive(Accounts)]
pub struct AdvanceCycle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.creator == authority.key() @ HuiFiError::Unauthorized,
        constraint = matches!(group_account.status, PoolStatus::Active { .. }) @ HuiFiError::InvalidPoolStatus,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        mut,
        seeds = [b"bid", group_account.key().as_ref(), &[group_account.current_cycle]],
        bump
    )]
    pub bid_state: Account<'info, BidState>,

    // Optional: Include winner's member account for eligibility update
    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), winner_member_account.owner.as_ref()],
        bump = winner_member_account.bump,
    )]
    pub winner_member_account: Option<Account<'info, MemberAccount>>,
}

pub fn advance_cycle(ctx: Context<AdvanceCycle>) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let bid_state = &mut ctx.accounts.bid_state;
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;

    match group_account.get_current_phase() {
        Some(CyclePhase::Bidding) => {
            msg!("📊 Finalizing bidding phase");
            
            // Verify we have bids
            require!(!bid_state.bids.is_empty(), HuiFiError::NoBids);

            // Sort bids and get winner outside of the borrow
            bid_state.bids.sort_by(|a, b| b.amount.cmp(&a.amount));
            let winning_bid = bid_state.bids.first().cloned()
                .ok_or(HuiFiError::NoBids)?;
            
            // Update bid state
            bid_state.winner = Some(winning_bid.bidder);
            
            // Update group account
            group_account.current_winner = Some(winning_bid.bidder);
            group_account.current_bid_amount = Some(winning_bid.amount);

            // Update winner eligibility if account provided
            if let Some(winner_account) = &mut ctx.accounts.winner_member_account {
                require!(
                    winner_account.owner == winning_bid.bidder,
                    HuiFiError::InvalidWinnerAccount
                );
                winner_account.eligible_for_payout = true;
            }

            // Transition to Contributing phase
            group_account.status = PoolStatus::Active {
                phase: CyclePhase::Contributing
            };

            msg!("🏆 Winner selected: {}", winning_bid.bidder);
            msg!("💰 Winning bid amount: {}", winning_bid.amount);
            msg!("➡️ Entering Contributing phase");
            // msg!("🔄 Cycle {} Phase: {:?}", group_account.current_cycle, CyclePhase::Contributing);
        },
        Some(CyclePhase::Contributing) => {
            msg!("💫 Finalizing contribution phase");
            
            // Optional: verify all contributions
            require!(
                group_account.all_members_contributed(),
                HuiFiError::PendingContributions
            );

            // Transition to Payout phase
            group_account.status = PoolStatus::Active {
                phase: CyclePhase::ReadyForPayout
            };
            group_account.next_payout_timestamp = current_timestamp + 
                group_account.config.payout_delay_seconds as i64;

            msg!("➡️ Entering Payout phase");
        },
        Some(CyclePhase::ReadyForPayout) => {
            msg!("💫 Completing current cycle");

            if group_account.current_cycle + 1 >= group_account.total_cycles {
                group_account.status = PoolStatus::Completed;
                msg!("✅ Pool completed! All cycles finished.");
            } else {
                // Advance to next cycle
                group_account.current_cycle += 1;
                
                // Reset for next cycle
                group_account.current_winner = None;
                group_account.current_bid_amount = None;
                group_account.last_cycle_timestamp = current_timestamp;
                
                // Clear bid state
                bid_state.bids.clear();
                bid_state.winner = None;

                // Start new cycle in Bidding phase
                group_account.status = PoolStatus::Active {
                    phase: CyclePhase::Bidding
                };

                msg!("➡️ Advanced to cycle {} - Bidding phase", group_account.current_cycle);
            }
        },
        _ => return Err(HuiFiError::InvalidPoolStatus.into()),
    }
    if group_account.is_completed() {
        group_account.status = PoolStatus::Completed;
        msg!("🎉 Pool completed! All cycles finished.");
    }
    Ok(())
}

// Optional: Helper function to verify contributions
fn verify_all_contributions(group_account: &GroupAccount) -> bool {
    // Implement contribution verification logic
    // For MVP, you might want to skip this or implement a simple version
    true
}

// Optional: Add a function to check current cycle status
#[derive(Accounts)]
pub struct CheckCycleStatus<'info> {
    #[account(
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        seeds = [b"bid", group_account.key().as_ref(), &[group_account.current_cycle]],
        bump
    )]
    pub bid_state: Account<'info, BidState>,
}

pub fn check_cycle_status(ctx: Context<CheckCycleStatus>) -> Result<()> {
    let group_account = &ctx.accounts.group_account;
    let bid_state = &ctx.accounts.bid_state;
    
    msg!("📊 Current Cycle Status:");
    msg!("Cycle: {}/{}", group_account.current_cycle + 1, group_account.total_cycles);
    msg!("Total Bids: {}", bid_state.bids.len());
    
    if let Some(winner) = group_account.current_winner {
        msg!("Current Winner: {}", winner);
        if let Some(amount) = group_account.current_bid_amount {
            msg!("Winning Bid Amount: {}", amount);
        }
    } else {
        msg!("Bidding Phase - No winner selected yet");
    }

    Ok(())
}

// Add these to your errors.rs file if not already present
// #[error_code]
// pub enum HuiFiError {
    // #[msg("No bids submitted for current cycle")]
    // NoBids,
    
    // #[msg("Invalid winner account provided")]
    // InvalidWinnerAccount,
    
    // #[msg("Pending contributions from members")]
    // PendingContributions,
// }

//=============== FOCRCE ADVANCE CYCLE FUNCTIONS ====================
#[derive(Accounts)]
pub struct ForceAdvanceCycle<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
        constraint = creator.key() == group_account.creator @ HuiFiError::Unauthorized,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    #[account(
        mut,
        seeds = [BID_STATE_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub bid_state: Account<'info, BidState>,
    
    // Optional winner member account
    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), bid_state.winner.unwrap_or_default().as_ref()],
        bump,
    )]
    pub winner_member_account: Option<Account<'info, MemberAccount>>,
}

pub fn force_advance_cycle(ctx: Context<ForceAdvanceCycle>) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let bid_state = &mut ctx.accounts.bid_state;
    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;

    match group_account.get_current_phase() {
        Some(CyclePhase::Bidding) => {
            msg!("📊 Force advancing from bidding phase");
            
            // If there are bids, use the highest one
            if !bid_state.bids.is_empty() {
                bid_state.bids.sort_by(|a, b| b.amount.cmp(&a.amount));
                let winning_bid = bid_state.bids.first().cloned().unwrap();
                
                bid_state.winner = Some(winning_bid.bidder);
                group_account.current_winner = Some(winning_bid.bidder);
                group_account.current_bid_amount = Some(winning_bid.amount);

                // Update winner eligibility if account provided
                if let Some(winner_account) = &mut ctx.accounts.winner_member_account {
                    winner_account.eligible_for_payout = true;
                }
            }

            group_account.status = PoolStatus::Active {
                phase: CyclePhase::Contributing
            };
            msg!("➡️ Forced to Contributing phase");
        },
        Some(CyclePhase::Contributing) => {
            msg!("💫 Force advancing from contribution phase");
            
            group_account.status = PoolStatus::Active {
                phase: CyclePhase::ReadyForPayout
            };
            group_account.next_payout_timestamp = current_timestamp;
            msg!("➡️ Forced to Payout phase");
        },
        Some(CyclePhase::ReadyForPayout) => {
            msg!("💫 Force completing current cycle");

            if group_account.current_cycle + 1 >= group_account.total_cycles {
                group_account.status = PoolStatus::Completed;
                msg!("✅ Pool completed! All cycles finished.");
            } else {
                group_account.current_cycle += 1;
                group_account.current_winner = None;
                group_account.current_bid_amount = None;
                group_account.last_cycle_timestamp = current_timestamp;
                
                bid_state.bids.clear();
                bid_state.winner = None;

                group_account.status = PoolStatus::Active {
                    phase: CyclePhase::Bidding
                };
                msg!("➡️ Forced to cycle {} - Bidding phase", group_account.current_cycle);
            }
        },
        _ => return Err(HuiFiError::InvalidPoolStatus.into()),
    }

    if group_account.is_completed() {
        group_account.status = PoolStatus::Completed;
        msg!("🎉 Pool completed! All cycles finished.");
    }

    msg!("⚠️ Force advanced cycle - FOR TESTING ONLY");
    Ok(())
}