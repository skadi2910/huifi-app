import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';


export function generateRandomUUID(length: number): Uint8Array {
    return new Uint8Array(length).map(() => Math.floor(Math.random() * 256));
}

export const formatAddress = (address: PublicKey): string => {
    const addressStr = address.toString();
    return `${addressStr.slice(0, 4)}...${addressStr.slice(-4)}`;
  };
  
  export const formatAmount = (amount: BN | number | undefined): string => {
    if (!amount) return '0.00';
    const value = typeof amount === 'number' ? amount : amount.toNumber();
    return (value / 1_000_000).toFixed(2); // Assuming 6 decimals for USDC
  };
  
  export const formatDate = (timestamp: BN | number | undefined): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(
      typeof timestamp === 'number' ? timestamp * 1000 : timestamp.toNumber() * 1000
    );
    return date.toLocaleDateString();
  };
  
  export const formatTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return [hours, minutes, remainingSeconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
  };