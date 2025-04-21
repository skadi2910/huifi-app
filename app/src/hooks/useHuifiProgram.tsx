import { useAnchorProvider } from '@/components/solana/solana-provider';
import { HUIFI_PROGRAM_ID } from '@/lib/constants';
import { Program, BN, Idl } from '@project-serum/anchor';
import { useMemo } from 'react';
import * as anchor from '@project-serum/anchor';

// Hook to use the program with the properly structured IDL
export function useHuifiProgram() {
  const provider = useAnchorProvider();

  const program = useMemo(() => {
    if (!provider) return null;

    try {
      // Define YieldStrategy enum type
      const yieldStrategyType = {
        name: "YieldStrategy",
        type: {
          kind: "enum",
          variants: [
            { name: "none" }, // lowercase to match Rust convention
            { name: "jitoSol" },
            { name: "kamino" }
          ]
        }
      };

      // Define PoolConfig struct type with correctly typed fields
      const poolConfigType = {
        name: "PoolConfig",
        type: {
          kind: "struct",
          fields: [
            { name: "maxParticipants", type: "u8" },
            { name: "contributionAmount", type: "u64" },
            { name: "cycleDurationSeconds", type: "u64" },
            { name: "payoutDelaySeconds", type: "u64" },
            { name: "earlyWithdrawalFeeBps", type: "u16" },
            { name: "collateralRequirementBps", type: "u16" },
            { name: "yieldStrategy", type: { defined: "YieldStrategy" } },
            { name: "isPrivate", type: "bool" }
          ]
        }
      };

      // Create a properly typed IDL that matches Anchor's expectations
      const idl = {
        version: "0.1.0",
        name: "contracts_hui",
        instructions: [
          {
            name: "createPool",
            accounts: [
              { name: "creator", isMut: true, isSigner: true },
              { name: "pool", isMut: true, isSigner: false },
              { name: "vault", isMut: true, isSigner: false },
              { name: "tokenMint", isMut: false, isSigner: false },
              { name: "tokenProgram", isMut: false, isSigner: false },
              { name: "systemProgram", isMut: false, isSigner: false },
              { name: "rent", isMut: false, isSigner: false }
            ],
            args: [
              {
                name: "pool_config", // Use snake_case to match Rust naming
                type: {
                  defined: "PoolConfig"
                }
              },
              {
                name: "name",
                type: "string"
              },
              {
                name: "description",
                type: "string"
              }
            ]
          }
        ],
        accounts: [
          {
            name: "Pool",
            type: {
              kind: "struct",
              fields: [
                { name: "creator", type: "publicKey" },
                { name: "tokenMint", type: "publicKey" }
              ]
            }
          }
        ],
        types: [
          yieldStrategyType,
          poolConfigType
        ],
        errors: [],
        metadata: {
          address: HUIFI_PROGRAM_ID.toString()
        }
      };
      
      // Create the program directly using the typed IDL
      // Cast to Idl type for TypeScript compatibility
      return new Program(idl as Idl, HUIFI_PROGRAM_ID, provider);
    } catch (error) {
      console.error("Error initializing program:", error);
      return null;
    }
  }, [provider]);

  return program;
}

// Helper functions remain the same
export function dateToAnchorTimestamp(date: Date): BN {
  return new BN(Math.floor(date.getTime() / 1000));
}

export function anchorTimestampToDate(timestamp: BN): Date {
  return new Date(timestamp.toNumber() * 1000);
}