import { useAnchorProvider } from '@/components/solana/solana-provider';
import { HUIFI_PROGRAM_ID } from '@/lib/constants';
import { Program, Idl, BN } from '@project-serum/anchor';
import { useMemo } from 'react';
import idl from '@/lib/idl/huifi.json';

export function useHuifiProgram() {
  const provider = useAnchorProvider();

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as Idl, HUIFI_PROGRAM_ID, provider);
  }, [provider]);

  return program;
}

// Helper to convert JS Date to anchor BN timestamp (seconds)
export function dateToAnchorTimestamp(date: Date): BN {
  return new BN(Math.floor(date.getTime() / 1000));
}

// Helper to convert anchor BN timestamp to JS Date
export function anchorTimestampToDate(timestamp: BN): Date {
  return new Date(timestamp.toNumber() * 1000);
}