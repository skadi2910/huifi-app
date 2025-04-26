import { Idl, Program } from '@coral-xyz/anchor';
import idl from '@/lib/idl/contracts_hui.json';
import { UserAccount, HuifiPool, RoundResult, ProtocolSettings, Bid, Vault, PoolConfig } from './program-types';
import { PublicKey } from '@solana/web3.js';
import { BN } from '@coral-xyz/anchor';
// Define account methods structure to match Anchor-generated types
export interface HuifiAccounts {
  GroupAccount: {  // Changed from HuifiPool to GroupAccount
    fetch(address: PublicKey): Promise<HuifiPool>;
    all(): Promise<{ publicKey: PublicKey; account: HuifiPool }[]>;
  };
  UserAccount: {
    fetch(address: PublicKey): Promise<UserAccount>;
    all(): Promise<{ publicKey: PublicKey; account: UserAccount }[]>;
    // Add other methods if needed
  };
  HuifiPool: {
    fetch(address: PublicKey): Promise<HuifiPool>;
    all(): Promise<{ publicKey: PublicKey; account: HuifiPool }[]>;
  };
  RoundResult: {
    fetch(address: PublicKey): Promise<RoundResult>;
  };
  ProtocolSettings: {
    fetch(address: PublicKey): Promise<ProtocolSettings>;
  };
  Bid: {
    fetch(address: PublicKey): Promise<Bid>;
  };
  Vault: {
    fetch(address: PublicKey): Promise<Vault>;
  };
}

// Define program methods structure to match Anchor-generated types
export interface HuifiMethods {
  createUserAccount(): any;
  createSolPool(
    pool_config: PoolConfig,
    uuid: number[],
    whitelist: PublicKey[] | null
  ): any;
  joinPool(): any;
  contribute(amount: any): any;
  placeBid(round: number, amount: any): any;
  claimJackpot(round: number): any;
  closePool(): any;
  initializeProtocol(protocolFeeBps: number, createPoolFee: BN): any;
}

// Define the HuifiProgram type correctly
export type HuifiProgram = Program<Idl> & {
  account: HuifiAccounts;
  methods: HuifiMethods;
};

// Help Typescript understand that the IDL is valid
export const IDL: Idl = idl as Idl;

// Get the program ID from the IDL
export const PROGRAM_ID = new PublicKey(idl.address);