import React from 'react';
import Link from 'next/link';
import { Coins, ChevronRight } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="py-20 text-[#e6ce04] relative overflow-hidden">
      {/* ... background effects ... */}
       <div className="absolute inset-0 overflow-hidden">
         <div className="absolute opacity-10 w-96 h-96 rounded-full bg-[#e6ce04] blur-3xl top-20 left-1/4"></div>
         <div className="absolute opacity-5 w-64 h-64 rounded-full bg-[#e6ce04] blur-2xl -bottom-10 right-10"></div>
         <div className="absolute h-16 w-16 rounded-full bg-[#e6ce04] top-1/4 left-1/4 animate-coin opacity-20"></div>
         <div className="absolute h-12 w-12 rounded-full bg-[#e6ce04] top-2/3 right-1/3 animate-coin opacity-20" style={{animationDelay: "1s"}}></div>
         <div className="absolute h-8 w-8 rounded-full bg-[#e6ce04] bottom-1/4 left-1/2 animate-coin opacity-20" style={{animationDelay: "2s"}}></div>
       </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Game?</h2>
        <p className="text-xl text-[#f8e555]/80 mb-8 max-w-2xl mx-auto">
          Join thousands of players already earning rewards from our decentralized rotating savings games.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/app/pools" // Link to the pools page
            className="px-8 py-3 rounded-lg bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] font-medium transition duration-300 flex items-center justify-center"
          >
            <Coins className="w-5 h-5 mr-2" />
            Start Playing
          </Link>
          <Link
            href="/learn/how-it-works" // Link to how-it-works or guide
            className="px-8 py-3 rounded-lg bg-[#1a1a18] hover:bg-[#252520] text-[#e6ce04] font-medium border border-[#e6ce04]/30 hover:border-[#e6ce04]/50 transition duration-300 flex items-center justify-center"
          >
            Game Guide
            <ChevronRight className="w-5 h-5 ml-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};