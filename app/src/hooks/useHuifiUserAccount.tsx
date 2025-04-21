import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { findUserAccountAddress } from '@/lib/pda';
import { useHuifiProgram } from './useHuifiProgram';
import { UserAccount } from '@/lib/types/program-types';
import { createUserAccount } from '@/lib/huifi-data-access';
import toast from 'react-hot-toast';

export function useHuifiUserAccount(userPublicKey: PublicKey | null) {
  const { connection } = useConnection();
  const program = useHuifiProgram();
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserAccount = async () => {
    if (!userPublicKey || !program) return;

    setIsLoading(true);
    setError(null);
    try {
      const [userAccountAddress] = findUserAccountAddress(userPublicKey);
      const account = await program.account.userAccount.fetch(userAccountAddress);
      setUserAccount(account as unknown as UserAccount);
    } catch (err: any) {
      // Check if error is "Account not found" - this is expected for new users
      if (err.message?.includes('Account does not exist')) {
        setUserAccount(null);
        setError('User account not initialized');
      } else {
        console.error('Error fetching user account:', err);
        setError('Failed to load user data');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize user account if it doesn't exist
  const initializeUserAccount = async () => {
    if (!userPublicKey || !program) return;
    
    setIsLoading(true);
    try {
      const tx = await createUserAccount(program, userPublicKey);
      toast.success('User account created successfully');
      await fetchUserAccount(); // Refresh after creating
    } catch (err) {
      console.error('Error creating user account:', err);
      toast.error('Failed to create user account');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and subscription setup
  useEffect(() => {
    if (!userPublicKey || !program) return;

    fetchUserAccount();

    // Set up subscription for real-time updates
    if (connection) {
      const [userAccountAddress] = findUserAccountAddress(userPublicKey);
      const subscriptionId = connection.onAccountChange(
        userAccountAddress,
        async (accountInfo) => {
          try {
            // Fix: Use fetch instead of decode and explicitly use the account address
            const updatedAccount = await program.account.userAccount.fetch(userAccountAddress);
            setUserAccount(updatedAccount as unknown as UserAccount);
          } catch (err) {
            console.error('Error decoding updated user account:', err);
          }
        }
      );

      return () => {
        connection.removeAccountChangeListener(subscriptionId);
      };
    }
  }, [userPublicKey, program, connection]);

  return { 
    userAccount, 
    isLoading, 
    error, 
    initializeUserAccount,
    refreshUserAccount: fetchUserAccount
  };
}