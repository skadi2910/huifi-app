'use client'

<<<<<<< HEAD
import { ReactNode, createContext, useContext, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTransactionToast } from '@/components/ui/ui-layout';
=======
import { ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTransactionToast } from '@/components/ui/ui-layout';
import { PublicKey } from '@solana/web3.js';
import { CollateralDepositedEvent, EarlyPayoutRequestedEvent, PayoutProcessedEvent } from '@/lib/types/events';
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80

type TransactionType = {
  signature: string;
  status: 'pending' | 'confirmed' | 'error';
  description?: string;
};

type TransactionContextType = {
  pendingTransactions: TransactionType[];
  addTransaction: (signature: string, description?: string) => void;
  confirmTransaction: (signature: string) => Promise<boolean>;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  const [pendingTransactions, setPendingTransactions] = useState<TransactionType[]>([]);
<<<<<<< HEAD
=======
  const [program, setProgram] = useState<any>(null);
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80

  const addTransaction = (signature: string, description?: string) => {
    setPendingTransactions(prev => [
      ...prev, 
      { signature, status: 'pending', description }
    ]);
  };

  const confirmTransaction = async (signature: string): Promise<boolean> => {
    try {
      // Wait for confirmation
      const status = await connection.confirmTransaction(signature, 'confirmed');
      
      if (status.value.err) {
        setPendingTransactions(prev => 
          prev.map(tx => tx.signature === signature 
            ? { ...tx, status: 'error' } 
            : tx
          )
        );
        console.error('Transaction error:', status.value.err);
        return false;
      }
      
      // Update status to confirmed
      setPendingTransactions(prev => 
        prev.map(tx => tx.signature === signature 
          ? { ...tx, status: 'confirmed' } 
          : tx
        )
      );
      
      // Display success toast
      transactionToast(signature);
      
      // Clean up confirmed transactions after a delay
      setTimeout(() => {
        setPendingTransactions(prev => 
          prev.filter(tx => tx.signature !== signature)
        );
      }, 5000);
      
      return true;
    } catch (err) {
      console.error('Error confirming transaction:', err);
      setPendingTransactions(prev => 
        prev.map(tx => tx.signature === signature 
          ? { ...tx, status: 'error' } 
          : tx
        )
      );
      return false;
    }
  };

<<<<<<< HEAD
=======
  const getTransactionDescription = (description?: string) => {
    switch (description) {
      case 'Request Early Payout':
        return 'Requesting early payout...';
      case 'Deposit Collateral':
        return 'Depositing collateral...';
      case 'Process Payout':
        return 'Processing payout...';
      default:
        return description || 'Processing transaction...';
    }
  };

  const handleCollateralDeposited = (event: CollateralDepositedEvent) => {
    // Handle collateral deposited event
  };

  const handleEarlyPayoutRequested = (event: EarlyPayoutRequestedEvent) => {
    // Handle early payout request event
  };

  const handlePayoutProcessed = (event: PayoutProcessedEvent) => {
    // Handle payout processed event
  };

  // Add event listeners
  useEffect(() => {
    if (!program) return;

    const collateralListener = program.addEventListener('CollateralDepositedEvent', handleCollateralDeposited);
    const earlyPayoutListener = program.addEventListener('EarlyPayoutRequestedEvent', handleEarlyPayoutRequested);
    const payoutListener = program.addEventListener('PayoutProcessedEvent', handlePayoutProcessed);

    return () => {
      program.removeEventListener(collateralListener);
      program.removeEventListener(earlyPayoutListener);
      program.removeEventListener(payoutListener);
    };
  }, [program]);

>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
  return (
    <TransactionContext.Provider value={{ 
      pendingTransactions, 
      addTransaction, 
      confirmTransaction 
    }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}