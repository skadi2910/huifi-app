'use client';

import React, { useState, useMemo } from 'react';
import { PoolCard } from '@/components/PoolCard'; // Assuming PoolCard is adapted
import { PoolFilterBar } from '@/components/PoolFilterBar';
import { Trophy, Star, Award } from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
// Assuming a hook to fetch all pool accounts
// import { useHuifiProgram } from '@/hooks/use-huifi-program';
import { AppHero } from '@/components/ui/ui-layout';

// Mock hook - replace with actual program interaction hook
const useHuifiProgram = () => {
  // Replace with actual useQuery fetching all pool accounts
  const mockPools = [
    {
      publicKey: new PublicKey('Hix8azRN2WG3REEyDsZQSfbjirY6CYstxJbK7BpHBDNo'),
      account: {
        name: "Daily Gold #42",
        maxParticipants: 20,
        currentParticipants: 18,
        contributionAmount: BigInt(100000000), // 100 USDC (6 decimals)
        totalValue: BigInt(2000000000), // 2000 USDC (6 decimals)
        frequency: 86400, // Daily
        status: 0, // Active
        nextPayoutTimestamp: BigInt(Math.floor(Date.now() / 1000) + 16 * 3600),
        yieldBasisPoints: 1240,
        // ... other fields
      }
    },
    {
      publicKey: new PublicKey('9CkKDmdrXQYMhsqYwpuKMXWtSbRZ2aASSUNXsL1rp4mL'),
      account: {
        name: "Weekly Ethereum",
        maxParticipants: 10,
        currentParticipants: 10,
        contributionAmount: BigInt("500000000000000000"), // 0.5 ETH (18 decimals)
        totalValue: BigInt("5000000000000000000"), // 5 ETH (18 decimals)
        frequency: 604800, // Weekly
        status: 0, // Active
        nextPayoutTimestamp: BigInt(Math.floor(Date.now() / 1000) + 3 * 86400),
        yieldBasisPoints: 980,
        // ... other fields
      }
    },
    {
       publicKey: new PublicKey('HLPqhZqbpAxQFWZvPEZ2cYBXBjMKstiAy56AMRVwLWU5'),
       account: {
         name: "Business Boost",
         maxParticipants: 12,
         currentParticipants: 8,
         contributionAmount: BigInt(500000000), // 500 USDC (6 decimals)
         totalValue: BigInt(6000000000), // 6000 USDC (6 decimals)
         frequency: 1209600, // Bi-weekly
         status: 1, // Filling
         nextPayoutTimestamp: BigInt(0), // Not started yet
         yieldBasisPoints: 1520,
         // ... other fields
       }
     },
  ];

  return {
    accounts: {
      data: mockPools,
      isLoading: false,
      isError: false,
    },
    // Add program interaction functions if needed
  };
};


export default function PoolsPage() {
  const { accounts } = useHuifiProgram();
  const [filters, setFilters] = useState({}); // Add state for filters from PoolFilterBar

  // Memoize filtered pools based on filter state
  const filteredPools = useMemo(() => {
    if (!accounts.data) return [];
    // Apply filtering logic here based on 'filters' state
    // Example: return accounts.data.filter(pool => pool.account.status === 0); // Filter only active
    return accounts.data;
  }, [accounts.data, filters]);

  // --- Mappers ---
  const mapFrequency = (seconds: number): string => {
     if (seconds === 86400) return "Daily";
     if (seconds === 604800) return "Weekly";
     if (seconds === 1209600) return "Bi-weekly";
     return `${seconds / 3600} hours`;
   };

   const mapStatus = (statusEnum: number): 'Active' | 'Filling' | 'Completed' => {
     switch (statusEnum) {
       case 0: return "Active";
       case 1: return "Filling";
       case 2: return "Completed";
       default: return "Filling"; // Default or handle unknown
     }
   };

   const formatAmount = (amount: bigint, decimals: number, symbol: string): string => {
     // Safely convert BigInt to string first, then to number
     const amountStr = amount.toString();
     const amountNum = parseFloat(amountStr) / Math.pow(10, decimals);
     return `${amountNum.toFixed(2)} ${symbol}`;
   };

   const calculateTimeRemaining = (timestamp: bigint): string => {
     const now = BigInt(Math.floor(Date.now() / 1000));
     const remaining = timestamp - now;
     if (remaining <= BigInt(0)) return "Now";
     
     // Convert to number safely for calculations
     const remainingNum = Number(remaining);
     const days = Math.floor(remainingNum / 86400);
     const hours = Math.floor((remainingNum % 86400) / 3600);
     
     if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
     if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
     return "Soon";
   };

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#010200] text-[#e6ce04]">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-[#e6ce04]">Active Games</h1>
            {/* Placeholder for Rank - fetch user-specific data if needed */}
            <div className="flex items-center bg-[#1a1a18] rounded-lg px-4 py-2 border border-[#e6ce04]/20">
              <Trophy className="h-5 w-5 text-[#e6ce04] mr-2" />
              <span className="mr-3 text-[#f8e555]">Your Rank:</span>
              <span className="font-bold text-[#e6ce04]">#42</span>
            </div>
          </div>
          <PoolFilterBar onFilterChange={setFilters} /> {/* Pass setter to update filters */}
        </div>

        {accounts.isLoading ? (
          <div className="flex justify-center items-center py-10">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : accounts.isError ? (
          <AppHero title="Error" subtitle="Could not load games." />
        ) : filteredPools.length === 0 ? (
           <AppHero title="No Games Found" subtitle="Try adjusting your filters or check back later." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPools.map(({ publicKey, account }) => {
              // Determine currency symbol based on program logic or mint address
              const currencySymbol = account.name.includes("Ethereum") ? "ETH" : "USDC";
              const decimals = currencySymbol === "ETH" ? 18 : 6;

              return (
                <PoolCard
                  key={publicKey.toString()}
                  poolId={publicKey} // Pass PublicKey as ID
                  name={account.name}
                  participants={{ current: account.currentParticipants, max: account.maxParticipants }}
                  contribution={formatAmount(account.contributionAmount, decimals, currencySymbol)}
                  totalValue={formatAmount(account.totalValue, decimals, currencySymbol)}
                  frequency={mapFrequency(account.frequency)}
                  status={mapStatus(account.status)}
                  timeRemaining={account.status === 0 ? calculateTimeRemaining(account.nextPayoutTimestamp) : (account.status === 1 ? 'Open' : 'Ended')}
                  yieldValue={`${(account.yieldBasisPoints / 100).toFixed(2)}%`}
                  xpReward={50} // Assuming fixed XP reward for joining/viewing
                />
              );
            })}
          </div>
        )}

        {/* Load More Button (implement pagination if necessary) */}
        <div className="mt-12 flex justify-center">
          <button className="px-8 py-3 bg-[#1a1a18] text-[#e6ce04] rounded-lg hover:bg-[#252520] transition duration-300 border border-[#e6ce04]/30 flex items-center">
            <span>Load More Games</span>
            <Award className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}