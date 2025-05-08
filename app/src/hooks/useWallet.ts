import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { useWallet as useLazorWallet } from '@lazorkit/wallet'

export function useWallet() {
  const solanaWallet = useSolanaWallet()
  const lazorWallet = useLazorWallet()

  return {
    // Solana wallet properties
    solanaPublicKey: solanaWallet.publicKey,
    solanaIsConnected: solanaWallet.connected,
    solanaConnect: solanaWallet.connect,
    solanaDisconnect: solanaWallet.disconnect,
    solanaSignTransaction: solanaWallet.signTransaction,
    solanaSignAllTransactions: solanaWallet.signAllTransactions,

    // Lazor wallet properties
    lazorPublicKey: lazorWallet.publicKey,
    lazorIsConnected: lazorWallet.isConnected,
    lazorSmartWalletAuthorityPubkey: lazorWallet.smartWalletAuthorityPubkey,
    lazorConnect: lazorWallet.connect,
    lazorDisconnect: lazorWallet.disconnect,
    lazorSignMessage: lazorWallet.signMessage,
    lazorError: lazorWallet.error,
    lazorIsLoading: lazorWallet.isLoading,
  }
}