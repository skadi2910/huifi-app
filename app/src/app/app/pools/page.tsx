'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PoolCard } from '@/components/PoolCard'; 
import { PoolFilterBar } from '@/components/PoolFilterBar';
import { PublicKey } from '@solana/web3.js';
import { AppHero } from '@/components/ui/app-hero';
import { useRouter } from 'next/navigation';
import { useHuifiPools } from '@/hooks/useHuifiPools';
import { useJoinPool } from '@/hooks/useJoinPool';
import toast, { Toaster } from 'react-hot-toast';
// import { useWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@/hooks/useWallet';
import dynamic from 'next/dynamic';
import { AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';
import { useWallet as useLazorWallet } from '@lazorkit/wallet';
// Import WalletMultiButton with client-side only rendering
// This prevents hydration errors
const WalletMultiButton = dynamic(
  () => import('@solana/wallet-adapter-react-ui').then(mod => mod.WalletMultiButton),
  { ssr: false }
);

// Custom toast component
const customToast = {
  error: (message: string, poolName?: string) => {
    toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#1a1a18] border-l-4 border-red-500 shadow-lg rounded-lg pointer-events-auto flex`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-400">Error</p>
                <p className="mt-1 text-sm text-red-300">{message}</p>
                {poolName && <p className="mt-1 text-xs text-red-400/70">Pool: {poolName}</p>}
              </div>
            </div>
          </div>
          <div className="flex border-l border-[#333]">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full h-full p-4 flex items-center justify-center text-sm font-medium text-red-400 hover:text-red-300"
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  },
  
  success: (message: string) => {
    toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#1a1a18] border-l-4 border-green-500 shadow-lg rounded-lg pointer-events-auto flex`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-400">Success</p>
                <p className="mt-1 text-sm text-green-300">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-[#333]">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full h-full p-4 flex items-center justify-center text-sm font-medium text-green-400 hover:text-green-300"
            >
              Close
            </button>
          </div>
        </div>
      ),
      { duration: 3000 }
    );
  },
  
  loading: (message: string) => {
    return toast.custom(
      (t) => (
        <div className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-[#1a1a18] border-l-4 border-[#e6ce04] shadow-lg rounded-lg pointer-events-auto flex`}>
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-5 w-5 border-2 border-[#e6ce04] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-[#e6ce04]">Loading</p>
                <p className="mt-1 text-sm text-[#f8e555]/80">{message}</p>
              </div>
            </div>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  }
};

export default function PoolsPage() {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // const { publicKey, connected } = useWallet();
  const {solanaIsConnected,lazorIsConnected} = useWallet();
  console.log("solanaIsConnected",solanaIsConnected);
  console.log("lazorIsConnected",lazorIsConnected); 
  const router = useRouter();
  // const {
  //   credentialId: lazorCredentialId,
  //   publicKey: lazorPublicKey,
  //   isConnected: lazorIsConnected,
  //   isLoading: lazorIsLoading,
  //   error: lazorError,
  //   smartWalletAuthorityPubkey: lazorSmartWalletAuthorityPubkey,
  //   connect: lazorConnect,
  //   disconnect: lazorDisconnect,
  //   signMessage: lazorSignMessage,
  // } = useLazorWallet();
  const { pools, isLoading, error, refreshPools } = useHuifiPools();
  const { joinPoolMutation } = useJoinPool();
  
  const filteredPools = useMemo(() => {
    if (!pools) return [];
    return pools.filter(pool => {
      // Skip if search doesn't match
      if (searchQuery) {
        const poolName = pool.account.uuid ? 
          `HuiFi Pool ${Array.from(pool.account.uuid).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 6)}` : 
          '';
          
        if (!poolName.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }
      
      // Filter by status
      if (activeFilter === 'active' && pool.account.status !== 1) return false;
      if (activeFilter === 'filling' && pool.account.status !== 0) return false;
      if (activeFilter === 'completed' && pool.account.status !== 2) return false;
      return true;
    });
  }, [pools, activeFilter, searchQuery]);

  const handleJoinPool = async (poolId: PublicKey, uuid: number[], poolName?: string) => {
    if (!solanaIsConnected && !lazorIsConnected) {
      customToast.error('Please connect your wallet first');
      return;
    }
    
    // Show loading toast
    const loadingToast = customToast.loading('Joining pool...');
    
    try {
      await joinPoolMutation.mutateAsync({ poolId, uuid });
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      customToast.success('Successfully joined pool!');
      
      // Refresh pools after a small delay
      setTimeout(() => {
        refreshPools();
      }, 50000);
    } catch (error) {
      console.error('Failed to join pool:', error);
      
      // Dismiss loading toast
      toast.dismiss(loadingToast);
      
      // Extract error message if available
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      let userErrorMessage = '';
      
      // Check for specific error patterns from the blockchain
      if (errorMessage.includes('MemberAlreadyJoined')) {
        userErrorMessage = 'You have already joined this pool';
      }
      else if (errorMessage.includes('NotWhitelisted')) {
        userErrorMessage = 'This is a private pool. You are not on the whitelist';
      }
      else if (errorMessage.includes('PoolFull')) {
        userErrorMessage = 'This pool is already full';
      }
      else if (errorMessage.includes('InvalidPoolStatus')) {
        userErrorMessage = 'This pool is no longer accepting new members';
      }
      else if (errorMessage.includes('insufficient funds')) {
        userErrorMessage = 'Insufficient funds to join this pool';
      }
      else {
        // Generic error message with details
        userErrorMessage = `Failed to join: ${errorMessage}`;
      }
      
      // Show error toast with pool name if available
      customToast.error(userErrorMessage, poolName);
    }
  };

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#010200]">
      {/* Add the Toaster component for toast notifications */}
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-[#e6ce04] mb-2">Explore Pools</h1>
          <p className="text-[#f8e555]/70">Join an active pool or create your own to start earning</p>
        </div>
        
        {!solanaIsConnected && !lazorIsConnected && (
          <div className="mb-8 p-6 bg-[#1a1a18] rounded-xl border border-[#e6ce04]/20 text-center">
            <p className="text-[#f8e555] mb-4">Connect your wallet to join pools</p>
            <div className="flex justify-center">
              <WalletMultiButton className="bg-[#e6ce04] text-[#010200] hover:bg-[#f8e555] transition-colors" />
            </div>
          </div>
        )}
        
        <PoolFilterBar 
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {isLoading ? (
          <div className="flex justify-center my-16 sm:my-20">
            <div className="w-12 h-12 border-4 border-[#e6ce04] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-6 sm:p-8 text-center text-red-400 bg-[#1a1a18] rounded-xl border border-red-500/30">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-500" />
            <p>Error loading pools: {error}</p>
            <button 
              onClick={refreshPools}
              className="mt-4 px-4 py-2 bg-[#1a1a18] border border-red-500/50 rounded-lg text-red-400 hover:bg-red-900/20"
            >
              Try Again
            </button>
          </div>
        ) : filteredPools.length === 0 ? (
          <div className="p-6 sm:p-8 text-center text-[#ffdd00]/70 bg-[#1a1a18] rounded-xl border border-[#e6ce04]/20 text-sm sm:text-base">
            No pools found matching your criteria
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 mt-8 mb-16 sm:mb-20 md:mb-24">
            {filteredPools.map((pool) => {
              // Get pool name for error display
              const poolName = pool.account.uuid ? 
                `HuiFi Pool ${Array.from(pool.account.uuid).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 6)}` :
                `Pool ${pool.publicKey.toString().substring(0, 8)}`;
                
              return (
                <PoolCard 
                  key={pool.publicKey.toString()} 
                  publicKey={pool.publicKey}
                  account={pool.account}
                  onJoinPool={(poolId, uuid) => handleJoinPool(poolId, uuid, poolName)}
                />
              );
            })}
          </div>
        )}
        
        <div className="flex justify-center">
          <button 
            onClick={() => router.push('/app/pools/create')}
            className="bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] font-bold py-3 px-6 rounded-lg border-2 border-black transition-colors"
          >
            CREATE NEW POOL
          </button>
        </div>
      </div>
    </main>
  );
}
