import { useEffect, useState } from 'react';
import { useHuifiProgram } from './useHuifiProgram';
import { HuifiPool } from '@/lib/types/program-types';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';

export function useHuifiPools() {
  const { connection } = useConnection();
  const program = useHuifiProgram();
  const [pools, setPools] = useState<{publicKey: PublicKey, account: HuifiPool}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = async () => {
    if (!program || !connection) return;
  
    setIsLoading(true);
    setError(null);
    try {
      // Use the connection object directly without specifying commitment here
      const accounts = await program.account.huifiPool.all();
      const formattedPools = accounts.map(({ publicKey, account }) => ({
        publicKey,
        account: account as unknown as HuifiPool,
      }));
      setPools(formattedPools);
    } catch (err) {
      console.error('Error fetching pools:', err);
      let errorMessage: string;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else {
        errorMessage = 'Unknown error connecting to Solana network';
      }
      setError(`Failed to load pools: ${errorMessage}`);
    }
  };

  useEffect(() => {
    fetchPools();
    
    // Set up program account subscriptions
    if (program && connection) {
      // This creates a websocket connection to listen for all pool account changes
      const subscriptionId = connection.onProgramAccountChange(
        program.programId,
        (accountInfo) => {
          // Only refresh if data actually changed
          if (accountInfo.accountInfo && accountInfo.accountInfo.data) {
            fetchPools();
          }
        },
        'confirmed',
        [{ dataSize: program.account.huifiPool.size }] // Filter to only receive updates for HuifiPool accounts
      );
      
      return () => {
        connection.removeProgramAccountChangeListener(subscriptionId);
      };
    }
  }, [program, connection]);

  return { 
    pools, 
    isLoading, 
    error,
    refreshPools: fetchPools 
  };
}