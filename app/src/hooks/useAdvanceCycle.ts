import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useHuifiProgram } from "./useHuifiProgram";
import { useTransactions } from "@/contexts/TransactionContext";
import { PoolWithKey } from "./useHuifiPools";
import {
  GroupAccount,
  BidState,
  MemberAccount,
} from "@/lib/types/program-types";
export interface AdvanceCycleParams {
  pool: PoolWithKey;
}

export const useAdvanceCycle = ({ pool }: { pool: PoolWithKey }) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const advanceCycleMutation = useMutation({
    mutationKey: ["advance-cycle"],
    mutationFn: async (params: AdvanceCycleParams): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error("Wallet not connected or program not loaded");
      }
      if (!program) {
        throw new Error("Program not initialized");
      }

      if (!params.pool) {
        throw new Error("Pool parameter is required");
      }
      // Debug log to check program structure
      console.log("Program structure:", {
        programId: program.programId.toBase58(),
        availableAccounts: Object.keys(program.account),
        // This will help us see what account types are actually available
      });
      try {
        const pool = params.pool;
        console.log("Pool details:", {
          uuid: pool.account.uuid,
          creator: pool.account.creator.toBase58(),
          currentCycle: pool.account.currentCycle,
          totalCycles: pool.account.totalCycles,
          status: pool.account.status,
        });
        // const groupPda = pool.publicKey;
        const [groupAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("huifi-pool"), Uint8Array.from(pool.account.uuid)],
          program.programId
        );

        // Find the bid state PDA based on the current cycle
        const [bidStatePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("huifi-bid-state"), groupAccountPda.toBuffer()],
          program.programId
        );
        const [winnerMemberAccountPda] = PublicKey.findProgramAddressSync(
          [
            Buffer.from("huifi-member"),
            groupAccountPda.toBuffer(),
            publicKey.toBuffer(),
          ],
          program.programId
        );
        console.log("Fetching accounts for:", {
          groupAccountPda: groupAccountPda.toBase58(),
          bidStatePda: bidStatePda.toBase58(),
          winnerMemberAccountPda: winnerMemberAccountPda.toBase58(),
        });
        // Verify program is still available before fetching
        if (
          !program.account.GroupAccount ||
          !program.account.BidState ||
          !program.account.MemberAccount
        ) {
          throw new Error("Program accounts not properly initialized");
        }
        // Type-safe account access
        // const accounts = {
        //   groupAccount: program.account
        //     .groupAccount as unknown as typeof program.account.GroupAccount,
        //   bidState: program.account
        //     .bidState as unknown as typeof program.account.BidState,
        //   memberAccount: program.account
        //     .memberAccount as unknown as typeof program.account.MemberAccount,
        // };
        // Fetch all accounts concurrently
        // const [
        //   groupAccountInfo,
        //   // bidStateAccountInfo,
        //   // winnerMemberAccountInfo,
        // ] = await Promise.all([
        //   program.account.GroupAccount.fetch(groupAccountPda) as Promise<GroupAccount>,
        //   // program.account.BidState.fetch(bidStatePda),
        //   // program.account.MemberAccount.fetch(winnerMemberAccountPda),
        // ]);
        // Try fetching accounts one by one with error handling
        let groupAccountInfo: GroupAccount | null = null;
        try {
          console.log("Debug - Attempting to fetch GroupAccount...");
          groupAccountInfo = await program.account.GroupAccount.fetch(
            groupAccountPda
          );
          console.log("Debug - GroupAccount fetched successfully");
        } catch (err) {
          console.error("Error fetching GroupAccount:", err);
          console.log(
            "Available account methods:",
            Object.keys(program.account)
          );
        }

        if (groupAccountInfo) {
          console.log("GroupAccount details:", {
            uuid: groupAccountInfo.uuid,
            creator: groupAccountInfo.creator.toBase58(),
            currentCycle: groupAccountInfo.currentCycle,
            totalCycles: groupAccountInfo.totalCycles,
            status: groupAccountInfo.status,
            currentWinner:
              groupAccountInfo.currentWinner?.toBase58() || "No winner yet",
            currentBidAmount:
              groupAccountInfo.currentBidAmount?.toString() || "0",
            totalContributions: groupAccountInfo.totalContributions.toString(),
            memberCount: groupAccountInfo.memberAddresses.length,
            members: groupAccountInfo.memberAddresses.map((pub) =>
              pub.toBase58()
            ),
          });
        }
        // // Log GroupAccount details
        // if (!groupAccountInfo) {
        //   console.log("GroupAccount doesn't exist yet!");
        // } else {
        //   console.log("GroupAccount details:", {
        //     uuid: groupAccountInfo.uuid,
        //     creator: groupAccountInfo.creator.toBase58(),
        //     currentCycle: groupAccountInfo.currentCycle,
        //     totalCycles: groupAccountInfo.totalCycles,
        //     status: groupAccountInfo.status,
        //     currentWinner:
        //       groupAccountInfo.currentWinner?.toBase58() || "No winner yet",
        //     currentBidAmount:
        //       groupAccountInfo.currentBidAmount?.toString() || "0",
        //     totalContributions: groupAccountInfo.totalContributions.toString(),
        //     memberCount: groupAccountInfo.memberAddresses.length,
        //     members: groupAccountInfo.memberAddresses.map((pub) =>
        //       pub.toBase58()
        //     ),
        //   });
        // }

        // Log BidState details
        // if (!bidStateAccountInfo) {
        //   console.log("BidState doesn't exist yet!");
        // } else {
        //   console.log("BidState details:", {
        //     pool: bidStateAccountInfo.pool.toBase58(),
        //     cycle: bidStateAccountInfo.cycle,
        //     totalBids: bidStateAccountInfo.bids.length,
        //     bids: bidStateAccountInfo.bids.map((bid) => ({
        //       bidder: bid.bidder.toBase58(),
        //       amount: bid.amount.toString(),
        //     })),
        //     winner: bidStateAccountInfo.winner?.toBase58() || "No winner yet",
        //   });
        // }

        // Log WinnerMember details
        // if (!winnerMemberAccountInfo) {
        //   console.log("WinnerMember doesn't exist yet!");
        // } else {
        //   console.log("WinnerMember details:", {
        //     owner: winnerMemberAccountInfo.owner.toBase58(),
        //     pool: winnerMemberAccountInfo.pool.toBase58(),
        //     contributionsMade: winnerMemberAccountInfo.contributionsMade,
        //     status: winnerMemberAccountInfo.status,
        //     hasBid: winnerMemberAccountInfo.hasBid,
        //     hasContributed: winnerMemberAccountInfo.hasContributed,
        //     hasReceivedPayout: winnerMemberAccountInfo.hasReceivedPayout,
        //     eligibleForPayout: winnerMemberAccountInfo.eligibleForPayout,
        //     collateralStaked:
        //       winnerMemberAccountInfo.collateralStaked.toString(),
        //     totalContributions:
        //       winnerMemberAccountInfo.totalContributions.toString(),
        //     hasDepositedCollateral:
        //       winnerMemberAccountInfo.hasDepositedCollateral,
        //     lastContributionTimestamp: new Date(
        //       winnerMemberAccountInfo.lastContributionTimestamp * 1000
        //     ).toLocaleString(),
        //   });
        // }

        // Log overall state summary
        // console.log("Current Pool State Summary:", {
        //   currentCycle: groupAccountInfo?.currentCycle || 0,
        //   totalCycles: groupAccountInfo?.totalCycles || 0,
        //   poolStatus: groupAccountInfo?.status || "Unknown",
        //   activeBids: bidStateAccountInfo?.bids.length || 0,
        //   currentWinner:
        //     bidStateAccountInfo?.winner?.toBase58() || "No winner yet",
        //   winnerEligibleForPayout:
        //     winnerMemberAccountInfo?.eligibleForPayout || false,
        // });

        // console.log('Advancing cycle for pool:', {
        //   authority: publicKey.toString(),
        //   groupAccount: groupAccountPDA.toString(),
        //   bidState: bidStatePda.toString(),
        //   winnerMemberAccount: winnerMemberAccountPda.toString(),
        // });

        // Call the advance_cycle instruction
        // const signature = await program.methods
        //   .forceAdvanceCycle()
        //   .accounts({
        //     authority: publicKey,
        //     groupAccount: groupAccountPda,
        //     bidState: bidStatePda,
        //     winnerMemberAccount: winnerMemberAccountPda,
        //   })
        //   .rpc();

        // console.log('Cycle advanced successfully:', signature);
        // await connection.confirmTransaction(signature);
        // addTransaction(signature, 'Advance Pool Cycle');

        // return signature;
        return "";
      } catch (error) {
        console.error("Error advancing cycle:", error);
        throw error;
      }
    },
  });

  return { advanceCycleMutation };
};
