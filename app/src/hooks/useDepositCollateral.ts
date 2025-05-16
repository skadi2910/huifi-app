import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { Commitment, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useHuifiProgram } from "./useHuifiProgram";
import { useTransactions } from "@/contexts/TransactionContext";
import { solToLamports } from "@/lib/utils";
import { useTransactionToast } from "@/components/ui/ui-layout";
interface DepositCollateralProps {
  amount: number;
  uuid: number[];
}
export const useDepositCollateral = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  //   const { connection } = useConnection();
  const { connection, program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const transactionToast = useTransactionToast();
  const depositSolCollateralMutation = useMutation({
    mutationKey: ["deposit-sol-collateral", { pool: poolAddress.toString() }],
    mutationFn: async (params: DepositCollateralProps): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error("Wallet not connected or program not loaded");
      }
      try {
        const amountLamports = solToLamports(params.amount);
        // Find the group account PDA using the UUID
        const [groupPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('huifi-pool'), new Uint8Array(params.uuid)],
            program.programId
          );
        // const groupAccount = await connection.getAccountInfo(groupPda);
        // console.log("Group account:", groupAccount);
        // Find the member account PDA
        const [memberPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('huifi-member'), groupPda.toBuffer(), publicKey.toBuffer()],
            program.programId
          );
        const [collateralVaultSolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("huifi-collateral-vault-sol"), poolAddress.toBuffer()],
          program.programId
        );
        const signature = await program.methods
          .depositSolCollateral(new Uint8Array(params.uuid), amountLamports)
          .accounts({
            contributor: publicKey,
            groupAccount: groupPda,
            memberAccount: memberPda,
            collateralVaultSol: collateralVaultSolPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        // Wait for confirmation with longer timeout
        await connection.confirmTransaction(signature, 'confirmed');
        addTransaction(signature, 'Collateral Deposit');
        transactionToast(signature);
        return signature;
        // return "Deposit Sol Collateral";
      } catch (error) {
        console.error("Error depositing collateral:", error);
        throw error;
      }
    },
  });
  return {depositSolCollateralMutation}
};
