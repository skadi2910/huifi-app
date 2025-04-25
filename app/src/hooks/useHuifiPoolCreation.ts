import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';
import {
  PublicKey,
  SystemProgram,
<<<<<<< HEAD
  SYSVAR_RENT_PUBKEY
=======
  SYSVAR_RENT_PUBKEY,
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
} from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress 
} from '@solana/spl-token';
import { BN } from '@coral-xyz/anchor';
import { useHuifiProgram } from './useHuifiProgram';
import { useTransactions } from '@/contexts/TransactionContext';
import { useMemo } from 'react';

// Define USDC addresses for different networks
const USDC_ADDRESSES = {
  mainnet: '',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', 
<<<<<<< HEAD
  testnet: '', 
  localnet: '4MDdpZdAoPhgiPydiMYTqCs52qgi5e5AfGnYimPdW2g8',
=======
  testnet: 'FSxJ85FXVsXSr51SeWf9ciJWTcRnqKFSmBgRDeL3KyWw', 
  localnet: '',
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
};

interface CreatePoolParams {
  name: string;
  description: string;
  maxPlayers: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  entryFee: number;
  currency: string;
  payoutMethod: 'predetermined' | 'bidding';
  latePenalty: 'none' | 'small' | 'moderate' | 'strict';
  privacy: 'public' | 'private';
<<<<<<< HEAD
  creator: PublicKey;
=======
  whitelistAddresses?: PublicKey[];
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
}

function getFrequencyInSeconds(frequency: string): number {
  switch (frequency) {
    case 'daily': return 60 * 60 * 24;
    case 'weekly': return 60 * 60 * 24 * 7;
    case 'biweekly': return 60 * 60 * 24 * 14;
    case 'monthly': return 60 * 60 * 24 * 30;
    default: return 60 * 60 * 24;
  }
}

export const useHuifiPoolCreation = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { program } = useHuifiProgram();
  const { addTransaction } = useTransactions();

  const protocolSettingsPda = useMemo(() => {
    if (!program) return null;
    return PublicKey.findProgramAddressSync(
      [Buffer.from('huifi-protocol')],
      program.programId
    )[0];
  }, [program]);

  const createPoolMutation = useMutation({
    mutationKey: ['create-pool'],
    mutationFn: async (params: CreatePoolParams): Promise<string> => {
<<<<<<< HEAD
      if (!publicKey || !program || !protocolSettingsPda) {
        throw new Error('Wallet not connected or program not loaded');
      }

      // Determine which network we're on
      const currentNetwork = connection.rpcEndpoint.includes('devnet') 
        ? 'devnet' 
        : connection.rpcEndpoint.includes('testnet')
          ? 'testnet'
          : connection.rpcEndpoint.includes('localhost') || connection.rpcEndpoint.includes('127.0.0.1')
            ? 'localnet'
            : 'mainnet';
      
      // Use correct USDC address for network
      const tokenMintAddress = USDC_ADDRESSES[currentNetwork];
      const tokenMint = new PublicKey(tokenMintAddress);
      
      console.log(`Using ${currentNetwork} USDC address: ${tokenMintAddress}`);

      // Verify token mint exists
      try {
        const tokenMintInfo = await connection.getAccountInfo(tokenMint);
        if (!tokenMintInfo) {
          throw new Error(`Token mint account for ${currentNetwork} USDC does not exist or could not be found. You may need to create your own test token.`);
        }
      } catch (err) {
        console.error(`Error checking token mint (${tokenMintAddress}):`, err);
        throw new Error(`Failed to verify token mint on ${currentNetwork}. If using devnet/testnet, you may need to create your own test token.`);
      }

      // Derive the groupAccount PDA
      const groupPda = PublicKey.findProgramAddressSync(
        [
          Buffer.from('huifi-pool'),
          tokenMint.toBuffer(),
          publicKey.toBuffer(),
          Buffer.from([params.maxPlayers]) 
        ],
        program.programId
      )[0];

      // Derive vault PDA
      const vaultPda = PublicKey.findProgramAddressSync(
        [Buffer.from('huifi-vault'), groupPda.toBuffer()],
        program.programId
      )[0];

      // Get vault token account address
      const vaultTokenAccount = await getAssociatedTokenAddress(
        tokenMint,        // mint
        vaultPda,         // owner
        true              // allowOwnerOffCurve: true for PDA as owner
      );

      const contributionAmount = new BN(params.entryFee * 1_000_000); // Assuming 6 decimals for USDC
      const cycleDuration = getFrequencyInSeconds(params.frequency);

      const yieldStrategy = { none: {} };

      const poolConfig = {
        maxParticipants: params.maxPlayers,
        contributionAmount,
        cycleDurationSeconds: new BN(cycleDuration),
        payoutDelaySeconds: new BN(3600), // 1 hour
        earlyWithdrawalFeeBps: new BN(500), // 5%
        collateralRequirementBps: new BN(1000), // 10%
        yieldStrategy,
      };

      console.log('Creating pool with:', {
        creator: publicKey.toBase58(),
        groupPda: groupPda.toBase58(),
        vaultPda: vaultPda.toBase58(),
        vaultTokenAccount: vaultTokenAccount.toBase58(),
        poolConfig,
      });

      try {
        // Create the pool
        const signature = await program.methods
          .createPool(poolConfig)
          .accounts({
            creator: publicKey,
            groupAccount: groupPda,
            tokenMint: tokenMint,
            vault: vaultPda,
            protocolSettings: protocolSettingsPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();

        await connection.confirmTransaction(signature);
        addTransaction(signature, 'Create Pool');

        return signature;
=======
      if (!publicKey || !program) {
        throw new Error('Wallet not connected or program not loaded');
      }

      if (!protocolSettingsPda) {
        throw new Error("Protocol settings PDA could not be derived");
      }

      try {
        // Before creating a pool, check if protocol is initialized
        try {
          console.log("Attempting to fetch protocol account at:", protocolSettingsPda.toString());
          const protocolAccount = await program.account.ProtocolSettings.fetch(
            protocolSettingsPda
          );
          console.log("Protocol is initialized:", !!protocolAccount, 
            "Admin:", protocolAccount.admin.toString());
        } catch (error) {
          console.error("Error fetching protocol:", error);
          
          // Try alternative approach to check if account exists at all
          try {
            const accountInfo = await connection.getAccountInfo(protocolSettingsPda);
            console.log("Account exists but fetch failed:", !!accountInfo);
            
            if (accountInfo) {
              console.log("Account owner:", accountInfo.owner.toString());
              console.log("Account data length:", accountInfo.data.length);
              
              // If account exists, continue instead of throwing
              console.log("Continuing despite fetch error");
            } else {
              throw new Error("Protocol not initialized. Please initialize protocol first.");
            }
          } catch (e) {
            console.error("Error checking account info:", e);
            throw new Error("Protocol not initialized. Please initialize protocol first.");
          }
        }

        // First, log the program ID to make sure it's correct
        console.log("Program ID:", program.programId.toString());

        // Create the pool with a simpler approach
        const poolConfig = {
          maxParticipants: Number(params.maxPlayers),
          contributionAmount: new BN(Math.floor(params.entryFee * 1_000_000)),
          cycleDurationSeconds: new BN(getFrequencyInSeconds(params.frequency)),
          payoutDelaySeconds: new BN(3600),
          earlyWithdrawalFeeBps: 500,
          collateralRequirementBps: 1000,
          yieldStrategy: 0  // Try with a simple number first
        };

        // Detailed logging of the poolConfig
        console.log("Raw poolConfig:", JSON.stringify({
          maxParticipants: poolConfig.maxParticipants,
          contributionAmount: poolConfig.contributionAmount.toString(),
          cycleDurationSeconds: poolConfig.cycleDurationSeconds.toString(),
          payoutDelaySeconds: poolConfig.payoutDelaySeconds.toString(),
          earlyWithdrawalFeeBps: poolConfig.earlyWithdrawalFeeBps,
          collateralRequirementBps: poolConfig.collateralRequirementBps,
          yieldStrategy: poolConfig.yieldStrategy,
          yieldStrategyType: typeof poolConfig.yieldStrategy
        }));

        // Modify the createSolPool call
        const uuid = Array.from(crypto.getRandomValues(new Uint8Array(6)));

        // Fix the whitelist parameter
        const whitelist = params.privacy === 'private' 
          ? (params.whitelistAddresses || []) 
          : undefined;

        if (params.currency === 'SOL') {
          const wrappedSOL = new PublicKey("So11111111111111111111111111111111111111112");
          const [groupAccount] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('huifi-sol-pool'),
              publicKey.toBuffer(),
              Buffer.from(uuid),
            ],
            program.programId
          );
          
          const [solVault] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('huifi-sol-vault'),
              groupAccount.toBuffer(),
            ],
            program.programId
          );
          
          // Log details about accounts
          console.log("Account details:", {
            creator: publicKey.toString(),
            group_account: groupAccount.toString(),
            sol_vault: solVault.toString(),
            protocolSettings: protocolSettingsPda.toString(),
            systemProgramId: SystemProgram.programId.toString(),
            rentAddress: SYSVAR_RENT_PUBKEY.toString()
          });

          // Try multiple formats
          // Format 1: Standard with number for yield_strategy
          const poolConfigFormat1 = {
            ...poolConfig,
            yieldStrategy: 0 // Number for None
          };
          
          // Format 2: With object for yield_strategy
          const poolConfigFormat2 = {
            ...poolConfig,
            yieldStrategy: { None: {} } // Object with capitalized variant
          };
          
          // Format 3: Snake case with number
          const poolConfigFormat3 = {
            max_participants: poolConfig.maxParticipants,
            contribution_amount: poolConfig.contributionAmount,
            cycle_duration_seconds: poolConfig.cycleDurationSeconds,
            payout_delay_seconds: poolConfig.payoutDelaySeconds,
            early_withdrawal_fee_bps: poolConfig.earlyWithdrawalFeeBps,
            collateral_requirement_bps: poolConfig.collateralRequirementBps,
            yield_strategy: 0 // Number for None
          };
          
          console.log("Trying format 1:", JSON.stringify(poolConfigFormat1));
          
          try {
            // First log the full instruction serialization
            const ix = await program.methods
              .createSolPool(
                poolConfigFormat1,
                uuid,
                whitelist
              )
              .accounts({
                creator: publicKey,
                group_account: groupAccount,
                sol_vault: solVault,
                protocol_settings: protocolSettingsPda,
                system_program: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
              })
              .instruction();
            
            console.log("Instruction data:", {
              programId: ix.programId.toString(),
              keys: ix.keys.map((k: { pubkey: PublicKey; isSigner: boolean; isWritable: boolean }) => ({
                pubkey: k.pubkey.toString(),
                isSigner: k.isSigner,
                isWritable: k.isWritable
              })),
              dataLength: ix.data.length,
              dataHex: Buffer.from(ix.data).toString('hex')
            });
            
            // Now execute the transaction
            const signature = await program.methods
              .createSolPool(
                poolConfigFormat1,
                uuid,
                whitelist
              )
              .accounts({
                creator: publicKey,
                group_account: groupAccount,
                sol_vault: solVault,
                protocol_settings: protocolSettingsPda,
                system_program: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
              })
              .rpc({
                skipPreflight: false
              })
              .catch((err: unknown) => {
                console.log("Format 1 error:", JSON.stringify(err, null, 2));
                
                // Try Format 2 if Format 1 failed
                console.log("Trying format 2:", JSON.stringify(poolConfigFormat2));
                return program.methods
                  .createSolPool(
                    poolConfigFormat2,
                    uuid,
                    whitelist
                  )
                  .accounts({
                    creator: publicKey,
                    group_account: groupAccount,
                    sol_vault: solVault,
                    protocol_settings: protocolSettingsPda,
                    system_program: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                  })
                  .rpc({
                    skipPreflight: false
                  })
                  .catch((err2: unknown) => {
                    console.log("Format 2 error:", JSON.stringify(err2, null, 2));
                    
                    // Try Format 3 if Format 2 failed
                    console.log("Trying format 3:", JSON.stringify(poolConfigFormat3));
                    return program.methods
                      .createSolPool(
                        poolConfigFormat3,
                        uuid,
                        whitelist
                      )
                      .accounts({
                        creator: publicKey,
                        group_account: groupAccount,
                        sol_vault: solVault,
                        protocol_settings: protocolSettingsPda,
                        system_program: SystemProgram.programId,
                        rent: SYSVAR_RENT_PUBKEY,
                      })
                      .rpc({
                        skipPreflight: false
                      })
                      .catch((err3: unknown) => {
                        console.log("Format 3 error:", JSON.stringify(err3, null, 2));
                        
                        // Try with camelCase account names if all formats failed
                        console.log("Trying with camelCase account names");
                        return program.methods
                          .createSolPool(
                            poolConfigFormat1,
                            uuid,
                            whitelist
                          )
                          .accounts({
                            creator: publicKey,
                            groupAccount: groupAccount,  // Try camelCase
                            solVault: solVault,          // Try camelCase
                            protocolSettings: protocolSettingsPda,
                            systemProgram: SystemProgram.programId,
                            rent: SYSVAR_RENT_PUBKEY,
                          })
                          .rpc({
                            skipPreflight: false
                          })
                          .catch((err4: unknown) => {
                            console.log("camelCase account error:", JSON.stringify(err4, null, 2));
                            throw new Error("All formats failed");
                          });
                      });
                  });
              });
            
            console.log("Pool created successfully! Signature:", signature);
            addTransaction(signature, 'Create Pool');
            return signature;
          } catch (error) {
            console.error("All attempts failed:", error);
            throw error;
          }
        } else {
          // Create an SPL token pool (e.g., USDC)
          const tokenMint = new PublicKey(USDC_ADDRESSES.localnet);
          
          // Derive the group account address
          const [groupAccount] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('huifi-pool'),
              tokenMint.toBuffer(),
              publicKey.toBuffer(),
              Buffer.from(uuid),
            ],
            program.programId
          );
          
          // Derive the vault address
          const [vault] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('huifi-spl-vault'),
              groupAccount.toBuffer(),
            ],
            program.programId
          );
          
          // Derive the associated token address
          const associatedTokenAddress = getAssociatedTokenAddress(tokenMint, publicKey);
          
          // Log all accounts being used
          console.log("Accounts:", {
            creator: publicKey.toString(),
            groupAccount: groupAccount.toString(),
            tokenMint: tokenMint.toString(),
            vault: vault.toString(),
            associatedTokenAddress: associatedTokenAddress.toString(),
            protocolSettings: protocolSettingsPda.toString(),
            tokenProgram: TOKEN_PROGRAM_ID.toString(),
            systemProgram: SystemProgram.programId.toString(),
            rent: SYSVAR_RENT_PUBKEY.toString()
          });
          
          // Add additional error handling and logging
          try {
            console.log("Starting SPL pool creation...");
            
            // First check if associatedTokenAddress is resolved correctly
            const associatedTokenAddress = await getAssociatedTokenAddress(
              tokenMint, 
              publicKey
            );
            
            console.log("Associated token address:", associatedTokenAddress.toString());
            
            // Try with wrapped SOL instead of USDC
            const wrappedSOL = new PublicKey("So11111111111111111111111111111111111111112");
            
            // Set skipPreflight to false to get better error details
            const signature = await program.methods
              .createSplPool(
                poolConfig,
                uuid,
                whitelist
              )
              .accounts({
                creator: publicKey,
                groupAccount: groupAccount,
                tokenMint: tokenMint,
                vault: vault,
                protocolSettings: protocolSettingsPda,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
                // Make sure associatedTokenProgram and userAta are included if required by the program
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                userAta: associatedTokenAddress
              })
              .rpc()
              .catch((error: any) => {
                console.log("Transaction error details:", error);
                if (error.logs) console.log("Error logs:", error.logs);
                throw error;
              });

            console.log("Pool created successfully! Signature:", signature);
            addTransaction(signature, 'Create Pool');
            return signature;
          } catch (error) {
            console.error("Detailed error:", error);
            throw error;
          }
        }
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
      } catch (error) {
        console.error('Error creating pool:', error);
        throw error;
      }
    },
  });

  return { createPoolMutation };
};