import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum PoolStatus {
  Initializing = 0,
  Active = 1,
  Completed = 2,
}

export enum YieldPlatform {
  None = 0,
  JitoSol = 1,
  Kamino = 2,
}

export interface HuifiPool {
  uuid: number[];
  config: PoolConfig;
  memberAddresses: PublicKey[];
  totalContributions: BN;
  currentWinner: PublicKey | null;    // Add this line
  currentBidAmount: BN | null;   
  creator: PublicKey;
  tokenMint: PublicKey;
  maxParticipants: number;
  currentParticipants: number;
  contributionAmount: BN;
  cycleDurationSeconds: BN;
  payoutDelaySeconds: BN;
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  status: PoolStatus;
  totalValue: BN;
  currentCycle: number;
  totalCycles: number;
  nextPayoutTimestamp: BN;
  startTime: BN;
  yieldBasisPoints: number;
  yieldStrategy: YieldPlatform;
  participants: PublicKey[];
  bump: number;
  name: string;
  description: string;
  frequency: string;
}

export interface UserAccount {
  owner: PublicKey;
  poolsJoined: number;
  activePools: number;
  totalContribution: BN;
  totalWinnings: BN;
  experiencePoints: number;
  bump: number;
}

export interface ProtocolSettings {
  admin: PublicKey;
  treasury: PublicKey;
  tokenMint: PublicKey;
  protocolFeeBps: number;
  bump: number;
}

export interface Bid {
  bidder: PublicKey;
  pool: PublicKey;
  round: number;
  amount: BN;
  timestamp: BN;
  bump: number;
}

export interface RoundResult {
  pool: PublicKey;
  round: number;
  winner: PublicKey;
  paid: boolean;
  payoutAmount: BN;
  payoutTimestamp: BN;
  bump: number;
}

export interface Vault {
  pool: PublicKey;
  bump: number;
}

export interface PoolConfig {
  maxParticipants: number;
  contributionAmount: BN;
  cycleDurationSeconds: BN;
  payoutDelaySeconds: BN;
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  yieldStrategy: { none: {} } | { jitoSol: {} } | { kamino: {} };
  isNativeSol: boolean;
  status: PoolStatus;
  isPrivate: boolean;
  // feedId: number[];
}

// First, we need the BidEntry interface 
// (assuming it contains bidder and amount based on common bid structures)
export interface BidEntry {
  bidder: PublicKey;
  amount: number | bigint;  // using number or bigint depending on your needs
}

// The main BidState interface
export interface BidState {
  pool: PublicKey;          // The group/pool this bid belongs to
  cycle: number;            // Which cycle this bid is for (u8 in Rust becomes number in TS)
  bids: BidEntry[];        // Vec<BidEntry> becomes array in TS
  winner: PublicKey | null; // Option<Pubkey> becomes nullable PublicKey
  bump: number;            // u8 becomes number
}

// First, create the enum for MemberStatus
export enum MemberStatus {
  Active = 'Active',
  Late = 'Late',
  Defaulted = 'Defaulted',
  Withdrawed = 'Withdrawed'
}

// Then create the interface for MemberAccount
export interface MemberAccount {
  owner: PublicKey;                    // Member wallet address
  pool: PublicKey;                     // Associated pool
  contributionsMade: number;           // u8 becomes number
  hasBid: boolean;                     // bool becomes boolean
  hasContributed: boolean;             // bool becomes boolean
  status: MemberStatus;                // Using the enum we defined above
  hasReceivedPayout: boolean;          // bool becomes boolean
  eligibleForPayout: boolean;          // bool becomes boolean
  collateralStaked: number | bigint;   // u64 becomes number or bigint
  reputationPoints: number | bigint;   // u64 becomes number or bigint
  lastContributionTimestamp: number;   // i64 becomes number
  totalContributions: number | bigint; // u64 becomes number or bigint
  hasDepositedCollateral: boolean;     // bool becomes boolean
  bump: number;                        // u8 becomes number
}

// First, create the enums
export enum CyclePhase {
  Bidding = 'Bidding',
  Contributing = 'Contributing',
  ReadyForPayout = 'ReadyForPayout'
}

// export enum PoolStatus {
//   Initializing = 'Initializing',
//   Active = { phase: CyclePhase },
//   Completed = 'Completed',
//   Defaulted = 'Defaulted'
// }

// export enum YieldPlatform {
//   None = 'None',
//   JitoSol = 'JitoSol',
//   Kamino = 'Kamino'
// }

// Create the PoolConfig interface
export interface PoolConfig {
  maxParticipants: number;           // u8
  contributionAmount: BN; // u64
  cycleDurationSeconds: BN; // u64
  payoutDelaySeconds: BN;  // u64
  earlyWithdrawalFeeBps: number;     // u16
  collateralRequirementBps: number;  // u16
  // yieldStrategy: YieldPlatform;
  yieldStrategy: { none: {} } | { jitoSol: {} } | { kamino: {} };
  isPrivate: boolean;
  isNativeSol: boolean;
  // feedId: number[];                  // [u8; 32]
}

// Create the main GroupAccount interface
export interface GroupAccount {
  uuid: number[];                     // [u8; 6]
  whitelist: PublicKey[];            // Vec<Pubkey>
  creator: PublicKey;                // Pubkey
  tokenMint: PublicKey;              // Pubkey
  vault: PublicKey;                  // Pubkey
  config: PoolConfig;                // PoolConfig
  memberAddresses: PublicKey[];      // Vec<Pubkey>
  payoutOrder: PublicKey[];          // Vec<Pubkey>
  currentCycle: number;              // u8
  totalCycles: number;               // u8
  status: PoolStatus;                // PoolStatus
  totalContributions: number | bigint; // u64
  unclaimedPayout: number | bigint;   // u64
  lastCycleTimestamp: number;        // i64
  nextPayoutTimestamp: number;       // i64
  priceFeedId: number[];            // [u8; 32]
  currentWinner: PublicKey | null;   // Option<Pubkey>
  currentBidAmount: number | bigint | null; // Option<u64>
  finalContributionAmount: number | bigint | null; // Option<u64>
  bump: number;                      // u8
}