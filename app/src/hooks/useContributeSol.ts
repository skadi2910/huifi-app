import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { Commitment, PublicKey, SystemProgram } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { solToLamports } from '@/lib/utils';

export interface ContributeSolParams {
  poolId: PublicKey;
  uuid: number[];
  amount: number; // in SOL (will be converted to lamports)
}

export const useContributeSol = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const contributeSolMutation = useMutation({
    mutationKey: ['contribute-sol'],
    mutationFn: async (params: ContributeSolParams): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        // Convert the UUID array to a proper format
        const uuid = Array.from(params.uuid.slice(0, 6));
        
        // Convert SOL amount to lamports
        const amountLamports =  solToLamports(params.amount); // 1 SOL = 10^9 lamports
        
        // Find the group account PDA using the UUID
        const [groupPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-pool'), new Uint8Array(uuid)],
          program.programId
        );

        // Find the member account PDA
        const [memberPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-member'), groupPda.toBuffer(), publicKey.toBuffer()],
          program.programId
        );

        // Find the vault SOL PDA
        const [vaultSolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-vault-sol'), groupPda.toBuffer()],
          program.programId
        );

        // Find the price update account
        // Note: In a real implementation, you would need to fetch this from Pyth or another oracle
        // This is just a placeholder - you'll need to implement the actual price feed logic
        const priceFeedAccount = new PublicKey('J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix'); // Placeholder

        console.log('Contributing SOL to pool:', {
          contributor: publicKey.toString(),
          groupAccount: groupPda.toString(),
          memberAccount: memberPda.toString(),
          vaultSol: vaultSolPda.toString(),
          amount: amountLamports.toString(),
          uuid
        });

        // Add preflight commitment option
        const options = {
          commitment: 'confirmed' as Commitment,
          preflightCommitment: 'confirmed' as Commitment,
        };
        
        // Call the contribute_sol instruction with options
        const signature = await program.methods
          .contributeSol(uuid, amountLamports)
          .accounts({
            contributor: publicKey,
            groupAccount: groupPda,
            memberAccount: memberPda,
            vaultSol: vaultSolPda,
            priceUpdate: priceFeedAccount,
            systemProgram: SystemProgram.programId,
          })
          .rpc(options);
        
        // Wait for confirmation with longer timeout
        await connection.confirmTransaction(signature, 'confirmed');
        addTransaction(signature, 'Contribute SOL to Pool');
        
        return signature;
      } catch (error) {
        console.error('Error contributing SOL to pool:', error);
        throw error;
      }
    }
  });

  return { contributeSolMutation };
};