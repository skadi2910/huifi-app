'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import BN from 'bn.js';
import toast from 'react-hot-toast';
import { 
  Coins, Trophy, Zap, CheckCircle, Calendar,
  Clock, Users, Wallet, ArrowLeft, ExternalLink
} from 'lucide-react';

// Import hooks and components
import { useHuifiProgram } from '@/hooks/useHuifiProgram';
// Fix missing modules by creating them or updating import paths
// For now, create stubs that you'll replace with real implementations
const useTransactionToast = () => (tx: string) => console.log(`Transaction toast: ${tx}`);
import { AppHero } from '@/components/ui/app-hero';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Define proper interfaces for HuifiPool if it's not already defined
// This is to fix the issue with ExtendedHuifiPool extending HuifiPool
interface HuifiPool {
  creator: PublicKey;
  tokenMint: PublicKey;
  maxParticipants: number;
  currentParticipants: number;
  contributionAmount: BN;
  cycleDurationSeconds: BN;
  payoutDelaySeconds: BN;
  earlyWithdrawalFeeBps: number;
  collateralRequirementBps: number;
  status: number;
  totalValue: BN;
  currentRound: number;
  nextPayoutTimestamp: BN | number;
  startTime: BN | number;
  yieldBasisPoints?: number;
  yieldStrategy: number; // Changed from YieldPlatform to number
  participants: PublicKey[];
  bump: number;
}

// Fix the ExtendedHuifiPool interface to make properties optional correctly
interface ExtendedHuifiPool extends Omit<HuifiPool, 'name'> {
  totalRounds?: number;
  name?: string;
  description?: string;
  frequency?: string;
}

interface PoolParticipant {
  publicKey: PublicKey;
  status: ParticipantStatus;
}

interface Transaction {
  signature: string;
  blockTime: number;
  type: string;
  amount?: string;
  user: PublicKey;
  status: string;
  xpChange?: string;
}

interface DisplayData {
  contributionAmount: string;
  totalValue: string;
  yield: string;
  frequency: string;
  status: string;
  earlyWithdrawalFee: string;
  yieldPlatform: string;
  nextWinner?: PoolParticipant;
}

type ContributionStatus = 'pending' | 'processing' | 'confirmed';
type ParticipantStatus = 'Winner' | 'Next' | 'Waiting' | 'Confirmed';
type TabType = 'overview' | 'participants' | 'transactions' | 'terms';

// Enum for pool status (should be imported from types)
enum PoolStatus {
  Filling = 0,
  Active = 1,
  Completed = 2
}

// Enum for yield platforms (should be imported from types)
// Fix the YieldPlatform enum to use string values for indexing
enum YieldPlatform {
  None = 0,
  JitoSol = 1,
  Kamino = 2
}

// Map for YieldPlatform display names
const YIELD_PLATFORM_NAMES: Record<number, string> = {
  [YieldPlatform.None]: "None",
  [YieldPlatform.JitoSol]: "Jito SOL",
  [YieldPlatform.Kamino]: "Kamino"
};

const PoolDetailPage = () => {
  // Hooks
  const params = useParams();
  const router = useRouter();
  const { publicKey, connected } = useWallet();
  const transactionToast = useTransactionToast();
  const { program } = useHuifiProgram();

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [contributionStatus, setContributionStatus] = useState<ContributionStatus>('pending');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isBidding, setIsBidding] = useState<boolean>(false);
  const [bidAmount, setBidAmount] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [targetBidRound, setTargetBidRound] = useState<number>(0);

  // Derive pool ID from URL
  const poolId = useMemo(() => {
    try {
      return params?.id ? new PublicKey(params.id as string) : undefined;
    } catch (e) {
      console.error("Invalid pool ID:", params?.id);
      return undefined;
    }
  }, [params?.id]);

  // Mock data hooks (replace with actual implementations)
  const { data: poolData, isLoading, isError, error, refetch: refetchPool } = useMockPoolAccount(poolId);
  const { mutateAsync: contribute, isLoading: isContributing } = useMockContribution();
  const { mutateAsync: placeBid, isLoading: isBidPlacing } = useMockBidPlacement();
  const { data: historyData, isLoading: isHistoryLoading, isError: isHistoryError, refetch: refetchHistory } = useMockHistory(poolId);

  // Derive participants list with statuses
  const poolParticipants = useMemo<PoolParticipant[]>(() => {
    if (!poolData || !poolData.participants) return [];

    return poolData.participants
      .filter(pk => !pk.equals(PublicKey.default))
      .map((pk, index) => {
        let status: ParticipantStatus = 'Waiting';
        
        if (poolData.currentRound > 0 && index === (poolData.currentRound - 1) % poolData.currentParticipants) {
          status = 'Winner';
        } else if (index === poolData.currentRound % poolData.currentParticipants) {
          status = 'Next';
        }
        
        return { publicKey: pk, status };
      });
  }, [poolData]);

  // Calculate total rounds
  const totalRounds = useMemo(() => {
    if (!poolData) return 0;
    return poolData.totalRounds ?? poolData.maxParticipants ?? 0;
  }, [poolData]);

  // Timer for next payout
  useEffect(() => {
    if (!poolData?.nextPayoutTimestamp) return;
    
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const nextTimestamp = typeof poolData.nextPayoutTimestamp === 'number'
          ? poolData.nextPayoutTimestamp
          : poolData.nextPayoutTimestamp.toNumber();
      const remaining = Math.max(0, nextTimestamp - now);
      setTimeRemaining(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [poolData?.nextPayoutTimestamp]);

  // Determine user participation status
  const isUserParticipant = useMemo(() => {
    return Boolean(publicKey && poolParticipants.some(p => 
      p.publicKey.equals(publicKey)
    ));
  }, [publicKey, poolParticipants]);

  // Format data for display
  const displayData = useMemo<DisplayData | null>(() => {
    if (!poolData) return null;
    
    return {
      contributionAmount: formatAmount(poolData.contributionAmount),
      totalValue: formatAmount(poolData.totalValue),
      yield: poolData.yieldBasisPoints ? 
        `${(poolData.yieldBasisPoints / 100).toFixed(2)}%` : '0.00%',
      frequency: formatFrequency(poolData.cycleDurationSeconds),
      status: formatStatus(poolData.status),
      earlyWithdrawalFee: `${poolData.earlyWithdrawalFeeBps / 100}%`,
      // Fix: Use the YIELD_PLATFORM_NAMES map to get the display name
      yieldPlatform: YIELD_PLATFORM_NAMES[poolData.yieldStrategy] || 'None',
      nextWinner: poolParticipants.find(p => p.status === 'Next')
    };
  }, [poolData, poolParticipants]);

  // Handler functions
  const handleContribute = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!poolData) {
      toast.error("Pool data not loaded");
      return;
    }
    
    setContributionStatus('processing');
    
    try {
      const tx = await contribute();
      transactionToast(tx);
      setContributionStatus('confirmed');
      setShowConfetti(true);
      
      refetchPool();
      refetchHistory();
      
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (err) {
      console.error("Contribution failed:", err);
      setContributionStatus('pending');
      toast.error(`Failed to contribute: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handlePlaceBid = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }
    
    if (!poolData) {
      toast.error("Pool data not loaded");
      return;
    }
    
    const bidAmountNum = parseFloat(bidAmount);
    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      toast.error("Please enter a valid positive bid amount");
      return;
    }
    
    const roundToBid = targetBidRound > 0 ? targetBidRound : poolData.currentRound;
    if (roundToBid <= 0) {
      toast.error("Invalid round number for bidding");
      return;
    }
    
    try {
      const amountInSmallestUnit = bidAmountNum * (10**6);
      const tx = await placeBid({ round: roundToBid, amount: amountInSmallestUnit });
      
      transactionToast(tx);
      setBidAmount('');
      setIsBidding(false);
      setTargetBidRound(0);
      
      refetchPool();
      refetchHistory();
      
      toast.success(`Bid placed successfully for round ${roundToBid}!`);
    } catch (err) {
      console.error("Bid failed:", err);
      toast.error(`Failed to place bid: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // UI components
  const renderStatusBadge = (status: ParticipantStatus | string) => {
    switch (status) {
      case 'Winner':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-[#e6ce04]/20 text-[#e6ce04] border border-[#e6ce04]/50 flex items-center">
            <Trophy className="w-3 h-3 mr-1" /> Winner
          </span>
        );
      case 'Next':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-[#e6ce04]/10 text-[#e6ce04] border border-[#e6ce04]/30 flex items-center">
            <Zap className="w-3 h-3 mr-1" /> Next
          </span>
        );
      case 'Waiting':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-[#1a1a18] text-[#f8e555]/70 border border-[#e6ce04]/20">
            Waiting
          </span>
        );
      case 'Confirmed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 border border-green-500/50 flex items-center">
            <CheckCircle className="w-3 h-3 mr-1" /> Confirmed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-[#1a1a18] text-[#f8e555]/70 border border-[#e6ce04]/20">
            {status}
          </span>
        );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#010200]">
        <span className="loading loading-spinner loading-lg text-[#e6ce04]" />
      </div>
    );
  }

  // Error state
  if (isError || !poolData || !displayData) {
    const errorMessage = error instanceof Error ? error.message : 
      typeof error === 'string' ? error :
      'Pool not found or failed to load';
    
    return (
      <AppHero
        title="Error Loading Pool"
        subtitle={`Could not load details for pool ID: ${params?.id}. Reason: ${errorMessage}`}
        ctaText="Back to Pools"
        ctaLink="/app/pools"
      />
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 bg-[#010200]">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-[#e6ce04] opacity-70 animate-confetti"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * -50}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Header section */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <button 
              onClick={() => router.push('/app/pools')}
              className="mr-3 p-2 rounded-full hover:bg-[#1a1a18] text-[#e6ce04]"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 bg-[#e6ce04] rounded-full flex items-center justify-center border-2 border-black shadow-md">
                <Coins className="w-6 h-6 text-[#010200]" />
              </div>
              <h1 className="text-3xl font-bold text-[#e6ce04]">
                {poolData.name || `Pool ${poolId?.toString().substring(0, 8)}...`}
              </h1>
            </div>
            
            {/* User XP display */}
            {connected && (
              <div className="hidden md:flex items-center bg-[#1a1a18] rounded-lg px-4 py-2 border border-[#e6ce04]/20 shadow-sm">
                <Trophy className="h-5 w-5 text-[#e6ce04] mr-2" />
                <span className="mr-3 text-sm text-[#f8e555]">Level:</span>
                <span className="font-bold text-[#e6ce04] mr-4">3</span>
                <div className="w-24 h-2 bg-gray-700 rounded-full border border-[#e6ce04]/20 overflow-hidden">
                  <div className="h-full bg-[#e6ce04] rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="ml-2 text-xs text-[#f8e555]">25 / 100 XP</span>
              </div>
            )}
          </div>
          
          <div className="text-[#f8e555]/70 ml-16">
            Created by {poolData.creator.toString().substring(0, 8)}...
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content column */}
          <div className="lg:w-2/3">
            {/* Pool stats */}
            <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 mb-6 relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl opacity-50"></div>
              <div className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full bg-[#e6ce04]/5 blur-2xl opacity-50"></div>

              {/* Pool stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 relative z-10 text-[#f8e555]">
                <InfoCard 
                  label="Status" 
                  value={displayData.status} 
                  valueClass={
                    displayData.status === 'Active' ? 'text-green-400' : 
                    displayData.status === 'Filling' ? 'text-yellow-400' : 
                    'text-gray-500'
                  }
                />
                <InfoCard label="Entry Fee" value={`${displayData.contributionAmount} USDC`} />
                <InfoCard label="Total Value" value={`${displayData.totalValue} USDC`} />
                <InfoCard label="Players" value={`${poolData.currentParticipants}/${poolData.maxParticipants}`} />
                <InfoCard label="Frequency" value={displayData.frequency} />
                <InfoCard label="Est. Yield" value={displayData.yield} />
              </div>

              {/* Tabs */}
              <div className="border-b border-[#e6ce04]/20 mb-6">
                <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
                  {(['overview', 'participants', 'transactions', 'terms'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`capitalize px-3 py-2 font-medium text-sm rounded-t-md whitespace-nowrap
                        ${activeTab === tab
                          ? 'border-b-2 border-[#e6ce04] text-[#e6ce04]'
                          : 'text-[#f8e555]/70 hover:text-[#e6ce04]'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab content */}
              <div className="relative z-10 min-h-[200px]">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#e6ce04] mb-3">Pool Overview</h3>
                    <p className="text-[#f8e555]/80 mb-4">{poolData.description || 'No description available.'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#f8e555]/70">
                      <div>
                        <p className="mb-1"><span className="text-[#e6ce04]/80">Current Round:</span> {poolData.currentRound} of {totalRounds}</p>
                        <p className="mb-1"><span className="text-[#e6ce04]/80">Started:</span> {formatDate(poolData.startTime)}</p>
                        <p className="mb-1"><span className="text-[#e6ce04]/80">Next Payout:</span> {formatDate(poolData.nextPayoutTimestamp)}</p>
                      </div>
                      <div>
                        <p className="mb-1"><span className="text-[#e6ce04]/80">Yield Source:</span> {displayData.yieldPlatform}</p>
                        <p className="mb-1"><span className="text-[#e6ce04]/80">Early Withdrawal Fee:</span> {displayData.earlyWithdrawalFee}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'participants' && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#e6ce04] mb-3">
                      Participants ({poolData.currentParticipants}/{poolData.maxParticipants})
                    </h3>
                    <ul className="space-y-2">
                      {/* Active participants */}
                      {poolParticipants.map((p) => (
                        <li key={p.publicKey.toString()} className="flex justify-between items-center p-2 bg-[#010200]/20 rounded">
                          <span className="text-sm text-[#f8e555] font-mono">
                            {publicKey && p.publicKey.equals(publicKey) ? '(You) ' : ''}
                            {formatAddress(p.publicKey)}
                          </span>
                          {renderStatusBadge(p.status)}
                        </li>
                      ))}
                      
                      {/* Empty slots */}
                      {[...Array(poolData.maxParticipants - poolData.currentParticipants)].map((_, i) => (
                        <li key={`empty-${i}`} className="flex justify-between items-center p-2 bg-[#010200]/10 rounded opacity-50">
                          <span className="text-sm text-[#f8e555]/50 font-mono italic">Waiting for player...</span>
                          {renderStatusBadge('Waiting')}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activeTab === 'transactions' && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#e6ce04] mb-3">Recent Activity</h3>
                    
                    {isHistoryLoading && 
                      <p className="text-[#f8e555]/70">Loading transaction history...</p>
                    }
                    
                    {isHistoryError && 
                      <p className="text-red-500">Failed to load transaction history.</p>
                    }
                    
                    {historyData && historyData.length > 0 ? (
                      <ul className="space-y-2">
                        {historyData.map((tx) => (
                          <li key={tx.signature} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 bg-[#010200]/20 rounded text-sm">
                            <div className='flex-1 mb-1 sm:mb-0'>
                              <span className="font-semibold text-[#e6ce04] mr-2">{tx.type}</span>
                              <span className="text-[#f8e555]/80 mr-2">
                                {formatAddress(tx.user)}
                              </span>
                              {tx.amount && 
                                <span className="text-[#f8e555]/80 mr-2">({tx.amount})</span>
                              }
                              {tx.xpChange && 
                                <span className="text-green-400 text-xs">{tx.xpChange}</span>
                              }
                            </div>
                            <div className='flex items-center gap-2'>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                tx.status === 'Confirmed' 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {tx.status}
                              </span>
                              <span className="text-[#f8e555]/60 text-xs">
                                {new Date(tx.blockTime * 1000).toLocaleString()}
                              </span>
                              <a 
                                href={`https://solscan.io/tx/${tx.signature}?cluster=devnet`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[#e6ce04]/70 hover:text-[#e6ce04] text-xs flex items-center"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[#f8e555]/70">No transactions found for this pool yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'terms' && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#e6ce04] mb-3">Pool Terms</h3>
                    <ul className="list-disc list-inside space-y-1 text-[#f8e555]/80 text-sm">
                      <li>Entry Fee: {displayData.contributionAmount} USDC</li>
                      <li>Max Participants: {poolData.maxParticipants}</li>
                      <li>Payout Frequency: {displayData.frequency}</li>
                      <li>Payout Order: Sequential (based on join order, unless bidding is enabled)</li>
                      <li>Estimated Yield: {displayData.yield} (from {displayData.yieldPlatform})</li>
                      <li>Early Withdrawal Penalty: {displayData.earlyWithdrawalFee}</li>
                      <li>Pool Contract: <a 
                        href={`https://solscan.io/account/${poolId?.toString()}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#e6ce04]/70 hover:text-[#e6ce04] underline"
                      >
                        View on Solscan
                      </a></li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar column */}
          <div className="lg:w-1/3 space-y-6">
            {/* Timer card */}
            <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 text-center">
              <h3 className="text-lg font-semibold text-[#e6ce04] mb-2">
                {displayData.status === 'Active' 
                  ? `Round ${poolData.currentRound} / ${totalRounds}` 
                  : 'Pool Filling'
                }
              </h3>
              
              {displayData.status === 'Active' && (
                <>
                  <p className="text-sm text-[#f8e555]/70 mb-1">Next Payout In:</p>
                  <p className="text-4xl font-mono font-bold text-[#e6ce04] mb-3">
                    {formatTime(timeRemaining)}
                  </p>
                  
                  {displayData.nextWinner && (
                    <p className="text-sm text-[#f8e555]/70">
                      Next Winner: {formatAddress(displayData.nextWinner.publicKey)}
                    </p>
                  )}
                </>
              )}
              
              {displayData.status === 'Filling' && (
                <p className="text-lg text-[#f8e555]/80 mt-4">
                  Waiting for {poolData.maxParticipants - poolData.currentParticipants} more players...
                </p>
              )}
              
              {displayData.status === 'Completed' && (
                <p className="text-lg text-gray-500 mt-4">This pool has ended.</p>
              )}
            </div>

            {/* Actions card - shown when connected */}
            {connected && displayData.status !== 'Completed' && (
              <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20">
                <h3 className="text-lg font-semibold text-[#e6ce04] mb-4 text-center">Your Action</h3>
                
                {/* Join pool button */}
                {displayData.status === 'Filling' && !isUserParticipant && (
                  <button
                    onClick={handleContribute}
                    disabled={contributionStatus === 'processing'}
                    className="w-full bg-[#e6ce04] text-[#010200] font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {contributionStatus === 'processing' ? (
                      <span className="loading loading-spinner loading-sm mr-2"></span>
                    ) : (
                      <Wallet className="w-5 h-5 mr-2" />
                    )}
                    Join Pool ({displayData.contributionAmount} USDC)
                  </button>
                )}
                
                {/* Already joined message */}
                {displayData.status === 'Filling' && isUserParticipant && (
                  <div className="text-center">
                    <p className="text-green-400 mb-2">
                      <CheckCircle className="inline-block w-5 h-5 mr-2" />
                      You have joined this pool!
                    </p>
                    <p className="text-[#f8e555]/80">
                      Waiting for {poolData.maxParticipants - poolData.currentParticipants} more players to start.
                    </p>
                  </div>
                )}

                {/* Bidding button - when pool is active */}
                {displayData.status === 'Active' && isUserParticipant && !isBidding && (
                  <button
                    onClick={() => {
                      setIsBidding(true);
                      setTargetBidRound(poolData.currentRound);
                    }}
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500 transition duration-200 flex items-center justify-center"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Place Bid for Round {poolData.currentRound}
                  </button>
                )}

                {/* Bidding form - shown when bidding */}
                {isBidding && (
                  <div className="space-y-3">
                    <p className="text-sm text-[#f8e555]/80">
                      Placing bid for Round {targetBidRound}
                    </p>
                    
                    <input
                      type="number"
                      placeholder="Bid Amount (USDC)"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      className="w-full px-3 py-2 font-mono text-lg text-[#e6ce04] bg-[#010200] border-2 border-[#e6ce04]/50 rounded-lg focus:outline-none focus:border-[#e6ce04] placeholder-[#e6ce04]/50"
                    />
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handlePlaceBid}
                        disabled={isBidPlacing}
                        className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition duration-200 disabled:opacity-50"
                      >
                        {isBidPlacing ? 'Submitting...' : 'Submit Bid'}
                      </button>
                      
                      <button
                        onClick={() => setIsBidding(false)}
                        className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Connect wallet prompt - shown when not connected */}
            {!connected && displayData.status !== 'Completed' && (
              <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20 text-center">
                <p className="text-[#f8e555]/80 mb-4">
                  Connect your wallet to interact with the pool.
                </p>
                
                <WalletMultiButton className="bg-[#e6ce04] text-[#010200] font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition duration-200" />
              </div>
            )}

            {/* Pool activity summary card */}
            <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] border border-[#e6ce04]/20">
              <h3 className="text-lg font-semibold text-[#e6ce04] mb-4">Pool Activity</h3>
              
              <div className="space-y-3 text-sm text-[#f8e555]/80">
                <div className="flex justify-between border-b border-[#1a1a18]/30 pb-2">
                  <span>Total contributions:</span>
                  <span className="text-[#e6ce04]">{displayData.totalValue} USDC</span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a18]/30 pb-2">
                  <span>Rounds completed:</span>
                  <span className="text-[#e6ce04]">{poolData.currentRound}</span>
                </div>
                <div className="flex justify-between border-b border-[#1a1a18]/30 pb-2">
                  <span>Rounds remaining:</span>
                  <span className="text-[#e6ce04]">{totalRounds - poolData.currentRound}</span>
                </div>
                <div className="flex justify-between">
                  <span>Participation:</span>
                  <span className="text-[#e6ce04]">
                    {Math.round((poolData.currentParticipants / poolData.maxParticipants) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

// Helper components with proper TypeScript props
interface InfoCardProps {
  label: string;
  value: string;
  valueClass?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, valueClass = '' }) => (
  <div className="flex flex-col items-center p-3 bg-[#010200]/30 rounded-lg border border-[#e6ce04]/10">
    <span className="text-xs uppercase text-[#e6ce04]/70 mb-1">{label}</span>
    <span className={`font-bold ${valueClass}`}>{value}</span>
  </div>
);

// Helper functions
const formatTime = (seconds: number): string => {
  if (seconds < 0) return "00:00:00";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const formatAmount = (amount: BN | undefined | bigint, decimals: number = 6): string => {
  if (amount === undefined || amount === null) return "0.00";

  let num: number;
  if (amount instanceof BN) {
    num = amount.toNumber();
  } else if (typeof amount === 'bigint') {
    num = Number(amount);
  } else {
    return "0.00";
  }

  return (num / (10**decimals)).toFixed(2);
};

const formatFrequency = (secondsBN: BN | number | undefined): string => {
  if (!secondsBN) return "Unknown";
  const seconds = typeof secondsBN === 'number' ? secondsBN : secondsBN.toNumber();
  
  if (seconds === 86400) return "Daily";
  if (seconds === 604800) return "Weekly";
  if (seconds === 1209600) return "Bi-Weekly";
  if (seconds === 2592000) return "Monthly";
  
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days} days`;
  
  const hours = Math.floor(seconds / 3600);
  return `${hours} hours`;
};

const formatStatus = (statusEnum: PoolStatus | number | undefined): string => {
  switch (statusEnum) {
    case PoolStatus.Active:
    case 1:
      return "Active";
    case PoolStatus.Filling:
    case 0:
      return "Filling";
    case PoolStatus.Completed:
    case 2:
      return "Completed";
    default:
      return "Unknown";
  }
};

const formatAddress = (address: PublicKey): string => {
  const str = address.toString();
  return `${str.substring(0, 6)}...${str.substring(str.length - 4)}`;
};

const formatDate = (timestamp: BN | number | undefined): string => {
  if (!timestamp) return "Unknown";
  const timestampNum = typeof timestamp === 'number' 
    ? timestamp 
    : timestamp instanceof BN ? timestamp.toNumber() : 0;
    
  return new Date(timestampNum * 1000).toLocaleString();
};

// Mock hook implementations with proper TypeScript annotations
function useMockPoolAccount(poolId: PublicKey | undefined): {
  data: ExtendedHuifiPool | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
} {
  return {
    data: poolId ? ({
      creator: new PublicKey('11111111111111111111111111111111'),
      tokenMint: new PublicKey('8HS8L4z9jYnbciuucqovMh6J7R8sfVsyKFcaUSeZRFs9'),
      maxParticipants: 10,
      currentParticipants: 5,
      contributionAmount: new BN(10 * 1_000_000),
      cycleDurationSeconds: new BN(86400),
      payoutDelaySeconds: new BN(3600),
      earlyWithdrawalFeeBps: 500,
      collateralRequirementBps: 1000,
      status: 1,
      totalValue: new BN(50 * 1_000_000),
      currentRound: 2,
      nextPayoutTimestamp: new BN(Math.floor(Date.now() / 1000) + 3600 * 5),
      startTime: new BN(Math.floor(Date.now() / 1000) - 86400 * 2),
      yieldBasisPoints: 150,
      yieldStrategy: YieldPlatform.JitoSol,
      participants: Array(10).fill(null).map((_, i) => 
        i < 5 ? new PublicKey(`PaRt${i+1}xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) : PublicKey.default
      ),
      bump: 255,
      name: `Mock Pool ${poolId.toString().substring(0, 4)}`,
      description: 'This is a mock pool for demonstration.',
      frequency: 'daily',
      totalRounds: 10,
    } as ExtendedHuifiPool) : undefined,
    isLoading: false,
    isError: !poolId,
    error: !poolId ? new Error("Invalid Pool ID") : null,
    refetch: () => console.log("Refetching account..."),
  };
}

function useMockContribution() {
  return {
    mutateAsync: async () => {
      console.log("Mock contributing...");
      await new Promise(res => setTimeout(res, 1500));
      return "mock_tx_signature_contribute_" + Date.now();
    },
    isLoading: false
  };
}

function useMockBidPlacement() {
  return {
    mutateAsync: async ({ round, amount }: { round: number; amount: number }) => {
      console.log(`Mock placing bid for round ${round} with amount ${amount}...`);
      await new Promise(res => setTimeout(res, 1500));
      return "mock_tx_signature_bid_" + Date.now();
    },
    isLoading: false
  };
}

function useMockHistory(poolId: PublicKey | undefined) {
  return {
    data: poolId ? [
      { 
        signature: "sig1...", 
        blockTime: Date.now()/1000 - 10000, 
        type: 'Contribution', 
        amount: '10.00 USDC', 
        user: new PublicKey('PaRt1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), 
        status: 'Confirmed', 
        xpChange: '+10 XP' 
      },
      { 
        signature: "sig2...", 
        blockTime: Date.now()/1000 - 5000, 
        type: 'Bid', 
        amount: '1.50 USDC', 
        user: new PublicKey('PaRt3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), 
        status: 'Confirmed' 
      },
      { 
        signature: "sig3...", 
        blockTime: Date.now()/1000 - 2000, 
        type: 'JackpotClaim', 
        amount: '48.50 USDC', 
        user: new PublicKey('PaRt2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), 
        status: 'Confirmed', 
        xpChange: '+50 XP' 
      },
    ] as Transaction[] : [],
    isLoading: false,
    isError: false,
    refetch: () => console.log("Refetching history..."),
  };
}

// Add confetti animation styles
const styles = `
  @keyframes confetti-fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
  .animate-confetti {
    animation: confetti-fall linear forwards;
  }
`;

if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default PoolDetailPage;