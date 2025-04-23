use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("5S8b4n1VwN3wasBcheSdUKSMyvVPLMgMe9FLxWLfBT8t");

#[program]
pub mod contracts_hui {
    use super::*;

    /// Initialize the protocol settings
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        let protocol_settings = &mut ctx.accounts.protocol_settings;
        
        // Check that protocol fee is reasonable (max 10%)
        require!(protocol_fee_bps <= 1000, ErrorCode::ProtocolFeeExceedsLimit);

        protocol_settings.admin = ctx.accounts.admin.key();
        protocol_settings.treasury = ctx.accounts.treasury.key();
        protocol_settings.token_mint = ctx.accounts.token_mint.key();
        protocol_settings.protocol_fee_bps = protocol_fee_bps;
        protocol_settings.bump = ctx.bumps.protocol_settings; // Fixed: use new Anchor bump API

        Ok(())
    }

    /// Create a new rotating savings pool
    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_config: PoolConfig,
    ) -> Result<()> {
        require!(
            pool_config.max_participants >= 3 && pool_config.max_participants <= 20,
            ErrorCode::InvalidParticipantCount
        );

        require!(
            pool_config.contribution_amount >= 1_000_000, // 1 USDC minimum (assuming 6 decimals)
            ErrorCode::ContributionTooSmall
        );

        require!(
            pool_config.cycle_duration_seconds >= 24 * 60 * 60, // 1 day minimum
            ErrorCode::CycleDurationTooShort
        );

        let pool = &mut ctx.accounts.group_account;
        let creator = &ctx.accounts.creator;
        let vault = &mut ctx.accounts.vault;

        // Set pool data
        pool.creator = creator.key();
        pool.token_mint = ctx.accounts.token_mint.key();
        pool.max_participants = pool_config.max_participants;
        pool.contribution_amount = pool_config.contribution_amount;
        pool.cycle_duration_seconds = pool_config.cycle_duration_seconds;
        pool.payout_delay_seconds = pool_config.payout_delay_seconds;
        pool.early_withdrawal_fee_bps = pool_config.early_withdrawal_fee_bps;
        pool.collateral_requirement_bps = pool_config.collateral_requirement_bps;
        pool.yield_strategy = pool_config.yield_strategy;
        
        // Set initial state
        pool.current_participants = 1; // Creator is first participant
        pool.status = PoolStatus::Filling;
        pool.total_value = 0;
        pool.current_round = 0;
        pool.next_payout_timestamp = Clock::get()?.unix_timestamp as u64 + pool_config.cycle_duration_seconds;
        pool.yield_basis_points = 0;
        pool.bump = ctx.bumps.group_account; // Fixed: use new Anchor bump API
        
        // Set vault data
        vault.pool = pool.key();
        vault.bump = ctx.bumps.vault; // Fixed: use new Anchor bump API

        // Create user account for creator
        create_user_account_internal(creator.key())?;
        
        emit!(PoolCreatedEvent {
            pool: pool.key(),
            creator: creator.key(),
            max_participants: pool_config.max_participants,
            contribution_amount: pool_config.contribution_amount,
            cycle_duration: pool_config.cycle_duration_seconds
        });

        Ok(())
    }

    /// Create a user account to track participation
    pub fn create_user_account(ctx: Context<CreateUserAccount>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        let user = &ctx.accounts.user;

        user_account.owner = user.key();
        user_account.pools_joined = 0;
        user_account.active_pools = 0;
        user_account.total_contribution = 0;
        user_account.total_winnings = 0;
        user_account.experience_points = 0;
        user_account.bump = ctx.bumps.user_account; // Fixed: use new Anchor bump API

        emit!(UserAccountCreatedEvent {
            user: user.key(),
        });

        Ok(())
    }

    /// Join a pool
    pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
        let pool = &mut ctx.accounts.group_account;
        let user = ctx.accounts.user.key();
        let user_account = &mut ctx.accounts.user_account;

        // Check if pool is still accepting participants
        require!(
            pool.status == PoolStatus::Filling,
            ErrorCode::PoolNotAcceptingParticipants
        );

        // Check if there's room for more participants
        require!(
            pool.current_participants < pool.max_participants,
            ErrorCode::PoolFull
        );

        // Check if user is already a participant
        require!(
            !pool.is_participant(user),
            ErrorCode::AlreadyParticipant
        );

        // Add user to participants
        pool.add_participant(user);
        pool.current_participants += 1;

        // Update user account stats
        user_account.pools_joined += 1;
        user_account.active_pools += 1;
        user_account.experience_points += 10; // Award XP for joining

        // Check if pool is now full
        if pool.current_participants == pool.max_participants {
            pool.status = PoolStatus::Active;
            pool.start_time = Clock::get()?.unix_timestamp as u64;
        }

        emit!(PoolJoinedEvent {
            pool: pool.key(),
            user: user,
            participants_count: pool.current_participants,
        });

        Ok(())
    }

    /// Contribute to pool
    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.group_account;
        let user = &ctx.accounts.user;
        let user_account = &mut ctx.accounts.user_account;

        // Ensure pool is active or filling
        require!(
            pool.status == PoolStatus::Active || pool.status == PoolStatus::Filling,
            ErrorCode::PoolNotActive
        );

        // Check if user is a participant
        require!(
            pool.is_participant(user.key()),
            ErrorCode::NotParticipant
        );

        // Check correct amount
        require!(
            amount == pool.contribution_amount,
            ErrorCode::IncorrectContributionAmount
        );

        // Transfer tokens from user to pool vault
        let cpi_accounts = Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.pool_token_account.to_account_info(),
            authority: user.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;

        // Update pool and user stats
        pool.total_value = pool.total_value.checked_add(amount).unwrap();
        user_account.total_contribution = user_account.total_contribution.checked_add(amount).unwrap();
        user_account.experience_points += 5; // Award XP for contributing

        emit!(ContributionEvent {
            pool: pool.key(),
            user: user.key(),
            amount,
            total_pool_value: pool.total_value,
        });

        Ok(())
    }

    /// Place a bid for the current round
    pub fn place_bid(ctx: Context<PlaceBid>, round: u8, amount: u64) -> Result<()> {
        let pool = &mut ctx.accounts.group_account;
        let bidder = &ctx.accounts.bidder;
        let bid = &mut ctx.accounts.bid;

        // Ensure pool is active
        require!(
            pool.status == PoolStatus::Active,
            ErrorCode::PoolNotActive
        );

        // Check if round is current
        require!(
            round == pool.current_round,
            ErrorCode::InvalidRound
        );

        // Check if bidder is a participant
        require!(
            pool.is_participant(bidder.key()),
            ErrorCode::NotParticipant
        );

        // For bidding model, ensure minimum bid
        if pool.collateral_requirement_bps > 10000 { // This is how we detect bidding model
            let min_bid = pool.contribution_amount
                .checked_mul(pool.current_participants as u64)
                .unwrap()
                .checked_mul(9000)
                .unwrap()
                .checked_div(10000)
                .unwrap();
                
            require!(
                amount >= min_bid,
                ErrorCode::BidTooLow
            );
        }

        // Create or update bid record
        bid.bidder = bidder.key();
        bid.pool = pool.key();
        bid.round = round;
        bid.amount = amount;
        bid.timestamp = Clock::get()?.unix_timestamp as u64;
        bid.bump = ctx.bumps.bid; // Fixed: use new Anchor bump API

        emit!(BidPlacedEvent {
            pool: pool.key(),
            bidder: bidder.key(),
            round,
            amount,
        });

        Ok(())
    }

    /// Claim the jackpot for a round
    pub fn claim_jackpot(ctx: Context<ClaimJackpot>, round: u8) -> Result<()> {
        let pool = &mut ctx.accounts.group_account;
        let winner = &ctx.accounts.winner;
        let user_account = &mut ctx.accounts.user_account;
        let round_result = &ctx.accounts.round_result;

        // Ensure pool is active
        require!(
            pool.status == PoolStatus::Active,
            ErrorCode::PoolNotActive
        );

        // Check if round is valid and completed
        require!(
            round <= pool.current_round,
            ErrorCode::InvalidRound
        );

        // Check if caller is the winner for the round
        require!(
            winner.key() == round_result.winner,
            ErrorCode::NotRoundWinner
        );

        // Check if jackpot has already been claimed
        require!(
            !round_result.paid,
            ErrorCode::JackpotAlreadyClaimed
        );

        // Calculate jackpot amount (total pool value / number of participants)
        let jackpot_amount = pool.contribution_amount
            .checked_mul(pool.current_participants as u64)
            .unwrap();

        // Transfer tokens from pool vault to winner
        let seeds = &[
            b"huifi-pool".as_ref(),
            &pool.token_mint.to_bytes(),
            &pool.creator.to_bytes(),
            &[pool.max_participants],
            &[pool.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.pool_token_account.to_account_info(),
            to: ctx.accounts.winner_token_account.to_account_info(),
            authority: pool.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        
        token::transfer(cpi_ctx, jackpot_amount)?;

        // Update round result and user stats
        // Fixed: remove the clone to prevent the Clone trait conflict
        let mut modified_result = RoundResult {
            pool: round_result.pool,
            round: round_result.round,
            winner: round_result.winner,
            paid: true,
            payout_amount: jackpot_amount,
            payout_timestamp: Clock::get()?.unix_timestamp as u64,
            bump: round_result.bump,
        };

        user_account.total_winnings = user_account.total_winnings.checked_add(jackpot_amount).unwrap();
        user_account.experience_points += 50; // Award XP for winning

        // Move to next round if this was the current round
        if round == pool.current_round {
            pool.current_round = pool.current_round.checked_add(1).unwrap();
            pool.next_payout_timestamp = Clock::get()?.unix_timestamp as u64 + pool.cycle_duration_seconds;
        }

        emit!(JackpotClaimedEvent {
            pool: pool.key(),
            winner: winner.key(),
            round,
            amount: jackpot_amount,
        });

        Ok(())
    }

    /// Close a completed pool
    pub fn close_pool(ctx: Context<ClosePool>) -> Result<()> {
        let pool = &mut ctx.accounts.group_account;
        let creator = &ctx.accounts.creator;

        // Ensure caller is the pool creator
        require!(
            creator.key() == pool.creator,
            ErrorCode::NotPoolCreator
        );

        // Ensure all rounds are completed
        require!(
            pool.current_round >= pool.max_participants as u8,
            ErrorCode::PoolStillActive
        );

        // Set pool status to completed
        pool.status = PoolStatus::Completed;

        emit!(PoolClosedEvent {
            pool: pool.key(),
            creator: creator.key(),
        });

        Ok(())
    }
}

// Helper function to create user account if it doesn't exist
fn create_user_account_internal(_user: Pubkey) -> Result<()> {
    // Fixed: added underscore to unused parameter
    // This is a placeholder - in reality, you would check if the account exists
    // and create it if it doesn't, but that would require a CPI to the program itself
    // which is more complex and would need a separate approach
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeProtocol<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + ProtocolSettings::INIT_SPACE,
        seeds = [b"huifi-protocol"],
        bump
    )]
    pub protocol_settings: Box<Account<'info, ProtocolSettings>>,

    #[account(mut)]
    pub treasury: Signer<'info>,

    pub token_mint: Account<'info, token::Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(pool_config: PoolConfig)] // Fixed: add instruction parameter to access max_participants
pub struct CreatePool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        init,
        payer = creator, 
        space = 8 + HuifiPool::INIT_SPACE,
        seeds = [
            b"huifi-pool",
            token_mint.key().as_ref(),
            creator.key().as_ref(),
            &[pool_config.max_participants] // Fixed: use parameter from pool_config
        ],
        bump
    )]
    pub group_account: Box<Account<'info, HuifiPool>>,

    pub token_mint: Account<'info, token::Mint>,

    #[account(
        init,
        payer = creator,
        space = 8 + Vault::INIT_SPACE,
        seeds = [b"huifi-vault", group_account.key().as_ref()],
        bump
    )]
    pub vault: Box<Account<'info, Vault>>,

    pub protocol_settings: Box<Account<'info, ProtocolSettings>>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct CreateUserAccount<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"huifi-member", user.key().as_ref()],
        bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinPool<'info> {
    #[account(mut)]
    pub group_account: Box<Account<'info, HuifiPool>>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"huifi-member", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub group_account: Box<Account<'info, HuifiPool>>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"huifi-member", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_token_account.mint == group_account.token_mint
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(round: u8, amount: u64)] // Fixed: add instruction parameters to make round available
pub struct PlaceBid<'info> {
    #[account(
        init_if_needed,
        payer = bidder,
        space = 8 + Bid::INIT_SPACE,
        seeds = [
            b"bid", 
            bidder.key().as_ref(), 
            group_account.key().as_ref(), 
            &[round] // Now using round from instruction parameter
        ],
        bump
    )]
    pub bid: Box<Account<'info, Bid>>,

    #[account(mut)]
    pub group_account: Box<Account<'info, HuifiPool>>,

    #[account(mut)]
    pub bidder: Signer<'info>,

    #[account(mut)]
    pub bidder_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_token_account.mint == group_account.token_mint
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(round: u8)] // Fixed: add instruction parameter to make round available
pub struct ClaimJackpot<'info> {
    #[account(mut)]
    pub group_account: Box<Account<'info, HuifiPool>>,

    #[account(
        mut,
        seeds = [b"round_result", group_account.key().as_ref(), &[round]], // Now using round from parameter
        bump = round_result.bump
    )]
    pub round_result: Box<Account<'info, RoundResult>>,

    #[account(mut)]
    pub winner: Signer<'info>,

    #[account(
        mut,
        constraint = winner_token_account.owner == winner.key()
    )]
    pub winner_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = pool_token_account.mint == group_account.token_mint
    )]
    pub pool_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"huifi-member", winner.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Box<Account<'info, UserAccount>>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClosePool<'info> {
    #[account(
        mut,
        constraint = group_account.creator == creator.key(),
    )]
    pub group_account: Box<Account<'info, HuifiPool>>,

    #[account(mut)]
    pub creator: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct ProtocolSettings {
    pub admin: Pubkey,
    pub treasury: Pubkey,
    pub token_mint: Pubkey,
    pub protocol_fee_bps: u16,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct HuifiPool {
    pub creator: Pubkey,
    pub token_mint: Pubkey,
    pub max_participants: u8,
    pub current_participants: u8,
    pub contribution_amount: u64,
    pub cycle_duration_seconds: u64,
    pub payout_delay_seconds: u64,
    pub early_withdrawal_fee_bps: u16,
    pub collateral_requirement_bps: u16,
    pub status: PoolStatus,
    pub total_value: u64,
    pub current_round: u8,
    pub next_payout_timestamp: u64,
    pub start_time: u64,
    pub yield_basis_points: u16,
    pub yield_strategy: YieldPlatform,
    pub participants: [Pubkey; 20], // Max size is 20 participants
    pub bump: u8,
}

#[account]
#[derive(Default, InitSpace)]
pub struct UserAccount {
    pub owner: Pubkey,
    pub pools_joined: u16,
    pub active_pools: u16,
    pub total_contribution: u64,
    pub total_winnings: u64,
    pub experience_points: u32,
    pub bump: u8,
}

#[account]
#[derive(Default, InitSpace)]
pub struct Vault {
    pub pool: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(Default, InitSpace)] // Fixed: Remove Clone to avoid conflict with account macro
pub struct Bid {
    pub bidder: Pubkey,
    pub pool: Pubkey,
    pub round: u8,
    pub amount: u64,
    pub timestamp: u64,
    pub bump: u8,
}

#[account]
#[derive(Default, InitSpace)] // Fixed: Remove Clone to avoid conflict with account macro
pub struct RoundResult {
    pub pool: Pubkey,
    pub round: u8,
    pub winner: Pubkey,
    pub paid: bool,
    pub payout_amount: u64,
    pub payout_timestamp: u64,
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum PoolStatus {
    Filling = 0,
    Active = 1,
    Completed = 2,
}

impl Default for PoolStatus {
    fn default() -> Self {
        PoolStatus::Filling
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, InitSpace)]
pub enum YieldPlatform {
    None,
    JitoSol,
    Kamino,
}

impl Default for YieldPlatform {
    fn default() -> Self {
        YieldPlatform::None
    }
}

// Remove redundant CreatePoolContext struct since you have CreatePool already

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct PoolConfig {
    pub max_participants: u8,
    pub contribution_amount: u64,
    pub cycle_duration_seconds: u64,
    pub payout_delay_seconds: u64,
    pub early_withdrawal_fee_bps: u16,
    pub collateral_requirement_bps: u16,
    pub yield_strategy: YieldPlatform,
}

impl HuifiPool {
    pub fn is_participant(&self, user: Pubkey) -> bool {
        for i in 0..self.current_participants {
            if self.participants[i as usize] == user {
                return true;
            }
        }
        false
    }
    
    pub fn add_participant(&mut self, user: Pubkey) {
        if self.current_participants < self.max_participants {
            self.participants[self.current_participants as usize] = user;
        }
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Protocol fee exceeds 10% maximum")]
    ProtocolFeeExceedsLimit,
    
    #[msg("Invalid participant count, must be between 3 and 20")]
    InvalidParticipantCount,
    
    #[msg("Contribution amount is too small")]
    ContributionTooSmall,
    
    #[msg("Cycle duration is too short")]
    CycleDurationTooShort,
    
    #[msg("Pool is not accepting participants")]
    PoolNotAcceptingParticipants,
    
    #[msg("Pool is already full")]
    PoolFull,
    
    #[msg("User is already a participant")]
    AlreadyParticipant,
    
    #[msg("Pool is not active")]
    PoolNotActive,
    
    #[msg("User is not a participant in this pool")]
    NotParticipant,
    
    #[msg("Incorrect contribution amount")]
    IncorrectContributionAmount,
    
    #[msg("Invalid round number")]
    InvalidRound,
    
    #[msg("Bid amount is too low")]
    BidTooLow,
    
    #[msg("User is not the round winner")]
    NotRoundWinner,
    
    #[msg("Jackpot has already been claimed")]
    JackpotAlreadyClaimed,
    
    #[msg("User is not the pool creator")]
    NotPoolCreator,
    
    #[msg("Pool is still active")]
    PoolStillActive,
}

// Event definitions
#[event]
pub struct PoolCreatedEvent {
    pub pool: Pubkey,
    pub creator: Pubkey,
    pub max_participants: u8,
    pub contribution_amount: u64,
    pub cycle_duration: u64,
}

#[event]
pub struct UserAccountCreatedEvent {
    pub user: Pubkey,
}

#[event]
pub struct PoolJoinedEvent {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub participants_count: u8,
}

#[event]
pub struct ContributionEvent {
    pub pool: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub total_pool_value: u64,
}

#[event]
pub struct BidPlacedEvent {
    pub pool: Pubkey,
    pub bidder: Pubkey,
    pub round: u8,
    pub amount: u64,
}

#[event]
pub struct JackpotClaimedEvent {
    pub pool: Pubkey,
    pub winner: Pubkey,
    pub round: u8,
    pub amount: u64,
}

#[event]
pub struct PoolClosedEvent {
    pub pool: Pubkey,
    pub creator: Pubkey,
}