use anchor_lang::prelude::*;
use crate::constants::*;
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
impl BidState {
    // Existing methods...

    // Helper to check if bidding should be finalized
    pub fn should_finalize_bidding(&self, total_members: u8) -> bool {
        self.bids.len() as u8 >= total_members || 
        self.bids.iter().any(|bid| bid.amount >= MAX_BID_AMOUNT)
    }

    // Helper to get winning bid amount
    pub fn get_winning_bid_amount(&self) -> Option<u64> {
        self.bids.iter()
            .max_by_key(|bid| bid.amount)
            .map(|bid| bid.amount)
    }
}