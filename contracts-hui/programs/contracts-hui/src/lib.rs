// // File: programs/contracts-hui/src/lib.rs
// use anchor_lang::prelude::*;

// declare_id!("6xBRZCRWt68bW4j4Jf51USyDzutWMwVQY45CYjNA7bt6");

// #[program]
// pub mod contracts_hui {
//     use super::*;

//     // Keep just the original initialize function
//     pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
//         msg!("Greetings from HuiFi Protocol: {:?}", ctx.program_id);
//         Ok(())
//     }

//     // Add a simple protocol initialization function directly here
//     pub fn init_protocol(ctx: Context<InitProtocol>, fee_bps: u16) -> Result<()> {
//         // Simple implementation directly in lib.rs
//         let protocol = &mut ctx.accounts.protocol_settings;
//         protocol.authority = ctx.accounts.admin.key();
//         protocol.fee_bps = fee_bps;
//         protocol.total_fees_collected = 0;
        
//         msg!("Protocol initialized with fee: {}", fee_bps);
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct Initialize {}

// // Define the account structure directly in the lib.rs file
// #[derive(Accounts)]
// pub struct InitProtocol<'info> {
//     #[account(mut)]
//     pub admin: Signer<'info>,
    
//     #[account(
//         init,
//         payer = admin,
//         space = 8 + 32 + 2 + 8,
//         seeds = [b"huifi-protocol"],
//         bump
//     )]
//     pub protocol_settings: Account<'info, ProtocolSettings>,
    
//     pub system_program: Program<'info, System>,
// }

// // Define a minimal account directly in the lib.rs file
// #[account]
// pub struct ProtocolSettings {
//     pub authority: Pubkey,
//     pub fee_bps: u16,
//     pub total_fees_collected: u64,
// }

// // Include your modules after the program definition
// pub mod state;
// pub mod errors;
// pub mod constants;
// pub mod instructions;

// File: programs/contracts-hui/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("6xBRZCRWt68bW4j4Jf51USyDzutWMwVQY45CYjNA7bt6");

pub mod instructions;
pub mod state;
pub mod errors;
pub mod constants;

// use instructions::*;
use state::*;
// use errors::*;

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