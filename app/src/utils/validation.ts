import { BN } from '@coral-xyz/anchor';
import { MAX_PARTICIPANTS, MIN_CONTRIBUTION_AMOUNT, MIN_CYCLE_DURATION, MAX_WHITELIST_SIZE } from '@/lib/constants';

export const validatePoolConfig = (config: any) => {
  if (config.maxParticipants > MAX_PARTICIPANTS) {
    throw new Error(`Maximum participants cannot exceed ${MAX_PARTICIPANTS}`);
  }
  
  if (config.contributionAmount.lt(new BN(MIN_CONTRIBUTION_AMOUNT))) {
    throw new Error(`Contribution amount must be at least ${MIN_CONTRIBUTION_AMOUNT}`);
  }
  
  if (config.cycleDurationSeconds.lt(new BN(MIN_CYCLE_DURATION))) {
    throw new Error(`Cycle duration must be at least ${MIN_CYCLE_DURATION} seconds`);
  }
  
  if (config.whitelist && config.whitelist.length > MAX_WHITELIST_SIZE) {
    throw new Error(`Whitelist cannot exceed ${MAX_WHITELIST_SIZE} addresses`);
  }
}; 