use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke, system_instruction, native_token::LAMPORTS_PER_SOL};
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use crate::constants::*;
use crate::state::*;
use crate::errors::*;
use anchor_lang::system_program::{self};

// ========== SOL Collateral ==========

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct DepositSolCollateral<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
        // Add phase validation - collateral can be deposited during Ready  phase
        constraint = matches!(
            group_account.status,
            PoolStatus::Active { phase: CyclePhase::ReadyForPayout }
        ) @ HuiFiError::InvalidPhase,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
        bump = member_account.bump,
        // Add validation that member is the winner
        constraint = Some(user.key()) == group_account.current_winner @ HuiFiError::NotPoolWinner,
    )]
    pub member_account: Account<'info, MemberAccount>,

    #[account(
        mut,
        seeds = [COLLATERAL_VAULT_SOL_SEED, group_account.key().as_ref()],
        bump,
    )]
    /// CHECK: Native SOL vault PDA
    pub collateral_vault_sol: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn deposit_sol_collateral(
    ctx: Context<DepositSolCollateral>,
    _uuid: [u8; 6],
    amount: u64  // already in lamports from frontend
) -> Result<()> {
    let group_account = &ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;

    // Calculate required collateral (130% of total contributions)
    let min_required = group_account.total_contributions
        .saturating_sub(member_account.contributions_made.into())
        .saturating_mul(130)
        .saturating_div(100);

    require!(amount >= min_required, HuiFiError::InsufficientCollateral);
    require!(member_account.has_deposited_collateral == false, HuiFiError::AlreadyDepositedCollateral);

    // Log amounts in SOL for better readability
    msg!("🛡️ Collateral status - Required: {} SOL (130% of total contributions), Provided: {} SOL", 
        min_required as f64 / LAMPORTS_PER_SOL as f64,
        amount as f64 / LAMPORTS_PER_SOL as f64
    );

    // Transfer lamports
    let ix = system_instruction::transfer(
        &ctx.accounts.user.key(),
        &ctx.accounts.collateral_vault_sol.key(),
        amount,  // already in lamports
    );

    invoke(
        &ix,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.collateral_vault_sol.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // Store amount in lamports
    member_account.collateral_staked += amount;
    member_account.has_deposited_collateral = true;

    // Log in SOL for better readability
    msg!("✅ Deposited {} SOL as collateral", 
        amount as f64 / LAMPORTS_PER_SOL as f64
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct WithdrawSolCollateral<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
        bump = member_account.bump,
    )]
    pub member_account: Account<'info, MemberAccount>,

    #[account(
        mut,
        seeds = [COLLATERAL_VAULT_SOL_SEED, group_account.key().as_ref()],
        bump,
    )]
    /// CHECK: Native SOL vault PDA
    pub collateral_vault_sol: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
pub fn withdraw_sol_collateral(
    ctx: Context<WithdrawSolCollateral>,
    _uuid: [u8; 6],
) -> Result<()> {
    let group_account = &mut ctx.accounts.group_account;
    let member_account = &mut ctx.accounts.member_account;
    let collateral_vault_sol = &mut ctx.accounts.collateral_vault_sol;
    // Add check to ensure user is the owner of the member account
    require!(ctx.accounts.user.key() == member_account.owner, HuiFiError::UnauthorizedAccess);
    // Validate member has deposited collateral
    require!(member_account.has_deposited_collateral, HuiFiError::NoCollateralDeposited);
    // require!(member_account.status != MemberStatus::Defaulted, HuiFiError::MemberNotDefaulted);
    // Validate member has not already withdrawn
    require!(member_account.status != MemberStatus::Withdrawed, HuiFiError::MemberAlreadyWithdrawed);
    // Validate cycle is completed
    require!(group_account.status == PoolStatus::Completed, HuiFiError::CycleNotCompleted);
    // Validate vault has enough funds
    require!(collateral_vault_sol.lamports() >= member_account.collateral_staked, HuiFiError::InsufficientVaultFunds);
    // Calculate required collateral (130% of total contributions)
    let amount = member_account.collateral_staked;

    // Transfer SOL to member's wallet
    system_program::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.collateral_vault_sol.to_account_info(),
                to: ctx.accounts.user.to_account_info(),
            },
            &[&[COLLATERAL_VAULT_SOL_SEED, group_account.key().as_ref(), &[ctx.bumps.collateral_vault_sol]]],
        ),
        amount,
    )?;

    // member_account.has_deposited_collateral = false;
    member_account.collateral_staked = 0;
    member_account.status = MemberStatus::Withdrawed;
    // Add logging for better tracking
    msg!("✅ Withdrawn {} SOL collateral", 
    amount as f64 / LAMPORTS_PER_SOL as f64
    );
    Ok(())
}
// ========== SPL Collateral ==========

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct DepositSplCollateral<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,

//     #[account(
//         mut,
//         seeds = [POOL_SEED, uuid.as_ref()],
//         bump = group_account.bump,
//         constraint = !group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
//         // Add phase validation - collateral can be deposited during Contributing phase
//         constraint = matches!(
//             group_account.status,
//             PoolStatus::Active { phase: CyclePhase::Contributing }
//         ) @ HuiFiError::InvalidPhase,
//     )]
//     pub group_account: Account<'info, GroupAccount>,

//     #[account(
//         mut,
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump = member_account.bump,
//     )]
//     pub member_account: Account<'info, MemberAccount>,

//     #[account(mut)]
//     pub user_token_account: Account<'info, TokenAccount>,

//     #[account(
//         mut,
//         seeds = [COLLATERAL_VAULT_SPL_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump,
//     )]
//     pub collateral_vault_spl: Account<'info, TokenAccount>,

//     #[account(
//         constraint = token_mint.key() == group_account.token_mint @ HuiFiError::InvalidTokenMint
//     )]
//     pub token_mint: Account<'info, Mint>,

//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
// }

// pub fn deposit_spl_collateral(
//     ctx: Context<DepositSplCollateral>,
//     _uuid: [u8; 6],
//     amount: u64
// ) -> Result<()> {
//     let group = &ctx.accounts.group_account;
//     let member = &mut ctx.accounts.member_account;

//     let min_required = calculate_required_collateral(
//         group.config.contribution_amount,
//         group.config.max_participants,
//         member.contributions_made,
//         group.config.collateral_requirement_bps as u64,
//     );

//     require!(amount >= min_required, HuiFiError::InsufficientCollateral);

//     let cpi_ctx = CpiContext::new(
//         ctx.accounts.token_program.to_account_info(),
//         Transfer {
//             from: ctx.accounts.user_token_account.to_account_info(),
//             to: ctx.accounts.collateral_vault_spl.to_account_info(),
//             authority: ctx.accounts.user.to_account_info(),
//         },
//     );

//     token::transfer(cpi_ctx, amount)?;
//     member.collateral_staked += amount;

//     msg!("✅ Deposited {} SPL tokens as collateral", amount);

//     Ok(())
// }
// ==================== SLASH COLLATERAL ====================

#[derive(Accounts)]
#[instruction(uuid: [u8; 6])]
pub struct SlashCollateral<'info> {
    #[account(mut)]
    pub admin: Signer<'info>, // authority to slash (admin, pool manager)

    #[account(
        mut,
        seeds = [POOL_SEED, uuid.as_ref()],
        bump = group_account.bump,
        // Validate phase - slashing can happen during ReadyForPayout
        constraint = matches!(
            group_account.status,
            PoolStatus::Active { phase: CyclePhase::ReadyForPayout }
        ) @ HuiFiError::InvalidPhase,
    )]
    pub group_account: Account<'info, GroupAccount>,

    #[account(
        mut,
        seeds = [MEMBER_SEED, group_account.key().as_ref(), member_account.owner.as_ref()],
        bump = member_account.bump,
    )]
    pub member_account: Account<'info, MemberAccount>,

    /// CHECK: Member's wallet (only for SOL)
    #[account(mut)]
    pub member_wallet: AccountInfo<'info>,

    /// Vault holding SOL collateral (optional)
    #[account(mut)]
    pub collateral_vault_sol: Option<AccountInfo<'info>>,

    /// Vault holding SPL collateral (optional)
    #[account(mut)]
    pub collateral_vault_spl: Option<Account<'info, TokenAccount>>,

    // Treasury accounts
    #[account(mut)]
    pub treasury_usdc: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury_usdt: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury_jitosol: Option<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub treasury_sol: Option<AccountInfo<'info>>,

    #[account(mut)]
    pub pool_vault: Option<Account<'info, TokenAccount>>,

    pub token_program: Option<Program<'info, Token>>,
    pub system_program: Program<'info, System>,
}

pub fn slash_collateral(ctx: Context<SlashCollateral>, uuid: [u8; 6], payout_amount: u64) -> Result<()> {
    let group = &ctx.accounts.group_account;
    let member = &mut ctx.accounts.member_account;

    require!(member.status == MemberStatus::Defaulted, HuiFiError::MemberNotDefaulted);
    require!(member.has_received_payout, HuiFiError::MemberNotPaidYet);

    let penalty_bps = 500u64; // 5%
    let penalty_amount = payout_amount
        .saturating_mul(penalty_bps)
        .saturating_div(10_000);
    let total_slash = payout_amount.saturating_add(penalty_amount);

    require!(total_slash <= member.collateral_staked, HuiFiError::InvalidSlashAmount);

    if group.config.is_native_sol {
        let vault = ctx.accounts.collateral_vault_sol.as_ref().ok_or(HuiFiError::MissingCollateralVault)?;
        let sol_treasury = ctx.accounts.treasury_sol.as_ref().ok_or(HuiFiError::MissingTreasury)?;
        let pool_vault = ctx.accounts.pool_vault.as_ref().ok_or(HuiFiError::MissingPoolVault)?;

        // Slash SOL manually
        **vault.lamports.borrow_mut() -= total_slash;
        **sol_treasury.lamports.borrow_mut() += penalty_amount;
        **pool_vault.to_account_info().lamports.borrow_mut() += payout_amount;

        msg!("🛡️ Slashed SOL collateral: {} to pool, {} penalty to treasury", payout_amount, penalty_amount);
    } else {
        let vault = ctx.accounts.collateral_vault_spl.as_ref().ok_or(HuiFiError::MissingCollateralVault)?;
        let pool_vault = ctx.accounts.pool_vault.as_ref().ok_or(HuiFiError::MissingPoolVault)?;
        let token_program = ctx.accounts.token_program.as_ref().ok_or(HuiFiError::MissingTokenProgram)?.to_account_info();
        let group_key = group.key();
        let member_key = member.owner;
        let seeds = &[
            COLLATERAL_VAULT_SPL_SEED,
            group_key.as_ref(),
            member_key.as_ref(),
        ];
        let signer = &[&seeds[..]];

        // Determine treasury
        let treasury_target = match group.token_mint {
            m if ctx.accounts.treasury_usdc.as_ref().map(|a| a.mint) == Some(m) => ctx.accounts.treasury_usdc.as_ref().unwrap().to_account_info(),
            m if ctx.accounts.treasury_usdt.as_ref().map(|a| a.mint) == Some(m) => ctx.accounts.treasury_usdt.as_ref().unwrap().to_account_info(),
            m if ctx.accounts.treasury_jitosol.as_ref().map(|a| a.mint) == Some(m) => ctx.accounts.treasury_jitosol.as_ref().unwrap().to_account_info(),
            _ => return Err(HuiFiError::UnsupportedToken.into()),
        };

        // Transfer repayment
        let repay_ctx = CpiContext::new_with_signer(
            token_program.clone(),
            Transfer {
                from: vault.to_account_info(),
                to: pool_vault.to_account_info(),
                authority: group.to_account_info(),
            },
            signer,
        );
        token::transfer(repay_ctx, payout_amount)?;

        // Transfer penalty
        let penalty_ctx = CpiContext::new_with_signer(
            token_program,
            Transfer {
                from: vault.to_account_info(),
                to: treasury_target,
                authority: group.to_account_info(),
            },
            signer,
        );
        token::transfer(penalty_ctx, penalty_amount)?;

        msg!("🛡️ Slashed SPL collateral: {} to pool, {} penalty to treasury", payout_amount, penalty_amount);
    }

    member.collateral_staked = member.collateral_staked.saturating_sub(total_slash);

    Ok(())
}

// ========== Helpers ==========

// Helper function should also work with lamports
// fn calculate_required_collateral(
//     contribution_amount: u64,  // should be in lamports
//     max_participants: u8,
//     contributions_made: u64,
//     collateral_requirement_bps: u64,
// ) -> u64 {
//     // Calculate total contribution value in lamports
//     let total_contribution = contribution_amount
//         .saturating_mul(max_participants as u64)
//         .saturating_mul(contributions_made);

//     // Calculate required collateral in lamports
//     total_contribution
//         .saturating_mul(collateral_requirement_bps)
//         .saturating_div(MIN_COLLATERAL_REQUIREMENT_BPS)
// }



// use anchor_lang::prelude::*;
// use anchor_lang::solana_program;
// use anchor_lang::solana_program::{program::invoke, system_instruction};
// use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
// use anchor_spl::token::spl_token::native_mint;
// use crate::constants::*;
// use crate::state::*;
// use crate::errors::*;

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct DepositSolCollateral<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,

//     #[account(
//         mut,
//         seeds = [POOL_SEED, uuid.as_ref()],
//         bump = group_account.bump,
//         constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
//     )]
//     pub group_account: Account<'info, GroupAccount>,

//     #[account(
//         mut,
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump = member_account.bump
//     )]
//     pub member_account: Account<'info, MemberAccount>,

//     #[account(
//         mut,
//         seeds = [COLLATERAL_VAULT_SOL_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump
//     )]
//     /// CHECK: This is a PDA that will hold SOL
//     pub collateral_vault_sol: AccountInfo<'info>,

//     pub system_program: Program<'info, System>,
// }
// pub fn deposit_sol_collateral(ctx: Context<DepositSolCollateral>, uuid: [u8; 6], amount: u64) -> Result<()> {
//     let group = &ctx.accounts.group_account;
//     let member = &mut ctx.accounts.member_account;

//     // Calculate based on LTV = 80% of expected payout
//     let min_required = calculate_required_collateral(
//         group.config.contribution_amount,
//         group.config.max_participants,
//         member.contributions_made,
//         group.config.collateral_requirement_bps as u64
//     );

//     require!(amount >= min_required, HuiFiError::InsufficientCollateral);

//     // Transfer SOL to the vault
//     let vault = &ctx.accounts.collateral_vault_sol;
//     let ix = system_instruction::transfer(
//         &ctx.accounts.user.key(),
//         &vault.key(),
//         amount,
//     );
//     invoke(
//         &ix,
//         &[
//             ctx.accounts.user.to_account_info(),
//             vault.clone(),
//             ctx.accounts.system_program.to_account_info(),
//         ],
//     )?;

//     // Update member's collateral staked amount
//     member.collateral_staked += amount;
    
//     msg!("Transferred {} SOL to collateral vault", amount);
    
//     Ok(())
// }
// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct SlashSolCollateral<'info> {
//     #[account(mut, seeds = [POOL_SEED, uuid.as_ref()], bump = group_account.bump,
//               constraint = group_account.config.is_native_sol @ HuiFiError::InvalidPoolType)]
//     pub group_account: Account<'info, GroupAccount>,

//     #[account(mut, seeds = [MEMBER_SEED, group_account.key().as_ref(), member_account.owner.as_ref()], 
//               bump = member_account.bump)]
//     pub member_account: Account<'info, MemberAccount>,

//     #[account(mut, seeds = [COLLATERAL_VAULT_SOL_SEED, group_account.key().as_ref(), member_account.owner.as_ref()], 
//               bump)]
//     /// CHECK: SOL vault for member's collateral
//     pub collateral_vault_sol: AccountInfo<'info>,

//     // Native SOL treasury
//     #[account(mut, seeds = [TREASURY_SEED, b"sol"], bump)]
//     /// CHECK: SOL treasury PDA
//     pub treasury_sol: AccountInfo<'info>,

//     // SOL pool vault
//     #[account(mut, seeds = [VAULT_SOL_SEED, group_account.key().as_ref()], bump)]
//     /// CHECK: Pool vault for SOL
//     pub pool_vault_sol: AccountInfo<'info>,

//     pub system_program: Program<'info, System>,
// }
// pub fn slash_sol_collateral(
//     ctx: Context<SlashSolCollateral>,
//     uuid: [u8; 6],
//     payout_amount: u64,
// ) -> Result<()> {
//     let member = &mut ctx.accounts.member_account;

//     require!(member.status == MemberStatus::Defaulted, HuiFiError::MemberNotDefaulted);
//     require!(member.has_received_payout, HuiFiError::MemberNotPaidYet);

//     let penalty_bps = 500u64; // 5%
//     let (total_slash, repayment_amount, penalty_amount) = calculate_slash_amounts(payout_amount, penalty_bps);

//     require!(total_slash <= member.collateral_staked, HuiFiError::InvalidSlashAmount);

//     let vault = &ctx.accounts.collateral_vault_sol;
//     let sol_treasury = &ctx.accounts.treasury_sol;
//     let pool_vault = &ctx.accounts.pool_vault_sol;

//     // Subtract from collateral vault
//     **vault.lamports.borrow_mut() -= total_slash;
//     // Add penalty to treasury
//     **sol_treasury.lamports.borrow_mut() += penalty_amount;
//     // Add repayment to pool vault
//     **pool_vault.lamports.borrow_mut() += repayment_amount;

//     // Update member's collateral amount
//     member.collateral_staked -= total_slash;

//     msg!("Slashed {} lamports: {} to pool, {} to SOL treasury", 
//         total_slash, repayment_amount, penalty_amount);

//     Ok(())
// }


// // SPL TOKEN COLLATERAL
// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct DepositSplCollateral<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,

//     #[account(
//         mut,
//         seeds = [POOL_SEED, uuid.as_ref()],
//         bump = group_account.bump,
//         constraint = !group_account.config.is_native_sol @ HuiFiError::InvalidPoolType,
//     )]
//     pub group_account: Account<'info, GroupAccount>,

//     #[account(
//         mut,
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump = member_account.bump
//     )]
//     pub member_account: Account<'info, MemberAccount>,

//     #[account(mut)]
//     pub user_token_account: Account<'info, TokenAccount>,

//     #[account(
//         init,
//         payer = user,
//         token::mint = token_mint,
//         token::authority = group_account,
//         seeds = [COLLATERAL_VAULT_SPL_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump
//     )]
//     pub collateral_vault_spl: Account<'info, TokenAccount>,
//     #[account(constraint = token_mint.key() == group_account.token_mint @ HuiFiError::InvalidTokenMint)]
//     pub token_mint: Account<'info, Mint>,
//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
// }
// pub fn deposit_spl_collateral(ctx: Context<DepositSplCollateral>, uuid: [u8; 6], amount: u64) -> Result<()> {
//     let group = &ctx.accounts.group_account;
//     let member = &mut ctx.accounts.member_account;

//     // Calculate based on LTV = 80% of expected payout
//     let min_required = calculate_required_collateral(
//         group.config.contribution_amount,
//         group.config.max_participants,
//         member.contributions_made,
//         group.config.collateral_requirement_bps as u64
//     );

//     require!(amount >= min_required, HuiFiError::InsufficientCollateral);

//     // Transfer SPL tokens to the vault
//     let cpi_ctx = CpiContext::new(
//         ctx.accounts.token_program.to_account_info(),
//         Transfer {
//             from: ctx.accounts.user_token_account.to_account_info(),
//             to: ctx.accounts.collateral_vault_spl.to_account_info(),
//             authority: ctx.accounts.user.to_account_info(),
//         },
//     );
//     token::transfer(cpi_ctx, amount)?;

//     // Update member's collateral staked amount
//     member.collateral_staked += amount;
    
//     msg!("Transferred {} SPL tokens to collateral vault", amount);
    
//     Ok(())
// }

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct SlashSplCollateral<'info> {
//     #[account(mut, seeds = [POOL_SEED, uuid.as_ref()], bump = group_account.bump,
//               constraint = !group_account.config.is_native_sol @ HuiFiError::InvalidPoolType)]
//     pub group_account: Account<'info, GroupAccount>,

//     #[account(mut, seeds = [MEMBER_SEED, group_account.key().as_ref(), member_account.owner.as_ref()], 
//               bump = member_account.bump)]
//     pub member_account: Account<'info, MemberAccount>,

//     #[account(mut, seeds = [COLLATERAL_VAULT_SPL_SEED, group_account.key().as_ref(), member_account.owner.as_ref()], 
//               bump)]
//     pub collateral_vault_spl: Account<'info, TokenAccount>,

//     // SPL Treasuries - only one will be used based on token type
//     #[account(mut)]
//     pub treasury_usdc: Option<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub treasury_usdt: Option<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub treasury_jitosol: Option<Account<'info, TokenAccount>>,

//     // SPL pool vault
//     #[account(mut, seeds = [VAULT_SPL_SEED, group_account.key().as_ref()], bump)]
//     pub pool_vault_spl: Account<'info, TokenAccount>,

//     pub token_program: Program<'info, Token>,
//     pub system_program: Program<'info, System>,
// }

// pub fn slash_spl_collateral(
//     ctx: Context<SlashSplCollateral>,
//     uuid: [u8; 6],
//     payout_amount: u64,
// ) -> Result<()> {
//     let group = &ctx.accounts.group_account;
//     let member = &mut ctx.accounts.member_account;

//     require!(member.status == MemberStatus::Defaulted, HuiFiError::MemberNotDefaulted);
//     require!(member.has_received_payout, HuiFiError::MemberNotPaidYet);

//     let penalty_bps = 500u64; // 5%
//     let (total_slash, repayment_amount, penalty_amount) = calculate_slash_amounts(payout_amount, penalty_bps);

//     require!(total_slash <= member.collateral_staked, HuiFiError::InvalidSlashAmount);

//     let vault = &ctx.accounts.collateral_vault_spl;
//     let pool_vault = &ctx.accounts.pool_vault_spl;
//     let token_program = ctx.accounts.token_program.to_account_info();

//     let group_key = group.key();
//     let seeds = &[
//         COLLATERAL_VAULT_SPL_SEED, 
//         group_key.as_ref(), 
//         member.owner.as_ref(), 
//     ];
//     let signer = &[&seeds[..]];

//     // Determine which treasury to use based on token mint
//     let treasury_target = match group.token_mint {
//         m if ctx.accounts.treasury_usdc.as_ref().map(|a| a.mint) == Some(m) => 
//             ctx.accounts.treasury_usdc.as_ref().unwrap().to_account_info(),
//         m if ctx.accounts.treasury_usdt.as_ref().map(|a| a.mint) == Some(m) => 
//             ctx.accounts.treasury_usdt.as_ref().unwrap().to_account_info(),
//         m if ctx.accounts.treasury_jitosol.as_ref().map(|a| a.mint) == Some(m) => 
//             ctx.accounts.treasury_jitosol.as_ref().unwrap().to_account_info(),
//         _ => return Err(HuiFiError::UnsupportedToken.into()),
//     };

//     // Transfer repayment to pool vault
//     let repay_ctx = CpiContext::new_with_signer(
//         token_program.clone(),
//         Transfer {
//             from: vault.to_account_info(),
//             to: pool_vault.to_account_info(),
//             authority: group.to_account_info(),
//         },
//         signer,
//     );
//     token::transfer(repay_ctx, repayment_amount)?;

//     // Transfer penalty to treasury
//     let penalty_ctx = CpiContext::new_with_signer(
//         token_program,
//         Transfer {
//             from: vault.to_account_info(),
//             to: treasury_target,
//             authority: group.to_account_info(),
//         },
//         signer,
//     );
//     token::transfer(penalty_ctx, penalty_amount)?;

//     // Update member's collateral amount
//     member.collateral_staked -= total_slash;

//     msg!("Slashed {} SPL tokens: {} to pool, {} to treasury", 
//         total_slash, repayment_amount, penalty_amount);

//     Ok(())
// }


// //====== HELPER FUNCTIONS ======//
// // Add these at the module level
// fn calculate_required_collateral(
//     contribution_amount: u64,
//     max_participants: u8,
//     contribution_count: u8,
//     ltv_basis_points: u64
// ) -> u64 {
//     let expected_payout = contribution_amount * max_participants as u64;
//     let user_contribution = contribution_amount * contribution_count as u64;
//     (expected_payout - user_contribution) * 10_000 / ltv_basis_points
// }

// fn calculate_slash_amounts(
//     payout_amount: u64,
//     penalty_bps: u64
// ) -> (u64, u64, u64) {
//     let penalty_amount = payout_amount * penalty_bps / 10_000;
//     let total_slash = payout_amount + penalty_amount;
//     let repayment_amount = payout_amount;
    
//     (total_slash, repayment_amount, penalty_amount)
// }


//====== OLD CODE ======//

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct DepositCollateral<'info> {
//     #[account(mut)]
//     pub user: Signer<'info>,

//     #[account(
//         mut,
//         seeds = [POOL_SEED, uuid.as_ref()],
//         bump = group_account.bump,
//     )]
//     pub group_account: Account<'info, GroupAccount>,

//     #[account(
//         mut,
//         seeds = [MEMBER_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump = member_account.bump
//     )]
//     pub member_account: Account<'info, MemberAccount>,

//     #[account(mut)]
//     pub user_token_account: Account<'info, TokenAccount>,

//     //COLLATERAL VAULT FOR SPL TOKEN
//     #[account(
//         init,
//         // mut,
//         payer = user,
//         token::mint = group_account.token_mint,
//         token::authority = group_account,
//         seeds = [COLLATERAL_VAULT_SPL_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump
//     )]
//     pub collateral_vault_spl: Account<'info, TokenAccount>,

//     //COLLATERAL VAULT FOR SOL NATIVE
//     #[account(
//         mut,
//         seeds = [COLLATERAL_VAULT_SOL_SEED, group_account.key().as_ref(), user.key().as_ref()],
//         bump
//     )]
//     pub collateral_vault_sol: Option<AccountInfo<'info>>,

//     pub token_program: Option<Program<'info, Token>>,
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
// }
// pub fn deposit_collateral(ctx: Context<DepositCollateral>, uuid: [u8; 6], amount: u64) -> Result<()> {
//     let group = &ctx.accounts.group_account;
//     let member = &ctx.accounts.member_account;

//     // Calculate based on LTV = 80% of expected payout
//     // Eg. If expected payout is 1000, user had contributed 100, and collateral requirement is 80% LTV, 
//     // then min required collateral is 1000 - 100  / 80% = 1125
//     let expected_payout = group.config.contribution_amount as u64 * group.config.max_participants as u64;
//     let ltv_basis_points = group.config.collateral_requirement_bps as u64;  // e.g., 8000 = 80%
//     let user_contribution_amount = member.contributions_made as u64 * group.config.contribution_amount as u64;
//     let min_required = (expected_payout - user_contribution_amount) * 10_000 / ltv_basis_points;

//     require!(amount >= min_required, HuiFiError::InsufficientCollateral);

//     if group.token_mint == anchor_spl::token::spl_token::native_mint::id()  {
//         // Native SOL
//         let vault = ctx.accounts.collateral_vault_sol.as_ref().unwrap();
//         let ix = system_instruction::transfer(
//             &ctx.accounts.user.key(),
//             &vault.key(),
//             amount,
//         );
//         invoke(
//             &ix,
//             &[
//                 ctx.accounts.user.to_account_info(),
//                 vault.clone(),
//                 ctx.accounts.system_program.to_account_info(),
//             ],
//         )?;
//         msg!("Transferred {} SOL", amount);
//     } else {
//         // SPL Token
//         let user_token_account = ctx.accounts.user_token_account.as_ref().unwrap();
//         let vault = ctx.accounts.collateral_vault_spl.as_ref().unwrap();

//         let cpi_ctx = CpiContext::new(
//             ctx.accounts.token_program.as_ref().unwrap().to_account_info(),
//             Transfer {
//                 from: user_token_account.to_account_info(),
//                 to: vault.to_account_info(),
//                 authority: ctx.accounts.user.to_account_info(),
//             },
//         );
//         token::transfer(cpi_ctx, amount)?;
//         msg!("Transferred {} SPL Token", amount);
//     }
//     Ok(())
// }

// #[derive(Accounts)]
// #[instruction(uuid: [u8; 6])]
// pub struct SlashCollateral<'info> {
//     #[account(mut, seeds = [POOL_SEED, uuid.as_ref()], bump = group_account.bump)]
//     pub group_account: Account<'info, GroupAccount>,

//     #[account(mut, seeds = [MEMBER_SEED, group_account.key().as_ref(), member_account.owner.as_ref()], bump = member_account.bump)]
//     pub member_account: Account<'info, MemberAccount>,

//     #[account(mut, seeds = [COLLATERAL_VAULT_SPL_SEED, group_account.key().as_ref(), member_account.owner.as_ref()], bump)]
//     pub collateral_vault_spl: Option<Account<'info, TokenAccount>>,

//     #[account(mut, seeds = [COLLATERAL_VAULT_SOL_SEED, group_account.key().as_ref(), member_account.owner.as_ref()], bump)]
//     /// CHECK: Native SOL vault
//     pub collateral_vault_sol: Option<AccountInfo<'info>>,

//     // SPL Treasuries
//     #[account(mut)]
//     pub treasury_usdc: Option<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub treasury_usdt: Option<Account<'info, TokenAccount>>,
//     #[account(mut)]
//     pub treasury_jitosol: Option<Account<'info, TokenAccount>>,

//     // Native SOL treasury
//     #[account(mut, seeds = [TREASURY_SEED,b"sol"], bump)]
//     /// CHECK: SOL treasury PDA
//     pub treasury_sol: Option<AccountInfo<'info>>,

//     #[account(mut)]
//     pub group_vault: Option<Account<'info, TokenAccount>>, // only needed for SPL

//     pub token_program: Option<Program<'info, Token>>,
//     pub system_program: Program<'info, System>,
// }

// pub fn slash_collateral(
//     ctx: Context<SlashCollateral>,
//     uuid: [u8; 6],
//     payout_amount: u64,
// ) -> Result<()> {
//     let group = &ctx.accounts.group_account;
//     let member = &mut ctx.accounts.member_account;

//     require!(member.status == MemberStatus::Defaulted, HuiFiError::MemberNotDefaulted);
//     require!(member.has_received_early_payout, HuiFiError::MemberNotPaidYet);

//     let penalty_bps = 500u64; // 5%
//     let total_slash = payout_amount * (10_000 + penalty_bps) / 10_000;
//     let penalty_amount = payout_amount * penalty_bps / 10_000;
//     let repayment_amount = total_slash - penalty_amount;

//     require!(total_slash <= member.collateral_staked, HuiFiError::InvalidSlashAmount);

//     if group.token_mint == solana_program::native_token::id() {
//         // Native SOL
//         let vault = ctx.accounts.collateral_vault_sol.as_ref().unwrap();
//         let sol_treasury = ctx.accounts.treasury_sol.as_ref().unwrap();
//         let group_vault = ctx.accounts.group_vault.as_ref().unwrap().to_account_info();

//         **vault.lamports.borrow_mut() -= total_slash;
//         **sol_treasury.lamports.borrow_mut() += penalty_amount;
//         **group_vault.lamports.borrow_mut() += repayment_amount;

//         msg!("Slashed {} lamports: {} to pool, {} to SOL treasury", total_slash, repayment_amount, penalty_amount);
//     } else {
//         let vault = ctx.accounts.collateral_vault_spl.as_ref().unwrap();
//         let pool_vault = ctx.accounts.group_vault.as_ref().unwrap();
//         let token_program = ctx.accounts.token_program.as_ref().unwrap().to_account_info();

//         let seeds = &[b"collateral_vault", group.key().as_ref(), member.owner.as_ref(), &[group.bump]];
//         let signer = &[&seeds[..]];

//         let treasury_target = match group.token_mint {
//             m if ctx.accounts.treasury_usdc.as_ref().map(|a| a.mint) == Some(m) => ctx.accounts.treasury_usdc.as_ref().unwrap().to_account_info(),
//             m if ctx.accounts.treasury_usdt.as_ref().map(|a| a.mint) == Some(m) => ctx.accounts.treasury_usdt.as_ref().unwrap().to_account_info(),
//             m if ctx.accounts.treasury_jitosol.as_ref().map(|a| a.mint) == Some(m) => ctx.accounts.treasury_jitosol.as_ref().unwrap().to_account_info(),
//             _ => return Err(HuiFiError::UnsupportedToken.into()),
//         };

//         let repay_ctx = CpiContext::new_with_signer(
//             token_program.clone(),
//             Transfer {
//                 from: vault.to_account_info(),
//                 to: pool_vault.to_account_info(),
//                 authority: group.to_account_info(),
//             },
//             signer,
//         );
//         token::transfer(repay_ctx, repayment_amount)?;

//         let penalty_ctx = CpiContext::new_with_signer(
//             token_program,
//             Transfer {
//                 from: vault.to_account_info(),
//                 to: treasury_target,
//                 authority: group.to_account_info(),
//             },
//             signer,
//         );
//         token::transfer(penalty_ctx, penalty_amount)?;

//         msg!("Slashed {} SPL tokens: {} to pool, {} to treasury", total_slash, repayment_amount, penalty_amount);
//     }

//     member.collateral_staked -= total_slash;
//     Ok(())
// }