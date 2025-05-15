// import { useConnection as useSolanaConnection } from '@solana/wallet-adapter-react';
// import { Connection } from '@solana/web3.js';
// import { useWallet } from './useWallet';

// // Change to default export
// export default function useCustomConnection() {
//   // const { connection } = useSolanaConnection();
//   const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
//   const { lazorIsConnected } = useWallet();

//   return {
//     connection,
//     isLazorConnection: lazorIsConnected
//   };
// }