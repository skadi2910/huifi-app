import React from 'react';
import Link from 'next/link';
import { UserPlus, Users, Trophy, ArrowRight, Coins } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: "01",
      icon: <UserPlus className="w-12 h-12 text-[#e6ce04]" />,
      title: "Join a Game",
      description: "Connect your Solana wallet and browse available games. Choose one matching your desired entry fee (SPL token) and payout schedule." // Updated
    },
    {
      number: "02",
      icon: <Coins className="w-12 h-12 text-[#e6ce04]" />,
      title: "Make Regular Entries",
      description: "Contribute the required SPL token amount according to the game schedule via a Solana transaction. Each contribution may earn you XP (off-chain)." // Updated
    },
    {
      number: "03",
      icon: <Trophy className="w-12 h-12 text-[#e6ce04]" />,
      title: "Win the Jackpot",
      description: "When it's your turn according to the smart contract's logic, you'll receive the entire jackpot directly to your wallet!" // Updated
    },
    {
      number: "04",
      icon: <Users className="w-12 h-12 text-[#e6ce04]" />,
      title: "Level Up & Repeat",
      description: "Continue playing to potentially increase earnings and gain more XP. Start new games or explore different pool types." // Updated
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* ... background effects ... */}
       <div className="absolute inset-0 overflow-hidden">
         <div className="absolute opacity-10 w-96 h-96 rounded-full bg-[#e6ce04] blur-3xl top-10 left-1/4"></div>
         <div className="absolute opacity-10 w-64 h-64 rounded-full bg-[#e6ce04] blur-2xl -bottom-10 right-10"></div>
         <div className="absolute h-10 w-10 rounded-full bg-[#e6ce04] bottom-1/4 left-1/3 animate-coin opacity-20"></div>
       </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#e6ce04]">How to Play</h2>
          <p className="text-[#f8e555]/70 max-w-2xl mx-auto">
            Our gamified rotating savings system on Solana makes financial growth simple, transparent, and fun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-[#1a1a18] rounded-xl p-6 shadow-[0_4px_20px_rgba(230,206,4,0.15)] relative z-10 h-full border border-[#e6ce04]/20 hover:shadow-[0_8px_30px_rgba(230,206,4,0.25)] transition-all duration-300 group">
                <div className="p-4 bg-[#252520] inline-block rounded-lg mb-6 group-hover:bg-[#e6ce04]/10 transition-colors duration-300">
                  {step.icon}
                </div>
                <div className="text-4xl font-bold text-[#e6ce04]/20 mb-4">{step.number}</div>
                <h3 className="text-xl font-semibold mb-3 text-[#e6ce04]">{step.title}</h3>
                <p className="text-[#f8e555]/70">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 left-full w-8 h-0.5 bg-gradient-to-r from-[#e6ce04]/40 to-transparent z-0 transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>

        {/* Game mechanics insight box */}
        <div className="mt-16 mb-10 bg-[#1a1a18] rounded-xl p-8 border border-[#e6ce04]/20 shadow-[0_4px_20px_rgba(230,206,4,0.15)]">
          <div className="flex flex-col md:flex-row items-center">
            {/* ... graphic ... */}
             <div className="mb-6 md:mb-0 md:mr-8">
               <div className="relative w-48 h-48 mx-auto">
                 <div className="absolute inset-0 bg-[#252520] rounded-full border-4 border-[#e6ce04]/20 flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-[#e6ce04]/10 via-transparent to-transparent"></div>
                   <Trophy className="w-20 h-20 text-[#e6ce04]/60 relative z-10" />
                 </div>
                 {/* ... spinning dots ... */}
               </div>
             </div>

            <div className="md:flex-1">
              <h3 className="text-2xl font-bold mb-4 text-[#e6ce04]">On-Chain Game Mechanics</h3> {/* Updated */}
              <p className="text-[#f8e555]/80 mb-4">
                Our Solana smart contracts ensure fair play. The jackpot order is determined
                by on-chain logic, ensuring complete transparency and eliminating potential favoritism.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-[#f8e555]/70">
                  <div className="w-1.5 h-1.5 bg-[#e6ce04] rounded-full mr-2"></div>
                  Each game has a specific SPL token entry fee and payout schedule
                </li>
                <li className="flex items-center text-[#f8e555]/70">
                  <div className="w-1.5 h-1.5 bg-[#e6ce04] rounded-full mr-2"></div>
                  Missing an entry may result in penalties as defined by the contract
                </li>
                <li className="flex items-center text-[#f8e555]/70">
                  <div className="w-1.5 h-1.5 bg-[#e6ce04] rounded-full mr-2"></div>
                  Players can participate in multiple games simultaneously
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/app/pools" // Link to pools page
            className="px-8 py-3 rounded-lg bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] font-medium transition duration-300 flex items-center justify-center max-w-xs mx-auto"
          >
            Explore Games Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};