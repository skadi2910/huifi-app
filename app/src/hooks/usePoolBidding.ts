import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { getProgramErrorMessage, solToLamports } from '@/lib/utils';
import { useTransactionToast } from '@/components/ui/ui-layout';
export const usePoolBidding = (poolAddress: PublicKey) => {
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  const { connection } = useConnection();
  const transactionToast = useTransactionToast();
  // Mutation for placing a bid
  const placeBidMutation = useMutation({
    mutationKey: ['place-bid', { pool: poolAddress.toString() }],
    mutationFn: async ({ amount,uuid }: { amount: number,uuid: number[] }): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }
      
      try {
        //Conver amount to BN
        // console.log("amount: ", amount);
        const amountBN = new BN(amount);
        // console.log("amountBN: ", amountBN);
        // Fetch the pool to get token mint
        const groupAccount = await program.account.groupAccount.fetch(poolAddress);
        // console.log("groupAccount: ", groupAccount);
        // const tokenMint = poolAccount.tokenMint;
        // Calculate bid PDA
        const [bidStateAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("huifi-bid-state"), poolAddress.toBuffer()],
          program.programId
        );
        const [memberAccountPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("huifi-member"), poolAddress.toBuffer(), publicKey.toBuffer()],
          program.programId
        );
      // console.log("poolAddress: ", poolAddress.toString());
      // If you want to see the actual data
      const bidStateAccount = await program.account.bidState.fetch(bidStateAccountPda);
      const bidStateAccountInfo = await connection.getAccountInfo(bidStateAccountPda);
    
      // if (bidStateAccountInfo) {
      //   console.log('BidState Account Details:', {
      //       address: bidStateAccountPda.toString(),
      //       space: bidStateAccountInfo.data.length,
      //       expectedSpace: 206, // 8 + 32 + 8 + 33 + 1 + 4 + (40 * 3)
      //       owner: bidStateAccountInfo.owner.toString(),
      //       programId: program.programId.toString(),
      //       spaceBreakdown: {
      //           discriminator: 8,
      //           pool: 32,
      //           cycle: 8,
      //           winner: 33,
      //           bump: 1,
      //           vecPrefix: 4,
      //           bidsSpace: 40 * 3
      //       }
      //   });
      // }
      // console.log('BidState Data:', {
      //   pool: bidStateAccount.pool.toString(),
      //   cycle: bidStateAccount.cycle,
      //   bidsCount: bidStateAccount.bids.length,
      //   bids: bidStateAccount.bids.map(bid=>({
      //     bidder: bid.bidder.toString(),
      //     amount: bid.amount.toString(),  
      //   })),
      //   winner: bidStateAccount.winner?.toString() || 'No winner yet',
      //   bump: bidStateAccount.bump,
      //   currentSize: bidStateAccountInfo?.data.length,
      //   // maxPossibleBids: Math.floor((bidStateAccountInfo?.data.length - (8 + 32 + 1 + 4 + 33 + 1)) / 40)
      // });

        const memberAccountInfo = await program.account.memberAccount.fetch(memberAccountPda);
        console.log("memberAccountInfo: ", memberAccountInfo);
        // Convert amount to lamports (assuming 6 decimals for the token)
        // const amountLamports = new BN(amount * 1_000_000);
        const amountLamports = solToLamports(amount);

        const signature = await program.methods.submitBid(amountLamports).accounts({
          bidder: publicKey,
          bidState: bidStateAccountPda,
          groupAccount: poolAddress,
          memberAccount: memberAccountPda,
        }).rpc();
        console.log("signature: ", signature);
        addTransaction(signature, `Place Bid`);
        transactionToast(signature);
        return signature;
        // return "";
      } catch (error: any) {
        // console.error('Error placing bid:', error);
        // throw error;
        const errorMessage = getProgramErrorMessage(error);
        console.log("errorMessage: ", errorMessage);
        console.error('Detailed error:', error);
        throw new Error(errorMessage);

      }
    }
  });
  
  return { placeBidMutation };
};