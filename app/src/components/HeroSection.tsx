'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Percent, BarChart2, Clock, Award, Zap, Shield } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const statsData = { tvl: '$4.2M+', activeGames: 273, avgYield: '12.4%', totalWinners: 1842 };
  const isLoading = false;

  return (
    <section className="relative text-black md:py-4 lg:py-8 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4">
          {/* Left column: Heading and CTA */}
          <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
            <motion.h1
              className="text-6xl sm:text-7xl md:text-8xl font-mono text-[#ffcc00] mb-6 glitch-text"
              data-text="HuiFi"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              HuiFi
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl md:text-2xl text-[#ffcc00] mb-8 font-mono"
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
              <div className="relative">
                <div className="btn-wrapper absolute inset-0 z-0"></div>
                <Link
                  href="/app/pools"
                  className="btn-glitch relative z-10"
                >
                  <span className="text">// Explore Games</span>
                  <span className="text-decoration">_</span>
                  <span className="decoration">⇒</span>
                </Link>
              </div>
              <Link
                href="/learn/how-it-works"
                className="btn-glitch-dark"
              >
                <span className="text">// How To Play</span>
                <span className="text-decoration">_</span>
                <span className="decoration">⇒</span>
              </Link>
            </motion.div>
          </div>

          {/* Right column: Enhanced Bento Stats Grid - Made larger and positioned properly */}
          <motion.div
            className="w-full lg:w-[45%] max-w-none lg:transform lg:translate-x-[-10px] mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="grid grid-cols-4 gap-3">
              {/* TVL Stat */}
              <motion.div 
                className="col-span-2 p-6 neu-box-yellow rounded-lg group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="bg-black rounded-full p-3 mb-3"
                  >
                    <TrendingUp size={24} className="text-[#ffcc00]" />
                  </motion.div>
                  <p className="text-xs font-mono uppercase tracking-wider text-black mb-1">Total Value Locked</p>
                  <motion.h4 
                    className="text-2xl font-mono font-bold glitch-text"
                    data-text={isLoading ? '...' : statsData?.tvl}
                  >
                    {isLoading ? '...' : statsData?.tvl}
                  </motion.h4>
                  <div className="mt-2 w-full bg-black bg-opacity-20 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '75%' }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                      className="h-full bg-black rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
              
              {/* Active Games Stat */}
              <motion.div 
                className="col-span-2 p-6 neu-box-yellow rounded-lg group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col items-center">
                  <motion.div 
                    initial={{ rotate: 0 }}
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    className="bg-black rounded-full p-3 mb-3"
                  >
                    <Users size={24} className="text-[#ffcc00]" />
                  </motion.div>
                  <p className="text-xs font-mono uppercase tracking-wider text-black mb-1">Active Games</p>
                  <div className="h-10">
                    <motion.h4 
                      className="text-2xl font-mono font-bold glitch-text" 
                      data-text={isLoading ? '...' : statsData?.activeGames}
                      initial={{ opacity: 1 }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {isLoading ? '...' : statsData?.activeGames}
                    </motion.h4>
                  </div>
                  <div className="flex mt-2 gap-1 w-full justify-center">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 10 }}
                        animate={{ height: [10, 20, 10] }}
                        transition={{ 
                          duration: 1, 
                          repeat: Infinity, 
                          repeatType: "reverse", 
                          delay: i * 0.2 
                        }}
                        className="w-2 bg-black rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* NEW: Time & Security - Combined small tile */}
              <motion.div 
                className="p-4 neu-box-yellow rounded-lg group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col justify-center items-center h-full">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="bg-black rounded-full p-2 mb-2"
                  >
                    <Clock size={20} className="text-[#ffcc00]" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-black mb-1">Average Round</p>
                    <p className="text-lg font-mono font-bold">28 days</p>
                  </div>
                </div>
              </motion.div>

              {/* NEW: Security Guarantee */}
              <motion.div 
                className="p-4 neu-box-yellow rounded-lg group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col justify-center items-center h-full">
                  <motion.div 
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-black rounded-full p-2 mb-2"
                  >
                    <Shield size={20} className="text-[#ffcc00]" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-black mb-1">Security Level</p>
                    <p className="text-lg font-mono font-bold">99.8%</p>
                  </div>
                </div>
              </motion.div>
              
              {/* NEW: Winners Count */}
              <motion.div 
                className="p-4 neu-box-yellow rounded-lg group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col justify-center items-center h-full">
                  <motion.div
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 5, 0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="bg-black rounded-full p-2 mb-2"
                  >
                    <Award size={20} className="text-[#ffcc00]" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-black mb-1">Total Winners</p>
                    <motion.p 
                      className="text-lg font-mono font-bold"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.8 }}
                    >
                      {statsData.totalWinners}
                    </motion.p>
                  </div>
                </div>
              </motion.div>

              {/* NEW: Performance Indicator */}
              <motion.div 
                className="p-4 neu-box-yellow rounded-lg group"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col justify-center items-center h-full">
                  <motion.div 
                    animate={{ 
                      boxShadow: ["0 0 0 0 rgba(0,0,0,0)", "0 0 0 10px rgba(0,0,0,0.1)", "0 0 0 0 rgba(0,0,0,0)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-black rounded-full p-2 mb-2"
                  >
                    <Zap size={20} className="text-[#ffcc00]" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-xs font-mono text-black mb-1">Performance</p>
                    <p className="text-lg font-mono font-bold">+5.2%</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Charts & Yield - Larger tile spanning full width */}
              <motion.div 
                className="col-span-4 p-6 neu-box-yellow rounded-lg group"
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="bg-black rounded-full p-2"
                    >
                      <Percent size={18} className="text-[#ffcc00]" />
                    </motion.div>
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-black">Average Yield</p>
                      <motion.h4 
                        className="text-3xl font-mono font-bold glitch-text" 
                        data-text={isLoading ? '...' : statsData?.avgYield}
                      >
                        {isLoading ? '...' : statsData?.avgYield}
                      </motion.h4>
                    </div>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="bg-black px-3 py-1 rounded-full"
                  >
                    <span className="text-xs font-mono text-[#ffcc00]">TRENDING UP</span>
                  </motion.div>
                </div>
                
                {/* Mini chart */}
                <div className="mt-3 h-20 w-full relative">
                  <div className="absolute inset-0 flex items-end justify-between px-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => {
                      // Generate a pseudo-random height between 20% and 100%
                      const height = `${20 + Math.abs(Math.sin(i * 0.7) * 80)}%`;
                      
                      return (
                        <motion.div
                          key={i}
                          className="bg-black rounded-sm w-[4%]"
                          style={{ height }}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ duration: 0.5, delay: i * 0.05 }}
                          whileHover={{ scaleY: 1.2 }}
                        />
                      );
                    })}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black bg-opacity-30"></div>
                </div>
                
                <div className="mt-3 flex justify-between text-xs font-mono text-black opacity-70">
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                </div>
              </motion.div>
              
              {/* NEW: Call to action banner */}
              <motion.div 
                className="col-span-4 p-4 bg-black rounded-lg group overflow-hidden relative border-2 border-[#ffcc00]"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div 
                  className="absolute -right-20 -top-20 w-40 h-40 bg-[#ffcc00] rounded-full opacity-10"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                />
                <div className="flex justify-between items-center">
                  <p className="text-sm font-mono text-[#ffcc00]">
                    JOIN THE <span className="glitch-text" data-text="NEXT GAME">NEXT GAME</span> STARTING IN 2 DAYS
                  </p>
                  <motion.p 
                    className="text-xs font-mono text-[#ffcc00] border border-[#ffcc00] rounded-full px-3 py-1"
                    animate={{ 
                      backgroundColor: ["rgba(0,0,0,0)", "rgba(255,204,0,0.2)", "rgba(0,0,0,0)"]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    11:24:36 LEFT
                  </motion.p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};