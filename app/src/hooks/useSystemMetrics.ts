import { useQuery } from '@tanstack/react-query';
import { useHuifiProgram } from './useHuifiProgram';
import { SystemState } from '@/lib/types/state';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { HuifiPool, ProtocolSettings } from '@/lib/types/program-types';

// Helper function to calculate total value locked across all pools
const calculateTotalValueLocked = (pools: { account: HuifiPool }[]): BN => {
  return pools.reduce((total, { account }) => {
    return total.add(account.totalValue);
  }, new BN(0));
};

// Helper function to calculate total protocol fees
const calculateProtocolFees = (
  pools: { account: HuifiPool }[], 
  settings: ProtocolSettings
): BN => {
  return pools.reduce((total, { account }) => {
    // Calculate fees based on total value and protocol fee BPS
    const poolFees = account.totalValue
      .mul(new BN(settings.protocolFeeBps))
      .div(new BN(10000)); // 10000 basis points = 100%
    return total.add(poolFees);
  }, new BN(0));
};

export const useSystemMetrics = () => {
  const { program } = useHuifiProgram();

  return useQuery<SystemState>({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      if (!program) throw new Error('Program not loaded');

      // Derive the protocol settings PDA
      const [protocolSettingsAddress] = PublicKey.findProgramAddressSync(
        [Buffer.from("huifi-protocol")],
        program.programId
      );

      const [pools, users, settings] = await Promise.all([
        program.account.HuifiPool.all(),
        program.account.UserAccount.all(),
        program.account.ProtocolSettings.fetch(protocolSettingsAddress)
      ]);

      // Calculate system metrics
      const metrics: SystemState = {
        totalPools: pools.length,
        totalUsers: users.length,
        totalValueLocked: calculateTotalValueLocked(pools),
        protocolFees: calculateProtocolFees(pools, settings),
        activePools: pools.filter(p => p.account.status === 1).length
      };

      return metrics;
    },
    enabled: !!program
  });
}; 