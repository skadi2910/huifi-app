'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
// Import hooks if fetching dynamic stats
// import { useQuery } from '@tanstack/react-query';

export const HeroSection: React.FC = () => {
  // Example: Fetching stats (replace with actual data fetching)
  // const { data: statsData, isLoading } = useQuery({
  //   queryKey: ['global-stats'],
  //   queryFn: async () => {
  //     // Fetch TVL, active games, etc. from your backend or directly if possible
  //     return {
  //       tvl: '$4.2M+',
  //       activeGames: 273,
  //       avgYield: '12.4%'
  //     };
  //   }
  // });
  const statsData = { tvl: '$4.2M+', activeGames: 273, avgYield: '12.4%' }; // Placeholder
  const isLoading = false; // Placeholder

  return (
    <section className="relative text-[#e6ce04] py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Background effects - synchronized with HowItWorksSection */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute opacity-10 w-96 h-96 rounded-full bg-[#e6ce04] blur-3xl top-10 left-1/4"></div>
        <div className="absolute opacity-10 w-96 h-96 rounded-full bg-[#e6ce04] blur-3xl -bottom-75 right-20"></div>
        <div className="absolute h-16 w-16 rounded-full bg-[#e6ce04]/30 top-1/4 left-1/6 animate-coin"></div>
        <div className="absolute h-12 w-12 rounded-full bg-[#e6ce04]/30 top-2/3 right-1/3 animate-coin" style={{animationDelay: "1s"}}></div>
        <div className="absolute h-10 w-10 rounded-full bg-[#e6ce04] bottom-1/4 left-1/3 animate-coin opacity-20" style={{animationDelay: "2s"}}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left column: Heading and CTA */}
          <div className="flex-1 text-center lg:text-left max-w-2xl mx-auto lg:mx-0">
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#e6ce04] to-[#f8e555]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              HuiFi
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 text-[#f8e555]/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Play, Save & Earn credits with Solana Rotating Savings Games
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 lg:mb-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                href="/app/pools"
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-[#e6ce04] to-[#f8e555] hover:from-[#f8e555] hover:to-[#f8e555] text-[#010200] font-bold transition duration-300 text-center"
              >
                Explore Games
              </Link>
              <Link
                href="/learn/how-it-works"
                className="px-8 py-3 rounded-lg bg-[#1a1a18] hover:bg-[#252520] text-[#e6ce04] font-medium border border-[#e6ce04]/30 transition duration-300 text-center"
              >
                How To Play
              </Link>
            </motion.div>
          </div>

          {/* Right column: Stats Card */}
          <motion.div
            className="w-full lg:flex-1 max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="relative p-5 sm:p-6 bg-[#1a1a18] rounded-xl border border-[#e6ce04]/20 shadow-[0_4px_20px_rgba(230,206,4,0.15)] hover:shadow-[0_8px_30px_rgba(230,206,4,0.25)] transition-all duration-300">
              {/* Stats header */}
              <div className="flex items-center justify-center mb-4">
                <h3 className="text-xl font-semibold text-center text-[#e6ce04]">Platform Statistics</h3>
              </div>
              
              {/* Stats content */}
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center border-b border-[#e6ce04]/20 pb-4">
                  <span className="text-[#f8e555]/80">Total Value Locked</span>
                  <span className="text-xl font-bold text-[#e6ce04]">{isLoading ? '...' : statsData?.tvl}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#e6ce04]/20 pb-4">
                  <span className="text-[#f8e555]/80">Active Games</span>
                  <span className="text-xl font-bold text-[#e6ce04]">{isLoading ? '...' : statsData?.activeGames}</span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="text-[#f8e555]/80">Average Yield</span>
                  <span className="text-xl font-bold text-[#f8e555]">{isLoading ? '...' : statsData?.avgYield}</span>
                </div>
              </div>
            
              <div className="absolute inset-0 bg-gradient-to-br from-[#e6ce04]/10 via-transparent to-transparent rounded-xl -z-10"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};