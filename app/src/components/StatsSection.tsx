'use client';

import React from 'react';
import { Coins, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

async function fetchGlobalStats() {
  // Mock data for now
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    tvl: '$4.2M+',
    activePlayers: '14,500+',
    completedGames: '1,245',
    avgYield: '12.4%'
  };
}

export const StatsSection: React.FC = () => {
  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['globalStats'],
    queryFn: fetchGlobalStats,
    staleTime: 1000 * 60 * 5,
  });

  const stats = [
    {
      label: 'Total Value Locked',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.tvl),
      icon: <Coins className="h-8 w-8 text-[#ffdd00]" /> // Changed to yellow color
    },
    {
      label: 'Active Players',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.activePlayers),
      icon: <Users className="h-8 w-8 text-[#ffdd00]" /> // Changed to yellow color
    },
    {
      label: 'Completed Games',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.completedGames),
      icon: <CheckCircle className="h-8 w-8 text-[#ffdd00]" /> // Changed to yellow color
    },
    {
      label: 'Average Yield',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.avgYield),
      icon: <TrendingUp className="h-8 w-8 text-[#ffdd00]" /> // Changed to yellow color
    }
  ];

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index} 
              className="neu-box-yellow card-glitch p-6 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-black rounded-full">
                  {stat.icon}
                </div>
              </div>
              <p className="text-4xl font-mono mb-2 text-black glitch-text min-h-[48px]" data-text={stat.value}>
                {stat.value}
              </p>
              <p className="font-mono text-black text-xl">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};