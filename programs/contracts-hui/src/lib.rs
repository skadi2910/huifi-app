use anchor_lang::prelude::*;

declare_id!("9kAiAJYzPBhrxw9VaFW1j583HgjcZYquJCJhNM5p9i2P");

#[program]
pub mod contracts_hui {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
