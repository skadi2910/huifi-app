import { PublicKey } from '@solana/web3.js';
import { HuifiPool, UserAccount } from '@/lib/types/program-types';

export const validatePoolAccount = (pool: HuifiPool) => {
  if (!pool) throw new Error('Pool account not found');
  if (pool.status === 2) throw new Error('Pool is completed');
  // Add more validations
};

export const validateUserAccount = (userAccount: UserAccount) => {
  if (!userAccount) throw new Error('User account not found');
  // Add more validations
};

export const validatePoolParticipant = (
  pool: HuifiPool,
  userPubkey: PublicKey
) => {
  if (!pool.participants.some((p: PublicKey) => p.equals(userPubkey))) {
    throw new Error('User is not a participant in this pool');
  }
}; 