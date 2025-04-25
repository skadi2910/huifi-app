export const PROGRAM_SEEDS = {
  PROTOCOL: 'huifi-protocol',
  MEMBER: 'huifi-member',
  SPL_POOL: 'huifi-pool',
  SOL_POOL: 'huifi-sol-pool',
  SPL_VAULT: 'huifi-spl-vault',
  SOL_VAULT: 'huifi-sol-vault',
  SPL_COLLATERAL: 'huifi-spl-collateral',
  SOL_COLLATERAL: 'huifi-sol-collateral',
  BID: 'bid',
  ROUND_RESULT: 'round_result'
};

export const MAX_WHITELIST_SIZE = 20;
export const MAX_PARTICIPANTS = 20;
export const MIN_CONTRIBUTION_AMOUNT = 1_000_000; // 1 USDC
export const MIN_CYCLE_DURATION = 24 * 60 * 60; // 24 hours 