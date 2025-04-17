'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'
import { ReactNode, Suspense, useEffect, useRef, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Github, Twitter, Trophy, Coins, Zap, Info, Menu, X, ChevronDown, ExternalLink } from 'lucide-react'
import { FaDiscord } from 'react-icons/fa'

import { AccountChecker } from '../account/account-ui'
import { ClusterChecker, ExplorerLink } from '../cluster/cluster-ui'
import { WalletButton } from '../solana/solana-provider'

export function UiLayout({ children, links }: { children: ReactNode; links: { label: string; path: string }[] }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(to bottom, #010200, #0a0a05)' }}>
      {/* Header Section - Redesigned with glass effect */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#010200]/80 border-b border-[#e6ce04]/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-[#e6ce04] to-[#f8e555] rounded-full flex items-center justify-center mr-2">
                  <Coins className="h-4 w-4 text-[#010200]" />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#e6ce04] to-[#f8e555]">
                  HuiFi
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/app/pools" 
                className={`text-[#e6ce04] hover:text-[#f8e555] transition-all duration-200 py-1 px-2 rounded-md hover:bg-[#e6ce04]/10 ${
                  pathname.startsWith('/app/pools') ? 'bg-[#e6ce04]/10 text-[#f8e555] font-medium' : ''
                }`}
              >
                Games
              </Link>
              <div className="relative group">
                <button className="flex items-center text-[#e6ce04] hover:text-[#f8e555] transition-all duration-200 py-1 px-2 rounded-md hover:bg-[#e6ce04]/10">
                  <span>Rules</span>
                  <ChevronDown className="ml-1 w-4 h-4 transition-transform group-hover:rotate-180" />
                </button>
                <div className="absolute left-0 mt-1 w-48 rounded-lg shadow-lg bg-[#0a0a05] border border-[#e6ce04]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 backdrop-blur-md">
                  <div className="py-1">
                    <Link href="/learn/how-it-works" className="block px-4 py-2 text-sm text-[#e6ce04] hover:bg-[#e6ce04]/10 rounded-md mx-1 my-1">
                      How To Play
                    </Link>
                    <Link href="/learn/faq" className="block px-4 py-2 text-sm text-[#e6ce04] hover:bg-[#e6ce04]/10 rounded-md mx-1 my-1">
                      FAQ
                    </Link>
                    <Link href="/learn/glossary" className="block px-4 py-2 text-sm text-[#e6ce04] hover:bg-[#e6ce04]/10 rounded-md mx-1 my-1">
                      Game Terms
                    </Link>
                  </div>
                </div>
              </div>
              <Link 
                href="/leaderboard" 
                className={`flex items-center text-[#e6ce04] hover:text-[#f8e555] transition-all duration-200 py-1 px-2 rounded-md hover:bg-[#e6ce04]/10 ${
                  pathname.startsWith('/leaderboard') ? 'bg-[#e6ce04]/10 text-[#f8e555] font-medium' : ''
                }`}
              >
                <Trophy className="w-4 h-4 mr-1" />
                Leaderboard
              </Link>
              <Link 
                href="/about" 
                className={`text-[#e6ce04] hover:text-[#f8e555] transition-all duration-200 py-1 px-2 rounded-md hover:bg-[#e6ce04]/10 ${
                  pathname.startsWith('/about') ? 'bg-[#e6ce04]/10 text-[#f8e555] font-medium' : ''
                }`}
              >
                About
              </Link>
            </nav>

            {/* Wallet Button Only */}
            <div className="flex items-center space-x-3">
              <div className="hidden md:block">
                <WalletButton />
              </div>
              
              {/* Mobile Menu Trigger */}
              <button 
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md hover:bg-[#e6ce04]/10 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-[#e6ce04]" />
                ) : (
                  <Menu className="h-6 w-6 text-[#e6ce04]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Redesigned with slide-down animation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a05]/95 backdrop-blur-lg border-b border-[#e6ce04]/20 animate-slideDown">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex flex-col space-y-3">
              <Link 
                href="/app/pools" 
                className={`text-[#e6ce04] hover:text-[#f8e555] transition py-2 px-3 rounded-md ${
                  pathname.startsWith('/app/pools') ? 'bg-[#e6ce04]/10 text-[#f8e555]' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Games
              </Link>
              
              <div className="py-2 px-3 space-y-1">
                <button className="flex items-center text-[#e6ce04] hover:text-[#f8e555] transition w-full">
                  <span>Rules</span>
                  <ChevronDown className="ml-1 w-4 h-4" />
                </button>
                <div className="pl-4 mt-2 space-y-2">
                  <Link 
                    href="/learn/how-it-works" 
                    className="block text-sm text-[#e6ce04] hover:text-[#f8e555] py-2 px-2 rounded-md hover:bg-[#e6ce04]/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    How To Play
                  </Link>
                  <Link 
                    href="/learn/faq" 
                    className="block text-sm text-[#e6ce04] hover:text-[#f8e555] py-2 px-2 rounded-md hover:bg-[#e6ce04]/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQ
                  </Link>
                  <Link 
                    href="/learn/glossary" 
                    className="block text-sm text-[#e6ce04] hover:text-[#f8e555] py-2 px-2 rounded-md hover:bg-[#e6ce04]/10"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Game Terms
                  </Link>
                </div>
              </div>
              
              <Link 
                href="/leaderboard" 
                className={`flex items-center text-[#e6ce04] hover:text-[#f8e555] transition py-2 px-3 rounded-md ${
                  pathname.startsWith('/leaderboard') ? 'bg-[#e6ce04]/10 text-[#f8e555]' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboard
              </Link>
              
              <Link 
                href="/about" 
                className={`text-[#e6ce04] hover:text-[#f8e555] transition py-2 px-3 rounded-md ${
                  pathname.startsWith('/about') ? 'bg-[#e6ce04]/10 text-[#f8e555]' : ''
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              
              <div className="py-2">
                <WalletButton />
              </div>
            </div>
          </nav>
        </div>
      )}

      {/* Cluster/Account Checkers */}
      <ClusterChecker>
        <AccountChecker />
      </ClusterChecker>

      {/* Main Content Area */}
      <main className="flex-grow container mx-auto px-4 pt-8 pb-12">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-64">
              <div className="w-12 h-12 border-4 border-[#e6ce04]/20 border-t-[#e6ce04] rounded-full animate-spin"></div>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: '#1a1a18',
              color: '#e6ce04',
              borderRadius: '0.5rem',
              border: '1px solid rgba(230, 206, 4, 0.2)',
            }
          }}
        />
      </main>

      {/* Footer Section - Redesigned */}
      <footer className="bg-[#0a0a05] text-[#f8e555]/70 border-t border-[#e6ce04]/20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Column 1: Logo & Social */}
            <div>
              <Link href="/" className="text-xl font-bold text-[#e6ce04] mb-4 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-[#e6ce04] to-[#f8e555] rounded-full flex items-center justify-center mr-2">
                  <Coins className="h-4 w-4 text-[#010200]" />
                </div>
                HuiFi
              </Link>
              <p className="mb-6 text-sm opacity-80">
                A decentralized platform for transparent and secure rotating savings games on the blockchain.
              </p>
              <div className="flex space-x-3">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-[#1a1a18] rounded-full hover:bg-[#e6ce04]/10 transition-colors duration-300"
                  aria-label="Twitter"
                >
                  <Twitter className="h-5 w-5 text-[#e6ce04]" />
                </a>
                <a 
                  href="https://discord.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-[#1a1a18] rounded-full hover:bg-[#e6ce04]/10 transition-colors duration-300"
                  aria-label="Discord"
                >
                  <FaDiscord className="h-5 w-5 text-[#e6ce04]" />
                </a>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 bg-[#1a1a18] rounded-full hover:bg-[#e6ce04]/10 transition-colors duration-300"
                  aria-label="Github"
                >
                  <Github className="h-5 w-5 text-[#e6ce04]" />
                </a>
              </div>
            </div>

            {/* Column 2: Game Platform Links */}
            <div>
              <h3 className="text-[#e6ce04] text-lg font-medium mb-4 flex items-center">
                <Trophy className="w-4 h-4 mr-2" />
                Game Platform
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/app/pools" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    Games
                  </Link>
                </li>
                <li>
                  <Link href="/app/create" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    Create Game
                  </Link>
                </li>
                <li>
                  <Link href="/app/dashboard" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    Game Center
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources Links */}
            <div>
              <h3 className="text-[#e6ce04] text-lg font-medium mb-4 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Resources
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/learn/how-it-works" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    How To Play
                  </Link>
                </li>
                <li>
                  <Link href="/learn/faq" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal Links */}
            <div>
              <h3 className="text-[#e6ce04] text-lg font-medium mb-4 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Legal
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/terms" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/risk" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    Risk Disclosure
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-[#e6ce04] transition-colors duration-200 flex items-center">
                    <span className="w-1 h-1 bg-[#e6ce04] rounded-full mr-2"></span>
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="max-w-xl mx-auto mt-12 mb-8 p-6 bg-[#1a1a18] rounded-xl border border-[#e6ce04]/20 backdrop-blur-sm">
            <h3 className="text-[#e6ce04] text-lg font-medium mb-3">Join the Players Community</h3>
            <p className="mb-4 text-sm opacity-80">Get the latest updates, tips, and special offers straight to your inbox.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full sm:flex-1 px-4 py-2 bg-[#252520] border border-[#e6ce04]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e6ce04] focus:border-transparent text-[#f8e555] placeholder-[#f8e555]/50"
              />
              <button className="px-5 py-2 bg-gradient-to-r from-[#e6ce04] to-[#f8e555] hover:from-[#f8e555] hover:to-[#f8e555] text-[#010200] rounded-lg font-medium transition duration-300 flex items-center justify-center">
                Subscribe
                <ExternalLink className="ml-1 w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-[#e6ce04]/10 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} HuiFi. All rights reserved.</p>
            <p className="mt-2 opacity-60">
              Generated by{' '}
              <a
                className="text-[#e6ce04] hover:text-[#f8e555] transition-colors"
                href="https://github.com/solana-developers/create-solana-dapp"
                target="_blank"
                rel="noopener noreferrer"
              >
                create-solana-dapp
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode
  title: string
  hide: () => void
  show: boolean
  submit?: () => void
  submitDisabled?: boolean
  submitLabel?: string
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  useEffect(() => {
    if (!dialogRef.current) return
    if (show) {
      dialogRef.current.showModal()
    } else {
      dialogRef.current.close()
    }
  }, [show, dialogRef])

  return (
    <dialog className="modal backdrop-blur-sm" ref={dialogRef}>
      <div className="modal-box bg-[#1a1a18] border border-[#e6ce04]/20 text-[#e6ce04] rounded-xl shadow-xl">
        <h3 className="font-bold text-xl mb-4 border-b border-[#e6ce04]/10 pb-3">{title}</h3>
        <div className="space-y-4">
          {children}
        </div>
        <div className="modal-action mt-6 flex justify-end border-t border-[#e6ce04]/10 pt-3">
          <div className="flex space-x-3">
            <button 
              onClick={hide} 
              className="px-4 py-2 bg-transparent hover:bg-[#e6ce04]/10 text-[#e6ce04] border border-[#e6ce04]/20 rounded-lg transition-colors"
            >
              Close
            </button>
            {submit ? (
              <button 
                className="px-4 py-2 bg-gradient-to-r from-[#e6ce04] to-[#f8e555] hover:from-[#f8e555] hover:to-[#f8e555] text-[#010200] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={submit} 
                disabled={submitDisabled}
              >
                {submitLabel || 'Save'}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </dialog>
  )
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode
  title: ReactNode
  subtitle: ReactNode
}) {
  return (
    <div className="py-16 bg-gradient-to-b from-[#010200] to-[#0a0a05] rounded-xl border border-[#e6ce04]/10 mb-8">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          {typeof title === 'string' ? (
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e6ce04] to-[#f8e555]">{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className="py-6 text-[#f8e555]/70 text-lg">{subtitle}</p>
          ) : (
            subtitle
          )}
          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </div>
  )
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
  }
  return str
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className="text-center p-2">
        <div className="text-lg font-medium mb-2">Transaction sent</div>
        <div className="mt-2">
          <ExplorerLink 
            path={`tx/${signature}`} 
            label="View Transaction"
            className="px-4 py-2 bg-[#e6ce04] hover:bg-[#f8e555] text-[#010200] rounded-lg font-medium transition-colors inline-flex items-center"
          />
          <ExternalLink className="ml-1 w-4 h-4 inline text-[#010200]" style={{ marginLeft: '-20px', marginRight: '4px' }} />
        </div>
      </div>,
      {
        duration: 5000,
        style: {
          background: '#1a1a18',
          color: '#e6ce04',
          border: '1px solid rgba(230, 206, 4, 0.2)',
        },
      }
    )
  }
}

// Add CSS animation for mobile menu
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .animate-slideDown {
      animation: slideDown 0.2s ease-out forwards;
    }
  `
  document.head.appendChild(style)
}