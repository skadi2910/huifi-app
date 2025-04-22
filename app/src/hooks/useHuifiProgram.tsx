import { useAnchorProvider } from '@/components/solana/solana-provider';
import { HUIFI_PROGRAM_ID } from '@/lib/constants';
import { Program, BN, Idl } from '@project-serum/anchor';
import { useMemo } from 'react';

// Hook to use the program with the properly structured IDL
export function useHuifiProgram() {
  const provider = useAnchorProvider();

  const program = useMemo(() => {
    if (!provider) return null;

    try {
      // Create a properly typed IDL that matches Anchor's expectations
      const idl = {
        version: "0.1.0",
        name: "contracts_hui",
        instructions: [
          {
            name: "createPool", // Changed from snake_case to camelCase to match function call
            accounts: [
              { name: "creator", isMut: true, isSigner: true },
              { name: "group_account", isMut: true, isSigner: false },
              { name: "token_mint", isMut: false, isSigner: false },
              { name: "vault", isMut: true, isSigner: false },
              { name: "protocol_settings", isMut: false, isSigner: false },
              { name: "token_program", isMut: false, isSigner: false },
              { name: "system_program", isMut: false, isSigner: false },
              { name: "rent", isMut: false, isSigner: false }
            ],
            args: [
              {
                name: "pool_config",
                type: {
                  defined: "PoolConfig"
                }
              }
            ]
          },
          // Add initialize_protocol instruction to instructions array
          {
            name: "initializeProtocol", // Changed from snake_case to camelCase
            accounts: [
              { name: "admin", isMut: true, isSigner: true },
              { name: "protocol_settings", isMut: true, isSigner: false },
              { name: "treasury", isMut: true, isSigner: false },
              { name: "token_mint", isMut: false, isSigner: false },
              { name: "token_program", isMut: false, isSigner: false },
              { name: "system_program", isMut: false, isSigner: false },
              { name: "rent", isMut: false, isSigner: false }
            ],
            args: [
              { name: "protocol_fee_bps", type: "u16" }
            ]
          },
        ],
        accounts: [
          {
            name: "GroupAccount",
            type: {
              kind: "struct",
              fields: [
                { name: "creator", type: "publicKey" },
                { name: "token_mint", type: "publicKey" },
              ]
            }
          },
          {
            name: "MemberAccount",
            type: {
              kind: "struct",
              fields: []
            }
          },
          {
            name: "ProtocolSettings",
            type: {
              kind: "struct",
              fields: []
            }
          }
        ],
        types: [
          {
            name: "YieldStrategy",
            type: {
              kind: "enum",
              variants: [
                { name: "none" }, 
                { name: "jitoSol" }
              ]
            }
          },
          {
            name: "PoolConfig",
            type: {
              kind: "struct",
              fields: [
                { name: "max_participants", type: "u8" },
                { name: "contribution_amount", type: "u64" },
                { name: "cycle_duration_seconds", type: "u64" },
                { name: "payout_delay_seconds", type: "u64" },
                { name: "early_withdrawal_fee_bps", type: "u16" },
                { name: "collateral_requirement_bps", type: "u16" },
                { name: "yield_strategy", type: { defined: "YieldStrategy" } },
                { name: "is_private", type: "bool" }
              ]
            }
          }
        ],
        errors: [],
      };
      
      // Create the program directly using the typed IDL
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