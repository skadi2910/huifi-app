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
declare_id!("6xBRZCRWt68bW4j4Jf51USyDzutWMwVQY45CYjNA7bt6");

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
    ) -> Result<()> {
        instructions::protocol::initialize_protocol(ctx, protocol_fee_bps)
    }

    //CREATE A NEW HUIFI POOL
    pub fn create_pool(ctx: Context<CreatePool>, pool_config: PoolConfig) -> Result<()> {
        instructions::pool::create_pool(ctx, pool_config)
    }

    // Join an existing pool
    pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
        instructions::pool::join_pool(ctx)
    }

    // Make a contribution to the pool
    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        instructions::pool::contribute(ctx, amount)
    }

    // Request early payout with collateral
    pub fn request_early_payout(
        ctx: Context<RequestEarlyPayout>,
    ) -> Result<()> {
        instructions::payout::request_early_payout(ctx)
    }

    // Process payout to the selected recipient
    pub fn process_payout(
        ctx: Context<ProcessPayout>,
    ) -> Result<()> {
        instructions::payout::process_payout(ctx)
    }

}

#[derive(Accounts)]

pub struct Initialize {}
