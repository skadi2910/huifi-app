import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useCluster } from '@/components/cluster/cluster-data-access';
import { HuifiProgram, IDL, PROGRAM_ID } from '@/lib/types/huifi-program';

export const useHuifiProgram = () => {
  const { connection } = useConnection();
  const { publicKey, signAllTransactions, signTransaction } = useWallet();
  const { cluster } = useCluster();

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;

    return new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions,
      },
      { commitment: 'confirmed' }
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    try {
      return new Program(IDL, provider) as HuifiProgram;
    } catch (error) {
      console.error('Failed to initialize program:', error);
      return null;
    }
  }, [provider]);

  return {
    program,
    provider,
    cluster, // expose cluster if needed by consumers
  };
};