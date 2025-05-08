// filepath: \\wsl.localhost\Ubuntu\home\ngocanh\huifi\huifi-dapp\src\app\app\dashboard\page.tsx // Adjusted path
'use client';

import React from 'react';
import { Wallet, TrendingUp, Trophy, Calendar, Coins, ChevronRight, Zap, Star } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/solana/solana-provider';
// Import necessary hooks for fetching user data (replace with your actual hooks)
// import { useUserDashboardData } from '@/components/huifi/huifi-data-access';
// import { useGetBalance } from '@/components/account/account-data-access'; // For SOL balance if needed

export default function DashboardPage() {
  const { 
    solanaPublicKey,
    solanaIsConnected,
    lazorPublicKey,
    lazorIsConnected,
    lazorSmartWalletAuthorityPubkey 
  } = useWallet();

  // Placeholder for fetching data - replace with actual hook usage
  // const { data: dashboardData, isLoading, error } = useUserDashboardData(publicKey);
  // const { data: solBalance } = useGetBalance(publicKey); // Example for SOL balance

  // Mock data structure (replace with actual data from hooks)
  const isLoading = false; // Set to true while loading
  const dashboardData = solanaPublicKey ? {
      totalEarnings: 1250, // USDC
      currentYield: 10.8,
      activeGamesCount: 3,
      nextEntryTime: '16 hours',
      nextEntryAmount: 100, // USDC
      nextEntryGame: 'Golden Jackpot #42',
      xp: 735,
      level: 4,
      activeGames: [
          { id: 'golden-jackpot-42', name: 'Golden Jackpot #42', currency: 'USDC', amount: 100, frequency: 'daily', position: '8/20', nextEntry: '16 hours', isNextWinner: false },
          { id: 'weekly-ethereum', name: 'Weekly Ethereum', currency: 'ETH', amount: 0.5, frequency: 'weekly', position: '3/10', nextEntry: '3 days', isNextWinner: false },
          { id: 'monthly-stablecoin', name: 'Monthly Stablecoin', currency: 'USDC', amount: 250, frequency: 'monthly', position: '1/12', nextEntry: '14 days', isNextWinner: true },
      ],
      recentActivity: [
          { type: 'Entry Made', game: 'Golden Jackpot #42', amount: '100 USDC', time: 'Yesterday', xp: null },
          { type: 'Jackpot Won!', game: 'Weekly Ethereum', amount: '5 ETH', time: '3 days ago', xp: null },
          { type: 'Game Joined', game: 'Monthly Stablecoin', amount: null, time: '1 week ago', xp: '+50 XP' },
      ],
      balances: [
          { currency: 'USDC', symbol: 'U', amount: '2,450.00' },
          { currency: 'ETH', symbol: 'E', amount: '3.25' },
          // { currency: 'SOL', symbol: 'S', amount: solBalance ? (solBalance / LAMPORTS_PER_SOL).toFixed(4) : '0.00' } // Example SOL balance
      ],
      topGames: [
          { name: 'Business Boost', details: '500 USDC bi-weekly', yield: '15.2%', players: '8/12', hot: false },
          { name: 'High Yield Monthly', details: '1,000 USDC monthly', yield: '18.5%', players: '5/10', hot: true },
      ],
      achievements: [
          { title: 'Early Adopter', icon: Star },
          { title: 'Game Creator', icon: Trophy },
          { title: 'Big Winner', icon: Coins },
      ]
  } : null;

  // Show connect button if neither wallet is connected
  if (!solanaIsConnected && !lazorIsConnected) {
    return (
      <div className="min-h-screen pt-24 pb-16 bg-[#010200] flex flex-col items-center justify-center">
        <h2 className="text-2xl text-[#e6ce04] mb-4">Connect Your Wallet</h2>
        <p className="text-[#f8e555]/70 mb-6">Please connect your wallet to access the dashboard.</p>
        <WalletButton />
      </div>
    );
  }

  if (isLoading) {
       return (
         <div className="min-h-screen pt-24 pb-16 bg-[#010200] flex items-center justify-center">
           <span className="loading loading-spinner loading-lg text-[#e6ce04]"></span>
         </div>
       );
  }

  if (!dashboardData) { // Handle case where data might be null even if connected
      return (
         <div className="min-h-screen pt-24 pb-16 bg-[#010200] flex flex-col items-center justify-center">
           <h2 className="text-2xl text-[#e6ce04] mb-4">No Dashboard Data</h2>
           <p className="text-[#f8e555]/70 mb-6">Could not load dashboard data. Try refreshing or reconnecting.</p>
           <WalletButton />
         </div>
       );
  }


  return (
    // Use main layout provided by src/app/layout.tsx
    <div className="container mx-auto px-4"> {/* Removed min-h-screen, pt, pb, bg */}
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div className="flex items-center">
          {/* ... Icon and Title ... */}
           <div className="w-10 h-10 bg-[#e6ce04] rounded-full flex items-center justify-center mr-3">
             <Trophy className="w-5 h-5 text-[#010200]" />
           </div>
          <div>
            <h1 className="text-3xl font-bold text-[#e6ce04]">Game Center</h1>
            {/* Use dynamic XP/Level */}
            <div className="flex items-center mt-1">
              <Star className="h-4 w-4 text-[#e6ce04] mr-1" />
              <span className="text-sm text-[#f8e555]">Level {dashboardData.level} Player</span>
              <span className="mx-2 text-[#f8e555]/30">•</span>
              <span className="text-sm text-[#f8e555]">{dashboardData.xp} XP</span>
            </div>
          </div>
        </div>
        <Link href="/app/create" className="mt-4 md:mt-0 px-4 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center">
          <Coins className="w-4 h-4 mr-2" /> Create New Game
        </Link>
      </div>

      {/* Stats Cards - Use dynamic data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Earnings */}
        <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 relative overflow-hidden">
           <div className="absolute -left-4 -top-4 w-20 h-20 rounded-full bg-[#e6ce04]/5 blur-xl"></div>
           <div className="relative z-10">
             <div className="flex items-center mb-4"><div className="p-2 bg-[#e6ce04]/10 rounded-lg mr-4"><Wallet className="h-6 w-6 text-[#e6ce04]" /></div><span className="text-[#f8e555]/70">Total Earnings</span></div>
             <p className="text-2xl font-bold text-[#e6ce04]">{dashboardData.totalEarnings.toLocaleString()} USDC</p>
             {/* Add dynamic monthly change if available */}
             <p className="text-sm text-[#e6ce04]/80 mt-2 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> +125 USDC this month</p>
           </div>
        </div>
        {/* Current Yield */}
         <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 relative overflow-hidden">
           <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-[#e6ce04]/5 blur-xl"></div>
           <div className="relative z-10">
             <div className="flex items-center mb-4"><div className="p-2 bg-[#e6ce04]/10 rounded-lg mr-4"><TrendingUp className="h-6 w-6 text-[#e6ce04]" /></div><span className="text-[#f8e555]/70">Average Yield</span></div>
             <p className="text-2xl font-bold text-[#e6ce04]">{dashboardData.currentYield}%</p>
             {/* Add dynamic change if available */}
             <p className="text-sm text-[#e6ce04]/80 mt-2 flex items-center"><TrendingUp className="h-3 w-3 mr-1" /> +2.3% from previous cycle</p>
           </div>
         </div>
        {/* Active Games */}
         <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 relative overflow-hidden">
           <div className="absolute -left-4 -top-4 w-20 h-20 rounded-full bg-[#e6ce04]/5 blur-xl"></div>
           <div className="relative z-10">
             <div className="flex items-center mb-4"><div className="p-2 bg-[#e6ce04]/10 rounded-lg mr-4"><Trophy className="h-6 w-6 text-[#e6ce04]" /></div><span className="text-[#f8e555]/70">Active Games</span></div>
             <p className="text-2xl font-bold text-[#e6ce04]">{dashboardData.activeGamesCount}</p>
             {/* Add dynamic currency count if available */}
             <p className="text-sm text-[#f8e555]/70 mt-2">Across 2 currencies</p>
           </div>
         </div>
        {/* Next Entry */}
         <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 relative overflow-hidden">
           <div className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-[#e6ce04]/5 blur-xl"></div>
           <div className="relative z-10">
             <div className="flex items-center mb-4"><div className="p-2 bg-[#e6ce04]/10 rounded-lg mr-4"><Calendar className="h-6 w-6 text-[#e6ce04]" /></div><span className="text-[#f8e555]/70">Next Entry</span></div>
             <p className="text-2xl font-bold text-[#e6ce04]">{dashboardData.nextEntryTime}</p>
             <p className="text-sm text-[#f8e555]/70 mt-2">{dashboardData.nextEntryAmount} USDC for {dashboardData.nextEntryGame}</p>
           </div>
         </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Games & Recent Activity */}
        <div className="lg:col-span-2">
          {/* Active Games List - Use dynamic data */}
          <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 mb-6 relative overflow-hidden">
             <div className="absolute -left-10 -top-10 w-32 h-32 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
             <div className="relative z-10">
               <h2 className="text-xl font-semibold mb-4 text-[#e6ce04] flex items-center"><Trophy className="w-5 h-5 mr-2" /> Your Active Games</h2>
               <div className="space-y-4">
                 {dashboardData.activeGames.map(game => (
                   <div key={game.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#252520] rounded-lg border border-[#e6ce04]/10 hover:border-[#e6ce04]/30 transition-all duration-200">
                     <div className="mb-3 md:mb-0">
                       <div className="flex items-center">
                         <div className="w-8 h-8 bg-[#e6ce04] rounded-full flex items-center justify-center mr-3"><Coins className="w-4 h-4 text-[#010200]" /></div>
                         <h3 className="font-medium text-[#e6ce04]">{game.name}</h3>
                       </div>
                       <p className="text-sm text-[#f8e555]/70 mt-1 ml-11">{game.amount} {game.currency} {game.frequency}</p>
                     </div>
                     <div className="flex items-center justify-between md:justify-end md:space-x-6">
                       <div className="text-right">
                         <p className={`font-medium text-[#f8e555]`}>Position: <span className={game.isNextWinner ? 'text-green-400' : 'text-[#e6ce04]'}>{game.position}</span></p>
                         <p className="text-xs text-[#f8e555]/70 mt-1">{game.isNextWinner ? `Next jackpot win: ${game.nextEntry}` : `Next entry: ${game.nextEntry}`}</p>
                       </div>
                       <Link href={`/app/pools/${game.id}`}>
                         <ChevronRight className="w-5 h-5 text-[#e6ce04]" />
                       </Link>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
          {/* Recent Activity - Use dynamic data */}
          <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 relative overflow-hidden">
             <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
             <div className="relative z-10">
               <h2 className="text-xl font-semibold mb-4 text-[#e6ce04] flex items-center"><Zap className="w-5 h-5 mr-2" /> Recent Activity</h2>
               <div className="space-y-4">
                 {dashboardData.recentActivity.map((activity, index) => (
                   <div key={index} className="flex items-center justify-between border-b border-[#e6ce04]/10 pb-4 last:border-b-0 last:pb-0">
                     <div className="flex items-center">
                       <div className="w-2 h-2 bg-[#e6ce04] rounded-full mr-3"></div>
                       <div>
                         <p className="font-medium text-[#f8e555]">{activity.type}</p>
                         <p className="text-sm text-[#f8e555]/70">{activity.game}</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="font-medium text-[#e6ce04]">{activity.amount || activity.xp}</p>
                       <p className="text-xs text-[#f8e555]/70">{activity.time}</p>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>

        {/* Right Column: Balance, Top Games, Achievements */}
        <div>
          {/* Your Balance - Use dynamic data */}
          <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 mb-6 relative overflow-hidden">
             <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
             <div className="relative z-10">
               <h2 className="text-xl font-semibold mb-4 text-[#e6ce04] flex items-center"><Wallet className="w-5 h-5 mr-2" /> Your Balance</h2>
               <div className="space-y-4">
                 {dashboardData.balances.map(balance => (
                   <div key={balance.currency} className="flex items-center justify-between p-4 bg-[#252520] rounded-lg border border-[#e6ce04]/10">
                     <div className="flex items-center">
                       <div className="w-8 h-8 bg-[#e6ce04] rounded-full mr-3 flex items-center justify-center text-[#010200] font-bold">{balance.symbol}</div>
                       <p className="font-medium text-[#f8e555]">{balance.currency}</p>
                     </div>
                     <p className="font-medium text-[#e6ce04]">{balance.amount}</p>
                   </div>
                 ))}
               </div>
               {/* Add Deposit/Withdraw functionality if needed */}
               <button className="w-full mt-4 px-4 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center justify-center">
                 <Coins className="w-4 h-4 mr-2" /> Deposit Funds
               </button>
             </div>
          </div>
          {/* Top Games - Use dynamic data */}
          <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 mb-6 relative overflow-hidden">
             <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
             <div className="relative z-10">
               <h2 className="text-xl font-semibold mb-4 text-[#e6ce04] flex items-center"><Star className="w-5 h-5 mr-2" /> Top Games</h2>
               <div className="space-y-4">
                 {dashboardData.topGames.map((game, index) => (
                   <div key={index} className="p-4 bg-[#252520] rounded-lg border border-[#e6ce04]/10 hover:border-[#e6ce04]/30 transition-all duration-200">
                     <h3 className="font-medium text-[#e6ce04] mb-1">{game.name}</h3>
                     <div className="flex items-center mb-2">
                       <span className="text-sm text-[#f8e555]/70">{game.details}</span>
                       {game.hot && <span className="ml-2 px-1.5 py-0.5 bg-[#e6ce04]/20 text-[#e6ce04] text-xs rounded border border-[#e6ce04]/30">HOT</span>}
                     </div>
                     <div className="flex justify-between text-xs">
                       <span className="text-[#e6ce04]">{game.yield} Yield</span>
                       <span className="text-[#f8e555]/70">{game.players} Players</span>
                     </div>
                   </div>
                 ))}
               </div>
               <Link href="/app/pools" className="w-full mt-4 px-4 py-2 text-center block bg-[#252520] hover:bg-[#353530] text-[#e6ce04] rounded-lg hover:border-[#e6ce04]/50 border border-[#e6ce04]/20 transition duration-300 flex items-center justify-center">
                 <Trophy className="w-4 h-4 mr-2" /> Explore All Games
               </Link>
             </div>
          </div>
          {/* Achievements - Use dynamic data */}
          <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 relative overflow-hidden">
             <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
             <div className="relative z-10">
               <h2 className="text-lg font-semibold mb-4 text-[#e6ce04] flex items-center"><Zap className="w-5 h-5 mr-2" /> Achievements</h2>
               <div className="flex flex-wrap gap-2">
                 {dashboardData.achievements.map((ach, index) => {
                   const Icon = ach.icon;
                   return (
                     <div key={index} className="p-2 bg-[#e6ce04]/10 rounded-lg border border-[#e6ce04]/30 flex items-center" title={ach.title}>
                       <Icon className="w-4 h-4 text-[#e6ce04]" />
                     </div>
                   );
                 })}
               </div>
               <Link href="/app/achievements" className="w-full mt-4 px-4 py-2 text-center block bg-[#252520] hover:bg-[#353530] text-[#e6ce04] text-sm rounded-lg hover:border-[#e6ce04]/50 border border-[#e6ce04]/20 transition duration-300 flex items-center justify-center">
                 View All Achievements
               </Link>
             </div>
          </div>
        </div>
      </div>
      {lazorIsConnected && (
        <div className="mt-4">
          <p>Lazor Smart Wallet: {lazorSmartWalletAuthorityPubkey}</p>
        </div>
      )}
    </div>
  );
};