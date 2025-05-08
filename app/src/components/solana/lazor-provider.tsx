'use client'

import { ReactNode } from 'react'
import { useWallet as useLazorWallet } from '@lazorkit/wallet'

export function LazorProvider({ children }: { children: ReactNode }) {
  const {
    isConnected,
    publicKey,
    smartWalletAuthorityPubkey,
    connect,
    disconnect,
    signMessage,
    error,
    isLoading
  } = useLazorWallet()

  return (
    <div>
      {children}
    </div>
  )
}
