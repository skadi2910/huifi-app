import { BN } from '@coral-xyz/anchor';

export const calculateNextPayout = (
  startTime: BN,
  cycleDuration: BN,
  currentRound: number
): BN => {
  return startTime.add(cycleDuration.mul(new BN(currentRound)));
};

export const isPayoutEligible = (
  nextPayoutTime: BN,
  currentTime: BN = new BN(Math.floor(Date.now() / 1000))
): boolean => {
  return currentTime.gte(nextPayoutTime);
};

export const getTimeUntilNextPayout = (
  nextPayoutTime: BN,
  currentTime: BN = new BN(Math.floor(Date.now() / 1000))
): { hours: number; minutes: number } => {
  const diff = nextPayoutTime.sub(currentTime);
  if (diff.lten(0)) return { hours: 0, minutes: 0 };

  const hours = diff.div(new BN(3600)).toNumber();
  const minutes = diff.mod(new BN(3600)).div(new BN(60)).toNumber();
  return { hours, minutes };
}; 