import { BN } from "@coral-xyz/anchor";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
// Define error codes enum or const
const ERROR_CODES = {
  ACCOUNT_NOT_INITIALIZED: 'AccountNotInitialized',
  NOT_POOL_MEMBER: 'NotPoolMember',
  INSUFFICIENT_FUNDS: 'InsufficientFunds',
  INVALID_BID_AMOUNT: 'InvalidBidAmount',
  ALREADY_BID: 'AlreadyBid',
  INVALID_PHASE: 'InvalidPhase',
  NOT_POOL_WINNER: 'NotPoolWinner',
} as const;

// Define error messages separately
const ERROR_MESSAGES = {
  [ERROR_CODES.ACCOUNT_NOT_INITIALIZED]: "You need to join the pool first before placing a bid",
  [ERROR_CODES.NOT_POOL_MEMBER]: "You must be a pool member to place a bid",
  [ERROR_CODES.INSUFFICIENT_FUNDS]: "Insufficient funds for bid",
  [ERROR_CODES.INVALID_BID_AMOUNT]: "Invalid bid amount",
  [ERROR_CODES.ALREADY_BID]: "You have already bid for this cycle",
  [ERROR_CODES.INVALID_PHASE]: "Invalid phase",
  [ERROR_CODES.NOT_POOL_WINNER]: "You are not the pool winner this round",
} as const;


export const lamportsToSol = (lamports: BN): string => {
    const sol = lamports.toNumber() / LAMPORTS_PER_SOL; // 1 SOL = 1e9 LAMPORTS
    return `${sol} SOL`;
};
export const solToLamports = (sol: number): BN => {
    return new BN(sol * LAMPORTS_PER_SOL);
};
export const formatDurationHours = (cycleDurationSeconds: BN): string => {
    const seconds = Number(cycleDurationSeconds.toString());
    const hours = seconds / 3600;
    return `${Math.floor(hours)} hours`;
};

export const formatDurationMinutes = (cycleDurationSeconds: BN): string => {
    const seconds = Number(cycleDurationSeconds.toString());
    const minutes = seconds / 60;
    return `${Math.floor(minutes)} minutes`;
};

export const formatDurationSeconds = (cycleDurationSeconds: BN): string => {
    const seconds = Number(cycleDurationSeconds.toString());
    return `${seconds} seconds`;
};
export const getStatusString = (status: any): string => {
    // Check if status exists
    if (!status) return 'Unknown';
    
    // Check which key exists in the status object
    try {
      if ('initializing' in status) return 'Initializing';
      if ('active' in status) return 'Active';
      if ('completed' in status) return 'Completed';
      return 'Unknown'; // fallback
    } catch (error) {
      console.error('Error parsing status:', status);
      return 'Unknown';
    }
  };
export const getPhaseString = (phase: any): string => {
    // Check if phase exists
    if (!phase) return 'Unknown';
    
    // Check which key exists in the phase object 
    try {
      if ('bidding' in phase) return 'Bidding';
      if ('contributing' in phase) return 'Contributing';
      if ('readyForPayout' in phase) return 'Ready For Payout';
      return 'Unknown'; // fallback
    } catch (error) {
      console.error('Error parsing phase:', phase);
      return 'Unknown';
    }
  };

export const bpsToPercentage = (bps: number): string => {
  return `${(bps / 100).toFixed(1)}%`; // Will show one decimal place
};
// Create a mapping function that handles both raw and Error Code: prefixed versions
const createErrorMapping = () => {
  const mapping: Record<string, string> = {};
  
  Object.entries(ERROR_MESSAGES).forEach(([code, message]) => {
    mapping[code] = message;                              // Raw code
    mapping[`Error Code: ${code}`] = message;            // Prefixed version
  });
  
  return mapping;
};
export const PROGRAM_ERRORS = createErrorMapping();
export const getProgramErrorMessage = (error: any): string => {
  const errorString = error?.toString() || '';
  
  for (const [errorCode, message] of Object.entries(PROGRAM_ERRORS)) {
    if (errorString.includes(errorCode)) {
      return message;
    }
  }
  
  return 'An unexpected error occurred';
};