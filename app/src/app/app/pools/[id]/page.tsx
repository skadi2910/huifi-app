'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  CheckCircle,
  Info,
  ArrowRight,
  Trophy,
  Zap,
  Coins
} from 'lucide-react';
import Link from 'next/link';
// Assuming you have hooks to interact with your specific Huifi program
// import { useHuifiProgram, useHuifiPoolAccount } from '@/hooks/use-huifi-program';
import { WalletButton, useAnchorProvider } from '@/components/solana/solana-provider';
import { ExplorerLink } from '@/components/cluster/cluster-ui';
import { useTransactionToast, AppHero, ellipsify } from '@/components/ui/ui-layout';
import toast from 'react-hot-toast';

// Define types for your pool data structure from the program
interface PoolAccountData {
  name: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  contributionAmount: bigint; // Use bigint for lamports or token amounts
  totalValue: bigint;
  frequency: number; // e.g., seconds per round
  status: number; // Enum for Active, Filling, Completed
  currentRound: number;
  totalRounds: number;
  yieldBasisPoints: number; // Basis points for yield
  nextPayoutTimestamp: bigint;
  creator: PublicKey;
  creationTimestamp: bigint;
  participants: { publicKey: PublicKey; round: number; status: number }[]; // Simplified example
  // Add other fields from your program's account structure
}

// Placeholder types until actual program types are defined
type ParticipantStatus = 'Winner' | 'Next' | 'Waiting' | 'Confirmed';
type ContributionStatus = 'pending' | 'processing' | 'confirmed';

interface Participant {
  id: number; // May need adjustment based on how participants are stored
  address: PublicKey;
  status: ParticipantStatus;
  round: number;
  xp: number; // Assuming XP is tracked off-chain or in a separate account
}

interface Transaction { // Likely fetched from Solana history, not stored in pool account
  signature: string;
  blockTime: number;
  type: string; // Parsed from transaction details
  amount: string;
  user: PublicKey;
  status: string; // e.g., 'Confirmed', 'Failed'
  xpChange?: string; // If tracked
}

// Mock hook - replace with your actual program interaction hook
const useHuifiPoolAccount = ({ poolId }: { poolId: PublicKey | undefined }) => {
  // Replace with actual useQuery fetching data from your program
  const mockData: PoolAccountData | null = poolId ? {
    name: "Golden Jackpot #42",
    description: "A daily contribution game with 20 players. Each member contributes 100 USDC daily, with one player winning the entire pot each day!",
    maxParticipants: 20,
    currentParticipants: 18,
    contributionAmount: BigInt(100 * 10**6), // Assuming 6 decimals for USDC
    totalValue: BigInt(2000 * 10**6),
    frequency: 86400, // Daily
    status: 0, // Active
    currentRound: 8,
    totalRounds: 20,
    yieldBasisPoints: 1240, // 12.4%
    nextPayoutTimestamp: BigInt(Date.now() / 1000 + 16 * 3600), // 16 hours from now
    creator: new PublicKey('CREAToRpubkey111111111111111111111111111111'),
    creationTimestamp: BigInt(Date.parse("April 1, 2025") / 1000),
    participants: [
      { publicKey: new PublicKey('PART1pubkey11111111111111111111111111111111'), round: 2, status: 0 }, // Winner
      { publicKey: new PublicKey('PART2pubkey11111111111111111111111111111111'), round: 4, status: 0 }, // Winner
      { publicKey: new PublicKey('PART3pubkey11111111111111111111111111111111'), round: 8, status: 1 }, // Next
      { publicKey: new PublicKey('PART4pubkey11111111111111111111111111111111'), round: 9, status: 2 }, // Waiting
    ],
  } : null;

  // Replace with actual mutations calling your program's instructions
  const contributeMutation = {
    mutateAsync: async () => {
      console.log("Simulating contribute transaction...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return "dummy_contribute_signature_" + Math.random().toString(36).substring(7);
    },
    isPending: false,
  };

  const placeBidMutation = {
    mutateAsync: async (/* { amount, round } */) => {
      console.log("Simulating place bid transaction...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return "dummy_bid_signature_" + Math.random().toString(36).substring(7);
    },
    isPending: false,
  };


  return {
    accountQuery: {
      data: mockData,
      isLoading: false,
      isError: false,
      error: null,
    },
    contributeMutation,
    placeBidMutation,
    // Add other mutations (e.g., claim jackpot)
  };
};

// Mock hook for transaction history - replace with useGetSignatures or similar
const usePoolTransactionHistory = ({ poolId }: { poolId: PublicKey | undefined }) => {
  const mockTransactions: Transaction[] = poolId ? [
    { signature: "sig1...", blockTime: Date.parse("Apr 13, 2025") / 1000, type: "Contribution", amount: "100 USDC", user: new PublicKey('PART1pubkey11111111111111111111111111111111'), status: "Confirmed", xpChange: "+15" },
    { signature: "sig2...", blockTime: Date.parse("Apr 12, 2025") / 1000, type: "Jackpot", amount: "2,000 USDC", user: new PublicKey('PART2pubkey11111111111111111111111111111111'), status: "Confirmed", xpChange: "+100" },
    { signature: "sig3...", blockTime: Date.parse("Apr 12, 2025") / 1000, type: "Contribution", amount: "100 USDC", user: new PublicKey('PART1pubkey11111111111111111111111111111111'), status: "Confirmed", xpChange: "+15" },
  ] : [];

  return {
    data: mockTransactions,
    isLoading: false,
    isError: false,
  };
};


const PoolDetailPage = () => {
  const params = useParams();
  const { publicKey } = useWallet();
  // const provider = useAnchorProvider(); // Use if needed for direct program calls
  const transactionToast = useTransactionToast();

  const poolId = useMemo(() => {
    try {
      return params?.id ? new PublicKey(params.id as string) : undefined;
    } catch (e) {
      console.error("Invalid pool ID:", params?.id);
      return undefined;
    }
  }, [params?.id]);

  const { accountQuery, contributeMutation, placeBidMutation } = useHuifiPoolAccount({ poolId });
  const historyQuery = usePoolTransactionHistory({ poolId }); // Fetch transaction history

  const poolData = accountQuery.data;

  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'transactions' | 'terms'>('overview');
  const [contributionStatus, setContributionStatus] = useState<ContributionStatus>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [targetBidRound, setTargetBidRound] = useState<number>(0);

  // Calculate time remaining until next payout
  useEffect(() => {
    if (poolData?.nextPayoutTimestamp) {
      const updateTimer = () => {
        const now = BigInt(Math.floor(Date.now() / 1000));
        const remaining = poolData.nextPayoutTimestamp - now;
        setTimeRemaining(remaining > 0 ? Number(remaining) : 0);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [poolData?.nextPayoutTimestamp]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleContribute = async () => {
    if (!publicKey || !poolId) {
      toast.error("Wallet not connected or pool ID missing");
      return;
    }
    setContributionStatus('processing');
    try {
      const signature = await contributeMutation.mutateAsync(/* pass necessary args */);
      transactionToast(signature);
      setContributionStatus('confirmed');
      setShowConfetti(true);
      // accountQuery.refetch(); // Refetch pool data after contribution
      setTimeout(() => setShowConfetti(false), 3000);
    } catch (error: any) {
      toast.error(`Contribution failed: ${error?.message}`);
      setContributionStatus('pending');
    }
  };

  const handlePlaceBid = async () => {
     if (!publicKey || !poolId || !bidAmount || !targetBidRound) {
       toast.error("Missing required bid information or wallet connection");
       return;
     }
     // Add validation for bidAmount (numeric, positive)
     try {
       const signature = await placeBidMutation.mutateAsync({
         // amount: parseFloat(bidAmount), // Convert to correct format/units
         // round: targetBidRound,
         // poolAccount: poolId,
       });
       transactionToast(signature);
       setIsBidding(false);
       setBidAmount('');
       // accountQuery.refetch(); // Refetch pool data after bid
     } catch (error: any) {
       toast.error(`Bid failed: ${error?.message}`);
     }
   };

  // --- Mappers to convert program data to UI display ---
  const mapFrequency = (seconds: number): string => {
    if (seconds === 86400) return "Daily";
    if (seconds === 604800) return "Weekly";
    // Add more cases as needed
    return `${seconds / 3600} hours`;
  };

  const mapStatus = (statusEnum: number): string => {
    switch (statusEnum) {
      case 0: return "Active";
      case 1: return "Filling";
      case 2: return "Completed";
      default: return "Unknown";
    }
  };

  const mapParticipantStatus = (statusEnum: number): ParticipantStatus => {
     switch (statusEnum) {
       case 0: return "Winner";
       case 1: return "Next";
       case 2: return "Waiting";
       case 3: return "Confirmed"; // Assuming Confirmed state exists
       default: return "Waiting";
     }
   };

  const formatAmount = (amount: bigint, decimals: number): string => {
    // Basic formatting, consider using a library for precision
    return (Number(amount) / (10**decimals)).toFixed(2);
  };

  const getStatusBadge = (status: ParticipantStatus | string) => {
    // ... (keep existing badge logic or adapt)
    switch (status) {
      case 'Winner':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#e6ce04]/20 text-[#e6ce04] border border-[#e6ce04]/50 flex items-center"><Trophy className="w-3 h-3 mr-1" /> Winner</span>;
      case 'Next':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#e6ce04]/10 text-[#e6ce04] border border-[#e6ce04]/30 flex items-center"><Zap className="w-3 h-3 mr-1" /> Next</span>;
      case 'Waiting':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#1a1a18] text-[#f8e555]/70 border border-[#e6ce04]/20">Waiting</span>;
      case 'Confirmed':
        return <span className="px-2 py-1 text-xs rounded-full bg-[#e6ce04]/20 text-[#e6ce04] border border-[#e6ce04]/50 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Confirmed</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-[#1a1a18] text-[#f8e555]/70 border border-[#e6ce04]/20">{status}</span>;
    }
  };

  // --- Loading / Error / No Pool States ---
  if (accountQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (accountQuery.isError || !poolData) {
    return (
      <AppHero title="Error" subtitle={`Failed to load pool data for ID: ${params?.id}. ${accountQuery.error?.message || 'Pool not found.'}`} />
    );
  }

  // --- Render Pool Details ---
  const contributionAmountStr = formatAmount(poolData.contributionAmount, 6); // Assuming 6 decimals for USDC
  const totalValueStr = formatAmount(poolData.totalValue, 6);
  const yieldStr = (poolData.yieldBasisPoints / 100).toFixed(2) + "%";
  const frequencyStr = mapFrequency(poolData.frequency);
  const statusStr = mapStatus(poolData.status);
  const nextPayoutParticipant = poolData.participants.find(p => p.status === 1); // Find 'Next' participant

  // Assuming XP and Level are fetched separately based on publicKey
  const userLevel = 3; // Placeholder
  const userXP = 125; // Placeholder

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#010200]">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Basic confetti placeholder */}
          <div className="absolute animate-float top-1/4 left-1/4 h-8 w-8 rounded-full bg-[#e6ce04]"></div>
          <div className="absolute animate-float delay-300 top-1/3 right-1/4 h-6 w-6 rounded-full bg-[#e6ce04]"></div>
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Game header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#e6ce04] rounded-full flex items-center justify-center">
              <Coins className="w-6 h-6 text-[#010200]" />
            </div>
            <h1 className="text-3xl font-bold text-[#e6ce04]">{poolData.name}</h1>
          </div>
          {publicKey && ( // Show XP/Level only if wallet is connected
            <div className="flex items-center mt-4 md:mt-0 bg-[#1a1a18] rounded-lg px-4 py-2 border border-[#e6ce04]/20">
              <Trophy className="h-5 w-5 text-[#e6ce04] mr-2" />
              <span className="mr-3 text-[#f8e555]">Your Level:</span>
              <span className="font-bold text-[#e6ce04]">{userLevel}</span>
              <div className="ml-3 w-24 h-2 bg-[#1a1a18] rounded-full border border-[#e6ce04]/20">
                <div className="h-full bg-[#e6ce04] rounded-full" style={{ width: `${(userXP % 100)}%` }}></div> {/* Adjust XP logic */}
              </div>
              <span className="ml-2 text-xs text-[#f8e555]">{userXP} XP</span>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column */}
          <div className="lg:w-2/3">
            <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 mb-6 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
              <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 relative z-10">
                <div>
                  <div className="flex items-center text-sm text-[#f8e555]/70 mb-3 space-x-4">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {poolData.currentParticipants}/{poolData.maxParticipants} Players
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {frequencyStr}
                    </span>
                    <span className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {yieldStr}
                    </span>
                  </div>
                  <p className="text-[#f8e555] mb-4">
                    {poolData.description}
                  </p>
                </div>
                <span className="mt-2 md:mt-0 px-3 py-1 rounded-full bg-[#e6ce04]/10 text-[#e6ce04] text-sm font-medium border border-[#e6ce04]/30">
                  {statusStr}
                </span>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                 {/* ... Tab buttons ... */}
                 <button
                   onClick={() => setActiveTab('overview')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                     activeTab === 'overview'
                       ? 'bg-[#e6ce04] text-[#010200]'
                       : 'bg-[#252520] text-[#f8e555]/70 border border-[#e6ce04]/20 hover:bg-[#252520]/80'
                   }`}
                 >
                   Game Overview
                 </button>
                 <button
                   onClick={() => setActiveTab('participants')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                     activeTab === 'participants'
                       ? 'bg-[#e6ce04] text-[#010200]'
                       : 'bg-[#252520] text-[#f8e555]/70 border border-[#e6ce04]/20 hover:bg-[#252520]/80'
                   }`}
                 >
                   Players
                 </button>
                 <button
                   onClick={() => setActiveTab('transactions')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                     activeTab === 'transactions'
                       ? 'bg-[#e6ce04] text-[#010200]'
                       : 'bg-[#252520] text-[#f8e555]/70 border border-[#e6ce04]/20 hover:bg-[#252520]/80'
                   }`}
                 >
                   History
                 </button>
                 <button
                   onClick={() => setActiveTab('terms')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                     activeTab === 'terms'
                       ? 'bg-[#e6ce04] text-[#010200]'
                       : 'bg-[#252520] text-[#f8e555]/70 border border-[#e6ce04]/20 hover:bg-[#252520]/80'
                   }`}
                 >
                   Rules
                 </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Current Round */}
                    <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10 group hover:border-[#e6ce04]/30 transition-all duration-300">
                      <h3 className="text-sm text-[#f8e555]/70 mb-1 group-hover:text-[#f8e555]">Current Round</h3>
                      <div className="flex items-center">
                        <p className="text-xl font-semibold text-[#e6ce04]">{poolData.currentRound}</p>
                        <span className="mx-2 text-[#f8e555]/50">of</span>
                        <p className="text-lg text-[#f8e555]">{poolData.totalRounds}</p>
                        <div className="ml-auto">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-[#e6ce04]/30">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray={`${poolData.currentRound / poolData.totalRounds * 62.83} 62.83`} strokeLinecap="round" transform="rotate(-90 12 12)" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    {/* Next Winner */}
                    <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10 group hover:border-[#e6ce04]/30 transition-all duration-300">
                      <h3 className="text-sm text-[#f8e555]/70 mb-1 group-hover:text-[#f8e555]">Next Winner</h3>
                      <div className="flex items-center">
                        <p className="text-xl font-semibold text-[#e6ce04]">
                          {nextPayoutParticipant ? ellipsify(nextPayoutParticipant.publicKey.toString()) : 'N/A'}
                        </p>
                        <div className="ml-auto bg-[#e6ce04]/10 p-1 rounded-full">
                          <Trophy className="h-5 w-5 text-[#e6ce04]" />
                        </div>
                      </div>
                    </div>
                    {/* Countdown */}
                    <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-shift"></div>
                      <div className="relative z-10">
                        <h3 className="text-sm text-[#f8e555]/70 mb-1">Countdown to Jackpot</h3>
                        <div className="flex items-center">
                          <p className="text-xl font-semibold text-[#e6ce04] animate-pulse">{formatTime(timeRemaining)}</p>
                          <div className="ml-auto">
                            <Clock className="h-5 w-5 text-[#e6ce04]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Game Information */}
                  <div className="bg-[#252520] p-5 rounded-lg border border-[#e6ce04]/10 mb-6 relative overflow-hidden">
                    <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>
                    <h3 className="text-lg font-semibold mb-4 text-[#e6ce04]">Game Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 relative z-10">
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10">
                        <span className="text-[#f8e555]/70">Game Creator</span>
                        <ExplorerLink path={`account/${poolData.creator.toString()}`} label={ellipsify(poolData.creator.toString())} className="font-medium text-[#f8e555] hover:text-[#e6ce04]" />
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10">
                        <span className="text-[#f8e555]/70">Created On</span>
                        <span className="font-medium text-[#f8e555]">{new Date(Number(poolData.creationTimestamp) * 1000).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10">
                        <span className="text-[#f8e555]/70">Entry Fee</span>
                        <span className="font-medium text-[#f8e555]">{contributionAmountStr} USDC</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10">
                        <span className="text-[#f8e555]/70">Total Jackpot</span>
                        <span className="font-medium text-[#e6ce04]">{totalValueStr} USDC</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10">
                        <span className="text-[#f8e555]/70">Frequency</span>
                        <span className="font-medium text-[#f8e555]">{frequencyStr}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10">
                        <span className="text-[#f8e555]/70">Earnings Boost</span>
                        <span className="font-medium text-[#e6ce04]">{yieldStr} <span className="text-[#f8e555]/50">APY</span></span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#e6ce04]/10 md:col-span-2">
                        <span className="text-[#f8e555]/70">XP per Contribution</span>
                        <span className="font-medium text-[#e6ce04]">+15 XP</span> {/* Assuming fixed XP */}
                      </div>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="flex items-center p-4 bg-[#e6ce04]/10 border border-[#e6ce04]/20 rounded-lg mb-6">
                    <Info className="w-5 h-5 text-[#e6ce04] mr-3 flex-shrink-0" />
                    <p className="text-sm text-[#f8e555]">
                      This game uses a rotation order determined by the smart contract at creation. Each player will win the full jackpot once during the game's lifetime.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'participants' && (
                 <div className="overflow-x-auto">
                   <table className="min-w-full">
                     <thead>
                       <tr className="bg-[#252520] border-b border-[#e6ce04]/10">
                         <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Rank</th>
                         <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Player</th>
                         <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Jackpot Round</th>
                         <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Status</th>
                         {/* <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">XP</th> */}
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[#e6ce04]/10">
                       {poolData.participants.map((participant, index) => (
                         <tr key={participant.publicKey.toString()} className="hover:bg-[#252520] transition-colors duration-150">
                           <td className="py-3 px-4 text-sm text-[#f8e555]">
                             <div className="flex items-center">
                               <div className="w-6 h-6 rounded-full bg-[#252520] border border-[#e6ce04]/20 flex items-center justify-center mr-2 text-xs">
                                 {index + 1} {/* Rank might need adjustment based on sorting */}
                               </div>
                             </div>
                           </td>
                           <td className="py-3 px-4 text-sm font-medium text-[#e6ce04]">
                             <ExplorerLink path={`account/${participant.publicKey.toString()}`} label={ellipsify(participant.publicKey.toString())} />
                           </td>
                           <td className="py-3 px-4 text-sm text-[#f8e555]/70">Round {participant.round}</td>
                           <td className="py-3 px-4 text-sm">{getStatusBadge(mapParticipantStatus(participant.status))}</td>
                           {/* <td className="py-3 px-4 text-sm text-[#e6ce04]">{participant.xp} XP</td> */}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}

              {activeTab === 'transactions' && (
                 <div className="overflow-x-auto">
                   {historyQuery.isLoading ? (
                     <span className="loading loading-spinner"></span>
                   ) : historyQuery.isError ? (
                     <div className="text-red-500">Error loading transaction history.</div>
                   ) : (
                     <table className="min-w-full">
                       <thead>
                         <tr className="bg-[#252520] border-b border-[#e6ce04]/10">
                           <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Date</th>
                           <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Event</th>
                           <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Amount</th>
                           <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Player</th>
                           <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Tx</th>
                           {/* <th className="py-3 px-4 text-left text-xs font-medium text-[#f8e555]/70 uppercase tracking-wider">Reward</th> */}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-[#e6ce04]/10">
                         {historyQuery.data?.map((tx) => (
                           <tr key={tx.signature} className="hover:bg-[#252520] transition-colors duration-150">
                             <td className="py-3 px-4 text-sm text-[#f8e555]/70">{new Date(tx.blockTime * 1000).toLocaleString()}</td>
                             <td className="py-3 px-4 text-sm font-medium text-[#e6ce04]">{tx.type}</td>
                             <td className="py-3 px-4 text-sm text-[#f8e555]">{tx.amount}</td>
                             <td className="py-3 px-4 text-sm text-[#f8e555]/70">
                               <ExplorerLink path={`account/${tx.user.toString()}`} label={ellipsify(tx.user.toString())} />
                             </td>
                             <td className="py-3 px-4 text-sm">
                               <ExplorerLink path={`tx/${tx.signature}`} label={ellipsify(tx.signature)} />
                             </td>
                             {/* <td className="py-3 px-4 text-sm font-medium text-[#e6ce04]">{tx.xpChange}</td> */}
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   )}
                 </div>
               )}

              {activeTab === 'terms' && (
                <div className="space-y-6">
                  {/* ... Rules content ... */}
                  <div>
                     <h3 className="text-lg font-semibold mb-3 text-[#e6ce04]">Game Rules</h3>
                     <p className="text-[#f8e555]/70 mb-3">
                       By joining this game, you agree to the following rules:
                     </p>
                     <ul className="list-disc pl-5 space-y-2 text-[#f8e555]">
                       <li>Contribute {contributionAmountStr} USDC {frequencyStr.toLowerCase()}.</li>
                       <li>Maintain sufficient funds in your connected wallet.</li>
                       <li>The jackpot order is predetermined and cannot be changed unless through bidding.</li>
                       <li>Missing a contribution will result in penalty points and potential disqualification (details depend on program logic).</li>
                       <li>All transactions are final and recorded on the blockchain.</li>
                       <li>Players earn XP for each successful contribution and bonus XP for completing a full cycle (XP logic may be off-chain).</li>
                     </ul>
                   </div>
                   {/* ... Rewards & Benefits ... */}
                   <div>
                     <h3 className="text-lg font-semibold mb-3 text-[#e6ce04]">Rewards & Benefits</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="bg-[#252520] rounded-lg p-4 border border-[#e6ce04]/10">
                         <h4 className="font-medium text-[#e6ce04] mb-2">Contributions</h4>
                         <p className="text-sm text-[#f8e555]/70">+15 XP per contribution</p>
                       </div>
                       <div className="bg-[#252520] rounded-lg p-4 border border-[#e6ce04]/10">
                         <h4 className="font-medium text-[#e6ce04] mb-2">Jackpot Winner</h4>
                         <p className="text-sm text-[#f8e555]/70">+100 XP + full pot</p>
                       </div>
                       <div className="bg-[#252520] rounded-lg p-4 border border-[#e6ce04]/10">
                         <h4 className="font-medium text-[#e6ce04] mb-2">Game Completion</h4>
                         <p className="text-sm text-[#f8e555]/70">+250 XP bonus</p>
                       </div>
                     </div>
                   </div>
                   {/* Smart Contract Link */}
                   <div>
                     <h3 className="text-lg font-semibold mb-3 text-[#e6ce04]">Smart Contract</h3>
                     <div className="flex items-center justify-between bg-[#252520] p-3 rounded-lg border border-[#e6ce04]/10">
                       <span className="text-sm font-mono text-[#f8e555]/70">{poolId ? ellipsify(poolId.toString(), 16) : 'N/A'}</span>
                       {poolId && <ExplorerLink path={`account/${poolId.toString()}`} label="View on Explorer" className="text-[#e6ce04] hover:underline text-sm" />}
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:w-1/3">
            <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 mb-6 relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-32 h-32 rounded-full bg-[#e6ce04]/5 blur-2xl"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#e6ce04]">Next Game Entry</h3>
                  <div className="w-10 h-10 rounded-full bg-[#e6ce04]/10 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-[#e6ce04]" />
                  </div>
                </div>

                {/* Countdown Timer */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#f8e555]/70">Time Remaining</span>
                    <span className="font-medium text-[#e6ce04]">{formatTime(timeRemaining)}</span>
                  </div>
                  <div className="w-full bg-[#252520] rounded-full h-2.5 border border-[#e6ce04]/10">
                    <div
                      className="bg-[#e6ce04] h-2 rounded-full animate-progress"
                      style={{ width: `${Math.max(0, 1 - timeRemaining / poolData.frequency) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Entry Details */}
                <div className="bg-[#252520] p-4 rounded-lg border border-[#e6ce04]/10 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#f8e555]/70">Entry Fee</span>
                    <span className="font-medium text-[#e6ce04]">{contributionAmountStr} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#f8e555]/70">Today's Winner</span>
                    <span className="font-medium text-[#e6ce04]">
                      {nextPayoutParticipant ? ellipsify(nextPayoutParticipant.publicKey.toString()) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[#f8e555]/70">XP Reward</span>
                    <span className="font-medium text-[#e6ce04]">+15 XP</span>
                  </div>
                </div>

                {/* Contribution Button Logic */}
                {!publicKey ? (
                  <WalletButton />
                ) : contributionStatus === 'pending' ? (
                  <button
                    onClick={handleContribute}
                    disabled={contributeMutation.isPending}
                    className="w-full py-3 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg transition duration-300 font-medium flex items-center justify-center disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4 mr-2" />
                    Play Now
                  </button>
                ) : contributionStatus === 'processing' ? (
                  <button
                    disabled
                    className="w-full py-3 bg-[#e6ce04]/70 text-[#010200] rounded-lg flex items-center justify-center"
                  >
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#010200]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </button>
                ) : ( // Confirmed
                  <div className="text-center p-4 bg-[#252520] rounded-lg border border-[#e6ce04]/20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#e6ce04]/20 mb-3 p-3">
                      <Trophy className="w-8 h-8 text-[#e6ce04] animate-pulse" />
                    </div>
                    <h4 className="text-lg font-medium text-[#e6ce04] mb-1">Entry Confirmed!</h4>
                    <p className="text-sm text-[#f8e555]/70 mb-3">You've earned +15 XP for today's contribution</p>
                    <Link
                      href="/app/dashboard" // Link to user's dashboard
                      className="text-[#e6ce04] hover:text-[#f8e555] text-sm flex items-center justify-center"
                    >
                      View your stats <ArrowRight className="ml-1 w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Bidding Section */}
            {statusStr === 'Active' && publicKey && !isBidding && (
              <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 relative overflow-hidden">
                {/* ... background effect ... */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-[#e6ce04]">Power Move</h3>
                    <span className="px-2 py-1 rounded-full bg-[#e6ce04]/10 text-[#e6ce04] text-xs font-medium border border-[#e6ce04]/30">
                      Boost Your Chances
                    </span>
                  </div>
                  <p className="text-sm text-[#f8e555] mb-5">
                    Want to receive the jackpot earlier? Place a bid to jump ahead in the rotation! (If bidding is enabled for this pool)
                  </p>
                  <button
                    onClick={() => setIsBidding(true)}
                    className="w-full py-2.5 bg-[#252520] hover:bg-[#353530] text-[#e6ce04] border border-[#e6ce04]/30 rounded-lg transition duration-300 flex items-center justify-center"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Place Power Bid
                  </button>
                </div>
              </div>
            )}

            {isBidding && publicKey && (
              <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20">
                <h3 className="text-lg font-semibold mb-4 text-[#e6ce04] flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Place Your Power Bid
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#f8e555] mb-2">
                    Bid Amount (USDC Discount)
                  </label>
                  <input
                    type="number" // Use number type
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Enter discount amount"
                    className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent placeholder-[#f8e555]/50"
                  />
                  <p className="text-xs text-[#f8e555]/70 mt-2">
                    This discount will be taken from your final jackpot amount if your bid wins.
                  </p>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-[#f8e555] mb-2">
                    Desired Jackpot Round
                  </label>
                  <select
                    value={targetBidRound || ''}
                    onChange={(e) => setTargetBidRound(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-[#e6ce04]/30 rounded-lg bg-[#252520] text-[#f8e555] focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent"
                  >
                    <option value="" disabled>Select Round</option>
                    {Array.from({ length: poolData.totalRounds - poolData.currentRound }, (_, i) => poolData.currentRound + i + 1)
                      .filter(round => !poolData.participants.some(p => p.round === round && p.status !== 2)) // Filter out already assigned/won rounds
                      .map(round => (
                        <option key={round} value={round}>
                          Round {round}
                        </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePlaceBid}
                    disabled={placeBidMutation.isPending || !bidAmount || !targetBidRound}
                    className="flex-1 py-2.5 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 disabled:opacity-50"
                  >
                    {placeBidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
                  </button>
                  <button
                    onClick={() => setIsBidding(false)}
                    disabled={placeBidMutation.isPending}
                    className="flex-1 py-2.5 bg-[#252520] hover:bg-[#353530] text-[#f8e555] border border-[#e6ce04]/30 rounded-lg transition duration-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Level progression teaser */}
            {publicKey && (
              <div className="mt-6 p-4 bg-[#252520] rounded-lg border border-[#e6ce04]/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[#e6ce04]">Level Progress</h3>
                  <span className="text-xs text-[#f8e555]/70">{userXP}/250 XP</span> {/* Adjust max XP per level */}
                </div>
                <div className="w-full h-2 bg-[#1a1a18] rounded-full">
                  <div className="h-full bg-[#e6ce04] rounded-full" style={{ width: `${(userXP / 250) * 100}%` }}></div>
                </div>
                <p className="text-xs text-[#f8e555]/70 mt-2">
                  Level up to unlock better rewards and special game features!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default PoolDetailPage;