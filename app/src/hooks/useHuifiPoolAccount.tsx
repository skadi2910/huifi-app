import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { findPoolAddress } from '@/lib/pda';
import { useHuifiProgram } from './useHuifiProgram';
import { HuifiPool } from '@/lib/types/program-types';
import { contributeToPool, placeBid } from '@/lib/huifi-data-access';
import { useTransactionToast } from '@/components/ui/ui-layout';
import toast from 'react-hot-toast';
import { USDC_MINT } from '@/lib/constants';

export function useHuifiPoolAccount({ poolId }: { poolId?: PublicKey }) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const program = useHuifiProgram();
  const transactionToast = useTransactionToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Change the state type to store the pool PublicKey instead of just the name
  const [poolData, setPoolData] = useState<{ publicKey: PublicKey, name: string } | null>(null);
  
  // Query to fetch the pool data
  const accountQuery = {
    data: null as HuifiPool | null,
    isLoading,
    isError: error !== null,
    error,
    refetch: async () => {
      await fetchPoolAccount();
    }
  };
  
  // Set up the contribute mutation
  const contributeMutation = {
    mutateAsync: async () => {
      if (!poolData || !publicKey || !program) {
        throw new Error("Missing required data");
      }
      
      setIsLoading(true);
      try {
        const tx = await contributeToPool(
          program,
          publicKey,
          poolData.publicKey, 
          USDC_MINT
        );
        await fetchPoolAccount(); // Refresh data
        return tx;
      } catch (err: any) {
        toast.error(`Error contributing: ${err?.message || "Unknown error"}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    isPending: isLoading
  };
  
  // Set up the place bid mutation
  const placeBidMutation = {
    mutateAsync: async ({ round, amount }: { round: number; amount: number }) => {
      if (!poolData || !publicKey || !program) {
        throw new Error("Missing required data");
      }
      
      setIsLoading(true);
      try {
        const tx = await placeBid(
          program,
          publicKey,
          poolData.publicKey,
          round,
          amount,
          USDC_MINT
        );
        await fetchPoolAccount(); // Refresh data
        return tx;
      } catch (err: any) {
        toast.error(`Error placing bid: ${err?.message || "Unknown error"}`);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    isPending: isLoading
  };
  
  // Function to fetch pool account data
  const fetchPoolAccount = async () => {
    if (!poolId || !program) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all pools to find the name for this poolId
      const allPools = await program.account.huifiPool.all();
      const targetPool = allPools.find(p => p.publicKey.equals(poolId));
      
      if (targetPool) {
        // Store both the publicKey and the name
        setPoolData({
          publicKey: targetPool.publicKey,
          name: (targetPool.account as any).name
        });
        accountQuery.data = targetPool.account as unknown as HuifiPool;
      } else {
        setError("Pool not found");
      }
    } catch (err) {
      console.error('Error fetching pool account:', err);
      setError('Failed to load pool data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up initial data fetch
  useEffect(() => {
    fetchPoolAccount();
    
    // Set up subscription for real-time updates if poolId exists
    if (connection && poolId) {
      const subscriptionId = connection.onAccountChange(
        poolId,
        async () => {
          await fetchPoolAccount();
        }
      );
      
      return () => {
        connection.removeAccountChangeListener(subscriptionId);
      };
    }
  }, [poolId, program, connection]);
  
  return { 
    accountQuery, 
    contributeMutation, 
    placeBidMutation,
    poolName: poolData?.name || null,
    poolPublicKey: poolData?.publicKey || null
  };
}