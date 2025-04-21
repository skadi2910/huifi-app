import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award, 
  Star, 
  Coins, 
  Wallet, 
  BadgeDollarSign,
  ArrowRight,
  Eye,
  LogIn
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { HuifiPool } from '@/lib/types/program-types';
import BN from 'bn.js';

export interface PoolCardProps {
  publicKey: PublicKey;
  account: HuifiPool;
}

export const PoolCard: React.FC<PoolCardProps> = ({ publicKey, account }) => {
  // Extract data from account
  const { 
    name,
    currentParticipants,
    maxParticipants,
    contributionAmount,
    status,
    frequency,
    nextPayoutTimestamp,
    yieldBasisPoints,
    totalValue,
  } = account;

  // Convert numerical status to string representation
  const getStatusString = (): 'Active' | 'Filling' | 'Completed' => {
    switch (status) {
      case 0:  // Adjust according to your enum values
        return 'Active';
      case 1:  // Adjust according to your enum values
        return 'Filling';
      case 2:  // Adjust according to your enum values
        return 'Completed';
      default:
        return 'Filling';
    }
  };

  const statusString = getStatusString();

  // Format time remaining
  const formatTimeRemaining = () => {
    // This is a placeholder - implement based on your nextPayoutTimestamp data structure
    if (!nextPayoutTimestamp) return "N/A";
    
    const now = Math.floor(Date.now() / 1000);
    const nextTimestamp = nextPayoutTimestamp.toNumber();
    
    if (nextTimestamp <= now) return "0h 0m";
    
    const diffSeconds = nextTimestamp - now;
    const hours = Math.floor(diffSeconds / 3600);
    const minutes = Math.floor((diffSeconds % 3600) / 60);
    
    return `${hours}h ${minutes}m`;
  };

  // Format currency values from BN to string with USDC suffix
  const formatCurrency = (amount: BN) => {
    if (!amount) return "0.00 USDC";
    // Convert BN to a decimal string (assuming 6 decimals for USDC)
    const value = amount.toNumber() / 1_000_000;
    return `${value.toFixed(2)} USDC`;
  };

  const getStatusClass = () => {
    switch (statusString) {
      case 'Active':
        return 'bg-black text-[#ffdd00] border-2 border-black';
      case 'Filling':
        return 'bg-[#ffef80] text-black border-2 border-black';
      case 'Completed':
        return 'bg-white text-black border-2 border-black';
      default:
        return 'bg-white text-black border-2 border-black';
    }
  };

  const poolDetailUrl = `/app/pools/${publicKey.toString()}`;

  // Format participants
  const participants = {
    current: currentParticipants || 0,
    max: maxParticipants || 10
  };
  
  // Convert yield basis points to percentage
  const yieldPercentage = yieldBasisPoints ? (yieldBasisPoints / 100).toFixed(2) : "0.00";
  
  // Calculate a simulated XP reward - replace with actual logic if available
  const xpReward = 100; // Example fixed value

  return (
    <div className="card-glitch bg-[#ffdd00] border-4 border-black p-4 rounded-lg shadow-lg">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-mono font-bold text-black glitch-text" data-text={name}>{name}</h3>
          <div className="flex flex-col items-end space-y-2">
            <span className={`text-lg py-1 px-3 rounded-md font-mono font-bold ${getStatusClass()} flex items-center`}>
              {statusString === 'Active' ? (
                <>
                  <span className="mr-1 animate-pulse">●</span> LIVE
                </>
              ) : statusString.toUpperCase()}
            </span>
            {xpReward && (
              <div className="flex items-center bg-black text-[#ffdd00] rounded-lg px-3 py-1 border-2 border-[#ffdd00]">
                <Star className="h-3 w-3 text-[#ffdd00] mr-1" />
                <span className="text-lg font-mono font-bold">+{xpReward.toString()} XP</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4 font-mono text-lg text-black">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2 text-black" />
            <span className="font-medium">
              {participants.current}/{participants.max} Players
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-black" />
            <span className="font-medium">{frequency ? `Every ${Math.floor(frequency.toNumber() / 86400)} days` : 'Weekly'} Rounds</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-black" />
            <span className="font-medium">Next: {formatTimeRemaining()}</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-black" />
            <span className="font-medium">Yield: {yieldPercentage}%</span>
          </div>
        </div>

        <div className="bg-[#ffef80] border-2 border-black rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex justify-between mb-2 font-mono text-lg">
            <span className="text-black font-medium flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Buy-in
            </span>
            <span className="text-black font-bold">{formatCurrency(contributionAmount)}</span>
          </div>
          <div className="flex justify-between font-mono text-lg">
            <span className="text-black font-medium flex items-center">
              <Coins className="w-4 h-4 mr-2" />
              Prize Pool
            </span>
            <span className="text-black font-bold">{formatCurrency(totalValue)}</span>
          </div>
        </div>

        <div className="flex space-x-4">
          {/* View Game Button - Always the same style */}
          <Link
            href={poolDetailUrl}
            className="flex-1 flex justify-center items-center btn-glitch-dark"
          >
            <Eye className="w-4 h-4 mr-2" />
            <span>// VIEW GAME_</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          
          {/* Join Game Button - Style varies based on status */}
          {statusString !== 'Completed' && (
            statusString === 'Filling' ? (
              <Link
                href={`${poolDetailUrl}?action=join`}
                className="flex-1 flex justify-center items-center btn-glitch"
              >
                <LogIn className="w-4 h-4 mr-2" />
                <span>// JOIN GAME_</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <Link
                href={`${poolDetailUrl}?action=join`}
                className="flex-1 flex justify-center items-center bg-[#ffef80] text-black/40 border-2 border-black/20 rounded-lg py-2.5 px-4 font-mono text-lg font-bold cursor-not-allowed"
                aria-disabled={statusString === 'Active'}
                onClick={(e) => { if (statusString === 'Active') e.preventDefault(); }}
              >
                <LogIn className="w-4 h-4 mr-2 opacity-50" />
                <span>// JOIN GAME_</span>
                <ArrowRight className="w-4 h-4 ml-1 opacity-50" />
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
};