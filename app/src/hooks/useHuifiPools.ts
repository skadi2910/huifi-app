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
  
  // Query to fetch all pools
  const poolsQuery = useQuery({
    queryKey: ['huifi-pools'],
    queryFn: async () => {
      if (!program) {
        throw new Error('Program not loaded');
      }
      
      try {
        console.log("Fetching pools from program:", program.programId.toString());
        
        // Try the direct Anchor method first
        let poolsData: PoolWithKey[] = [];
        
        try {
          // Check different possible case variants of the account name
          const possibleAccountNames = ['HuifiPool', 'huifiPool', 'huifi_pool', 'groupAccount'];
          let anchorAccount: { all: () => Promise<AnchorAccountResult[]> } | undefined;
          
          for (const name of possibleAccountNames) {
            // Use type assertion to tell TypeScript it's okay to index with a string
            const accountsNamespace = program.account as Record<string, any>;
            if (accountsNamespace[name] && typeof accountsNamespace[name].all === 'function') {
              console.log(`Found Anchor account with name: ${name}`);
              anchorAccount = accountsNamespace[name];
              break;
            }
          }
          
          if (anchorAccount) {
            const anchorPools = await anchorAccount.all();
            console.log("Anchor pools fetched:", anchorPools.length);
            
            poolsData = anchorPools.map((item: AnchorAccountResult) => ({
              publicKey: item.publicKey,
              account: item.account as unknown as HuifiPoolType
            }));
          } else {
            // Use type assertion to safely access program.account properties
            const accountKeys = Object.keys(program.account as Record<string, any>);
            console.log("Available account types:", accountKeys);
            throw new Error("Anchor method not available");
          }
        } catch (err) {
          console.warn("Failed to fetch using Anchor method, using getProgramAccounts instead", err);
          
          try {
            // Check if idl and accounts exist before accessing
            if (!program.idl || !program.idl.accounts) {
              throw new Error("Program IDL or accounts not available");
            }
            
            // Log the IDL to inspect account names and discriminators
            console.log("IDL accounts:", program.idl.accounts.map(a => a.name));
            
            // Find the account with "pool" in its name (case insensitive)
            const poolAccount = program.idl.accounts.find(a => 
              a.name === 'groupAccount'
            );
            
            if (!poolAccount) {
              console.error("Available accounts:", program.idl.accounts.map(a => a.name));
              throw new Error("Could not find GroupAccount in IDL. Available accounts: " + 
                program.idl.accounts.map(a => a.name).join(', '));
            }
            
            console.log("Found pool account in IDL:", poolAccount.name);
            console.log("Discriminator:", poolAccount.discriminator);
            
            // Use the correct discriminator from IDL - handle possible undefined
            const discriminator = poolAccount.discriminator 
              ? Buffer.from(poolAccount.discriminator) 
              : Buffer.from([]);
              
            const base58Discriminator = bs58.encode(discriminator);
            
            console.log("Using discriminator:", base58Discriminator);
            
            // Fallback to getProgramAccounts
            const accounts = await connection.getProgramAccounts(program.programId, {
              filters: [
                {
                  memcmp: {
                    offset: 0,
                    bytes: base58Discriminator
                  }
                }
              ],
            });
            
            console.log("Raw getProgramAccounts result:", accounts.length);
            
            // Use explicit types in Promise.all mapping
            poolsData = await Promise.all(
              accounts.map(async ({ pubkey, account }) => {
                try {
                  // Decode using Anchor coder with the correct account name
                  const parsed = program.coder.accounts.decode(
                    'groupAccount',  // Use name from IDL
                    account.data
                  );
                  
                  return {
                    publicKey: pubkey,
                    account: parsed as unknown as HuifiPoolType
                  };
                } catch (decodeErr) {
                  console.error("Failed to decode account:", pubkey.toString(), decodeErr);
                  console.log("Account data:", account.data.slice(0, 20));
                  throw decodeErr;
                }
              })
            );
          } catch (error) {
            console.error("Failed to process accounts:", error);
            throw error;
          }
        }
        
        // Transform and enrich the data - add explicit type to map parameter
        const enrichedPools = poolsData.map(({ publicKey, account }: PoolWithKey) => {
          console.log("Raw pool data:", account);
          
          // Add UI-friendly fields
          const enriched = {
            ...account,
            name: `HuiFi Pool #${publicKey.toString().substring(0, 8)}`,
            description: 'A rotating savings pool',
            frequency: account.cycleDurationSeconds && 
              typeof account.cycleDurationSeconds === 'object' && 
              'gte' in account.cycleDurationSeconds
                ? account.cycleDurationSeconds.gte(new BN(604800)) 
                  ? 'weekly' 
                  : 'daily'
                : 'weekly',
          };
          
          return {
            publicKey,
            account: enriched,
          };
        });
        
        console.log("Processed pools:", enrichedPools);
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