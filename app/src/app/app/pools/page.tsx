<<<<<<< HEAD
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
  
  const { pools, isLoading, error, refreshPools } = useHuifiPools();
  
  const filteredPools = useMemo(() => {
    if (!pools) return [];
    return pools.filter(pool => {
      if (searchQuery && !pool.account.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeFilter === 'active' && pool.account.status !== 1) return false;
      if (activeFilter === 'filling' && pool.account.status !== 0) return false;
      if (activeFilter === 'completed' && pool.account.status !== 2) return false;
      return true;
    });
  }, [pools, activeFilter, searchQuery]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <PoolFilterBar 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {isLoading ? (
        <div className="flex justify-center my-16 sm:my-20">
          <div className="loading-neu"></div>
        </div>
      ) : error ? (
        <div className="p-6 sm:p-8 text-center text-red-400 neu-box-dark">
          Error loading pools: {error}
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="p-6 sm:p-8 text-center text-[#ffdd00]/70 neu-box-dark text-sm sm:text-base">
          No pools found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mt-8 mb-16 sm:mb-20 md:mb-24">
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
=======
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
  
  const { pools, isLoading, error, refreshPools } = useHuifiPools();
  
  const filteredPools = useMemo(() => {
    if (!pools) return [];
    return pools.filter(pool => {
      if (searchQuery && !pool.account.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeFilter === 'active' && pool.account.status !== 1) return false;
      if (activeFilter === 'filling' && pool.account.status !== 0) return false;
      if (activeFilter === 'completed' && pool.account.status !== 2) return false;
      return true;
    });
  }, [pools, activeFilter, searchQuery]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <PoolFilterBar 
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {isLoading ? (
        <div className="flex justify-center my-16 sm:my-20">
          <div className="loading-neu"></div>
        </div>
      ) : error ? (
        <div className="p-6 sm:p-8 text-center text-red-400 neu-box-dark">
          Error loading pools: {error}
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="p-6 sm:p-8 text-center text-[#ffdd00]/70 neu-box-dark text-sm sm:text-base">
          No pools found matching your criteria
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mt-8 mb-16 sm:mb-20 md:mb-24">
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
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
