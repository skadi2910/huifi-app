'use client'

import NextLink from 'next/link'
import { ChevronRight, CopyIcon, ExternalLink, LinkIcon, XCircle, Menu, X, Zap, Shield, Award, Home, LayoutDashboard } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { Dialog } from '@headlessui/react'
import { WalletButton } from '../solana/solana-provider'
import { LazorKitButton } from '../solana/LazorKitButton'
import { AccountChecker } from '../account/account-ui'
import { useCallback } from 'react'

export function useTransactionToast() {
  return useCallback((signature: string) => {
    const url = `https://explorer.solana.com/tx/${signature}?cluster=devnet`
    toast.success(
      <div className="font-mono">
        <div className="mb-2">Transaction confirmed</div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 underline text-xs"
        >
          <LinkIcon className="h-3 w-3" />
          <div>Solana Explorer</div>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    )
  }, [])
}

export function AppModal({
  isOpen,
  setIsOpen,
  title,
  children,
}: {
  isOpen: boolean; // Make sure this is always a boolean
  setIsOpen: (isOpen: boolean) => void;
  title: ReactNode;
  children: ReactNode;
}) {
  // Add a fallback default value for isOpen
  const openValue = isOpen === true; // Forces a boolean value

  return (
    <Dialog
      open={openValue} // Use openValue instead of isOpen directly
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      {/* Rest of the component remains the same */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md bg-[#0a0a09] border-4 border-[#ffdd00] rounded-lg overflow-hidden transform transition-all">
          <Dialog.Title className="bg-[#ffdd00] text-black font-mono text-lg px-4 py-3 flex justify-between items-center">
            <div className="flex items-center">
              {title}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-black hover:text-black/70 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </Dialog.Title>
          
          <div className="p-6">
            {children}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export function ellipsify(str: string, start = 4, end = 4): string {
  if (str.length <= start + end) return str
  return `${str.slice(0, start)}...${str.slice(-end)}`
}

export function AppHero({
  title,
  subtitle,
  children,
}: {
  title: ReactNode
  subtitle?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="bg-[#010200]/50 border-b-4 border-[#ffdd00] py-12 mb-8">
      <div className="container mx-auto px-4">
        <div className="text-center md:text-left">
          <div className="text-3xl md:text-4xl font-mono mb-2 text-[#ffdd00] glitch-text" data-text={title}>
            {title}
          </div>
          {subtitle && <div className="text-lg md:text-xl font-mono text-[#ffdd00]/80">{subtitle}</div>}
          {children}
        </div>
      </div>
    </div>
  )
}

export function UiLayout({ links, children }: { links: { label: string; path: string }[]; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Define your navigation links here
  const navigationLinks = [
    { label: 'Home', path: '/' },
    { label: 'Games', path: '/app/pools' },
    { label: 'Learn', path: '/learn/how-it-works' },
    { label: 'Dashboard', path: '/app/dashboard' }
  ]

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Decorative Background Elements remain unchanged */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 -right-48 w-96 h-96 bg-[#ffdd00]/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-48 w-96 h-96 bg-[#ffdd00]/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-48 left-1/4 w-96 h-96 bg-[#ffdd00]/10 rounded-full blur-3xl"></div>
        
        {/* Grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,221,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,221,0,0.05)_1px,transparent_1px)]" style={{ backgroundSize: '40px 40px' }}></div>
        
        {/* Random glitch elements */}
        <div className="absolute top-1/4 left-1/4 w-4 h-12 bg-[#ffdd00]/30 animate-pulse-slow"></div>
        <div className="absolute top-3/4 right-1/3 w-8 h-2 bg-[#ffdd00]/20 animate-ping-slow"></div>
        <div className="absolute bottom-1/4 left-2/3 w-2 h-8 bg-[#ffdd00]/20 animate-bounce-slow"></div>
      </div>

      {/* Redesigned Navbar */}
      <nav className="sticky top-0 z-40 bg-[#010200]/90 backdrop-blur-md border-b-4 border-[#ffdd00]">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo with enhanced animation */}
            <motion.div 
              className="flex items-center"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <NextLink href="/">
                <div className="flex items-center group">
                  <motion.div 
                    className="w-8 h-8 bg-[#ffdd00] rounded mr-2 flex items-center justify-center overflow-hidden"
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <Zap className="h-5 w-5 text-black" />
                  </motion.div>
                  <span className="text-2xl font-mono text-[#ffdd00] group-hover:text-[#ffdd00]/80 transition">
                    Hui<span className="font-mono text-white">Fi</span>
                    <motion.span 
                      className="inline-block text-[#ffdd00]"
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    >_</motion.span>
                  </span>
                </div>
              </NextLink>
            </motion.div>
            
            {/* Enhanced Desktop Navigation */}
            <div className="hidden md:flex">
              <motion.div 
                className="flex space-x-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, staggerChildren: 0.1 }}
              >
                {navigationLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <NextLink 
                      href={link.path}
                      className="px-4 py-2 font-mono text-lg block"
                    >
                      <span className={`relative z-10 ${
                        pathname === link.path ? 'text-[#ffdd00]' : 'text-[#ffdd00]/70 hover:text-[#ffdd00]'
                      } transition-colors`}>
                        {link.label}
                      </span>
                      {pathname === link.path && (
                        <motion.div 
                          className="absolute bottom-0 left-0 h-0.5 bg-[#ffdd00] w-full"
                          layoutId="underline"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </NextLink>
                  </motion.div>
                ))}
              </motion.div>
            </div>
            
            {/* Wallet and Mobile Menu Button */}
            <motion.div 
              className="flex items-center"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <WalletButton />
              <LazorKitButton />
              
              <motion.button
                className="md:hidden ml-4 text-[#ffdd00] hover:text-[#ffdd00]/80 transition p-2 rounded-md"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
        
        {/* Enhanced Mobile menu with animations */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              className="md:hidden bg-[#0a0a09] border-b-4 border-[#ffdd00]"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-4 space-y-1">
                {navigationLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <NextLink 
                      href={link.path}
                      className={`block px-3 py-2 font-mono text-xl rounded-md ${
                        pathname === link.path 
                          ? 'text-[#ffdd00] bg-[#ffdd00]/10' 
                          : 'text-[#ffdd00]/70 hover:text-[#ffdd00] hover:bg-[#ffdd00]/5'
                      } transition-colors`}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center">
                        {link.path === '/' && <Home className="w-5 h-5 mr-2" />}
                        {link.path.includes('pools') && <Award className="w-5 h-5 mr-2" />}
                        {link.path.includes('learn') && <Shield className="w-5 h-5 mr-2" />}
                        {link.path.includes('dashboard') && <LayoutDashboard className="w-5 h-5 mr-2" />}
                        {link.label}
                      </div>
                    </NextLink>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      
      <AccountChecker />
      
      <main className="flex-grow relative z-10 pt-6">
        {children}
      </main>
      
      <footer className="bg-[#010200] text-[#ffdd00]/80 border-t-4 border-[#ffdd00] py-8 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-mono text-[#ffdd00] mb-3">HuiFi</h3>
              <p className="font-mono text-sm">
                Decentralized Rotating Savings Games on Solana.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-mono text-[#ffdd00] mb-3">Resources</h3>
              <ul className="space-y-2 font-mono text-sm">
                <li>
                  <a href="#" className="hover:text-[#ffdd00] transition">Documentation</a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#ffdd00] transition">FAQs</a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#ffdd00] transition">Terms of Service</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-mono text-[#ffdd00] mb-3">Connect</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-[#ffdd00]/80 hover:text-[#ffdd00] transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-[#ffdd00]/80 hover:text-[#ffdd00] transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-[#ffdd00]/80 hover:text-[#ffdd00] transition">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#ffdd00]/20 text-center font-mono text-xs">
            <p>&copy; {new Date().getFullYear()} HuiFi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}