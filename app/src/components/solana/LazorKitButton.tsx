'use client';

import React, { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ellipsify } from '../ui/ui-layout';

export function LazorKitButton() {
  const {
    connect,
    disconnect,
    isConnected,
    isLoading,
    smartWalletAuthorityPubkey,
    publicKey,
    error
  } = useWallet();
  
  const [localLoading, setLocalLoading] = useState(false);
  
  // Get the display address - prioritize smart wallet address then fallback to publicKey
  const displayAddress = smartWalletAuthorityPubkey || publicKey;
  
  const handleConnect = useCallback(async () => {
    if (isConnected) {
      disconnect();
      return;
    }
    
    setLocalLoading(true);
    try {
      await connect();
    } catch (err) {
      console.error('Failed to connect LazorKit wallet:', err);
    } finally {
      setLocalLoading(false);
    }
  }, [connect, disconnect, isConnected]);
  
  const loading = isLoading || localLoading;

  return (
    <motion.button
      onClick={handleConnect}
      disabled={loading}
      className={`ml-2 px-4 py-2 font-mono rounded-md flex items-center transition-all duration-300 ${
        isConnected 
          ? 'bg-[#ffdd00]/20 text-[#ffdd00] hover:bg-[#ffdd00]/30 border border-[#ffdd00]/40' 
          : 'bg-[#1a1a18] text-[#ffdd00] hover:bg-[#252520] border border-[#ffdd00]/20'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center">
        <div className="w-5 h-5 mr-2 flex items-center justify-center overflow-hidden rounded-full">
          <img 
            src="https://lazorkit.xyz/logo.png" 
            alt="Lazor Kit Logo" 
            width={20}
            height={20}
            className="object-contain"
          />
        </div>
        
        {loading ? (
          <span className="animate-pulse">Connecting...</span>
        ) : isConnected && displayAddress ? (
          <span>{ellipsify(displayAddress)}</span>
        ) : (
          <span>Lazor Kit</span>
        )}
      </div>
    </motion.button>
  );
}