import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useEffect, useState } from 'react';

// Type definitions for our pools
interface HuifiPool {
  creator: PublicKey;
  tokenMint: PublicKey;
  maxParticipants: number;
  currentParticipants: number;
  contributionAmount: any; // This is a BN in Anchor
  cycleDurationSeconds: any; // This is a BN in Anchor
  payoutDelaySeconds: any; // This is a BN in Anchor
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  status: number;
  totalValue: any; // This is a BN in Anchor
  currentRound: number;
  nextPayoutTimestamp: any; // This is a BN in Anchor
  startTime: any; // This is a BN in Anchor
  yieldBasisPoints: number;
  yieldStrategy: any;
  participants: PublicKey[];
  bump: number;
  // Additional UI properties
  name: string;
  description: string;
  frequency: string;
}

type PoolWithKey = {
  publicKey: PublicKey;
  account: HuifiPool;
};

export const useHuifiPools = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const [pools, setPools] = useState<PoolWithKey[]>([]);
  
  // Query to fetch all pools
  const poolsQuery = useQuery({
    queryKey: ['huifi-pools'],
    queryFn: async () => {
      if (!program) {
        throw new Error('Program not loaded');
      }
      
      try {
        // Fetch all pool accounts
        const accounts = await program.account.HuifiPool.all();
        
        // Transform and enrich the data as needed
        const enrichedPools = accounts.map(({ publicKey, account }) => ({
          publicKey,
          account: {
            ...account,
            // Add any UI-specific properties or transformations here
            name: `HuiFi Pool #${publicKey.toString().substring(0, 8)}`, // This would come from off-chain or other sources
            description: 'A rotating savings pool', // This would come from off-chain or other sources
            frequency: account.cycleDurationSeconds.toNumber() >= 604800 ? 'weekly' : 'daily', // Simple frequency determination
          }
        }));
        
        setPools(enrichedPools);
        return enrichedPools;
      } catch (error) {
        console.error('Error fetching pools:', error);
        throw error;
      }
    },
    enabled: !!program,
  });
  
  // Function to refresh pools
  const refreshPools = () => {
    poolsQuery.refetch();
  };
  
  // Listen for program events to update pools
  useEffect(() => {
    if (!program || !connection) return;
    
    // Set up listeners for relevant events
    const listener = program.addEventListener('PoolCreatedEvent', (event) => {
      console.log('New pool created:', event);
      refreshPools();
    });
    
    return () => {
      program.removeEventListener(listener);
    };
  }, [program, connection]);
  
  // Join pool mutation
  const joinPoolMutation = useMutation({
    mutationKey: ['join-pool'],
    mutationFn: async (poolAddress: PublicKey): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        // Get user account PDA
        const [userAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('user'), publicKey.toBuffer()],
          program.programId
        );
        
        const signature = await program.methods
          .joinPool()
          .accounts({
            huifiPool: poolAddress,
            user: publicKey,
            userAccount: userAccountPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
          
        addTransaction(signature, 'Join Pool');
        return signature;
      } catch (error) {
        console.error('Error joining pool:', error);
        throw error;
      }
    },
    onSuccess: () => {
      refreshPools();
    }
  });
  
  return {
    pools,
    isLoading: poolsQuery.isLoading || !pools,
    error: poolsQuery.error,
    refreshPools,
    joinPoolMutation,
  };
};