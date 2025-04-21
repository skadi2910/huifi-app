import { useEffect, useState } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, ParsedTransactionWithMeta, PartiallyDecodedInstruction } from '@solana/web3.js';
import { useHuifiProgram } from './useHuifiProgram';
import bs58 from 'bs58'; // You'll need to install this package

interface PoolTransaction {
  signature: string;
  blockTime: number;
  type: string;
  amount: string;
  user: PublicKey;
  status: string;
  xpChange?: string;
}

export function usePoolTransactionHistory({ poolId }: { poolId?: PublicKey }) {
  const { connection } = useConnection();
  const program = useHuifiProgram();
  const [transactions, setTransactions] = useState<PoolTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionHistory = async () => {
    if (!poolId || !program) return;

    setIsLoading(true);
    setError(null);
    try {
      // Get all signatures for the pool account
      const signatures = await connection.getSignaturesForAddress(poolId, { limit: 20 });
      
      // Fetch full transaction data for each signature
      const txPromises = signatures.map(async (sig) => {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, 'confirmed');
          if (!tx || !tx.blockTime) return null;
          
          // Attempt to determine transaction type and extract data
          const parsedTx = parseTxData(tx, poolId, program?.programId);
          if (!parsedTx) return null;
          
          return {
            signature: sig.signature,
            blockTime: tx.blockTime,
            ...parsedTx
          };
        } catch (err) {
          console.error('Error fetching transaction:', err);
          return null;
        }
      });
      
      const txData = (await Promise.all(txPromises)).filter(Boolean) as PoolTransaction[];
      setTransactions(txData);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Parse transaction data to extract relevant info
  const parseTxData = (
    tx: ParsedTransactionWithMeta, 
    poolId: PublicKey,
    programId?: PublicKey
  ): { type: string; amount: string; user: PublicKey; status: string; xpChange?: string } | null => {
    if (!tx.meta || tx.meta.err || !programId) {
      return {
        type: 'Unknown',
        amount: '0',
        user: tx.transaction.message.accountKeys[0].pubkey,
        status: 'Failed'
      };
    }
    
    try {
      // Transaction sender is usually the first account
      const user = tx.transaction.message.accountKeys[0].pubkey;
      
      // Look for program invocations to determine transaction type
      const programIdx = tx.transaction.message.accountKeys.findIndex(
        account => account.pubkey.toString() === programId.toString()
      );
      
      if (programIdx === -1) {
        return null; // Not a program transaction
      }
      
      // Get token transfers to determine amount
      const tokenTransfers = tx.meta.postTokenBalances?.filter(
        ptb => ptb.owner && new PublicKey(ptb.owner).equals(poolId)
      );
      
      let amount = '0';
      if (tokenTransfers?.length) {
        // This is simplified, you'd want to calculate the actual amount
        amount = tokenTransfers[0].uiTokenAmount.uiAmountString || '0';
      }
      
      // Get the instructions from the transaction
      const instructions = tx.transaction.message.instructions;
      
      // Try to determine transaction type from available data
      let type = 'Unknown';
      
      // Check if we have any parsed instructions that match our program
      if (instructions.length > 0) {
        // For partially decoded instructions, we can look at the programId
        const firstInst = instructions[0];
        
        if ('programId' in firstInst) {
          // For partially decoded instructions
          const pdInstruction = firstInst as PartiallyDecodedInstruction;
          
          // Check if this is our program and try to identify the instruction type
          if (pdInstruction.programId.toString() === programId.toString() && pdInstruction.data) {
            // The instruction data is a base58 encoded string - we need to decode it properly
            try {
              // Use bs58 library to decode base58 data
              const decodedData = bs58.decode(pdInstruction.data);
              const dataStr = Buffer.from(decodedData).toString();
              
              if (dataStr.includes('create')) {
                type = 'Create Pool';
              } else if (dataStr.includes('join')) {
                type = 'Join';
              } else if (dataStr.includes('contribute')) {
                type = 'Contribution';
              } else if (dataStr.includes('bid')) {
                type = 'Place Bid';
              } else if (dataStr.includes('claim')) {
                type = 'Jackpot';
              }
            } catch (err) {
              console.error("Error decoding instruction data:", err);
            }
          }
        } else {
          // For parsed instructions, check the program name and instruction name
          const parsedInst = firstInst as any; // Type casting since the exact structure can vary
          
          if (parsedInst.program === 'HuiFi' || parsedInst.programId?.toString() === programId.toString()) {
            // Try to get instruction type from the instruction name
            const instName = parsedInst.parsed?.type || '';
            
            if (instName.includes('create')) {
              type = 'Create Pool';
            } else if (instName.includes('join')) {
              type = 'Join';
            } else if (instName.includes('contribute')) {
              type = 'Contribution';
            } else if (instName.includes('bid')) {
              type = 'Place Bid';
            } else if (instName.includes('claim')) {
              type = 'Jackpot';
            }
          }
        }
      }
      
      return {
        type,
        amount: `${amount} USDC`, // Simplified, adjust based on actual token
        user,
        status: 'Confirmed'
      };
    } catch (err) {
      console.error('Error parsing transaction:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchTransactionHistory();
  }, [poolId, program, connection]);

  return {
    data: transactions,
    isLoading,
    isError: error !== null,
    error,
    refetch: fetchTransactionHistory
  };
}