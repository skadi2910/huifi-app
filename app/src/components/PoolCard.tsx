import React from 'react';
import Link from 'next/link';
import { Users, Calendar, Clock, TrendingUp, Award, Star } from 'lucide-react';
import { PublicKey } from '@solana/web3.js'; // Import PublicKey

interface PoolCardProps {
  poolId: PublicKey; // Use PublicKey for ID
  name: string;
  participants: { current: number; max: number };
  contribution: string; // Formatted string (e.g., "100 USDC")
  totalValue: string; // Formatted string (e.g., "2,000 USDC")
  frequency: string; // Formatted string (e.g., "Daily")
  status: 'Active' | 'Filling' | 'Completed';
  timeRemaining: string; // Formatted string (e.g., "16 hours", "Open")
  yieldValue: string; // Formatted string (e.g., "12.4%")
  xpReward?: number; // Optional XP reward display
}

export const PoolCard: React.FC<PoolCardProps> = ({
  poolId,
  name,
  participants,
  contribution,
  totalValue,
  frequency,
  status,
  timeRemaining,
  yieldValue,
  xpReward,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'Active':
        return 'bg-[#e6ce04] text-[#010200] font-bold';
      case 'Filling':
        return 'bg-[#1a1a18] text-[#e6ce04] border border-[#e6ce04]';
      case 'Completed':
        return 'bg-[#252520] text-[#808080] border border-[#808080]/20';
      default:
        return 'bg-[#252520] text-[#f8e555]/70 border border-[#e6ce04]/20';
    }
  };

  const poolDetailUrl = `/app/pools/${poolId.toString()}`; // Use PublicKey for link

  return (
    <div className="bg-[#010200] rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(230,206,4,0.25)] hover:shadow-[0_8px_30px_rgba(230,206,4,0.35)] transition-shadow duration-300 border border-[#e6ce04]/20">
      <div className="relative">
        {xpReward && ( // Conditionally render XP reward
          <div className="absolute top-2 right-2 flex items-center bg-[#010200]/80 rounded-full px-2 py-0.5">
            <Star className="h-3 w-3 text-[#e6ce04] mr-1" />
            <span className="text-xs text-[#e6ce04]">Earn {xpReward} XP</span>
          </div>
        )}
        <div className="h-3 bg-gradient-to-r from-[#e6ce04] to-[#f8e555]"></div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-[#e6ce04]">{name}</h3>
          <span className={`text-xs py-1 px-2 rounded ${getStatusColor()}`}>
            {status === 'Active' ? 'LIVE' : status}
          </span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center text-[#f8e555]">
            <Users className="w-4 h-4 mr-2" />
            <span>
              {participants.current}/{participants.max} Players
            </span>
          </div>
          <div className="flex items-center text-[#f8e555]">
            <Calendar className="w-4 h-4 mr-2" />
            <span>{frequency} Rounds</span>
          </div>
          <div className="flex items-center text-[#f8e555]">
            <Clock className="w-4 h-4 mr-2" />
            <span>Next round: {timeRemaining}</span>
          </div>
          <div className="flex items-center text-[#e6ce04]">
            <Award className="w-4 h-4 mr-2" />
            <span>Win rate: {yieldValue}</span>
          </div>
        </div>

        <div className="bg-[#1a1a18] p-3 rounded-lg mb-4 border border-[#e6ce04]/10">
          <div className="flex justify-between mb-2">
            <span className="text-[#f8e555]">Buy-in</span>
            <span className="font-medium text-[#e6ce04]">{contribution}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#f8e555]">Prize Pool</span>
            <span className="font-medium text-[#e6ce04]">{totalValue}</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <Link
            href={poolDetailUrl} // Use dynamic URL
            className="flex-1 py-2 text-center bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg transition duration-300 font-bold"
          >
            View Game
          </Link>
          {status !== 'Completed' && ( // Only show Join if not completed
            <Link
              href={`${poolDetailUrl}?action=join`} // Add query param or specific join route if needed
              className={`flex-1 py-2 text-center rounded-lg transition duration-300 ${
                status === 'Filling'
                  ? 'bg-[#1a1a18] text-[#e6ce04] hover:bg-[#252520] border border-[#e6ce04]/30'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500' // Disabled style if Active
              }`}
              aria-disabled={status === 'Active'}
              onClick={(e) => { if (status === 'Active') e.preventDefault(); }} // Prevent click if active
            >
              {status === 'Filling' ? 'Join Game' : 'Join Game'} {/* Adjust text if needed */}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};