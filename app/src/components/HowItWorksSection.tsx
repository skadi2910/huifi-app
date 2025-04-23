'use client';

import React from 'react';
import Link from 'next/link';
import { UserPlus, Users, Trophy, Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';

export const HowItWorksSection: React.FC = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });
  
  const steps = [
    {
      number: "01",
      icon: <UserPlus className="w-12 h-12 text-[#ffdd00]" />,
      title: "Join a Game",
      description: "Connect your Solana wallet and browse available games. Choose one matching your desired entry fee (SPL token) and payout schedule."
    },
    {
      number: "02",
      icon: <Coins className="w-12 h-12 text-[#ffdd00]" />,
      title: "Make Regular Entries",
      description: "Contribute the required SPL token amount according to the game schedule via a Solana transaction. Each contribution may earn you XP (off-chain)."
    },
    {
      number: "03",
      icon: <Trophy className="w-12 h-12 text-[#ffdd00]" />,
      title: "Win the Jackpot",
      description: "When it's your turn according to the smart contract's logic, you'll receive the entire jackpot directly to your wallet!"
    },
    {
      number: "04",
      icon: <Users className="w-12 h-12 text-[#ffdd00]" />,
      title: "Level Up & Repeat",
      description: "Continue playing to potentially increase earnings and gain more XP. Start new games or explore different pool types."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section className="py-20 relative overflow-hidden" ref={sectionRef}>
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7 }}
        >
          <h2
            className="text-4xl md:text-5xl font-mono mb-4 text-[#ffdd00] glitch-text"
            data-text="How to Play"
          >
            How to Play
          </h2>
          <p className="text-[#ffdd00]/80 font-mono text-2xl max-w-2xl mx-auto">
            Our gamified rotating savings system on Solana makes financial growth simple, transparent, and fun.
          </p>
        </motion.div>

        {/* Staggered layout for steps */}
        <motion.div 
          className="relative"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className={`flex flex-col md:flex-row items-center mb-12 ${
                index % 2 === 0 ? 'md:flex-row-reverse' : ''
              }`}
              variants={itemVariants}
            >
              <div className="md:w-1/2 p-6">
                <div className="border-2 border-[#ffdd00] p-6 card-glitch bg-transparent relative z-10 h-full">
                  <div className="text-4xl font-mono mb-4 text-[#ffdd00]">{step.number}</div>
                  <h3 className="text-2xl font-mono mb-3 text-[#ffdd00]">{step.title}</h3>
                  <p className="font-mono text-[#ffdd00]/80 text-lg">{step.description}</p>
                </div>
              </div>
              <div className="md:w-1/2 flex justify-center">
                <motion.div
                  className="w-32 h-32 rounded-full border-4 border-[#ffdd00] flex items-center justify-center bg-black"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  {step.icon}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          className="mt-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="relative inline-block">
            <div className="btn-wrapper absolute inset-0 z-0"></div>
            <Link href="/app/pools" className="btn-glitch relative z-10 inline-block">
              <span className="text">Explore Games Now</span>
              <span className="decoration">⇒</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};