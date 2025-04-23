use anchor_lang::prelude::*;

#[error_code]
pub enum HuiFiError {
    #[msg("Invalid pool configuration")]
    InvalidPoolConfig,
    
    #[msg("Pool is full")]
    PoolFull,
    
    #[msg("Pool is not in the correct status")]
    InvalidPoolStatus,
    
    #[msg("Member already joined")]
    MemberAlreadyJoined,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Insufficient contribution amount")]
    InsufficientContribution,
    
    #[msg("Invalid cycle - not ready for contribution")]
    InvalidCycleForContribution,
    
    #[msg("Member has already contributed for this cycle")]
    AlreadyContributed,
    
    #[msg("Insufficient collateral for early payout")]
    InsufficientCollateral,
    
    #[msg("Member already received payout")]
    AlreadyReceivedPayout,
    
    #[msg("Not eligible for payout yet")]
    NotEligibleForPayout,
    
    #[msg("Pool vault has insufficient funds")]
    InsufficientVaultFunds,
    
    #[msg("Not all members have contributed for the current cycle")]
    PendingContributions,
    
    #[msg("Invalid payout amount calculation")]
    InvalidPayoutAmount,
    
    #[msg("Member not found in the pool")]
    MemberNotFound,
    
    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,
    
    #[msg("Cycle duration hasn't elapsed yet")]
    CycleDurationNotElapsed,
    
    #[msg("Payout delay hasn't elapsed yet")]
    PayoutDelayNotElapsed,

    #[msg("Treasury account already exists")]
    TreasuryAccountAlreadyExists,

    #[msg("Invalid treasury account")]
    InvalidTreasuryAccount,

    #[msg("Not whitelisted")]
    NotWhitelisted,

    #[msg("Invalid slash amount")]
    InvalidSlashAmount,

    #[msg("Member not defaulted")]
    MemberNotDefaulted,

    #[msg("Member not paid yet")]
    MemberNotPaidYet,

    #[msg("Unsupported token")]
    UnsupportedToken,

    #[msg("Invalid vault")]
    InvalidVault,

    #[msg("Invalid pool type")]
    InvalidPoolType,

    #[msg("Invalid token mint")]
    InvalidTokenMint,
}