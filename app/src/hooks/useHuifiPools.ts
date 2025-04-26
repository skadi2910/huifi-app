import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useEffect, useState, useCallback } from 'react';
import { BN,Program,Idl } from '@coral-xyz/anchor';
import bs58 from 'bs58';
import { HuifiPool as HuifiPoolType } from '@/lib/types/program-types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;
const JITTER_FACTOR = 0.1;
const getBackoffTime = (attempt: number) => {
  const backoff = Math.min(
    INITIAL_BACKOFF_MS * Math.pow(2, attempt),
    MAX_BACKOFF_MS
  );
  const jitter = backoff * JITTER_FACTOR * (Math.random() * 2 - 1);
  return backoff + jitter;
};
export type MemberAccountData = {
  owner: PublicKey;
  pool: PublicKey;
  contributionsMade: number;
  status: any; // You might want to define a proper type for MemberStatus
  hasReceivedPayout: boolean;
  eligibleForPayout: boolean;
  collateralStaked: BN;
  reputationPoints: BN;
  lastContributionTimestamp: BN;
  bump: number;
};
export type PoolWithKey = {
  publicKey: PublicKey;
  account: HuifiPoolType;
};

type AnchorAccountResult = {
  publicKey: PublicKey;
  account: any;
};
// Define your program's account types
type HuifiAccounts = {
  memberAccount: {
    fetch(address: PublicKey): Promise<MemberAccountData>;
  };
  groupAccount: {
    fetch(address: PublicKey): Promise<any>;
  };
  bidState: {
    fetch(address: PublicKey): Promise<any>;
  };
  priceUpdateV2: {
    fetch(address: PublicKey): Promise<any>;
  };
  protocolSettings: {
    fetch(address: PublicKey): Promise<any>;
  };
};
// Define the program type
type HuifiProgram = Program<Idl> & {
  account: HuifiAccounts;
};
export const useHuifiPools = () => {
  
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  // Update the program type here
  const { program } = useHuifiProgram() as { program: HuifiProgram | null };
  const { addTransaction } = useTransactions();
  const [pools, setPools] = useState<PoolWithKey[]>([]);
  
  // Query to fetch all pools
   const poolsQuery = useQuery({
    queryKey: ['huifi-pools'],
    queryFn: async () => {
      if (!program) {
        throw new Error('Program not loaded');
      }
      
      let attempt = 0;
      const MAX_ATTEMPTS = 5;
      
      while (attempt < MAX_ATTEMPTS) {
        try {
          console.log("Fetching pools from program:", program.programId.toString());
          let poolsData: PoolWithKey[] = [];
          
          try {
            const possibleAccountNames = ['HuifiPool', 'huifiPool', 'huifi_pool', 'groupAccount'];
            let anchorAccount: { all: () => Promise<AnchorAccountResult[]> } | undefined;
            
            for (const name of possibleAccountNames) {
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
              const accountKeys = Object.keys(program.account as Record<string, any>);
              console.log("Available account types:", accountKeys);
              throw new Error("Anchor method not available");
            }
          } catch (err) {
            console.warn("Failed to fetch using Anchor method, using getProgramAccounts instead", err);
            
            try {
              if (!program.idl || !program.idl.accounts) {
                throw new Error("Program IDL or accounts not available");
              }
              
              console.log("IDL accounts:", program.idl.accounts.map(a => a.name));
              
              const poolAccount = program.idl.accounts.find(a => 
                a.name === 'groupAccount'
              );
              
              if (!poolAccount) {
                console.error("Available accounts:", program.idl.accounts.map(a => a.name));
                throw new Error("Could not find GroupAccount in IDL");
              }
              
              console.log("Found pool account in IDL:", poolAccount.name);
              console.log("Discriminator:", poolAccount.discriminator);
              
              const discriminator = poolAccount.discriminator 
                ? Buffer.from(poolAccount.discriminator) 
                : Buffer.from([]);
                
              const base58Discriminator = bs58.encode(discriminator);
              
              console.log("Using discriminator:", base58Discriminator);
              
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
              
              poolsData = await Promise.all(
                accounts.map(async ({ pubkey, account }) => {
                  try {
                    const parsed = program.coder.accounts.decode(
                      'groupAccount',
                      account.data
                    );
                    
                    return {
                      publicKey: pubkey,
                      account: parsed as unknown as HuifiPoolType
                    };
                  } catch (decodeErr) {
                    console.error("Failed to decode account:", pubkey.toString(), decodeErr);
                    throw decodeErr;
                  }
                })
              );
            } catch (error) {
              console.error("Failed to process accounts:", error);
              throw error;
            }
          }
          
          const enrichedPools = poolsData.map(({ publicKey, account }: PoolWithKey) => {
            // console.log("Raw pool data:", account);
            
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
          attempt++;
          
          if (error instanceof Error && error.message.includes('429')) {
            if (attempt === MAX_ATTEMPTS) {
              throw new Error('Max retries reached for rate limit');
            }
            
            const backoffTime = getBackoffTime(attempt);
            console.log(`Rate limited, attempt ${attempt}/${MAX_ATTEMPTS}. Waiting ${backoffTime}ms...`);
            await delay(backoffTime);
            continue;
          }
          
          throw error;
        }
      }
      
      throw new Error('Failed to fetch pools after max attempts');
    },
    enabled: !!program,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 30000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message.includes('429')) {
        return failureCount < 5;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => getBackoffTime(attemptIndex),
  });

  const fetchPoolDetails = async (address: PublicKey): Promise<PoolWithKey | null> => {
    if (!program) {
      throw new Error('Program not loaded');
    }

    // First check if we have the pool in our current state
    const cachedPool = pools.find(
      pool => pool.publicKey.toString() === address.toString()
    );
    
    if (cachedPool) {
      return cachedPool;
    }

    let attempt = 0;
    const MAX_ATTEMPTS = 3;

    while (attempt < MAX_ATTEMPTS) {
      try {
        const allPools = await poolsQuery.refetch();
        const matchingPool = allPools.data?.find(
          pool => pool.publicKey.toString() === address.toString()
        );

        if (matchingPool) {
          return matchingPool;
        }

        // If we didn't find the pool, wait before trying again
        attempt++;
        if (attempt < MAX_ATTEMPTS) {
          const backoffTime = getBackoffTime(attempt);
          await delay(backoffTime);
        }
      } catch (error) {
        attempt++;
        if (error instanceof Error && error.message.includes('429')) {
          if (attempt === MAX_ATTEMPTS) {
            console.error('Max retries reached for rate limit');
            return null;
          }
          const backoffTime = getBackoffTime(attempt);
          await delay(backoffTime);
          continue;
        }
        console.error('Error fetching pool details:', error);
        return null;
      }
    }

    return null;
  };

 
  const MEMBER_SEED = "huifi-member";

  const fetchMemberAccountDetail = async (poolData: PoolWithKey, userWallet: PublicKey): Promise<MemberAccountData | null> => {
    const maxRetries = 3;
    const baseDelay = 1000;
  
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!poolData || !userWallet || !program) {
          console.log('Missing required data:', {
            hasPoolData: !!poolData,
            hasUserWallet: !!userWallet,
            hasProgram: !!program
          });
          return null;
        }
  
        // Debug: Log available accounts
        console.log("Available accounts:", Object.keys(program.account));
        if (program.idl && program.idl.accounts) {
          console.log("Program IDL accounts:", program.idl.accounts.map(a => a.name));
        } else {
          console.log("Program IDL accounts not available");
        }
  
        const [memberPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from(MEMBER_SEED, 'utf-8'),
            poolData.publicKey.toBuffer(),
            userWallet.toBuffer()
          ],
          program.programId
        );
  
        console.log('Attempting to fetch member account:', {
          memberPda: memberPda.toString(),
          pool: poolData.publicKey.toString(),
          user: userWallet.toString(),
          attempt: attempt + 1
        });
  
        if (attempt > 0) {
          const retryDelay = baseDelay * Math.pow(2, attempt);
          console.log(`Retry attempt ${attempt + 1}, waiting ${retryDelay}ms...`);
          await delay(retryDelay);
        }
  
        const memberAccount = await program.account.memberAccount.fetch(memberPda);
        
        
        if (!memberAccount) {
          console.log('Member account not found');
          return null;
        }
  
        console.log('Member account found:', {
          owner: memberAccount.owner.toString(),
          pool: memberAccount.pool.toString(),
          contributionsMade: memberAccount.contributionsMade,
          hasReceivedPayout: memberAccount.hasReceivedPayout,
          eligibleForPayout: memberAccount.eligibleForPayout,
          collateralStaked: memberAccount.collateralStaked.toString(),
          status: memberAccount.status
        });
  
        return memberAccount as MemberAccountData;
  
      } catch (error) {
        if (error instanceof Error) {
          if (error.message.includes('429')) {
            if (attempt === maxRetries - 1) {
              console.error('Max retries reached for rate limit');
              return null;
            }
            continue;
          } else if (error.message.includes('Account does not exist')) {
            console.log('Member account does not exist');
            return null;
          }
        }
        console.error('Error in fetchMemberAccountDetail:', error);
        if (attempt === maxRetries - 1) return null;
      }
    }
  
    return null;
  };
  
  const refreshPools = useCallback(async () => {
    console.log("Refreshing pools...");
    await delay(getBackoffTime(0)); // Add initial delay
    return poolsQuery.refetch();
  }, [poolsQuery]);
  const joinPoolMutation = useMutation({
    mutationKey: ['join-pool'],
    mutationFn: async (poolAddress: PublicKey): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
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
    onSuccess: async () => {
      await delay(30000);
      await refreshPools();
    }
  });

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
    fetchPoolDetails,
    fetchMemberAccountDetail
  };
};