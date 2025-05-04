import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useHuifiProgram } from "./useHuifiProgram";
import { useTransactions } from "@/contexts/TransactionContext";
import { HuifiProgram } from "@/lib/types/huifi-program";
import { useState } from "react";
import { PoolWithKey } from "./useHuifiPools";

export const useFetchingPoolDetail = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions(); 
  const [pools, setPools] = useState<PoolWithKey[]>([]);
};
    