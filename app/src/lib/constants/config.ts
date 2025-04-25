export const PROGRAM_CONFIG = {
  MAX_POOLS_PER_USER: 10,
  MAX_ACTIVE_POOLS: 5,
  MIN_POOL_DURATION: 24 * 60 * 60, // 1 day in seconds
  MAX_POOL_DURATION: 365 * 24 * 60 * 60, // 1 year in seconds
  MAX_PROTOCOL_FEE_BPS: 1000, // 10%
  MIN_COLLATERAL_BPS: 500, // 5%
  MAX_COLLATERAL_BPS: 2000, // 20%
  DEFAULT_PAYOUT_DELAY: 3600, // 1 hour in seconds
  MAX_EARLY_WITHDRAWAL_FEE_BPS: 2000, // 20%
};

export const YIELD_STRATEGIES = {
  NONE: 0,
  JITO_SOL: 1,
  KAMINO: 2,
} as const;

export const POOL_STATUS = {
  FILLING: 0,
  ACTIVE: 1,
  COMPLETED: 2,
} as const; 