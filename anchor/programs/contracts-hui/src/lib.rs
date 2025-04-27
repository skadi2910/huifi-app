use anchor_lang::prelude::*;
use errors::*;
use instructions::*;
use state::*;
// External modules with no re-exports at all
pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;
// use anchor_spl::token::{Token, TokenAccount};
// declare_id!("3EpcS5dv1G71CDER3d77L7jAh7dn9zKpJNo7wSSwn7kA");
declare_id!("96b1pKm21J4ouL2kUD6YeLAhxNZyj1HC82t5VCeEmTsP");

// use crate::instructions::protocol::InitializeProtocol;
// use crate::instructions::protocol::initialize_protocol as initialize_protocol_handler;
#[program]
pub mod contracts_hui {
    use super::*;

    // Simplify to only have a minimal function without imports
    // pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    //     msg!("Greetings from: {:?}", ctx.program_id);
    //     Ok(())
    // }

    //INITIALIZE PROTOCOL
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
        create_pool_fee: u64,
    ) -> Result<()> {
        // Using default penalty of 5% (500 basis points)
        instructions::protocol::initialize_protocol(ctx, protocol_fee_bps, create_pool_fee, 500)
    }

    //CREATE A NEW HUIFI POOL
    // pub fn create_pool(
    //     ctx: Context<CreatePool>, 
    //     pool_config: PoolConfig, 
    //     uuid: [u8; 6],
    //     whitelist: Option<Vec<Pubkey>>
    // ) -> Result<()> {
    //     instructions::pool::create_pool(ctx, pool_config, uuid, whitelist)
    // }
    pub fn create_sol_pool(
        ctx: Context<CreateSolPool>,
        pool_config: PoolConfig,
        uuid: [u8; 6],
        whitelist: Option<Vec<Pubkey>>
    ) -> Result<()> {
        instructions::pool::create_sol_pool(ctx, pool_config, uuid, whitelist)
    }
    pub fn create_spl_pool(
        ctx: Context<CreateSplPool>,
        pool_config: PoolConfig,
        uuid: [u8; 6],
        whitelist: Option<Vec<Pubkey>>
    ) -> Result<()> {
        instructions::pool::create_spl_pool(ctx, pool_config, uuid, whitelist)
    }
    pub fn join_sol_pool(
        ctx: Context<JoinSolPool>,
        uuid: [u8; 6]
    ) -> Result<()> {
        instructions::pool::join_sol_pool(ctx, uuid)
    }
    pub fn join_spl_pool(
        ctx: Context<JoinSplPool>,
        uuid: [u8; 6]
    ) -> Result<()> {
        instructions::pool::join_spl_pool(ctx, uuid)
    }
    pub fn contribute_sol(
        ctx: Context<ContributeSol>,
        uuid: [u8; 6],
        amount: u64
    ) -> Result<()> {
        instructions::contribution::contribute_sol(ctx, uuid, amount)
    }
    // pub fn contribute_spl(
    //     ctx: Context<ContributeSpl>,
    //     uuid: [u8; 6],
    //     amount: u64
    // ) -> Result<()> {
    //     instructions::contribution::contribute_spl(ctx, uuid, amount)
    // }
    pub fn deposit_sol_collateral(
        ctx: Context<DepositSolCollateral>,
        uuid: [u8; 6],
        amount: u64
    ) -> Result<()> {
        instructions::collateral::deposit_sol_collateral(ctx, uuid, amount)
    }
    // pub fn deposit_spl_collateral(
    //     ctx: Context<DepositSplCollateral>,
    //     uuid: [u8; 6],
    //     amount: u64
    // ) -> Result<()> {
    //     instructions::collateral::deposit_spl_collateral(ctx, uuid, amount)
    // }
    pub fn slash_collateral(
        ctx: Context<SlashCollateral>,
        uuid: [u8; 6],
        payout_amount: u64
    ) -> Result<()> {
        instructions::collateral::slash_collateral(ctx, uuid, payout_amount)
    }
    pub fn process_payout(
        ctx: Context<ProcessPayout>,
        uuid: [u8; 6],  
        required_collateral: Option<u64>
    ) -> Result<()> {
        instructions::payout::process_payout(ctx, uuid, required_collateral)
    }
    pub fn submit_bid(
        ctx: Context<SubmitBid>,
        bid_amount: u64
    ) -> Result<()> {
        instructions::bidding::submit_bid(ctx, bid_amount)
    }
    pub fn finalize_bidding(
        ctx: Context<FinalizeBidding>,
        uuid: [u8; 6]
    ) -> Result<()> {
        instructions::bidding::finalize_bidding(ctx)
    }
    pub fn advance_cycle(
        ctx: Context<AdvanceCycle>
    ) -> Result<()> {
        instructions::cycle_management::advance_cycle(ctx)
    }
    
    pub fn check_cycle_status(
        ctx: Context<CheckCycleStatus>
    ) -> Result<()> {
        instructions::cycle_management::check_cycle_status(ctx)
    }
    pub fn force_advance_cycle(
        ctx: Context<ForceAdvanceCycle>
    ) -> Result<()> {
        instructions::cycle_management::force_advance_cycle(ctx)
    }
    // Commenting out until withdraw structures are implemented
    /*
    pub fn withdraw_sol_collateral(
        ctx: Context<WithdrawSolCollateral>,
        uuid: [u8; 6]
    ) -> Result<()> {
        instructions::collateral::withdraw_sol_collateral(ctx, uuid)
    }   
    pub fn withdraw_spl_collateral(
        ctx: Context<WithdrawSplCollateral>,
        uuid: [u8; 6]
    ) -> Result<()> {
        instructions::collateral::withdraw_spl_collateral(ctx, uuid)
    }
    */
    

    
    // // Join an existing pool
    // pub fn join_pool(ctx: Context<JoinPool>, uuid: [u8; 6]) -> Result<()> {
    //     instructions::pool::join_pool(ctx, uuid)
    // }

    // // Make a contribution to the pool
    // pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
    //     instructions::pool::contribute(ctx, amount)
    // }

    // Request early payout with collateral
    // pub fn request_early_payout(
    //     ctx: Context<RequestEarlyPayout>,
    // ) -> Result<()> {
    //     instructions::payout::request_early_payout(ctx)
    // }

    // // Process payout to the selected recipient
    // pub fn process_payout(
    //     ctx: Context<ProcessPayout>,
    // ) -> Result<()> {
    //     instructions::payout::process_payout(ctx)
    // }

}

#[derive(Accounts)]

pub struct Initialize {}
