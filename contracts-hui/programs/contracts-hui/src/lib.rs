use anchor_lang::prelude::*;

declare_id!("Ak59apPA2FJJrtTRRojeCjWWmPXc1shpzxXrsaKApaFX");

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
