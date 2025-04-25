import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useHuifiProgram } from './useHuifiProgram';
import { YieldPlatform, HuifiPool } from '@/lib/types/program-types';

const calculateEstimatedApy = (pool: HuifiPool): number => {
  // Convert basis points to percentage (1 bp = 0.01%)
  return pool.yieldBasisPoints / 100;
};

export const usePoolYield = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();

  const yieldQuery = useQuery({
    queryKey: ['pool-yield', poolAddress.toString()],
    queryFn: async () => {
      if (!program) throw new Error('Program not loaded');

      const pool = await program.account.HuifiPool.fetch(poolAddress);
      return {
        strategy: pool.yieldStrategy,
        basisPoints: pool.yieldBasisPoints,
        estimatedApy: calculateEstimatedApy(pool),
      };
    },
    enabled: !!program,
  });

  const updateYieldStrategyMutation = useMutation({
    mutationKey: ['update-yield-strategy', poolAddress.toString()],
    mutationFn: async (strategy: YieldPlatform): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      // Implementation
      return '';
    }
  });

  return {
    yieldQuery,
    updateYieldStrategyMutation,
  };
}; 