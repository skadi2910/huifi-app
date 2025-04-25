import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useEffect, useState } from 'react';
import { BN } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { HuifiPool as HuifiPoolType } from '@/lib/types/program-types';

type PoolWithKey = {
  publicKey: PublicKey;
  account: HuifiPoolType;
};

// Type for anchor account function return
type AnchorAccountResult = {
  publicKey: PublicKey;
  account: any;
};

export const useHuifiPools = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const [pools, setPools] = useState<PoolWithKey[]>([]);
  
  const poolsQuery = useQuery({
    queryKey: ['huifi-pools'],
    queryFn: async () => {
      if (!program) {
        throw new Error('Program not loaded');
      }

      try {
        // Fetch both SPL and SOL pools
        const [splPools, solPools] = await Promise.all([
          (program.account as any).huifipool.all([
            {
              memcmp: {
                offset: 8 + 32 + 32, // Adjust offset based on account structure
                bytes: bs58.encode(new Uint8Array([0])) // isNativeSol = false - using Uint8Array
              }
            }
          ]),
          (program.account as any).huifipool.all([
            {
              memcmp: {
                offset: 8 + 32 + 32, // Adjust offset based on account structure
                bytes: bs58.encode(new Uint8Array([1])) // isNativeSol = true - using Uint8Array
              }
            }
          ])
        ]);

        return [...splPools, ...solPools].map(pool => ({
          publicKey: pool.publicKey,
          account: pool.account
        }));
      } catch (err) {
        console.error("Failed to fetch pools:", err);
        throw err;
      }
    },
    enabled: !!program
  });
  
  // Function to refresh pools
  const refreshPools = () => {
    console.log("Refreshing pools...");
    poolsQuery.refetch();
  };
  
  // Listen for program events to update pools
  useEffect(() => {
    if (!program || !connection) return;
    
    try {
      // Set up listeners for relevant events
      const eventName = 'PoolCreatedEvent';
      console.log("Setting up listener for event:", eventName);
      
      const listener = program.addEventListener(eventName, (event) => {
        console.log('New pool created event received:', event);
        refreshPools();
      });
      
      // Explicitly refresh once at the beginning
      setTimeout(() => refreshPools(), 1000);
      
      return () => {
        program.removeEventListener(listener);
      };
    } catch (err) {
      console.error("Failed to set up event listener:", err);
    }
  }, [program, connection]);
  
  // Join pool mutation
  const joinPoolMutation = useMutation({
    mutationKey: ['join-pool'],
    mutationFn: async (poolAddress: PublicKey): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        // Get user account PDA with correct seed
        const [userAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-member'), publicKey.toBuffer()],
          program.programId
        );
        
        const signature = await program.methods
          .joinPool()
          .accounts({
            groupAccount: poolAddress,
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
  
  // Format the error as a string if it exists
  const errorMessage = poolsQuery.error 
    ? poolsQuery.error instanceof Error
      ? poolsQuery.error.message
      : 'An unknown error occurred' 
    : null;
  
  return {
    pools,
    isLoading: poolsQuery.isLoading || !pools,
    error: errorMessage,
    refreshPools,
    joinPoolMutation,
  };
};