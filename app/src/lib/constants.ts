import { PublicKey, Keypair } from '@solana/web3.js';

// The actual deployed program ID from your Anchor.toml or deployment
export const HUIFI_PROGRAM_ID = new PublicKey('5S8b4n1VwN3wasBcheSdUKSMyvVPLMgMe9FLxWLfBT8t');

// USDC token mint on devnet (for testing)
export const USDC_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// Default RPC endpoints
export const DEFAULT_RPC_ENDPOINT = 'http://localhost:8899';

// Pool constants
export const MIN_PARTICIPANTS = 3;
export const MAX_PARTICIPANTS = 20;

// Seeds for PDAs - updated to match Rust program's seed constants exactly
export const USER_ACCOUNT_SEED = 'huifi-member'; 
export const BID_SEED = 'bid';
export const ROUND_RESULT_SEED = 'round_result';

export const PROTOCOL_SEED = "huifi-protocol";
export const POOL_SEED = "huifi-pool";
export const MEMBER_SEED = "huifi-member";
export const VAULT_SEED = "huifi-vault";