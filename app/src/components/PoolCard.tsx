import React from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Coins,
  Wallet
} from 'lucide-react';
import { PublicKey } from '@solana/web3.js';
import { HuifiPool } from '@/lib/types/program-types';
import BN from 'bn.js';

export interface PoolCardProps {
  publicKey: PublicKey;
  account: HuifiPool;
  onJoinPool?: (poolId: PublicKey, uuid: number[]) => Promise<void>;
}

export const PoolCard: React.FC<PoolCardProps> = ({ publicKey, account, onJoinPool }) => {
  const {
    config,
    memberAddresses,
    totalContributions,
    status: rawStatus,
    nextPayoutTimestamp,
    uuid
  } = account;

  const maxParticipants = config?.maxParticipants || 0;
  const contributionAmount = config?.contributionAmount || new BN(0);
  const cycleDurationSeconds = config?.cycleDurationSeconds || new BN(0);
  const currentParticipants = memberAddresses?.length || 0;
  const totalValue = totalContributions || new BN(0);

  const frequencyInSeconds = cycleDurationSeconds.toNumber();
  const frequency = 
  frequencyInSeconds <= 86400 ? 'daily' :
  frequencyInSeconds <= 604800 ? 'weekly' :
  frequencyInSeconds <= 1209600 ? 'biweekly' : 'monthly';

// Use default yield if not available in the data
  const yieldBasisPoints = 0;

  const name =
    `HuiFi Pool ${Array.from(uuid).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 6)}`;

  const getStatusString = (): 'Active' | 'Filling' | 'Completed' => {
    switch (rawStatus) {
      case 1:
        return 'Active';
      case 2:
        return 'Completed';
      case 0:
      default:
        return 'Filling';
    }
  };

  const statusString = getStatusString();

  const formatTimeRemaining = () => {
    if (!nextPayoutTimestamp) return 'N/A';
    const now = Math.floor(Date.now() / 1000);
    const next = nextPayoutTimestamp.toNumber();
    const diff = next - now;
    if (diff <= 0) return '0h 0m';
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: BN) => {
    const value = amount?.toNumber() ?? 0;
    return `${(value / 1_000_000).toFixed(2)} USDC`;
  };

  const getStatusClass = () => {
    switch (statusString) {
      case 'Active':
        return 'bg-black text-[#ffdd00] border-black';
      case 'Filling':
        return 'bg-[#ffef80] text-black border-black';
      case 'Completed':
        return 'bg-white text-black border-black';
      default:
        return 'bg-white text-black border-black';
    }
  };

  const poolDetailUrl = `/app/pools/${publicKey.toString()}`;
  const participants = {
    current: currentParticipants || 0,
    max: maxParticipants || 10
  };

  const yieldPercentage = yieldBasisPoints
    ? (yieldBasisPoints / 100).toFixed(2)
    : '0.00';

  const xpReward = 100; // Placeholder

  // Add a handler for the join button click
  const handleJoinClick = async (e: React.MouseEvent) => {
    if (statusString === 'Filling' && onJoinPool) {
      e.preventDefault();
      try {
        await onJoinPool(publicKey, Array.from(uuid));
      } catch (error) {
        // Error handling is now centralized in the parent component
        console.error('Join action failed:', error);
      }
    }
  };

  return (
    <div className="card-glitch bg-[#ffdd00] border-4 border-black p-4 rounded-lg shadow-lg w-full sm:p-6">
      <div className="p-2 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
          <h3 className="text-lg sm:text-xl md:text-2xl font-mono font-bold text-black glitch-text break-words" data-text={name}>
            {name}
          </h3>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs sm:text-sm md:text-base px-3 py-1 rounded-md font-mono font-bold border-2 ${getStatusClass()} flex items-center`}>
              {statusString === 'Active' ? (
                <>
                  <span className="mr-1 animate-pulse">●</span> LIVE
                </>
              ) : (
                statusString.toUpperCase()
              )}
            </span>
            {xpReward && (
              <div className="flex items-center bg-black text-[#ffdd00] rounded-lg px-3 py-1 border-2 border-[#ffdd00]">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                <span className="text-xs sm:text-sm font-mono font-bold">+{xpReward} XP</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4 font-mono text-sm sm:text-base text-black">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            <span className="font-medium">
              {participants.current}/{participants.max} Players
            </span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <span className="font-medium">Every {frequency} days Rounds</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            <span className="font-medium">Next: {formatTimeRemaining()}</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="font-medium">Yield: {yieldPercentage}%</span>
          </div>
        </div>

        <div className="bg-[#ffef80] border-2 border-black rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex justify-between mb-2 font-mono text-sm sm:text-base">
            <span className="text-black font-medium flex items-center">
              <Wallet className="w-4 h-4 mr-2" />
              Buy-in
            </span>
            <span className="text-black font-bold">{formatCurrency(contributionAmount)}</span>
          </div>
          <div className="flex justify-between font-mono text-sm sm:text-base">
            <span className="text-black font-medium flex items-center">
              <Coins className="w-4 h-4 mr-2" />
              Prize Pool
            </span>
            <span className="text-black font-bold">{formatCurrency(totalValue)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={poolDetailUrl}
            className="flex justify-center items-center btn-glitch-dark px-3 py-2 text-sm sm:text-base text-center"
          >
            <span>// VIEW GAME_</span>
          </Link>

          {statusString !== 'Completed' &&
            (statusString === 'Filling' ? (
              <button
                onClick={handleJoinClick}
                className="flex justify-center items-center btn-glitch px-3 py-2 text-sm sm:text-base text-center"
              >
                <span>// JOIN GAME_ ⇒</span>
              </button>
            ) : (
              <button
                disabled
                className="flex justify-center items-center bg-[#ffef80] text-black/40 border-2 border-black/20 rounded-lg px-3 py-2 text-sm sm:text-base font-mono font-bold text-center cursor-not-allowed"
              >
                <span>// JOIN GAME_ ⇒</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
