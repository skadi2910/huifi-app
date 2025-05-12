import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { useWallet as useLazorWallet } from "@lazorkit/wallet";
import { useEffect } from "react";
import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { error } from "console";

export function useWallet() {
  const solanaWallet = useSolanaWallet();
  const lazorWallet = useLazorWallet();
  const {smartWalletAuthorityPubkey} = lazorWallet;
  // console.log("smartWalletAuthorityPubkey",smartWalletAuthorityPubkey);

  const [storedSmartWalletPubkey, setStoredSmartWalletPubkey] = useState<string | null>(() => {
    // Initialize from localStorage only once
    if (typeof window !== 'undefined') {
      return localStorage.getItem('smartWalletAuthorityPubkey');
    }
    return null;
  });
  // Initialize smart wallet when connected
  useEffect(() => {
    if (lazorWallet.isConnected && !lazorWallet.smartWalletAuthorityPubkey) {
      console.log('Initializing smart wallet...');
      lazorWallet.connect().catch((error: Error) => {
        console.error('Failed to initialize smart wallet:', error);
      });
    }
  }, [lazorWallet.isConnected, lazorWallet.smartWalletAuthorityPubkey]);
 // Save smart wallet pubkey to localStorage when it changes
 useEffect(() => {
  const smartWalletPubkey = lazorWallet.smartWalletAuthorityPubkey;
  if (smartWalletPubkey && smartWalletPubkey !== storedSmartWalletPubkey) {
    localStorage.setItem('smartWalletAuthorityPubkey', smartWalletPubkey);
    setStoredSmartWalletPubkey(smartWalletPubkey);
    console.log('Smart wallet pubkey saved:', smartWalletPubkey);
  }
}, [lazorWallet.smartWalletAuthorityPubkey]);
 // Get the active public key
 const activePublicKey = (() => {
  try {
    // Check Lazor wallet first
    if (lazorWallet.isConnected) {
      // Log the raw values
      // console.log('Lazor wallet values:', {
      //   smartWalletAuthorityPubkey: lazorWallet.smartWalletAuthorityPubkey,
      //   publicKey: lazorWallet.publicKey,
      //   types: {
      //     smartWallet: typeof lazorWallet.smartWalletAuthorityPubkey,
      //     publicKey: typeof lazorWallet.publicKey
      //   }
      // });

      // Use smart wallet authority if available, otherwise use regular public key
      const key = lazorWallet.smartWalletAuthorityPubkey || lazorWallet.publicKey;
      if (!key) return null;

      // If it's already a PublicKey, return it
      if (key instanceof PublicKey) {
        return key;
      }

      // If it's a string, try to convert it
      if (typeof key === 'string') {
        return new PublicKey(key);
      }

      // If it's a Uint8Array or Buffer, convert it
      if (key instanceof Uint8Array || Buffer.isBuffer(key)) {
        return new PublicKey(key);
      }

      console.error('Unsupported public key format:', key);
      return null;
    }
    
    // Fall back to Solana wallet
    if (solanaWallet.connected && solanaWallet.publicKey) {
      const solanaKey = solanaWallet.publicKey;
      // console.log("Type of Solana Key:", {
      //   value: solanaKey,
      //   type: typeof solanaKey,
      //   isPublicKey: solanaKey instanceof PublicKey,
      //   hasToBase58: solanaKey?.toBase58 ? 'yes' : 'no',
      //   toString: solanaKey?.toString(),
      //   raw: solanaKey
      // });
      return solanaKey;
    }
    
    return null;
  } catch (error) {
    console.error('Error creating PublicKey:', error);
    return null;
  }
})();

  // Helper to determine which wallet is active
  const activeWalletType = lazorWallet.isConnected
    ? "lazor"
    : solanaWallet.connected
    ? "solana"
    : null;


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
