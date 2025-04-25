<<<<<<< HEAD
'use client';

import React from 'react';
import { ShieldCheck, Trophy, Zap, Coins } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

export const FeaturesSection: React.FC = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const features = [
    {
      icon: <ShieldCheck className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Secure & Transparent',
      description: 'Smart contracts ensure your jackpot funds are secure and all gameplay rules are transparently enforced on the blockchain.'
    },
    {
      icon: <Trophy className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Fair Gameplay',
      description: 'On-chain logic guarantees fair player rotation and jackpot distribution according to predefined rules.'
    },
    {
      icon: <Zap className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Level Up & Earn',
      description: 'Earn XP and achievements (potentially off-chain) while enjoying competitive yields generated through DeFi integrations (if applicable).'
    },
    {
      icon: <Coins className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Flexible Rewards',
      description: 'Collect jackpots in various SPL tokens or stablecoins supported by the specific game pool.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
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
            data-text="Why Play with HuiFi?"
          >
            Why Play with HuiFi?
          </h2>
          <p className="text-[#ffdd00] font-mono max-w-2xl mx-auto">
            A gamified approach to rotating savings on Solana - earn rewards, level up, and secure your financial future.
          </p>
        </motion.div>

        {/* Diagonal Card Layout with staggered animations */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`relative p-6 border-2 border-[#ffdd00] card-glitch bg-transparent group transition-transform duration-300 hover:scale-105 ${
                index % 2 === 0 ? 'transform -translate-y-4' : 'transform translate-y-4'
              }`}
              variants={itemVariants}
              whileHover={{ boxShadow: "0 0 15px rgba(255, 221, 0, 0.3)" }}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-mono mb-3 text-[#ffdd00] transition-all duration-300 group-hover:font-bold group-hover:text-2xl group-hover:text-[#ffdd00]">
                {feature.title}
              </h3>
              <p className="font-mono text-[#ffdd00] transition-opacity duration-300 group-hover:opacity-80">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
=======
'use client';

import React from 'react';
import { ShieldCheck, Trophy, Zap, Coins } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

export const FeaturesSection: React.FC = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const features = [
    {
      icon: <ShieldCheck className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Secure & Transparent',
      description: 'Smart contracts ensure your jackpot funds are secure and all gameplay rules are transparently enforced on the blockchain.'
    },
    {
      icon: <Trophy className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Fair Gameplay',
      description: 'On-chain logic guarantees fair player rotation and jackpot distribution according to predefined rules.'
    },
    {
      icon: <Zap className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Level Up & Earn',
      description: 'Earn XP and achievements (potentially off-chain) while enjoying competitive yields generated through DeFi integrations (if applicable).'
    },
    {
      icon: <Coins className="w-12 h-12 text-[#ffdd00] transition-transform duration-300 group-hover:scale-110" />,
      title: 'Flexible Rewards',
      description: 'Collect jackpots in various SPL tokens or stablecoins supported by the specific game pool.'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
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
            data-text="Why Play with HuiFi?"
          >
            Why Play with HuiFi?
          </h2>
          <p className="text-[#ffdd00] font-mono max-w-2xl mx-auto">
            A gamified approach to rotating savings on Solana - earn rewards, level up, and secure your financial future.
          </p>
        </motion.div>

        {/* Diagonal Card Layout with staggered animations */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className={`relative p-6 border-2 border-[#ffdd00] card-glitch bg-transparent group transition-transform duration-300 hover:scale-105 ${
                index % 2 === 0 ? 'transform -translate-y-4' : 'transform translate-y-4'
              }`}
              variants={itemVariants}
              whileHover={{ boxShadow: "0 0 15px rgba(255, 221, 0, 0.3)" }}
            >
              <div className="mb-6">{feature.icon}</div>
              <h3 className="text-xl font-mono mb-3 text-[#ffdd00] transition-all duration-300 group-hover:font-bold group-hover:text-2xl group-hover:text-[#ffdd00]">
                {feature.title}
              </h3>
              <p className="font-mono text-[#ffdd00] transition-opacity duration-300 group-hover:opacity-80">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
};