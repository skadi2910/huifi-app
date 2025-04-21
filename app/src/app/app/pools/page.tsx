'use client';

import React, { useState, useMemo } from 'react';
import { PoolCard } from '@/components/PoolCard'; 
import { PoolFilterBar } from '@/components/PoolFilterBar';
import { Trophy, ChevronDown } from 'lucide-react';
import { AppHero } from '@/components/ui/ui-layout';
import { useHuifiPools } from '@/hooks/useHuifiPools';

export default function PoolsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Use the real hook that fetches from chain
  const { pools, isLoading, error, refreshPools } = useHuifiPools();
  
  // Apply filters
  const filteredPools = useMemo(() => {
    if (!pools) return [];
    
    return pools.filter(pool => {
      // Text search
      if (searchQuery && !pool.account.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (activeFilter === 'active' && pool.account.status !== 1) { // 1 is Active
        return false;
      }
      if (activeFilter === 'filling' && pool.account.status !== 0) { // 0 is Initializing/Filling
        return false;
      }
      if (activeFilter === 'completed' && pool.account.status !== 2) { // 2 is Completed
        return false;
      }
      
      return true;
    });
  }, [pools, activeFilter, searchQuery]);

  return (
    <div className="container mx-auto px-4">

      <PoolFilterBar 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {isLoading ? (
        <div className="flex justify-center my-20">
          <div className="loading-neu"></div>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-400 neu-box-dark">
          Error loading pools: {error}
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="p-8 text-center text-[#ffdd00]/70 neu-box-dark">
          No pools found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredPools.map((pool) => (
            <PoolCard 
              key={pool.publicKey.toString()} 
              publicKey={pool.publicKey}
              account={pool.account}
            />
          ))}
        </div>
      )}
    </div>
  );
}