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

require('@solana/wallet-adapter-react-ui/styles.css')

export const WalletButton = dynamic(async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton, {
  ssr: false,
})

export function SolanaProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster()
  const endpoint = useMemo(() => cluster.endpoint, [cluster])
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
  ], [])
  
  const onError = useCallback((error: WalletError) => {
    console.error(error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
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