import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  SYSVAR_RENT_PUBKEY, 
  Transaction,
  sendAndConfirmTransaction,
  Connection
} from '@solana/web3.js';
import { 
  createMint, 
  getAssociatedTokenAddressSync, 
  TOKEN_PROGRAM_ID, 
  getMint,
  createAssociatedTokenAccountInstruction,
<<<<<<< HEAD
  createMintToInstruction 
=======
  createMintToInstruction,
  createInitializeMintInstruction
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
} from '@solana/spl-token';
import toast from 'react-hot-toast';
import { useTransactions } from '@/contexts/TransactionContext';
import { useHuifiProgram } from './useHuifiProgram';

<<<<<<< HEAD
export const useInitializeProtocol = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();
  
  const initializeMutation = useMutation({
    mutationKey: ['initialize-protocol'],
    mutationFn: async (protocolFeeBps: number): Promise<string> => {
      if (!wallet.publicKey || !program || !wallet.signTransaction) {
        throw new Error('Wallet not connected or program not loaded');
      }
  
      try {
        // Create a keypair for the treasury account
        const treasuryKeypair = Keypair.generate();
        
        // Determine the appropriate token mint based on the network
        let tokenMint: PublicKey;
        const endpoint = connection.rpcEndpoint;
        
        if (endpoint.includes('devnet')) {
          // Use devnet USDC address
          tokenMint = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
        } else if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
          console.log('Local network detected. Creating a new test token mint...');
          
          try {
            // Create a new token mint with the connected wallet as the authority
            const mintKeypair = Keypair.generate();
            
            console.log(`Creating token mint with keypair: ${mintKeypair.publicKey.toString()}`);
            console.log(`Using wallet ${wallet.publicKey.toString()} as mint authority`);
            
            // Create a local keypair for creating the token (we control both sides)
            const payerKeypair = Keypair.generate();
            
            // Request airdrop to fund the local keypair
            console.log(`Requesting airdrop to fund keypair: ${payerKeypair.publicKey.toString()}`);
            const airdropSignature = await connection.requestAirdrop(
              payerKeypair.publicKey,
              2 * 10 ** 9 // 2 SOL
            );
            await connection.confirmTransaction(airdropSignature);
            console.log('Airdrop confirmed');
            
            // Create the mint using the local keypair that matches the Signer interface
            await createMint(
              connection,
              payerKeypair, // This is a proper Signer with secretKey
              payerKeypair.publicKey, // mint authority - use payer for testing
              null, // freeze authority - none for testing
              6, // decimals - match USDC
              mintKeypair,
            );
            
            tokenMint = mintKeypair.publicKey;
            console.log(`Successfully created test token mint: ${tokenMint.toString()}`);
            
            // Verify token was created
            const mintInfo = await getMint(connection, tokenMint);
            console.log('Token mint info:', mintInfo);
            
          } catch (error: unknown) {
            console.error('Failed to create test token:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to create test token: ${errorMessage}`);
          }
        } else {
          // Mainnet USDC address
          tokenMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        }
  
        console.log(`Using token mint: ${tokenMint.toString()} on network: ${endpoint}`);
  
        // Use the correct protocol settings PDA seed from the Rust program
        const [protocolSettingsPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-protocol')], // Matches the seed in lib.rs
          program.programId
        );
  
        console.log('Initializing protocol with settings:', {
          admin: wallet.publicKey.toString(),
          treasury: treasuryKeypair.publicKey.toString(),
          tokenMint: tokenMint.toString(),
          protocolFeeBps,
          protocolSettingsPda: protocolSettingsPda.toString()
        });
        
        // Call the initialize_protocol instruction
        const signature = await program.methods
          .initializeProtocol(protocolFeeBps)
          .accounts({
            admin: wallet.publicKey,
            protocolSettings: protocolSettingsPda,
            treasury: treasuryKeypair.publicKey,
            tokenMint: tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .signers([treasuryKeypair])
          .rpc();
          
        console.log('Protocol initialized successfully:', signature);
        addTransaction(signature, 'Initialize Protocol');
        return signature;
      } catch (error: unknown) {
        console.error('Error initializing protocol:', error);
        throw error;
      }
    }
=======
// Define USDC addresses for different networks
const USDC_ADDRESSES = {
  mainnet: '',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', 
  testnet: 'FSxJ85FXVsXSr51SeWf9ciJWTcRnqKFSmBgRDeL3KyWw', 
  localnet: 'AKoar5c1TEejfwZL66TUJsnexCQDyLXVZKzCUPvJFNnR',
};

interface InitializeProtocolParams {
  protocolFeeBps: number;
  createPoolFee?: number;
}

export const useInitializeProtocol = () => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const initializeMutation = useMutation({
    mutationKey: ['initialize-protocol'],
    mutationFn: async (protocolFeeBps: number): Promise<string> => {
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      try {
        // Derive protocol settings PDA
        const [protocolSettings] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-protocol')],
          program.programId
        );

        // Check if protocol is already initialized
        try {
          const protocolAccount = await program.account.ProtocolSettings.fetch(
            protocolSettings
          );
          
          console.log("Protocol is already initialized:", !!protocolAccount);
          return "Protocol already initialized"; // Return early with success message
        } catch (fetchError) {
          console.log("Protocol not initialized, continuing with initialization");
        }

        // Use Wrapped SOL (always exists)
        const tokenMint = new PublicKey("So11111111111111111111111111111111111111112");
        
        // Set minimal fee and simpler parameter values
        const protocolFeeBps = 100; // 1%
        const createPoolFee = new BN(100000); // Smaller value

        // Add verbose logging and detailed diagnostics
        try {
          // Log accounts being used
          console.log("Protocol accounts:", {
            admin: publicKey.toString(),
            protocolSettings: protocolSettings.toString(),
            treasury: publicKey.toString(),
            tokenMint: tokenMint.toString(),
          });

          // Check balances
          const balance = await connection.getBalance(publicKey);
          console.log("Wallet balance:", balance / 1_000_000_000, "SOL");

          // Use simpler options
          const signature = await program.methods
            .initializeProtocol(protocolFeeBps, createPoolFee)
            .accounts({
              admin: publicKey,
              protocolSettings: protocolSettings,
              treasury: publicKey,
              tokenMint: tokenMint,
              tokenProgram: TOKEN_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .rpc({
              skipPreflight: false, // Try false first for better client-side validation
              commitment: 'confirmed'
            });

          console.log("SUCCESS: Protocol initialized!");
          addTransaction(signature, 'Initialize Protocol');
          return signature;
        } catch (error: any) {
          // Print any nested error details
          if (error?.logs) console.log("Transaction logs:", error.logs);
          if (error?.message) console.log("Error message:", error.message);
          
          throw error;
        }
      } catch (error) {
        console.error('Error initializing protocol:', error);
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
        throw error;
      }
    },
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
  });

  return { initializeMutation };
};