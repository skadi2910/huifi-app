import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { PublicKey, SystemProgram } from "@solana/web3.js";
// import { BN } from "@coral-xyz/anchor";
import { useHuifiProgram } from "./useHuifiProgram";
import { useTransactions } from "@/contexts/TransactionContext";
import { useTransactionToast } from "@/components/ui/ui-layout";
  // import { solToLamports } from "@/lib/utils";

interface WithdrawSolCollateralProps {
  uuid: number[];
}

export const useWithdrawSolCollateral = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { connection, program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const transactionToast = useTransactionToast();
  const withdrawSolCollateralMutation = useMutation({
    mutationKey: ["withdraw-sol-collateral", { pool: poolAddress.toString() }],
    mutationFn: async (params: WithdrawSolCollateralProps): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error("Wallet not connected or program not loaded");
      }
      try {
        const [groupAccountPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('huifi-pool'), new Uint8Array(params.uuid)],
            program.programId
          );
        const [memberAccountPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('huifi-member'), groupAccountPda.toBuffer(), publicKey.toBuffer()],
            program.programId
          );
        const [collateralVaultSolPda] = PublicKey.findProgramAddressSync(
            [Buffer.from('huifi-collateral-vault-sol'), groupAccountPda.toBuffer()],
            program.programId
          );
        const signature = await program.methods
          .withdrawSolCollateral(new Uint8Array(params.uuid))
          .accounts({
            user: publicKey,
            groupAccount: groupAccountPda,
            memberAccount: memberAccountPda,
            collateralVaultSol: collateralVaultSolPda,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        // // Wait for confirmation with longer timeout
        await connection.confirmTransaction(signature, 'confirmed');
        addTransaction(signature, 'Withdraw Sol Collateral');
        transactionToast(signature);
        return signature;
        // return "Withdraw Sol Collateral";
    }
    catch (error) {
      console.error("Error withdrawing SOL collateral:", error);
      throw error;
    }
  },
  });

  return { withdrawSolCollateralMutation };
};
