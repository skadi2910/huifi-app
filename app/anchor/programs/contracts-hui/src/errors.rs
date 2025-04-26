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
    
    #[msg("Pending contributions from members")]
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

    #[msg("Invalid pool UUID")]
    InvalidPoolUUID,

    #[msg("No bids")]
    NoBids,

    #[msg("Already bid")]
    AlreadyBid,

    #[msg("Invalid bid amount")]
    InvalidBidAmount,

    #[msg("Missing collateral vault")]
    MissingCollateralVault,

    #[msg("Missing treasury")]
    MissingTreasury,

    #[msg("Missing pool vault")]
    MissingPoolVault,

    #[msg("Missing token program")]
    MissingTokenProgram,

    #[msg("Invalid winner account provided")]
    InvalidWinnerAccount,
    
    #[msg("Invalid phase transition")]
    InvalidPhaseTransition,

    #[msg("Cycle not ready for advancement")]
    CycleNotReadyForAdvancement,

    #[msg("Invalid cycle phase")]
    InvalidCyclePhase,

    #[msg("Invalid phase")]
    InvalidPhase,

    #[msg("Not a pool member")]
    NotPoolMember,
    #[msg("Bid amount exceeds maximum allowed")]
    BidTooHigh,
    #[msg("Not pool winner")]
    NotPoolWinner,
    #[msg("Collateral required")]
    CollateralRequired,
    // #[msg("Cannot transition to next phase")]
    // InvalidPhaseTransition,
    #[msg("All members must contribute before advancing")]
    ContributionsPending,
}