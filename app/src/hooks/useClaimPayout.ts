import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useTransactionToast } from '@/components/ui/ui-layout';
export const useClaimPayout = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program, connection } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const transactionToast = useTransactionToast();
  
  // Mutation for claiming a jackpot
  const claimPayoutMutation = useMutation({
    mutationKey: ['claim-payout', { pool: poolAddress.toString() }],
    mutationFn: async (params: { uuid: number[] }): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        const [groupPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-pool'), new Uint8Array(params.uuid)],
          program.programId
        );
        const [recipientPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-member'), groupPda.toBuffer(), publicKey.toBuffer()],
          program.programId
        );
        const [treasuryPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-treasury'), Buffer.from('sol')],
          program.programId
        );
        const [protocolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-protocol')],
          program.programId
        );
        const [vaultSolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-vault-sol'), groupPda.toBuffer()],
          program.programId
        );
        console.log("Debug account addresses:", {
          user: publicKey.toString(),
          groupAccount: groupPda.toString(),
          recipientAccount: recipientPda.toString(),
          protocolSettings: protocolPda.toString(),
          protocolTreasury: treasuryPda.toString(),
          vaultSol: vaultSolPda.toString(),
        });
        const signature = await program.methods
          .processPayout(new Uint8Array(params.uuid))
          .accounts({
            user: publicKey,
            groupAccount: groupPda,
            recipientAccount: recipientPda,
            protocolSettings: protocolPda,
            protocolTreasury: treasuryPda,
            vaultSol: vaultSolPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        await connection.confirmTransaction(signature, 'confirmed');
        addTransaction(signature, 'Claim Payout');
        transactionToast(signature);
        return signature;
        // return "Claim Payout"; 
      } catch (error) {
        console.error('Error claiming jackpot:', error);
        throw error;
      }
    }
  });
  
  return { claimPayoutMutation };
};