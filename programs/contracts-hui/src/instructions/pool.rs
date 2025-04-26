// use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

// use crate::state::*;
// use crate::constants::*;
// use crate::errors::*;

// #[derive(Accounts)]
// #[instruction(pool_config: PoolConfig, uuid: [u8; 6])]
// pub struct CreatePool<'info> {
//     #[account(mut)]
//     pub creator: Signer<'info>,
    
//     #[account(
//         init,
//         payer = creator,
//         // space = 8 + 32 + 32 + 32 + std::mem::size_of::<PoolConfig>() + 32 * pool_config.max_participants as usize * 2 + 1 + 1 + 1 + 8 + 8 + 8 + 1 + 8,
//         space = 8 + std::mem::size_of::<GroupAccount>(),
//         // seeds = [POOL_SEED, token_mint.key().as_ref(), creator.key().as_ref(), &[pool_config.max_participants]],
//         seeds = [POOL_SEED, uuid.as_ref()],
//         bump,
//     )]
//     pub group_account: Account<'info, GroupAccount>,
    
//     pub token_mint: Account<'info, Mint>,
    
//     // #[account(
//     //     init,
//     //     payer = creator,
//     //     token::mint = token_mint,
//     //     token::authority = group_account,
//     //     seeds = [VAULT_SEED, group_account.key().as_ref()],
//     //     bump,
//     // )]
//     // pub vault: Account<'info, TokenAccount>,
// // SPL vault (only used for non-SOL tokens)
//     #[account(
//         init_if_needed,
//         payer = creator,
//         token::mint = token_mint,
//         token::authority = group_account,
//         seeds = [VAULT_SPL_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault_spl: Option<Account<'info, TokenAccount>>,
    
//     // SOL vault (only used for native SOL)
//     /// CHECK: This is a PDA that will hold SOL
//     #[account(
//         mut,
//         seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault_sol: Option<UncheckedAccount<'info>>,
    
//     #[account(
//         seeds = [PROTOCOL_SEED],
//         bump = protocol_settings.bump,
//     )]
//     pub protocol_settings: Account<'info, ProtocolSettings>,
    
//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
// }

// pub fn create_pool(
//     ctx: Context<CreatePool>,
//     pool_config: PoolConfig,
//     uuid: [u8; 6],
//     whitelist: Option<Vec<Pubkey>>,
// ) -> Result<()> {
//     // Validate pool configuration
//     validate_pool_config(&pool_config)?;
    
//     let current_timestamp = Clock::get()?.unix_timestamp;
//     let group_account = &mut ctx.accounts.group_account;
//     let bump = ctx.bumps.group_account;

//     // Check if we're using native SOL
//     let is_native_sol = ctx.accounts.token_mint.key() == anchor_spl::token::spl_token::native_mint::id();
    
//     // Validate that the correct vault is provided
//     if is_native_sol {
//         require!(ctx.accounts.vault_sol.is_some(), HuiFiError::InvalidVault);
//     } else {
//         require!(ctx.accounts.vault_spl.is_some(), HuiFiError::InvalidVault);
//     }
//     // Initialize the group account
//     group_account.uuid = uuid;
//     group_account.creator = ctx.accounts.creator.key();
//     group_account.whitelist = whitelist.unwrap_or_default();
//     group_account.token_mint = ctx.accounts.token_mint.key();

//    // Set the correct vault based on token type
//    if is_native_sol {
//     group_account.vault = ctx.accounts.vault_sol.as_ref().unwrap().key();
//     } else {
//     group_account.vault = ctx.accounts.vault_spl.as_ref().unwrap().key();
//     }
//     // Update pool config to mark if it's native SOL
//     let mut final_config = pool_config.clone();
//     final_config.is_native_sol = is_native_sol;
//     group_account.config = final_config;
//     // group_account.config = pool_config.clone();
//     group_account.member_addresses = Vec::new();
//     group_account.payout_order = Vec::new();
//     group_account.current_cycle = 0;
//     group_account.total_cycles = pool_config.max_participants;
//     group_account.status = PoolStatus::Initializing;
//     group_account.total_contributions = 0;
//     group_account.last_cycle_timestamp = current_timestamp;
//     group_account.next_payout_timestamp = 0; // Will be set when pool becomes active
//     group_account.bump = bump;
    
//     // Add creator as the first member
//     group_account.member_addresses.push(ctx.accounts.creator.key());
//     msg!("✅ Pool created with UUID: {:?}", uuid);
//     msg!("👥 Max participants: {}", pool_config.max_participants);
//     msg!("💰 Using {}", if is_native_sol { "native SOL" } else { "SPL token" });
//     // msg!("Pool created with max participants: {}", pool_config.max_participants);
    
//     Ok(())
// }

// fn validate_pool_config(config: &PoolConfig) -> Result<()> {
//     // Check number of participants
//     require!(
//         config.max_participants >= MIN_PARTICIPANTS && config.max_participants <= MAX_PARTICIPANTS,
//         HuiFiError::InvalidPoolConfig
//     );
    
//     // Check contribution amount
//     require!(
//         config.contribution_amount >= MIN_CONTRIBUTION_AMOUNT && config.contribution_amount <= MAX_CONTRIBUTION_AMOUNT,
//         HuiFiError::InvalidPoolConfig
//     );
    
//     // Check cycle duration
//     require!(
//         config.cycle_duration_seconds >= MIN_CYCLE_DURATION && config.cycle_duration_seconds <= MAX_CYCLE_DURATION,
//         HuiFiError::InvalidPoolConfig
//     );
    
//     // Check payout delay
//     require!(
//         config.payout_delay_seconds >= MIN_PAYOUT_DELAY && config.payout_delay_seconds <= MAX_PAYOUT_DELAY,
//         HuiFiError::InvalidPoolConfig
//     );
    
//     // Check early withdrawal fee
//     require!(
//         config.early_withdrawal_fee_bps <= MAX_EARLY_WITHDRAWAL_FEE_BPS,
//         HuiFiError::InvalidPoolConfig
//     );
    
//     // Check collateral requirement
//     require!(
//         config.collateral_requirement_bps >= MIN_COLLATERAL_REQUIREMENT_BPS,
//         HuiFiError::InvalidPoolConfig
//     );
    
//     Ok(())
// }

// #[derive(Accounts)]
// pub struct JoinPool<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,
    
//     #[account(
//         mut,
//         // seeds = [POOL_SEED, group_account.token_mint.as_ref(), group_account.creator.as_ref(), &[group_account.total_cycles]],
//         seeds = [POOL_SEED, group_account.uuid.as_ref()],
//         bump = group_account.bump,
//         constraint = group_account.status == PoolStatus::Initializing @ HuiFiError::InvalidPoolStatus,
//         constraint = group_account.member_addresses.len() < group_account.total_cycles as usize @ HuiFiError::PoolFull,
//     )]
//     pub group_account: Account<'info, GroupAccount>,
    
//     #[account(
//         init,
//         payer = user,
//         space = 8 + std::mem::size_of::<MemberAccount>(),
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump,
//     )]
//     pub member_account: Account<'info, MemberAccount>,
    
//     // User's token account (to verify they have funds)
//     #[account(
//         constraint = user_token_account.owner == user.key() @ HuiFiError::InvalidTokenAccountOwner,
//         constraint = user_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//         constraint = user_token_account.amount >= group_account.config.contribution_amount @ HuiFiError::InsufficientContribution,
//     )]
//     pub user_token_account: Account<'info, TokenAccount>,
    
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
// }

// pub fn join_pool(ctx: Context<JoinPool>,uuid: [u8; 6]) -> Result<()> {
//     let group_account = &mut ctx.accounts.group_account;
//     let member_account = &mut ctx.accounts.member_account;
//     let user_key = ctx.accounts.user.key();
    
//     // Check if user is already a member
//     require!(
//         !group_account.member_addresses.contains(&user_key),
//         HuiFiError::MemberAlreadyJoined
//     );
//     // ✅ Check whitelist first!
//     if !group_account.whitelist.is_empty() {
//         require!(
//             group_account.whitelist.contains(&user_key),
//             HuiFiError::NotWhitelisted
//         );
//     }    
//     // Initialize the member account
//     let _current_timestamp = Clock::get()?.unix_timestamp;
//     let bump = ctx.bumps.member_account;
    
//     member_account.owner = user_key;
//     member_account.pool = group_account.key();
//     member_account.contributions_made = 0;
//     member_account.status = MemberStatus::Active;
//     member_account.has_received_early_payout = false;
//     member_account.collateral_staked = 0;
//     member_account.reputation_points = 0;
//     member_account.last_contribution_timestamp = 0; // No contributions yet
//     member_account.bump = bump;
    
//     // Add user to the pool's member list
//     group_account.member_addresses.push(user_key);
    
//     // If the pool is now full, change status to Active and set payout order
//     if group_account.member_addresses.len() as u8 == group_account.total_cycles {
//         group_account.status = PoolStatus::Active;
        
//         // For now, we'll use the order of joining as the payout order
//         // In a more advanced implementation, you might want to randomize this
//         group_account.payout_order = group_account.member_addresses.clone();
//     }
//     msg!("User joined pool: {}", user_key);
//     msg!("Current member count: {}/{}", 
//         group_account.member_addresses.len(),
//         group_account.total_cycles
//     );
    
//     Ok(())
// }

// #[derive(Accounts)]
// pub struct Contribute<'info> {
//     #[account(mut)]
//     pub contributor: Signer<'info>,
    
//     #[account(
//         mut,
//         seeds = [POOL_SEED, group_account.token_mint.as_ref(), group_account.creator.as_ref(), &[group_account.total_cycles]],
//         bump = group_account.bump,
//         constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
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
    
//     // #[account(
//     //     mut,
//     //     constraint = contributor_token_account.owner == contributor.key() @ HuiFiError::InvalidTokenAccountOwner,
//     //     constraint = contributor_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     // )]
//     // pub contributor_token_account: Account<'info, TokenAccount>,
    
//     // #[account(
//     //     mut,
//     //     seeds = [VAULT_SEED, group_account.key().as_ref()],
//     //     bump,
//     // )]
//     // pub vault: Account<'info, TokenAccount>,
//     // SPL token contribution
//     #[account(
//         mut,
//         constraint = contributor_token_account.owner == contributor.key() @ HuiFiError::InvalidTokenAccountOwner,
//         constraint = contributor_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
//     )]
//     pub contributor_token_account: Account<'info, TokenAccount>,
    
//     // SPL token vault
//     #[account(
//         mut,
//         seeds = [VAULT_SPL_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault_spl: Option<Account<'info, TokenAccount>>,
    
//     // SOL vault
//     /// CHECK: This is a PDA that holds SOL
//     #[account(
//         mut,
//         seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault_sol: Option<UncheckedAccount<'info>>,
//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
// }

// pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
//     let group_account = &mut ctx.accounts.group_account;
//     let member_account = &mut ctx.accounts.member_account;
    
//     // Validate the contribution amount
//     require!(
//         amount == group_account.config.contribution_amount,
//         HuiFiError::InsufficientContribution
//     );
    
//     let current_timestamp = Clock::get()?.unix_timestamp;
    

//    // Check if we're using native SOL or SPL token
//    let is_native_sol = group_account.config.is_native_sol;
    
//    // Validate that the correct accounts are provided
//    if is_native_sol {
//        require!(ctx.accounts.vault_sol.is_some(), HuiFiError::InvalidVault);
//    } else {
//        require!(
//            ctx.accounts.vault_spl.is_some() && ctx.accounts.contributor_token_account.is_some(),
//            HuiFiError::InvalidVault
//        );
//    }

//     // Transfer tokens from contributor to pool vault
//    // Process the contribution based on token type
//     if is_native_sol {
//         // Transfer SOL from contributor to pool vault
//         let ix = anchor_lang::solana_program::system_instruction::transfer(
//             &ctx.accounts.contributor.key(),
//             &ctx.accounts.vault_sol.as_ref().unwrap().key(),
//             amount,
//         );
        
//         anchor_lang::solana_program::program::invoke(
//             &ix,
//             &[
//                 ctx.accounts.contributor.to_account_info(),
//                 ctx.accounts.vault_sol.as_ref().unwrap().to_account_info(),
//                 ctx.accounts.system_program.to_account_info(),
//             ],
//         )?;
//     } else {
//         // Transfer SPL tokens from contributor to pool vault
//         let cpi_accounts = Transfer {
//             from: ctx.accounts.contributor_token_account.as_ref().unwrap().to_account_info(),
//             to: ctx.accounts.vault_spl.as_ref().unwrap().to_account_info(),
//             authority: ctx.accounts.contributor.to_account_info(),
//         };
        
//         let cpi_program = ctx.accounts.token_program.to_account_info();
//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
//         token::transfer(cpi_ctx, amount)?;
//     }
    
//     // let cpi_accounts = Transfer {
//     //     from: ctx.accounts.contributor_token_account.to_account_info(),
//     //     to: ctx.accounts.vault.to_account_info(),
//     //     authority: ctx.accounts.contributor.to_account_info(),
//     // };
    
//     // let cpi_program = ctx.accounts.token_program.to_account_info();
//     // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
//     // token::transfer(cpi_ctx, amount)?;
    
//     // Update member account
//     member_account.contributions_made = member_account.contributions_made.saturating_add(1);
//     member_account.last_contribution_timestamp = current_timestamp;
    
//     // Update pool account
//     group_account.total_contributions = group_account.total_contributions.saturating_add(amount);
    
//     // Check if all members have contributed for the current cycle
//     // This would be implemented in a more sophisticated way in a production system
//     // For example, you would maintain a list of who has contributed in the current cycle
//     msg!("Contribution of {} {} received from {}", 
//     amount, 
//     if is_native_sol { "SOL" } else { "tokens" },
//     ctx.accounts.contributor.key()
// );
//     // msg!("Contribution of {} tokens received from {}", 
//     //     amount, 
//     //     ctx.accounts.contributor.key()
//     // );
    
//     Ok(())
// }

use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction};
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

use crate::state::*;
use crate::constants::*;
use crate::errors::*;
// ==================== CREATE POOL FUNCTIONS ====================

//CREATE SOL POOL
#[derive(Accounts)]
#[instruction(pool_config: PoolConfig, uuid: [u8; 6])]
pub struct CreateSolPool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<GroupAccount>(),
        seeds = [POOL_SEED, uuid.as_ref()],
        bump,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    /// CHECK: This is a PDA that will hold SOL
    #[account(
        mut,
        seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault_sol: UncheckedAccount<'info>,
    
    #[account(seeds = [PROTOCOL_SEED], bump = protocol_settings.bump)]
    pub protocol_settings: Account<'info, ProtocolSettings>,
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_sol_pool(
    ctx: Context<CreateSolPool>,
    pool_config: PoolConfig,
    uuid: [u8; 6],
    whitelist: Option<Vec<Pubkey>>,
) -> Result<()> {
    // Validate pool configuration
    validate_pool_config(&pool_config)?;
    
    let current_timestamp = Clock::get()?.unix_timestamp;
    let group_account = &mut ctx.accounts.group_account;
    let bump = ctx.bumps.group_account;
    // Create a copy of pool_config instead of modifying the original
    let mut config = pool_config.clone();
    // Mark as SOL pool
    config.is_native_sol = true;
    
    // Initialize the group account
    group_account.uuid = uuid;
    group_account.creator = ctx.accounts.creator.key();
    group_account.whitelist = whitelist.unwrap_or_default();
    group_account.token_mint = anchor_spl::token::spl_token::native_mint::id();
    group_account.vault = ctx.accounts.vault_sol.key();
    group_account.config = config;
    group_account.member_addresses = Vec::new();
    group_account.payout_order = Vec::new();
    group_account.current_cycle = 0;
    group_account.total_cycles = pool_config.max_participants;
    group_account.status = PoolStatus::Initializing;
    group_account.total_contributions = 0;
    group_account.unclaimed_payout = 0;
    group_account.last_cycle_timestamp = current_timestamp;
    group_account.next_payout_timestamp = 0;
    group_account.price_feed_id = pool_config.feed_id;
    group_account.current_bid_amount = None;
    group_account.current_winner = None;
    group_account.bump = bump;
    
    // Add creator as the first member
    group_account.member_addresses.push(ctx.accounts.creator.key());
    
    msg!("✅ SOL Pool created with UUID: {:?}", uuid);
    msg!("👥 Max participants: {}", pool_config.max_participants);
    
    Ok(())
}

//CREATE SPL POOL
#[derive(Accounts)]
#[instruction(pool_config: PoolConfig, uuid: [u8; 6])]
pub struct CreateSplPool<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = 8 + std::mem::size_of::<GroupAccount>(),
        seeds = [POOL_SEED, uuid.as_ref()],
        bump,
    )]
    pub group_account: Account<'info, GroupAccount>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        init,
        payer = creator,
        token::mint = token_mint,
        token::authority = group_account,
        seeds = [VAULT_SPL_SEED, group_account.key().as_ref()],
        bump,
    )]
    pub vault_spl: Account<'info, TokenAccount>,
    
    #[account(seeds = [PROTOCOL_SEED], bump = protocol_settings.bump)]
    pub protocol_settings: Account<'info, ProtocolSettings>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn create_spl_pool(
    ctx: Context<CreateSplPool>,
    pool_config: PoolConfig,
    uuid: [u8; 6],
    whitelist: Option<Vec<Pubkey>>,
) -> Result<()> {
    // Validate pool configuration
    validate_pool_config(&pool_config)?;
    
    let current_timestamp = Clock::get()?.unix_timestamp;
    let group_account = &mut ctx.accounts.group_account;
    let bump = ctx.bumps.group_account;
    let mut config = pool_config.clone();
    // Mark as SPL token pool
    config.is_native_sol = false;
    
    // Initialize the group account
    group_account.uuid = uuid;
    group_account.creator = ctx.accounts.creator.key();
    group_account.whitelist = whitelist.unwrap_or_default();
    group_account.token_mint = ctx.accounts.token_mint.key();
    group_account.vault = ctx.accounts.vault_spl.key();
    group_account.config = config;
    group_account.member_addresses = Vec::new();
    group_account.payout_order = Vec::new();
    group_account.current_cycle = 0;
    group_account.total_cycles = pool_config.max_participants;
    group_account.status = PoolStatus::Initializing;
    group_account.total_contributions = 0;
    group_account.last_cycle_timestamp = current_timestamp;
    group_account.next_payout_timestamp = 0;
    group_account.price_feed_id = pool_config.feed_id;
    group_account.current_bid_amount = None;
    group_account.current_winner = None;
    group_account.bump = bump;
    
    // Add creator as the first member
    group_account.member_addresses.push(ctx.accounts.creator.key());
    
    msg!("✅ SPL Token Pool created with UUID: {:?}", uuid);
    msg!("👥 Max participants: {}", pool_config.max_participants);
    msg!("💰 Token mint: {}", ctx.accounts.token_mint.key());
    
    Ok(())
}


// ==================== JOIN POOL FUNCTIONS ====================

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct JoinSolPool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.status == PoolStatus::Initializing @ HuiFiError::InvalidPoolStatus,
        constraint = group_account.member_addresses.len() < group_account.total_cycles as usize @ HuiFiError::PoolFull,
        constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
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
    
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn join_sol_pool(ctx: Context<JoinSolPool>, uuid: [u8; 6]) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    let user_key = ctx.accounts.user.key();
    
    // Check if user is already a member
    require!(
        !group_account.member_addresses.contains(&user_key),
        HuiFiError::MemberAlreadyJoined
    );
    
    // Check whitelist if applicable
    if !group_account.whitelist.is_empty() {
        require!(
            group_account.whitelist.contains(&user_key),
            HuiFiError::NotWhitelisted
        );
    }
    
    // Initialize the member account
    let bump = ctx.bumps.member_account;
    
    member_account.owner = user_key;
    member_account.pool = group_account.key();
    member_account.contributions_made = 0;
    member_account.status = MemberStatus::Active;
    member_account.has_received_payout = false;
    member_account.eligible_for_payout = false;
    member_account.collateral_staked = 0;
    member_account.reputation_points = 0;
    member_account.last_contribution_timestamp = 0;
    member_account.bump = bump;
    
    // Add user to the pool's member list
    group_account.member_addresses.push(user_key);
    
    // If the pool is now full, change status to Active and set payout order
    if group_account.member_addresses.len() as u8 == group_account.total_cycles {
        group_account.status = PoolStatus::Active;
        group_account.payout_order = group_account.member_addresses.clone();
    }
    
    msg!("User joined SOL pool: {}", user_key);
    msg!("Current member count: {}/{}", 
        group_account.member_addresses.len(),
        group_account.total_cycles
    );
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct JoinSplPool<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.status == PoolStatus::Initializing @ HuiFiError::InvalidPoolStatus,
        constraint = group_account.member_addresses.len() < group_account.total_cycles as usize @ HuiFiError::PoolFull,
        constraint = !group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
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
    
    #[account(
        constraint = user_token_account.owner == user.key() @ HuiFiError::InvalidTokenAccountOwner,
        constraint = user_token_account.mint == group_account.token_mint @ HuiFiError::InvalidPoolConfig,
        constraint = user_token_account.amount >= group_account.config.contribution_amount @ HuiFiError::InsufficientContribution,
    )]
    pub user_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn join_spl_pool(ctx: Context<JoinSplPool>, uuid: [u8; 6]) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    let user_key = ctx.accounts.user.key();
    
    // Check if user is already a member
    require!(
        !group_account.member_addresses.contains(&user_key),
        HuiFiError::MemberAlreadyJoined
    );
    
    // Check whitelist if applicable
    if !group_account.whitelist.is_empty() {
        require!(
            group_account.whitelist.contains(&user_key),
            HuiFiError::NotWhitelisted
        );
    }
    
    // Initialize the member account
    let bump = ctx.bumps.member_account;
    
    member_account.owner = user_key;
    member_account.pool = group_account.key();
    member_account.contributions_made = 0;
    member_account.status = MemberStatus::Active;
    member_account.has_received_payout = false;
    member_account.eligible_for_payout = false;
    member_account.collateral_staked = 0;
    member_account.reputation_points = 0;
    member_account.last_contribution_timestamp = 0;
    member_account.bump = bump;
    
    // Add user to the pool's member list
    group_account.member_addresses.push(user_key);
    
    // If the pool is now full, change status to Active and set payout order
    if group_account.member_addresses.len() as u8 == group_account.total_cycles {
        group_account.status = PoolStatus::Active;
        group_account.payout_order = group_account.member_addresses.clone();
    }
    
    msg!("User joined SPL pool: {}", user_key);
    msg!("Current member count: {}/{}", 
        group_account.member_addresses.len(),
        group_account.total_cycles
    );
    
    Ok(())
}

// // ==================== CONTRIBUTE FUNCTIONS ====================

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct ContributeSol<'info> {
//     #[account(mut)]
//     pub contributor: Signer<'info>,
    
//     #[account(
//         mut,
//         seeds = [POOL_SEED, uuid.as_ref()],
//         bump = group_account.bump,
//         constraint = group_account.status == PoolStatus::Active @ HuiFiError::InvalidPoolStatus,
//         constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
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
    
//     /// CHECK: This is a PDA that holds SOL
//     #[account(
//         mut,
//         seeds = [VAULT_SOL_SEED, group_account.key().as_ref()],
//         bump,
//     )]
//     pub vault_sol: UncheckedAccount<'info>,
    
//     pub system_program: Program<'info, System>,
// }

// pub fn contribute_sol(ctx: Context<ContributeSol>, uuid: [u8; 6], amount: u64) -> Result<()> {
//     let group_account = &mut ctx.accounts.group_account;
//     let member_account = &mut ctx.accounts.member_account;
    
//     // Validate the contribution amount
//     require!(
//         amount == group_account.config.contribution_amount,
//         HuiFiError::InsufficientContribution
//     );
    
//     let current_timestamp = Clock::get()?.unix_timestamp;
    
//     // Transfer SOL from contributor to pool vault
//     let ix = system_instruction::transfer(
//         &ctx.accounts.contributor.key(),
//         &ctx.accounts.vault_sol.key(),
//         amount,
//     );
    
//     invoke(
//         &ix,
//         &[
//             ctx.accounts.contributor.to_account_info(),
//             ctx.accounts.vault_sol.to_account_info(),
//             ctx.accounts.system_program.to_account_info(),
//         ],
//     )?;
    
//     // Update member account
//     member_account.contributions_made = member_account.contributions_made.saturating_add(1);
//     member_account.last_contribution_timestamp = current_timestamp;
    
//     // Update pool account
//     group_account.total_contributions = group_account.total_contributions.saturating_add(amount);
    
//     msg!("Contribution of {} SOL received from {}", 
//         amount, 
//         ctx.accounts.contributor.key()
//     );
    
//     Ok(())
// }

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
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
    
//     // Validate the contribution amount
//     require!(
//         amount == group_account.config.contribution_amount,
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

// ==================== HELPER FUNCTIONS ====================

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

