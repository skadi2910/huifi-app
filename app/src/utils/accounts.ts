import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/lib/types/huifi-program';

export const getSolBidAccounts = async (
  poolAddress: PublicKey, 
  bidder: PublicKey, 
  program: any
) => {
  // ... implementation
};

export const getSplBidAccounts = async (
  poolAddress: PublicKey, 
  bidder: PublicKey, 
  program: any
) => {
  // ... implementation
};

export const getSolJackpotAccounts = async (
  poolAddress: PublicKey, 
  winner: PublicKey, 
  round: number,
  program: any
) => {
  // ... implementation
};

export const getSplJackpotAccounts = async (
  poolAddress: PublicKey, 
  winner: PublicKey, 
  round: number,
  program: any
) => {
  // ... implementation
}; 