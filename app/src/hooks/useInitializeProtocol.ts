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
  createMintToInstruction 
} from '@solana/spl-token';
import toast from 'react-hot-toast';
import { useTransactions } from '@/contexts/TransactionContext';
import { useHuifiProgram } from './useHuifiProgram';

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
        // const treasuryKeypair = Keypair.generate();
        // const treasuryUsdcKeypair = Keypair.generate();
        // const treasuryUsdtKeypair = Keypair.generate();
        // const treasuryJitosolKeypair = Keypair.generate();
        // Define mint addresses based on network
        const endpoint = connection.rpcEndpoint;
        // Determine the appropriate token mint based on the network
        let tokenMint: PublicKey;
        
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
         // Find the Treasury SOL PDA
         const [treasurySolPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('huifi-treasury'), Buffer.from('sol')],
          program.programId
        );
               // Convert the fee to the correct type (u16)
               const protocolFeeBpsU16 = parseInt(protocolFeeBps.toString());
        
               // Convert create_pool_fee to a BN (u64)
               const createPoolFee = new BN(100000000); // 0.1 SOL in lamports
        console.log('Initializing protocol with settings:', {
          admin: wallet.publicKey.toString(),
          // treasury: treasuryKeypair.publicKey.toString(),
          tokenMint: tokenMint.toString(),
          protocolFeeBps,
          protocolSettingsPda: protocolSettingsPda.toString()
        });
        
        // Call the initialize_protocol instruction
        const signature = await program.methods
          .initializeProtocol(protocolFeeBpsU16,createPoolFee)
          .accounts({
            admin: wallet.publicKey,
            protocolSettings: protocolSettingsPda,
            // treasury: treasuryKeypair.publicKey,
            treasurySol: treasurySolPda,
            tokenMint: tokenMint,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          // .signers([treasuryKeypair])
          .rpc();
          
        console.log('Protocol initialized successfully:', signature);
        addTransaction(signature, 'Initialize Protocol');
        return signature;
      } catch (error: unknown) {
        console.error('Error initializing protocol:', error);
        throw error;
      }
    }
  });

  return { initializeMutation };
};