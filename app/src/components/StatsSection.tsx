'use client'; // Add 'use client' if using hooks like useQuery

import React from 'react';
import { Coins, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query'; // Import useQuery

// Define function to fetch global stats (replace with your actual API/program call)
async function fetchGlobalStats() {
  // Example: Fetch from an API endpoint
  // const response = await fetch('/api/stats');
  // if (!response.ok) {
  //   throw new Error('Network response was not ok');
  // }
  // const data = await response.json();
  // return data;

  // Mock data for now
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return {
    tvl: '$4.2M+',
    activePlayers: '14,500+',
    completedGames: '1,245',
    avgYield: '12.4%'
  };
}


export const StatsSection: React.FC = () => {
  // Use react-query to fetch and cache stats
  const { data: statsData, isLoading, isError } = useQuery({
    queryKey: ['globalStats'], // Unique key for this query
    queryFn: fetchGlobalStats,
    staleTime: 1000 * 60 * 5, // Refetch data every 5 minutes
  });

  const stats = [
    {
      label: 'Total Value Locked',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.tvl),
      icon: <Coins className="h-8 w-8 text-[#e6ce04]" />
    },
    {
      label: 'Active Players',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.activePlayers),
      icon: <Users className="h-8 w-8 text-[#e6ce04]" />
    },
    {
      label: 'Completed Games',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.completedGames),
      icon: <CheckCircle className="h-8 w-8 text-[#e6ce04]" />
    },
    {
      label: 'Average Yield',
      value: isLoading ? '...' : (isError ? 'N/A' : statsData?.avgYield),
      icon: <TrendingUp className="h-8 w-8 text-[#e6ce04]" />
    }
  ];

  return (
    <section className="py-16 border-t border-b border-[#e6ce04]/20 relative overflow-hidden">
      {/* ... background effects ... */}
       <div className="absolute inset-0 overflow-hidden">
         <div className="absolute opacity-10 w-96 h-96 rounded-full bg-[#e6ce04] blur-3xl -top-20 -left-20"></div>
         <div className="absolute opacity-10 w-96 h-96 rounded-full bg-[#e6ce04] blur-3xl bottom-20 right-20"></div>
       </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-6 bg-[#1a1a18] rounded-xl border border-[#e6ce04]/20 shadow-[0_4px_20px_rgba(230,206,4,0.15)] hover:shadow-[0_8px_30px_rgba(230,206,4,0.25)] transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-[#252520] rounded-full group-hover:bg-[#e6ce04]/10 transition-colors duration-300">
                  {stat.icon}
                </div>
              </div>
              <p className="text-3xl md:text-4xl font-bold mb-2 text-[#e6ce04] min-h-[48px]"> {/* Added min-height */}
                {stat.value}
              </p>
              <p className="text-[#f8e555]/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};