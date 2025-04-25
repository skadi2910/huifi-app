import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from '@/lib/types/huifi-program';

export const findPoolAddress = (
  tokenMint: PublicKey,
  creator: PublicKey,
  uuid: number[],
  isNativeSol: boolean
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    isNativeSol
      ? [
          Buffer.from('huifi-sol-pool'),
          creator.toBuffer(),
          Buffer.from(uuid)
        ]
      : [
          Buffer.from('huifi-pool'),
          tokenMint.toBuffer(),
          creator.toBuffer(),
          Buffer.from(uuid)
        ],
    PROGRAM_ID
  );
};

export const findVaultAddress = (
  poolAddress: PublicKey,
  isNativeSol: boolean
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(isNativeSol ? 'huifi-sol-vault' : 'huifi-spl-vault'),
      poolAddress.toBuffer()
    ],
    PROGRAM_ID
  );
};

export const findCollateralAddress = (
  poolAddress: PublicKey,
  isNativeSol: boolean
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(isNativeSol ? 'huifi-sol-collateral' : 'huifi-spl-collateral'),
      poolAddress.toBuffer()
    ],
    PROGRAM_ID
  );
}; 