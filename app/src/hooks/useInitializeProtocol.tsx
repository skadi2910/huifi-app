import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { useHuifiProgram } from './useHuifiProgram';
import { initializeProtocol } from '@/lib/huifi-data-access';
import { toast } from 'react-hot-toast';

export function useInitializeProtocol() {
  const program = useHuifiProgram();
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  
  const initializeMutation = useMutation({
    mutationFn: async (protocolFeeBps: number = 100) => {
      if (!program || !publicKey || !connection) {
        throw new Error("Wallet not connected or program not loaded");
      }
      
      // Check connection
      try {
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        console.log("Connection confirmed with blockhash:", blockhash.substring(0, 10) + "...");
      } catch (err) {
        console.error("Connection check failed:", err);
        throw new Error("Cannot connect to Solana network. Please check your internet connection.");
      }
      
      // No need to generate a keypair, just call the function
      const tx = await initializeProtocol(
        program,
        publicKey,
        protocolFeeBps
      );
      
      return tx;
    },
    retry: 1,
    onError: (error) => {
      // Error handling remains the same
      if (error instanceof Error) {
        if (error.message.includes('Blockhash not found')) {
          toast.error('Network connection issue. Please try again.');
        } else if (error.message.includes('seeds constraint was violated')) {
          toast.error('Protocol may already be initialized.');
        } else if (error.message.includes('unknown signer')) {
          toast.error('Signing error. Please try again.');
        } else {
          toast.error(`Initialization error: ${error.message}`);
        }
      }
    }
  });

  return { initializeMutation };
}