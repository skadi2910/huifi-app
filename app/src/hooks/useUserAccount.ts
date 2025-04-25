import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';

export const useUserAccount = () => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  // Generate PDA using correct seed from IDL
  const userAccountPda = useMemo(() => {
    if (!publicKey || !program) return null;

    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('huifi-member'), publicKey.toBuffer()], 
      program.programId
    );

    return pda;
  }, [publicKey, program]);

  // Fetch user account
  const userAccountQuery = useQuery({
    queryKey: ['userAccount', publicKey?.toBase58()],
    queryFn: async () => {
      if (!program || !userAccountPda) throw new Error('Missing program or PDA');
      try {
        // Note: using lowercase 'userAccount' to match Anchor-generated types
        return await program.account.UserAccount.fetch(userAccountPda);
      } catch (err) {
        console.warn('User account not found:', err);
        return null;
      }
    },
    enabled: !!program && !!userAccountPda,
  });

  // Create user account mutation
  const createUserAccountMutation = useMutation({
    mutationKey: ['create-user-account', publicKey?.toBase58()],
    mutationFn: async (): Promise<string> => {
      if (!program || !publicKey || !userAccountPda) {
        throw new Error('Wallet or program not ready');
      }

      const tx = await program.methods
        .createUserAccount()
        .accounts({
          userAccount: userAccountPda,
          user: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      addTransaction(tx, 'Create User Account');
      return tx;
    },
  });

  return {
    userAccount: userAccountQuery.data,
    userAccountPda,
    isLoading: userAccountQuery.isLoading,
    error: userAccountQuery.error,
    createUserAccountMutation,
  };
};