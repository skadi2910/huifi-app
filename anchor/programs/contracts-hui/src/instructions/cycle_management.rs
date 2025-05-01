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
        seeds = [MEMBER_SEED, group_account.key().as_ref(), authority.owner.as_ref()],
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
    #[account(
        mut,
        // constraint = signer.key() == group_account.creator @ HuiFiError::Unauthorized // Enforce creator check
    )]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, group_account.uuid.as_ref()],
        bump = group_account.bump,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    #[account(
        seeds = [BID_STATE_SEED,
            group_account.key().as_ref()],
        bump,
    )]
    pub bid_state: Account<'info, BidState>, 
    // Optional winner member account
    #[account(
        mut,
        seeds = [
            MEMBER_SEED, 
            group_account.key().as_ref(), 
            bid_state.winner.unwrap_or_default().as_ref()
        ],
        bump,
    )]
    pub winner_member_account: Option<Account<'info, MemberAccount>>,
}

pub fn force_advance_cycle(ctx: Context<ForceAdvanceCycle>) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let bid_state = &mut ctx.accounts.bid_state;

    let clock = Clock::get()?;
    let current_timestamp = clock.unix_timestamp;
    match group_account.status {
        PoolStatus::Initializing => {
            msg!("📊 Force advancing from initializing state");
            // Move to cycle 1
            group_account.current_cycle += 1; // Set directly to 1 instead of incrementing
            group_account.status = PoolStatus::Active {
                phase: CyclePhase::Bidding
            };
            group_account.last_cycle_timestamp = current_timestamp;
            msg!("➡️ Forced to Active - Bidding phase");
        },
        PoolStatus::Active { phase } => match phase {
            CyclePhase::Bidding => {
                msg!("📊 Force advancing from bidding phase");
                
                if bid_state.bids.is_empty() {
                    // If no bids, just move to Contributing phase, Creator Win, Bid amount = 0
                    bid_state.winner = Some(group_account.creator);
                    group_account.current_winner = bid_state.winner;
                    group_account.current_bid_amount = Some(0);
                    msg!("ℹ️ No bids in this cycle, Creator wins");
                } else if bid_state.bids.len() == 1 {
                    // If only one bid, they automatically win
                    let winning_bid = bid_state.bids.first().cloned().unwrap();
                    bid_state.winner = Some(winning_bid.bidder);
                    group_account.current_winner = Some(winning_bid.bidder);
                    group_account.current_bid_amount = Some(winning_bid.amount);
                    
                    if let Some(winner_account) = &mut ctx.accounts.winner_member_account {
                        winner_account.eligible_for_payout = true;
                    }
                    msg!("🏆 Single bidder wins automatically");
                } else {
                    // Multiple bids - sort and pick highest
                    bid_state.bids.sort_by(|a, b| b.amount.cmp(&a.amount));
                    let winning_bid = bid_state.bids.first().cloned().unwrap();
                    
                    bid_state.winner = Some(winning_bid.bidder);
                    group_account.current_winner = Some(winning_bid.bidder);
                    group_account.current_bid_amount = Some(winning_bid.amount);
                
                    if let Some(winner_account) = &mut ctx.accounts.winner_member_account {
                        winner_account.eligible_for_payout = true;
                    }
                    msg!("🏆 Highest bidder wins");
                }

                group_account.status = PoolStatus::Active {
                    phase: CyclePhase::Contributing
                };
                msg!("➡️ Forced to Contributing phase");
            },
            CyclePhase::Contributing => {
                msg!("💫 Force advancing from contribution phase");
                
                group_account.status = PoolStatus::Active {
                    phase: CyclePhase::ReadyForPayout
                };
                group_account.next_payout_timestamp = current_timestamp;
                msg!("➡️ Forced to Payout phase");
            },
            CyclePhase::ReadyForPayout => {
                msg!("💫 Force completing current cycle");

                if group_account.current_cycle >= group_account.total_cycles {
                    group_account.status = PoolStatus::Completed;
                    msg!("✅ Pool completed! All cycles finished.");
                } else {              
                    group_account.current_winner = None;
                    group_account.current_bid_amount = None;
                    group_account.last_cycle_timestamp = current_timestamp;

                    bid_state.bids = Vec::new();
                    bid_state.winner = None;                       
                    group_account.status = PoolStatus::Active {
                        phase: CyclePhase::Bidding
                    };
                    msg!("➡️ Forced to cycle {} - Bidding phase", group_account.current_cycle);
                }
            },            // ... rest of the existing match cases ...
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

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(
        mut,
        constraint = signer.key() == group_account.creator @ HuiFiError::Unauthorized
    )]
    pub signer: Signer<'info>,
    
    #[account(
        mut,
        constraint = group_account.status == PoolStatus::Completed @ HuiFiError::InvalidPoolStatus,
        close = signer
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    #[account(
        mut,
        seeds = [BID_STATE_SEED, group_account.key().as_ref()],
        bump,
        close = signer
    )]
    pub bid_state: Account<'info, BidState>,

    /// CHECK: This is a PDA that holds SOL
    #[account(
        mut,
        seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault_sol: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
    let group_account = &ctx.accounts.group_account;
    let vault_sol = &ctx.accounts.vault_sol;
    let signer = &ctx.accounts.signer;

    // Check if pool is completed
    require!(
        matches!(group_account.status, PoolStatus::Completed),
        HuiFiError::InvalidPoolStatus
    );

    // Check if there are any unclaimed payouts
    require!(
        group_account.unclaimed_payout == 0,
        HuiFiError::UnclaimedPayouts
    );

    // If there's any SOL left in the vault, transfer it back to creator
    let vault_balance = vault_sol.lamports();
    if vault_balance > 0 {
        **vault_sol.try_borrow_mut_lamports()? = 0;
        **signer.try_borrow_mut_lamports()? = signer
            .lamports()
            .checked_add(vault_balance)
            .ok_or(HuiFiError::Overflow)?;
    }

    msg!("🗑️ Pool closed and accounts cleaned up");
    msg!("💰 Remaining balance returned to creator: {} lamports", vault_balance);
    Ok(())
}

