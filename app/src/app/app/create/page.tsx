'use client';

import React, { useState, useEffect } from 'react';
import { Coins, Trophy, Calendar, Users, Zap, ChevronRight, InfoIcon, ArrowLeftIcon, CheckCircleIcon, Loader2 } from 'lucide-react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletButton } from '@/components/solana/solana-provider';
import { useTransactionToast } from '@/components/ui/ui-layout';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useHuifiProgram } from '@/hooks/useHuifiProgram';
import { useHuifiPoolCreation } from '@/hooks/useHuifiPoolCreation';

export default function CreatePoolPage() {
  const [step, setStep] = useState(1);
  const program = useHuifiProgram();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const transactionToast = useTransactionToast();
  const router = useRouter();
  const { createPoolMutation } = useHuifiPoolCreation();
  const [isCreating, setIsCreating] = useState(false);
  const [isRequestingAirdrop, setIsRequestingAirdrop] = useState(false);
  const [balance, setBalance] = useState(0);
  const [hasCheckedBalance, setHasCheckedBalance] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxPlayers: '',
    frequency: 'daily',
    entryFee: '',
    currency: 'USDC',
    payoutMethod: 'predetermined',
    latePenalty: 'none',
    privacy: 'public',
    agreeTerms: false,
  });

  // Check SOL balance when wallet is connected
  useEffect(() => {
    if (publicKey && connection) {
      const fetchBalance = async () => {
        try {
          const bal = await connection.getBalance(publicKey);
          setBalance(bal / LAMPORTS_PER_SOL);
          setHasCheckedBalance(true);
        } catch (err) {
          console.error("Error fetching balance:", err);
        }
      };
      fetchBalance();
    }
  }, [publicKey, connection]);

  // Function to request an airdrop
  const requestAirdrop = async () => {
    if (!publicKey || !connection) return;
    
    try {
      setIsRequestingAirdrop(true);
      
      // Request 2 SOL (adjust as needed)
      const signature = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      
      // Confirm the transaction
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });
      
      // Update balance
      const newBalance = await connection.getBalance(publicKey);
      setBalance(newBalance / LAMPORTS_PER_SOL);
      
      toast.success(`Successfully received 2 SOL! New balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
    } catch (error) {
      console.error("Airdrop failed:", error);
      toast.error("Failed to request SOL airdrop. Are you connected to Solana devnet?");
    } finally {
      setIsRequestingAirdrop(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Handle checkbox separately
    const isCheckbox = type === 'checkbox';
    // @ts-ignore // TODO: Fix type for checkbox
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? e.target.checked : value }));
  };

  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, id } = e.target;
    setFormData(prev => ({ ...prev, [name]: id }));
  };

  const handleCreateGame = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet first.');
      return;
    }
    if (!program) {
      toast.error('Program not loaded. Please refresh the page.');
      return;
    }
    if (!formData.agreeTerms) {
      toast.error('Please agree to the terms and conditions.');
      return;
    }
    if (!formData.name || !formData.maxPlayers || !formData.entryFee) {
      toast.error('Please fill in all required fields.');
      return;
    }
    
    setIsCreating(true);
  
    try {
      // Check if the user has sufficient SOL balance
      const currentBalance = await connection.getBalance(publicKey);
      if (currentBalance < 10000000) { // 0.01 SOL
        toast.error(`Insufficient SOL balance. You need at least 0.01 SOL to create a pool. Current balance: ${currentBalance / LAMPORTS_PER_SOL} SOL`);
        setIsCreating(false);
        return;
      }
  
      console.log("Starting pool creation with data:", {
        name: formData.name,
        description: formData.description,
        maxPlayers: parseInt(formData.maxPlayers),
        frequency: formData.frequency,
        entryFee: parseFloat(formData.entryFee),
        currency: formData.currency,
        payoutMethod: formData.payoutMethod,
        latePenalty: formData.latePenalty,
        privacy: formData.privacy,
        creator: publicKey.toString(),
        program: program ? "Program loaded" : "Program not loaded"
      });
      
      const signature = await createPoolMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        maxPlayers: parseInt(formData.maxPlayers),
        frequency: formData.frequency as 'daily' | 'weekly' | 'biweekly' | 'monthly',
        entryFee: parseFloat(formData.entryFee),
        currency: formData.currency,
        payoutMethod: formData.payoutMethod as 'predetermined' | 'bidding',
        latePenalty: formData.latePenalty as 'none' | 'small' | 'moderate' | 'strict',
        privacy: formData.privacy as 'public' | 'private',
        creator: publicKey,
      });
  
      console.log("Pool creation successful, signature:", signature);
      transactionToast(signature);
      toast.success('Game created successfully!');
      router.push('/app/pools');
    } catch (error) {
      console.error('Error creating game:', error);
      if (error instanceof Error) {
        toast.error(`Failed to create game: ${error.message}`);
      } else {
        toast.error('Failed to create game: Unknown error');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Show connect button if wallet not connected
  if (!publicKey) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-[#010200] flex flex-col items-center justify-center">
         <h2 className="text-2xl text-[#e6ce04] mb-4">Connect Your Wallet</h2>
         <p className="text-[#f8e555]/70 mb-6">Please connect your wallet to create a new game.</p>
        <WalletButton />
      </div>
    );
  }

  // Display information if SOL balance is insufficient
  if (hasCheckedBalance && balance < 0.01) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto bg-[#1a1a18] rounded-xl shadow-lg p-8 border border-[#e6ce04]/20">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-[#e6ce04]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#e6ce04] mb-2">Insufficient SOL Balance</h2>
            <p className="text-[#f8e555]/70 mb-4">
              You need at least 0.01 SOL to create a pool. Your current balance is {balance.toFixed(4)} SOL.
            </p>
          </div>
          
          <div className="bg-[#252520] p-5 rounded-lg mb-6">
            <h3 className="text-[#e6ce04] font-medium mb-3">Why do I need SOL?</h3>
            <p className="text-sm text-[#f8e555]/70 mb-3">
              Creating a pool requires SOL for:
            </p>
            <ul className="list-disc pl-5 text-sm text-[#f8e555]/70 space-y-1">
              <li>Transaction fees</li>
              <li>Creating on-chain accounts</li>
              <li>Storing game data</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={requestAirdrop}
              disabled={isRequestingAirdrop}
              className="w-full px-6 py-3 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequestingAirdrop ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Requesting SOL...
                </>
              ) : (
                <>
                  Request 2 SOL Airdrop <Coins className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
            
            <div className="text-center text-sm text-[#f8e555]/50 mt-2">
              Note: Airdrops only work on devnet and testnet networks
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Add SOL Balance display at the top */}
        <div className="flex items-center justify-end mb-4">
          <div className="bg-[#252520] px-4 py-2 rounded-lg flex items-center">
            <Coins className="w-4 h-4 text-[#e6ce04] mr-2" />
            <span className="text-[#f8e555]">{balance.toFixed(4)} SOL</span>
            <button 
              onClick={requestAirdrop}
              disabled={isRequestingAirdrop}
              className="ml-2 text-xs bg-[#e6ce04]/10 hover:bg-[#e6ce04]/20 text-[#e6ce04] px-2 py-1 rounded-md transition duration-300 disabled:opacity-50"
            >
              {isRequestingAirdrop ? "Requesting..." : "+2 SOL"}
            </button>
          </div>
        </div>
        
        {/* Header and Progress Steps */}
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-[#e6ce04] rounded-full flex items-center justify-center mr-3">
            <Coins className="w-5 h-5 text-[#010200]" />
          </div>
          <h1 className="text-3xl font-bold text-[#e6ce04]">Create New Game</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#e6ce04] text-[#010200]' : 'bg-[#252520] text-[#f8e555]/70'}`}>1</div>
          <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-[#e6ce04]' : 'bg-[#252520]'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#e6ce04] text-[#010200]' : 'bg-[#252520] text-[#f8e555]/70'}`}>2</div>
          <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-[#e6ce04]' : 'bg-[#252520]'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#e6ce04] text-[#010200]' : 'bg-[#252520] text-[#f8e555]/70'}`}>3</div>
        </div>

        <div className="bg-[#1a1a18] rounded-xl shadow-lg p-6 border border-[#e6ce04]/20 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>

          <div className="relative z-10">
            {step === 1 && (
              <div className="mb-8">
                {/* Step 1 Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#e6ce04] flex items-center">
                    <Trophy className="w-5 h-5 mr-2" /> Game Details
                  </h2>
                  <span className="text-sm bg-[#e6ce04]/10 text-[#e6ce04] px-3 py-1 rounded-full border border-[#e6ce04]/30">Step 1 of 3</span>
                </div>
                <div className="space-y-6">
                  {/* Game Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#f8e555] mb-2">Game Name <span className="text-red-500">*</span></label>
                    <input id="name" name="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="Give your game a catchy title" className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50" />
                  </div>
                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[#f8e555] mb-2">Description</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Describe your game rules and goals" rows={3} className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50"></textarea>
                  </div>
                  {/* Max Players & Frequency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="maxPlayers" className="block text-sm font-medium text-[#f8e555] mb-2 flex items-center"><Users className="w-4 h-4 mr-1" /> Maximum Players <span className="text-red-500">*</span></label>
                      <input id="maxPlayers" name="maxPlayers" type="number" value={formData.maxPlayers} onChange={handleInputChange} placeholder="Enter a number" min="2" max="50" className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50" />
                    </div>
                    <div>
                      <label htmlFor="frequency" className="block text-sm font-medium text-[#f8e555] mb-2 flex items-center"><Calendar className="w-4 h-4 mr-1" /> Contribution Frequency</label>
                      <select id="frequency" name="frequency" value={formData.frequency} onChange={handleInputChange} className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                  {/* Entry Fee & Currency */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="entryFee" className="block text-sm font-medium text-[#f8e555] mb-2 flex items-center"><Coins className="w-4 h-4 mr-1" /> Entry Fee <span className="text-red-500">*</span></label>
                      <input id="entryFee" name="entryFee" type="number" value={formData.entryFee} onChange={handleInputChange} placeholder="0.00" className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50" />
                    </div>
                    <div>
                      <label htmlFor="currency" className="block text-sm font-medium text-[#f8e555] mb-2">Currency</label>
                      <select id="currency" name="currency" value={formData.currency} onChange={handleInputChange} className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent">
                        <option>USDC</option>
                        <option>ETH</option>
                        <option>DAI</option>
                        <option>USDT</option>
                      </select>
                    </div>
                  </div>
                  {/* XP Rewards */}
                  <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10">
                    <h3 className="text-[#e6ce04] font-medium mb-2 flex items-center"><Zap className="w-4 h-4 mr-1" /> XP & Rewards</h3>
                    <div className="space-y-3 text-sm text-[#f8e555]/70">
                      <div className="flex justify-between"><span>Entry XP reward:</span><span className="text-[#e6ce04]">+15 XP per entry</span></div>
                      <div className="flex justify-between"><span>Jackpot winner bonus:</span><span className="text-[#e6ce04]">+100 XP</span></div>
                      <div className="flex justify-between"><span>Game completion bonus:</span><span className="text-[#e6ce04]">+250 XP</span></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="mb-8">
                {/* Step 2 Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#e6ce04] flex items-center"><Trophy className="w-5 h-5 mr-2" /> Game Rules</h2>
                  <span className="text-sm bg-[#e6ce04]/10 text-[#e6ce04] px-3 py-1 rounded-full border border-[#e6ce04]/30">Step 2 of 3</span>
                </div>
                <div className="space-y-6">
                  {/* Payout Method */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8e555] mb-2">Payout Method</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div onClick={() => setFormData(prev => ({ ...prev, payoutMethod: 'predetermined' }))} className={`bg-[#252520] p-4 rounded-lg border hover:border-[#e6ce04]/50 cursor-pointer transition-all ${formData.payoutMethod === 'predetermined' ? 'border-[#e6ce04]' : 'border-[#e6ce04]/20'}`}>
                        <h3 className="text-[#e6ce04] font-medium mb-2">Predetermined Order</h3>
                        <p className="text-sm text-[#f8e555]/70">Set the jackpot order at creation time. Each player gets their turn according to the fixed schedule.</p>
                      </div>
                      <div onClick={() => setFormData(prev => ({ ...prev, payoutMethod: 'bidding' }))} className={`bg-[#252520] p-4 rounded-lg border hover:border-[#e6ce04]/50 cursor-pointer transition-all ${formData.payoutMethod === 'bidding' ? 'border-[#e6ce04]' : 'border-[#e6ce04]/20'}`}>
                        <h3 className="text-[#e6ce04] font-medium mb-2">Bidding System</h3>
                        <p className="text-sm text-[#f8e555]/70">Players bid for earlier positions by offering a discount on the pot they receive.</p>
                      </div>
                    </div>
                  </div>
                  {/* Late Penalties */}
                  <div>
                    <label htmlFor="latePenalty" className="block text-sm font-medium text-[#f8e555] mb-2">Late Contribution Penalties</label>
                    <select id="latePenalty" name="latePenalty" value={formData.latePenalty} onChange={handleInputChange} className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent">
                      <option value="none">None - Players can contribute late without penalty</option>
                      <option value="small">Small - 1% fee for late contributions</option>
                      <option value="moderate">Moderate - 5% fee for late contributions</option>
                      <option value="strict">Strict - Remove players after 24 hours of missed contribution</option>
                    </select>
                  </div>
                  {/* Privacy Settings */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8e555] mb-2">Privacy Settings</label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="radio" id="public" name="privacy" checked={formData.privacy === 'public'} onChange={handleRadioChange} className="mr-2 accent-[#e6ce04]" />
                        <label htmlFor="public" className="text-[#f8e555]">Public Game - Anyone can join</label>
                      </div>
                      <div className="flex items-center">
                        <input type="radio" id="private" name="privacy" checked={formData.privacy === 'private'} onChange={handleRadioChange} className="mr-2 accent-[#e6ce04]" />
                        <label htmlFor="private" className="text-[#f8e555]">Private Game - Invitation only</label>
                      </div>
                    </div>
                  </div>
                  {/* Info Box */}
                  <div className="flex items-center p-4 bg-[#e6ce04]/10 border border-[#e6ce04]/20 rounded-lg">
                    <InfoIcon className="w-5 h-5 text-[#e6ce04] mr-3 flex-shrink-0" />
                    <p className="text-sm text-[#f8e555]">All game rules are encoded in the smart contract and cannot be changed after creation. Choose wisely!</p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mb-8">
                {/* Step 3 Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-[#e6ce04] flex items-center"><Trophy className="w-5 h-5 mr-2" /> Game Review</h2>
                  <span className="text-sm bg-[#e6ce04]/10 text-[#e6ce04] px-3 py-1 rounded-full border border-[#e6ce04]/30">Step 3 of 3</span>
                </div>
                <div className="space-y-6">
                  {/* Game Summary */}
                  <div className="bg-[#252520] p-5 rounded-lg border border-[#e6ce04]/10">
                    <h3 className="text-lg font-semibold mb-4 text-[#e6ce04]">Game Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Game Name</span><span className="font-medium text-[#f8e555]">{formData.name || '-'}</span></div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Players</span><span className="font-medium text-[#f8e555]">Max {formData.maxPlayers || '-'}</span></div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Entry Fee</span><span className="font-medium text-[#f8e555]">{formData.entryFee || '0.00'} {formData.currency}</span></div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Frequency</span><span className="font-medium text-[#f8e555] capitalize">{formData.frequency}</span></div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Payout Method</span><span className="font-medium text-[#f8e555] capitalize">{formData.payoutMethod}</span></div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Privacy</span><span className="font-medium text-[#f8e555] capitalize">{formData.privacy}</span></div>
                      {/* Calculate Max Jackpot and APY based on inputs */}
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Max Jackpot</span><span className="font-medium text-[#e6ce04]">{(parseFloat(formData.entryFee || '0') * parseInt(formData.maxPlayers || '0')) || '0.00'} {formData.currency}</span></div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Estimated APY</span><span className="font-medium text-[#e6ce04]">~12.4%</span></div>
                    </div>
                  </div>
                  {/* Gas & Fees */}
                  <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10">
                    <h3 className="text-[#e6ce04] font-medium mb-3">Gas & Fees</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-[#f8e555]/70">Smart Contract Deployment</span><span className="text-[#f8e555]">~0.012 SOL</span></div>
                      <div className="flex justify-between"><span className="text-[#f8e555]/70">Platform Fee (1%)</span><span className="text-[#f8e555]">{(parseFloat(formData.entryFee || '0') * parseInt(formData.maxPlayers || '0') * 0.01) || '0.00'} {formData.currency}</span></div>
                    </div>
                  </div>
                  {/* Info Box */}
                  <div className="flex items-center p-4 bg-[#e6ce04]/10 border border-[#e6ce04]/20 rounded-lg">
                    <InfoIcon className="w-5 h-5 text-[#e6ce04] mr-3 flex-shrink-0" />
                    <p className="text-sm text-[#f8e555]">By creating this game, you will earn 500 XP and the "Game Creator" achievement badge!</p>
                  </div>
                  {/* Terms Agreement */}
                  <div className="flex items-center">
                    <input type="checkbox" id="agreeTerms" name="agreeTerms" checked={formData.agreeTerms} onChange={handleInputChange} className="mr-2 accent-[#e6ce04]" />
                    <label htmlFor="agreeTerms" className="text-[#f8e555]">I agree to the terms and conditions and understand that smart contract interactions are irreversible</label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="px-6 py-2 bg-[#252520] hover:bg-[#353530] text-[#e6ce04] border border-[#e6ce04]/30 rounded-lg transition duration-300">Back</button>
              ) : ( <div></div> )}

              {step < 3 ? (
                <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center">Continue <ChevronRight className="w-4 h-4 ml-1" /></button>
              ) : (
                <button
                  onClick={handleCreateGame}
                  disabled={isCreating || !formData.agreeTerms || !formData.name || !formData.maxPlayers || !formData.entryFee}
                  className={`px-6 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      Create Game <Trophy className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}