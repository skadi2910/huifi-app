'use client';

import React, { useState } from 'react';
import { Coins, Trophy, Calendar, Users, Zap, ChevronRight, InfoIcon } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react'; // Import useWallet
import { WalletButton } from '@/components/solana/solana-provider'; // Import WalletButton
// Import necessary hooks for program interaction (replace with your actual hooks)
// import { useHuifiProgram } from '@/components/huifi/huifi-data-access';
import { useTransactionToast } from '@/components/ui/ui-layout'; // Import toast

export default function CreatePoolPage() {
  const [step, setStep] = useState(1);
  const { publicKey } = useWallet(); // Get wallet public key
  const transactionToast = useTransactionToast();
  // Placeholder for program interaction hook
  // const { createGameMutation } = useHuifiProgram();

  // Add state to hold form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxPlayers: '',
    frequency: 'daily',
    entryFee: '',
    currency: 'USDC',
    payoutMethod: 'predetermined', // Default or manage selection state
    latePenalty: 'none', // Default or manage selection state
    privacy: 'public', // Default or manage selection state
    agreeTerms: false,
  });

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
      // Should ideally be handled by disabling the button or showing WalletButton
      alert('Please connect your wallet first.');
      return;
    }
    if (!formData.agreeTerms) {
      alert('Please agree to the terms and conditions.');
      return;
    }

    console.log("Creating game with data:", formData);
    // Replace with actual contract call using mutation
    // try {
    //   const signature = await createGameMutation.mutateAsync({
    //     name: formData.name,
    //     description: formData.description,
    //     maxPlayers: parseInt(formData.maxPlayers),
    //     frequency: formData.frequency,
    //     entryFee: parseFloat(formData.entryFee), // Ensure correct type (e.g., BN)
    //     currency: formData.currency, // May need mapping to token mint address
    //     payoutMethod: formData.payoutMethod,
    //     latePenalty: formData.latePenalty,
    //     privacy: formData.privacy,
    //     creator: publicKey,
    //   });
    //   transactionToast(signature);
    //   // Optionally redirect or reset form
    //   setStep(1);
    //   // Reset form data if needed
    // } catch (error) {
    //   console.error("Failed to create game:", error);
    //   alert(`Failed to create game: ${error}`); // Show error to user
    // }
    alert("Game creation logic placeholder. Implement contract interaction."); // Placeholder
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

  return (
    // Use main layout provided by src/app/layout.tsx
    // The <main> tag might be redundant if UiLayout provides it
    <div className="container mx-auto px-4"> {/* Removed min-h-screen, pt, pb, bg */}
      <div className="max-w-3xl mx-auto">
        {/* ... Header and Progress Steps ... */}
         <div className="flex items-center mb-6">
           <div className="w-10 h-10 bg-[#e6ce04] rounded-full flex items-center justify-center mr-3">
             <Coins className="w-5 h-5 text-[#010200]" />
           </div>
           <h1 className="text-3xl font-bold text-[#e6ce04]">Create New Game</h1>
         </div>

         {/* Progress Steps */}
         <div className="flex items-center mb-8">
           {/* ... Step indicators ... */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-[#e6ce04] text-[#010200]' : 'bg-[#252520] text-[#f8e555]/70'}`}>1</div>
            <div className={`h-0.5 w-12 ${step >= 2 ? 'bg-[#e6ce04]' : 'bg-[#252520]'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-[#e6ce04] text-[#010200]' : 'bg-[#252520] text-[#f8e555]/70'}`}>2</div>
            <div className={`h-0.5 w-12 ${step >= 3 ? 'bg-[#e6ce04]' : 'bg-[#252520]'}`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-[#e6ce04] text-[#010200]' : 'bg-[#252520] text-[#f8e555]/70'}`}>3</div>
         </div>

        <div className="bg-[#1a1a18] rounded-xl shadow-lg p-6 border border-[#e6ce04]/20 relative overflow-hidden">
          {/* ... Background decorative elements ... */}
            <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
            <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>

          <div className="relative z-10">
            {step === 1 && (
              <div className="mb-8">
                {/* ... Step 1 Header ... */}
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-semibold text-[#e6ce04] flex items-center">
                     <Trophy className="w-5 h-5 mr-2" /> Game Details
                   </h2>
                   <span className="text-sm bg-[#e6ce04]/10 text-[#e6ce04] px-3 py-1 rounded-full border border-[#e6ce04]/30">Step 1 of 3</span>
                 </div>
                <div className="space-y-6">
                  {/* Game Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#f8e555] mb-2">Game Name</label>
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
                      <label htmlFor="maxPlayers" className="block text-sm font-medium text-[#f8e555] mb-2 flex items-center"><Users className="w-4 h-4 mr-1" /> Maximum Players</label>
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
                      <label htmlFor="entryFee" className="block text-sm font-medium text-[#f8e555] mb-2 flex items-center"><Coins className="w-4 h-4 mr-1" /> Entry Fee</label>
                      <input id="entryFee" name="entryFee" type="number" value={formData.entryFee} onChange={handleInputChange} placeholder="0.00" className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50" />
                    </div>
                    <div>
                      <label htmlFor="currency" className="block text-sm font-medium text-[#f8e555] mb-2">Currency</label>
                      <select id="currency" name="currency" value={formData.currency} onChange={handleInputChange} className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent">
                        <option>USDC</option>
                        <option>ETH</option> {/* Consider if ETH is directly supported or wrapped */}
                        <option>DAI</option>
                        <option>USDT</option>
                      </select>
                    </div>
                  </div>
                  {/* XP Rewards (Static display) */}
                  {/* ...existing code... */}
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
                {/* ... Step 2 Header ... */}
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-semibold text-[#e6ce04] flex items-center"><Trophy className="w-5 h-5 mr-2" /> Game Rules</h2>
                   <span className="text-sm bg-[#e6ce04]/10 text-[#e6ce04] px-3 py-1 rounded-full border border-[#e6ce04]/30">Step 2 of 3</span>
                 </div>
                <div className="space-y-6">
                  {/* Payout Method */}
                  <div>
                    <label className="block text-sm font-medium text-[#f8e555] mb-2">Payout Method</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {/* Add onClick handlers and manage selected state */}
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
                      <option value="moderate">Moderate - 3% fee for late contributions</option>
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
                  {/* ...existing code... */}
                   <div className="flex items-center p-4 bg-[#e6ce04]/10 border border-[#e6ce04]/20 rounded-lg">
                     <InfoIcon className="w-5 h-5 text-[#e6ce04] mr-3 flex-shrink-0" />
                     <p className="text-sm text-[#f8e555]">All game rules are encoded in the smart contract and cannot be changed after creation. Choose wisely!</p>
                   </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mb-8">
                {/* ... Step 3 Header ... */}
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-xl font-semibold text-[#e6ce04] flex items-center"><Trophy className="w-5 h-5 mr-2" /> Game Review</h2>
                   <span className="text-sm bg-[#e6ce04]/10 text-[#e6ce04] px-3 py-1 rounded-full border border-[#e6ce04]/30">Step 3 of 3</span>
                 </div>
                <div className="space-y-6">
                  {/* Game Summary - Use formData */}
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
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Max Jackpot</span><span className="font-medium text-[#e6ce04]">{/* Calculate */} {(parseFloat(formData.entryFee) * parseInt(formData.maxPlayers)) || '0.00'} {formData.currency}</span></div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10"><span className="text-[#f8e555]/70">Estimated APY</span><span className="font-medium text-[#e6ce04]">{/* Calculate */} ~12.4%</span></div>
                    </div>
                  </div>
                  {/* Gas & Fees (Static/Estimated) */}
                  {/* ...existing code... */}
                   <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10">
                     <h3 className="text-[#e6ce04] font-medium mb-3">Gas & Fees</h3>
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between"><span className="text-[#f8e555]/70">Smart Contract Deployment</span><span className="text-[#f8e555]">~0.012 SOL</span></div> {/* Updated to SOL */}
                       <div className="flex justify-between"><span className="text-[#f8e555]/70">Platform Fee (1%)</span><span className="text-[#f8e555]">{/* Calculate */} {(parseFloat(formData.entryFee) * parseInt(formData.maxPlayers) * 0.01) || '0.00'} {formData.currency}</span></div>
                     </div>
                   </div>
                  {/* Info Box */}
                  {/* ...existing code... */}
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
                  // disabled={createGameMutation.isPending || !formData.agreeTerms} // Disable during creation or if terms not agreed
                  disabled={!formData.agreeTerms} // Simplified disabling
                  className={`px-6 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {/* {createGameMutation.isPending ? 'Creating...' : 'Create Game'} <Trophy className="w-4 h-4 ml-2" /> */}
                   Create Game <Trophy className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};