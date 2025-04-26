pub const PROTOCOL_SEED: &[u8] = b"huifi-protocol";
pub const POOL_SEED: &[u8] = b"huifi-pool";
pub const MEMBER_SEED: &[u8] = b"huifi-member";
pub const VAULT_SEED: &[u8] = b"huifi-vault";
pub const COLLATERAL_VAULT_SPL_SEED: &[u8] = b"huifi-collateral-vault-spl";
pub const COLLATERAL_VAULT_SOL_SEED: &[u8] = b"huifi-collateral-vault-sol";
pub const VAULT_SPL_SEED: &[u8] = b"huifi-vault-spl";
pub const VAULT_SOL_SEED: &[u8] = b"huifi-vault-sol";
pub const TREASURY_SEED: &[u8] = b"huifi-treasury";
pub const MIN_PARTICIPANTS: u8 = 3;
pub const MAX_PARTICIPANTS: u8 = 10;

pub const MIN_CONTRIBUTION_AMOUNT: u64 = 10;
pub const MAX_CONTRIBUTION_AMOUNT: u64 = 10000;

pub const MIN_CYCLE_DURATION: u64 = 3 * 24 * 60 * 60; // 3 days in seconds
pub const MAX_CYCLE_DURATION: u64 = 28 * 24 * 60 * 60; // 28 days in seconds

pub const MIN_PAYOUT_DELAY: u64 = 1 * 24 * 60 * 60; // 1 day in seconds
pub const MAX_PAYOUT_DELAY: u64 = 7 * 24 * 60 * 60; // 7 days in seconds

pub const DEFAULT_EARLY_WITHDRAWAL_FEE_BPS: u16 = 200; // 2%
pub const MAX_EARLY_WITHDRAWAL_FEE_BPS: u16 = 1000; // 10%

pub const DEFAULT_COLLATERAL_REQUIREMENT_BPS: u16 = 20000; // 200%
pub const MIN_COLLATERAL_REQUIREMENT_BPS: u16 = 10000; // 100%

pub const BASIS_POINTS_DIVISOR: u64 = 10000; // 100% in basis points

pub const MAXIMUM_AGE: u64 = 60 * 60; // 1 hour in seconds

pub const BID_STATE_SEED: &[u8] = b"huifi-bid-state";
pub const MAX_BID_AMOUNT: u64 = 1000000000000000000; // 1 SOL in lamports