import { Idl, Program } from '@coral-xyz/anchor';
import idl from '@/lib/idl/contracts_hui.json';
import { UserAccount, HuifiPool, RoundResult, ProtocolSettings, Bid, Vault } from './program-types';
import { PublicKey } from '@solana/web3.js';
<<<<<<< HEAD
=======
import { BN } from '@coral-xyz/anchor';
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80

// Define account methods structure to match Anchor-generated types
export interface HuifiAccounts {
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
<<<<<<< HEAD
  createPool(config: any): any;
  joinPool(): any;
  contribute(amount: any): any;
  placeBid(round: number, amount: any): any;
  claimJackpot(round: number): any;
  closePool(): any;
  initializeProtocol(protocolFeeBps: number): any;
=======
  createSplPool(config: any, uuid: number[], whitelist?: PublicKey[]): any;
  createSolPool(config: any, uuid: number[], whitelist?: PublicKey[]): any;
  joinPool(): any;
  contributeSpl(uuid: number[], amount: BN): any;
  contributeSol(uuid: number[], amount: BN): any;
  depositSplCollateral(uuid: number[], amount: BN): any;
  depositSolCollateral(uuid: number[], amount: BN): any;
  requestEarlyPayout(): any;
  processSplPayout(): any;
  processSolPayout(): any;
  placeBid(round: number, amount: BN): any;
  claimJackpot(round: number): any;
  closePool(): any;
  initializeProtocol(protocolFeeBps: number, createPoolFee: BN): any;
>>>>>>> e2bd6cb0551c905b610c043cda1bfe18e063fd80
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