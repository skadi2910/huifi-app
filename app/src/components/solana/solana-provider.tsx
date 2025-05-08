'use client'

import dynamic from 'next/dynamic'
import { AnchorProvider } from '@coral-xyz/anchor'
import { WalletError } from '@solana/wallet-adapter-base'
import {
  AnchorWallet,
  useConnection,
  useWallet,
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { ReactNode, useCallback, useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
// @ts-ignore
import { 
  PhantomWalletAdapter, 
  SolflareWalletAdapter, 
  LedgerWalletAdapter 
} from '@solana/wallet-adapter-wallets'
import { LazorWalletAdapter } from './lazor-wallet-adapter'

require('@solana/wallet-adapter-react-ui/styles.css')

// Create a custom wallet button component
const CustomWalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui')
    return function CustomWalletButton() {
      return (
        <div className="wallet-adapter-dropdown">
          <WalletMultiButton />
          <div className="wallet-adapter-dropdown-list">
            <button
              className="wallet-adapter-dropdown-list-item"
              onClick={async () => {
                const lazorWallet = new LazorWalletAdapter()
                try {
                  await lazorWallet.connect()
                } catch (error) {
                  console.error('Failed to connect Lazor wallet:', error)
                }
              }}
            >
              Connect Lazor Wallet
            </button>
          </div>
        </div>
      )
    }
  },
  { ssr: false }
)

export const WalletButton = CustomWalletButton

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new LazorWalletAdapter(),
  ], [])
  
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export function useAnchorProvider() {
  const { connection } = useConnection()
  const wallet = useWallet()

  return useMemo(() => 
    wallet 
      ? new AnchorProvider(
          connection, 
          {
            publicKey: wallet.publicKey!,
            signTransaction: wallet.signTransaction as any,
            signAllTransactions: wallet.signAllTransactions as any,
          }, 
          { commitment: 'confirmed' }
        ) 
      : new AnchorProvider(connection, null as any, { commitment: 'confirmed' })
  , [connection, wallet])
}