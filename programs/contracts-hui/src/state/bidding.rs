use anchor_lang::prelude::*;

#[account]
pub struct BidState {
    pub pool: Pubkey,               // The group/pool this bid belongs to
    pub cycle: u8,                  // Which cycle this bid is for
    pub bids: Vec<BidEntry>,        // All bids submitted
    pub winner: Option<Pubkey>,     // Winner of the bidding round
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct BidEntry {
    pub bidder: Pubkey,
    pub amount: u64,
}
