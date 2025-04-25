import { useQuery } from '@tanstack/react-query';
import { PublicKey } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';

export const usePoolStats = (poolAddress: PublicKey) => {
  const { program } = useHuifiProgram();

  return useQuery({
    queryKey: ['pool-stats', poolAddress.toString()],
    queryFn: async () => {
      if (!program) throw new Error('Program not loaded');

      const pool = await program.account.HuifiPool.fetch(poolAddress);
      
      return {
        totalValue: pool.totalValue,
        currentParticipants: pool.currentParticipants,
        currentRound: pool.currentRound,
        nextPayoutTimestamp: pool.nextPayoutTimestamp,
        yieldBasisPoints: pool.yieldBasisPoints,
      };
    },
    enabled: !!program,
  });
}; 