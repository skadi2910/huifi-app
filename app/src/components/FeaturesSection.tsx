import React from 'react';
import {
  ShieldCheck,
  Trophy,
  Zap,
  Coins
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-12 h-12 text-[#e6ce04]" />,
      title: 'Secure & Transparent', // Combined title
      description: 'Smart contracts ensure your jackpot funds are secure and all gameplay rules are transparently enforced on the blockchain.' // Updated description
    },
    {
      icon: <Trophy className="w-12 h-12 text-[#e6ce04]" />,
      title: 'Fair Gameplay', // Changed title
      description: 'On-chain logic guarantees fair player rotation and jackpot distribution according to predefined rules.' // Updated description
    },
    {
      icon: <Zap className="w-12 h-12 text-[#e6ce04]" />,
      title: 'Level Up & Earn',
      description: 'Earn XP and achievements (potentially off-chain) while enjoying competitive yields generated through DeFi integrations (if applicable).' // Clarified XP and yield source
    },
    {
      icon: <Coins className="w-12 h-12 text-[#e6ce04]" />,
      title: 'Flexible Rewards',
      description: 'Collect jackpots in various SPL tokens or stablecoins supported by the specific game pool.' // Specified SPL tokens
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* ... background effects ... */}
       <div className="absolute inset-0 overflow-hidden">
         <div className="absolute opacity-10 w-96 h-96 rounded-full bg-[#e6ce04] blur-3xl -top-20 right-20"></div>
         <div className="absolute opacity-10 w-64 h-64 rounded-full bg-[#e6ce04] blur-2xl bottom-10 left-10"></div>
         <div className="absolute h-10 w-10 rounded-full bg-[#e6ce04] top-1/3 right-1/3 animate-coin opacity-20" style={{animationDelay: "1.5s"}}></div>
       </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#e6ce04]">Why Play with HuiFi?</h2> {/* Updated Name */}
          <p className="text-[#f8e555]/70 max-w-2xl mx-auto">
            A gamified approach to rotating savings on Solana - earn rewards, level up, and secure your financial future.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-xl bg-[#1a1a18] shadow-[0_4px_20px_rgba(230,206,4,0.15)] hover:shadow-[0_8px_30px_rgba(230,206,4,0.25)] transition-all duration-300 border border-[#e6ce04]/20 group"
            >
              <div className="p-4 bg-[#252520] inline-block rounded-lg mb-6 group-hover:bg-[#e6ce04]/10 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#e6ce04]">{feature.title}</h3>
              <p className="text-[#f8e555]/70">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Gameplay highlight */}
        <div className="mt-16 bg-[#1a1a18] border border-[#e6ce04]/20 rounded-xl p-8 shadow-[0_4px_20px_rgba(230,206,4,0.15)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-[#e6ce04]">Play, Earn, Repeat</h3>
              <p className="text-[#f8e555]/80 mb-6">
                Our gamified rotating savings system turns financial planning into an exciting game where everyone wins.
                Make regular contributions, earn rewards (XP potentially off-chain), and take turns winning the jackpot secured by smart contracts.
              </p>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="bg-[#e6ce04]/10 p-1 rounded-full mr-3">
                    <Trophy className="w-5 h-5 text-[#e6ce04]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#e6ce04] mb-0.5">XP & Achievement System</h4>
                    <p className="text-sm text-[#f8e555]/70">Level up your profile and unlock exclusive benefits (may be off-chain)</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-[#e6ce04]/10 p-1 rounded-full mr-3">
                    <ShieldCheck className="w-5 h-5 text-[#e6ce04]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#e6ce04] mb-0.5">Game Rules on Solana</h4> {/* Changed */}
                    <p className="text-sm text-[#f8e555]/70">Fair and transparent gameplay enforced by smart contracts</p>
                  </div>
                </div>
              </div>
            </div>
            {/* ... graphic element ... */}
             <div className="flex justify-center">
               <div className="relative">
                 <div className="w-64 h-64 relative bg-[#252520] rounded-full flex items-center justify-center overflow-hidden border-8 border-[#1a1a18]">
                   <div className="absolute inset-0 bg-gradient-to-br from-[#e6ce04]/20 via-transparent to-transparent"></div>
                   <div className="relative z-10 text-center p-6">
                     <Coins className="w-16 h-16 mx-auto text-[#e6ce04] mb-3" />
                     {/* Replace with dynamic data if available */}
                     <div className="text-2xl font-bold text-[#e6ce04]">12.4%</div>
                     <div className="text-sm text-[#f8e555]/70">Average Yield</div>
                   </div>
                 </div>
                 <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#252520] rounded-full border-4 border-[#1a1a18] flex items-center justify-center">
                   <Zap className="w-8 h-8 text-[#e6ce04]" />
                 </div>
                 <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-[#252520] rounded-full border-4 border-[#1a1a18] flex items-center justify-center">
                   <Trophy className="w-8 h-8 text-[#e6ce04]" />
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};