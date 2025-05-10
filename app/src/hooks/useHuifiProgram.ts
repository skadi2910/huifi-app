import { useConnection,  } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { useCluster } from '@/components/cluster/cluster-data-access';
import { HuifiProgram, IDL, PROGRAM_ID } from '@/lib/types/huifi-program';
import useCustomConnection from '@/hooks/useCustomConnection';
import { useWallet } from '@/hooks/useWallet';
import { Connection } from '@solana/web3.js';
export const useHuifiProgram = () => {
  // const { connection } = useConnection();
  const { connection } = useCustomConnection();
  // console.log("connection",connection);
  // const { publicKey, signAllTransactions, signTransaction } = useWallet();
  const { 
    solanaPublicKey,
    solanaSignTransaction,
    solanaSignAllTransactions,
    lazorPublicKey,
    lazorSmartWalletAuthorityPubkey,
    lazorSignMessage,
    lazorIsConnected,
    solanaIsConnected
  } = useWallet();
  const { cluster } = useCluster();

  // const provider = useMemo(() => {
  //   if (!publicKey || !signTransaction || !signAllTransactions) return null;

  //   return new AnchorProvider(
  //     connection,
  //     {
  //       publicKey,
  //       signTransaction,
  //       signAllTransactions,
  //     },
  //     { commitment: 'confirmed' }
  //   );
  // }, [connection, publicKey, signTransaction, signAllTransactions]);
  // const provider = useMemo(() => {
  //   // For Lazor wallet
  //   if (lazorIsConnected && lazorSmartWalletAuthorityPubkey) {
  //     return new AnchorProvider(
  //       connection,
  //       {
  //         publicKey: lazorSmartWalletAuthorityPubkey,
  //         signTransaction: async (tx) => {
  //           const signed = await lazorSignMessage(tx);
  //           return signed as any;
  //         },
  //         signAllTransactions: async (txs) => {
  //           return Promise.all(txs.map(tx => lazorSignMessage(tx) as any));
  //         },
  //       },
  //       { commitment: 'confirmed' }
  //     );
  //   }

  //   // For regular Solana wallet
  //   if (solanaIsConnected && solanaPublicKey && solanaSignTransaction && solanaSignAllTransactions) {
  //     return new AnchorProvider(
  //       connection,
  //       {
  //         publicKey: solanaPublicKey,
  //         signTransaction: solanaSignTransaction,
  //         signAllTransactions: solanaSignAllTransactions,
  //       },
  //       { commitment: 'confirmed' }
  //     );
  //   }

  //   return null;
  // }, [
  //   connection,
  //   lazorIsConnected,
  //   lazorSmartWalletAuthorityPubkey,
  //   lazorSignMessage,
  //   solanaIsConnected,
  //   solanaPublicKey,
  //   solanaSignTransaction,
  //   solanaSignAllTransactions
  // ]);
  const provider = useMemo(() => {
    console.log('Creating provider with wallet state:', {
      lazorIsConnected,
      lazorSmartWalletAuthorityPubkey: lazorSmartWalletAuthorityPubkey?.toString(),
      lazorPublicKey: lazorPublicKey?.toString(),
      solanaIsConnected,
      solanaPublicKey: solanaPublicKey?.toString(),
    });

    // For Lazor wallet
    if (lazorIsConnected && lazorPublicKey) {
      // console.log('Creating Lazor provider with:', {
      //   // connection: new Connection('https://rpc.lazorkit.xyz/', {
      //   //   wsEndpoint: 'https://rpc.lazorkit.xyz/ws/',
      //   //   commitment: 'confirmed',
      //   //   confirmTransactionInitialTimeout: 60000,
      //   // }),
      //   connection: connection,
      //   publicKey: lazorPublicKey.toString(),
      //   hasSignMessage: !!lazorSignMessage,
      // });

      try {
        const lazorProvider = new AnchorProvider(
          connection,
        //   new Connection('https://rpc.lazorkit.xyz/', {
        //   wsEndpoint: 'https://rpc.lazorkit.xyz/ws/',
        //   commitment: 'confirmed',
        //   confirmTransactionInitialTimeout: 60000,
        // }),
          {
            publicKey: lazorPublicKey,
            signTransaction: async (tx) => {
              console.log('Lazor signing transaction');
              const signed = await lazorSignMessage(tx);
              console.log('Transaction signed by Lazor');
              return signed as any;
            },
            signAllTransactions: async (txs) => {
              console.log('Lazor signing multiple transactions:', txs.length);
              return Promise.all(txs.map(tx => lazorSignMessage(tx) as any));
            },
          },
          { commitment: 'confirmed' }
        );
        // console.log('Lazor provider created successfully');
        return lazorProvider;
      } catch (error) {
        console.error('Failed to create Lazor provider:', error);
        return null;
      }
    }

    // For regular Solana wallet
    if (solanaIsConnected && solanaPublicKey && solanaSignTransaction && solanaSignAllTransactions) {
      // console.log('Creating Solana provider with:', {
      //   connection: connection.rpcEndpoint,
      //   publicKey: solanaPublicKey.toString(),
      //   hasSignTransaction: !!solanaSignTransaction,
      //   hasSignAllTransactions: !!solanaSignAllTransactions,
      // });

      try {
        const solanaProvider = new AnchorProvider(
          connection,
          {
            publicKey: solanaPublicKey,
            signTransaction: solanaSignTransaction,
            signAllTransactions: solanaSignAllTransactions,
          },
          { commitment: 'confirmed' }
        );
        console.log('Solana provider created successfully');
        return solanaProvider;
      } catch (error) {
        console.error('Failed to create Solana provider:', error);
        return null;
      }
    }

    console.log('No provider created - no wallet connected or missing required properties');
    return null;
}, [
    connection,
    lazorIsConnected,
    lazorSmartWalletAuthorityPubkey,
    lazorSignMessage,
    solanaIsConnected,
    solanaPublicKey,
    solanaSignTransaction,
    solanaSignAllTransactions
]);
  const program = useMemo(() => {
    if (!provider){
      console.log('Provider is null, program not initialized');
      return null;
    } 
    try {
      // Fix: The order should be: IDL, PROGRAM_ID, provider
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
    isLazorConnection: lazorIsConnected,
  };
};