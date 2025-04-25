// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import HuifidappIDL from '../target/idl/huifidapp.json'
import type { Huifidapp } from '../target/types/huifidapp'

// Re-export the generated IDL and type
export { Huifidapp, HuifidappIDL }

// The programId is imported from the program IDL.
export const HUIFIDAPP_PROGRAM_ID = new PublicKey(HuifidappIDL.address)

// This is a helper function to get the Huifidapp Anchor program.
export function getHuifidappProgram(provider: AnchorProvider, address?: PublicKey) {
  return new Program({ ...HuifidappIDL, address: address ? address.toBase58() : HuifidappIDL.address } as Huifidapp, provider)
}

// This is a helper function to get the program ID for the Huifidapp program depending on the cluster.
export function getHuifidappProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Huifidapp program on devnet and testnet.
      return new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF')
    case 'mainnet-beta':
    default:
      return HUIFIDAPP_PROGRAM_ID
  }
}
