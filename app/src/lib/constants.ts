import { PublicKey } from '@solana/web3.js';

// The actual deployed program ID from your Anchor.toml or deployment
export const HUIFI_PROGRAM_ID = new PublicKey('6xBRZCRWt68bW4j4Jf51USyDzutWMwVQY45CYjNA7bt6');

// USDC token mint on devnet (for testing)
export const USDC_MINT = new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr');

// Default RPC endpoints
export const DEFAULT_RPC_ENDPOINT = 'https://api.devnet.solana.com';

// Pool constants
export const MIN_PARTICIPANTS = 3;
export const MAX_PARTICIPANTS = 20;

// Seeds for PDAs
export const POOL_SEED = 'pool';
export const USER_ACCOUNT_SEED = 'user';
export const BID_SEED = 'bid';
export const ROUND_RESULT_SEED = 'round_result';
export const VAULT_SEED = 'vault';
export const PROTOCOL_SETTINGS_SEED = "protocol_settings";