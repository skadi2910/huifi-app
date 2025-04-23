'use client';

import React from 'react';
import Link from 'next/link';
import { Coins, ChevronRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

export const CTASection: React.FC = () => {
  const sectionRef = React.useRef(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section className="py-20 relative overflow-hidden" ref={sectionRef}>
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.h2 
          className="text-4xl md:text-5xl font-mono mb-6 glitch-text text-[#ffdd00]" 
          data-text="Ready to Start Your Game?"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
        >
          Ready to Start Your Game?
        </motion.h2>
        <motion.p 
          className="text-xl font-mono mb-8 max-w-2xl mx-auto text-[#ffdd00]/80"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Join thousands of players already earning rewards from our decentralized rotating savings games.
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <div className="relative">
              <div className="btn-wrapper absolute inset-0 z-0"></div>
              <Link
                href="/app/pools"
                className="btn-glitch relative z-10"
              >
                <span className="text">// Start Playing</span>
                <span className="text-decoration">_</span>
                <span className="decoration">⇒</span>
              </Link>
            </div>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Link
              href="/learn/how-it-works"
              className="btn-glitch-dark"
            >
              <span className="text">// Game Guide</span>
              <span className="text-decoration">_</span>
              <span className="decoration">⇒</span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};