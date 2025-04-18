#[allow(unused_imports)]
use anchor_lang::prelude::*;
use instructions::*;
use state::*;
use errors::*;
use constants::*;

declare_id!("6xBRZCRWt68bW4j4Jf51USyDzutWMwVQY45CYjNA7bt6");

// Module declarations
pub mod instructions;
pub mod state;
pub mod errors;
pub mod constants;

// // Import everything from instructions
// use crate::instructions::*;
// use crate::state::*;
// use crate::errors::*;

#[program]
pub mod contracts_hui {
    use super::*;

    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        instructions::protocol::initialize_protocol(ctx, protocol_fee_bps)
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_config: PoolConfig,
    ) -> Result<()> {
        instructions::pool::create_pool(ctx, pool_config)
    }

    pub fn join_pool(
        ctx: Context<JoinPool>,
    ) -> Result<()> {
        instructions::pool::join_pool(ctx)
    }

    pub fn contribute(
        ctx: Context<Contribute>,
        amount: u64,
    ) -> Result<()> {
        instructions::pool::contribute(ctx, amount)
    }

    pub fn request_early_payout(
        ctx: Context<RequestEarlyPayout>,
    ) -> Result<()> {
        instructions::payout::request_early_payout(ctx)
    }

    pub fn process_payout(
        ctx: Context<ProcessPayout>,
    ) -> Result<()> {
        instructions::payout::process_payout(ctx)
    }

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
