import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';

export enum PoolStatus {
  Filling = 0,
  Active = 1,
  Completed = 2,
}

export enum YieldPlatform {
  None = 0,
  JitoSol = 1,
  Kamino = 2,
}

export interface HuifiPool {
<<<<<<< HEAD
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
  currentRound: number;
  nextPayoutTimestamp: BN;
  startTime: BN;
  yieldBasisPoints: number;
  yieldStrategy: YieldPlatform;
  participants: PublicKey[];
  bump: number;
  name: string;
  description: string;
  frequency: string;
=======
  maxParticipants: number;              // u8
  contributionAmount: bigint;          // u64 → use BigInt
  cycleDurationSeconds: bigint;        // u64 → use BigInt
  payoutDelaySeconds: bigint;          // u64 → use BigInt
  earlyWithdrawalFeeBps: number;       // u16
  collateralRequirementBps: number;    // u16
  yieldStrategy: YieldPlatform;        // enum (anchor will serialize as u8)
  isPrivate: boolean;                  // bool
  isNativeSol: boolean;                // bool
  status: PoolStatus;                  // Add this property
  totalValue: bigint;                  // Add this property (u64)
  currentRound: number;                // Add this property (u8)
  nextPayoutTimestamp: bigint;         // Add this property (u64)
  startTime: bigint;                   // Add this property (u64)
  yieldBasisPoints: number;            // Add this property (u16)
  creator: PublicKey;                  // First field in the struct
  tokenMint: PublicKey;                // Second field in the struct
  participants: PublicKey[];           // Array of pubkeys (fixed-size array in Rust)
  uuid: number[];                      // [u8; 6] in Rust
  whitelist: PublicKey[];              // Vec<Pubkey> in Rust
  payoutRecipients: PublicKey[];       // [Pubkey; 20] in Rust (named payout_recipients)
  earlyPayoutRequests: PublicKey[];    // [Pubkey; 20] in Rust (named early_payout_requests)
  bump: number;                        // u8
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
}

export interface UserAccount {
  owner: PublicKey;
  poolsJoined: number;
  activePools: number;
<<<<<<< HEAD
  totalContribution: BN;
  totalWinnings: BN;
=======
  poolsCreated: number;
  totalContribution: BN;
  totalWinnings: BN;
  collateralDeposited: BN;
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
  experiencePoints: number;
  bump: number;
}

export interface ProtocolSettings {
  admin: PublicKey;
  treasury: PublicKey;
  tokenMint: PublicKey;
  protocolFeeBps: number;
<<<<<<< HEAD
=======
  createPoolFee: BN;
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
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