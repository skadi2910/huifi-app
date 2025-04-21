#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod huifidapp {
    use super::*;

  pub fn close(_ctx: Context<CloseHuifidapp>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.huifidapp.count = ctx.accounts.huifidapp.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.huifidapp.count = ctx.accounts.huifidapp.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeHuifidapp>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.huifidapp.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeHuifidapp<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Huifidapp::INIT_SPACE,
  payer = payer
  )]
  pub huifidapp: Account<'info, Huifidapp>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseHuifidapp<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub huifidapp: Account<'info, Huifidapp>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub huifidapp: Account<'info, Huifidapp>,
}

#[account]
#[derive(InitSpace)]
pub struct Huifidapp {
  count: u8,
}
