import { HUIFI_PROGRAM_ID, POOL_SEED, USER_ACCOUNT_SEED, BID_SEED, ROUND_RESULT_SEED, VAULT_SEED, PROTOCOL_SETTINGS_SEED } from './constants';
import { PublicKey } from '@solana/web3.js';

export const findPoolAddress = (
  tokenMint: PublicKey, 
  creator: PublicKey,
  maxParticipants: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_SEED),
      tokenMint.toBuffer(),
      creator.toBuffer(),
      Buffer.from([maxParticipants])
    ],
    HUIFI_PROGRAM_ID
  );
};

export const findVaultAddress = (poolAddress: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(VAULT_SEED),
      poolAddress.toBuffer()
    ],
    HUIFI_PROGRAM_ID
  );
};

export const findUserAccountAddress = (owner: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(USER_ACCOUNT_SEED), owner.toBuffer()],
    HUIFI_PROGRAM_ID
  );
};

export const findBidAddress = (
  bidder: PublicKey,
  pool: PublicKey,
  round: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(BID_SEED), 
      bidder.toBuffer(), 
      pool.toBuffer(), 
      Buffer.from([round])
    ],
    HUIFI_PROGRAM_ID
  );
};

export const findRoundResultAddress = (
  pool: PublicKey,
  round: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(ROUND_RESULT_SEED), 
      pool.toBuffer(), 
      Buffer.from([round])
    ],
    HUIFI_PROGRAM_ID
  );
};

export const findProtocolSettingsAddress = (): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PROTOCOL_SETTINGS_SEED)],
    HUIFI_PROGRAM_ID
  );
};