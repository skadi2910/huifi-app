'use client'

import { ReactNode, createContext, useContext, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useTransactionToast } from '@/components/ui/ui-layout';
import { useWallet } from '@/hooks/useWallet';

type TransactionType = {
  signature: string;
  status: 'pending' | 'confirmed' | 'error';
  description?: string;
};

type TransactionContextType = {
  pendingTransactions: TransactionType[];
  addTransaction: (signature: string, description?: string) => void;
  confirmTransaction: (signature: string) => Promise<boolean>;
  signTransaction: (transaction: any) => Promise<string>;
  signMessage: (instruction: any) => Promise<string>;
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { 
    solanaSignTransaction,
    solanaSignAllTransactions,
    lazorSignMessage 
  } = useWallet();
  const transactionToast = useTransactionToast();
  const [pendingTransactions, setPendingTransactions] = useState<TransactionType[]>([]);

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

  const signTransaction = async (transaction: any) => {
    if (solanaSignTransaction) {
      return await solanaSignTransaction(transaction);
    }
    throw new Error('No wallet available for signing');
  };

  const signMessage = async (instruction: any) => {
    if (lazorSignMessage) {
      return await lazorSignMessage(instruction);
    }
    throw new Error('No Lazor wallet available for signing');
  };

  return (
    <TransactionContext.Provider value={{ 
      pendingTransactions, 
      addTransaction, 
      confirmTransaction,
      signTransaction,
      signMessage
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