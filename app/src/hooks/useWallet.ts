import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useWallet as useLazorWallet } from "@lazorkit/wallet";
import { useEffect } from "react";
import { useState } from "react";

export function useWallet() {
  const solanaWallet = useSolanaWallet();
  const lazorWallet = useLazorWallet();
  const {smartWalletAuthorityPubkey} = lazorWallet;
  console.log("smartWalletAuthorityPubkey",smartWalletAuthorityPubkey);
  const [storedSmartWalletPubkey, setStoredSmartWalletPubkey] = useState(() => {
    const savedPubkey = sessionStorage.getItem('smartWalletAuthorityPubkey');
    return savedPubkey ? savedPubkey : null;
  });



  useEffect(() => {
    if (smartWalletAuthorityPubkey) {
      sessionStorage.setItem('smartWalletAuthorityPubkey', smartWalletAuthorityPubkey);
      setStoredSmartWalletPubkey(smartWalletAuthorityPubkey);
      console.log('Wallet connected with public key:', smartWalletAuthorityPubkey);
    }
  }, [smartWalletAuthorityPubkey]);
  // console.log('Lazor wallet state:', {
  //   isConnected: lazorWallet.isConnected,
  //   publicKey: lazorWallet.publicKey?.toString(),
  //   smartWalletAuthorityPubkey: lazorWallet.smartWalletAuthorityPubkey?.toString(),
  // });
  // Helper to determine which wallet is active
  const activeWalletType = lazorWallet.isConnected
    ? "lazor"
    : solanaWallet.connected
    ? "solana"
    : null;

  // Get the active public key
  const activePublicKey = (() => {
    if (lazorWallet.isConnected) {
      return lazorWallet.smartWalletAuthorityPubkey || lazorWallet.publicKey;
    }
    
    if (solanaWallet.connected) {
      return solanaWallet.publicKey;
    }
    
    return null;
  })();

  // Generic sign transaction method that uses the appropriate wallet
  const signTransaction = async (transaction: any) => {
    if (lazorWallet.isConnected) {
      return lazorWallet.signMessage(transaction);
    }
    if (solanaWallet.connected) {
      return solanaWallet?.signTransaction?.(transaction);
    }
    throw new Error("No wallet connected");
  };
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

   // Combined properties
    activeWalletType,
    activePublicKey,
    signTransaction,
    isConnected: solanaWallet.connected || lazorWallet.isConnected,
  };
}
