'use client';

import React, { useState } from 'react';
import { useInitializeProtocol } from '@/hooks/useInitializeProtocol';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletButton } from '@/components/solana/solana-provider';
import { useTransactionToast } from '@/components/ui/ui-layout';
import { toast } from 'react-hot-toast';
import { Loader2, Shield } from 'lucide-react';

export default function AdminPage() {
  const { publicKey } = useWallet();
  const { initializeMutation } = useInitializeProtocol();
  const [protocolFeeBps, setProtocolFeeBps] = useState(100); // 1% default
  const [isInitializing, setIsInitializing] = useState(false);
  const transactionToast = useTransactionToast();

  const handleInitializeProtocol = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first.');
      return;
    }

    if (!initializeMutation) {
      toast.error('Initialization mutation not available.');
      return;
    }

    setIsInitializing(true);
    try {
      const signature = await initializeMutation.mutateAsync(protocolFeeBps);
      transactionToast(signature);
      toast.success('Protocol initialized successfully!');
    } catch (error) {
      console.error('Error initializing protocol:', error);
      if (error instanceof Error) {
        toast.error(`Failed to initialize protocol: ${error.message}`);
      } else {
        toast.error('Failed to initialize protocol: Unknown error');
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Show connect button if wallet not connected
  if (!publicKey) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-[#010200] flex flex-col items-center justify-center">
         <h2 className="text-2xl text-[#e6ce04] mb-4">Connect Your Wallet</h2>
         <p className="text-[#f8e555]/70 mb-6">Please connect your wallet to access the admin panel.</p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <div className="w-10 h-10 bg-[#e6ce04] rounded-full flex items-center justify-center mr-3">
            <Shield className="w-5 h-5 text-[#010200]" />
          </div>
          <h1 className="text-3xl font-bold text-[#e6ce04]">Admin Panel</h1>
        </div>

        <div className="bg-[#1a1a18] rounded-xl shadow-lg p-6 border border-[#e6ce04]/20 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-[#e6ce04] mb-6">Initialize Protocol</h2>
            
            <div className="mb-6">
              <label htmlFor="protocolFee" className="block text-sm font-medium text-[#f8e555] mb-2">Protocol Fee (basis points)</label>
              <input 
                id="protocolFee" 
                type="number" 
                value={protocolFeeBps} 
                onChange={(e) => setProtocolFeeBps(Number(e.target.value))}
                min="0" 
                max="10000" 
                className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent" 
              />
              <p className="text-sm text-[#f8e555]/70 mt-1">1% = 100 basis points, 10% = 1000 basis points</p>
            </div>
            
            <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10 mb-6">
              <h3 className="text-[#e6ce04] font-medium mb-2">Protocol Settings</h3>
              <div className="text-sm text-[#f8e555]">
                <p>This will initialize the protocol settings with your wallet as the admin.</p>
                <p className="mt-2">Protocol fee: {(protocolFeeBps / 100).toFixed(2)}%</p>
                <p className="mt-2">Admin: {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}</p>
              </div>
            </div>
            
            <button
              onClick={handleInitializeProtocol}
              disabled={isInitializing || !initializeMutation}
              className="w-full px-6 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initializing...
                </>
              ) : (
                'Initialize Protocol'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}