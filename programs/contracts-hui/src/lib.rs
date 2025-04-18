// use anchor_lang::prelude::*;

// declare_id!("9kAiAJYzPBhrxw9VaFW1j583HgjcZYquJCJhNM5p9i2P");

// #[program]
// pub mod contracts_hui {
//     use super::*;

//     pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
//         msg!("Greetings from: {:?}", ctx.program_id);
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct Initialize {}


use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};

// declare_id!("6xBRZCRWt68bW4j4Jf51USyDzutWMwVQY45CYjNA7bt6");
declare_id!("9kAiAJYzPBhrxw9VaFW1j583HgjcZYquJCJhNM5p9i2P");
pub mod instructions;
pub mod state;
pub mod errors;
pub mod constants;

use instructions::*;
use state::*;
use errors::*;

#[program]
pub mod contracts_hui {
    use super::*;

    // Initialize the protocol settings
    pub fn initialize_protocol(
        ctx: Context<InitializeProtocol>,
        protocol_fee_bps: u16,
    ) -> Result<()> {
        instructions::protocol::initialize_protocol(ctx, protocol_fee_bps)
    }

    // Create a new HuiFi pool
    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_config: PoolConfig,
    ) -> Result<()> {
        instructions::pool::create_pool(ctx, pool_config)
    }

    // Join an existing pool
    pub fn join_pool(
        ctx: Context<JoinPool>,
    ) -> Result<()> {
        instructions::pool::join_pool(ctx)
    }

    // Make a contribution to the pool
    pub fn contribute(
        ctx: Context<Contribute>,
        amount: u64,
    ) -> Result<()> {
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

    // Keep the original initialize function for compatibility
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

// Keep the original Initialize struct for compatibility
#[derive(Accounts)]
pub struct Initialize {}