import { Connection, PublicKey } from '@solana/web3.js';
import { HuifiProgram } from '@/lib/types/huifi-program';
import { 
  PoolCreatedEvent, 
  ContributionEvent,
  PayoutProcessedEvent 
} from '@/lib/types/events';

export const subscribeToPoolEvents = (
  program: HuifiProgram,
  poolAddress: PublicKey,
  callbacks: {
    onContribution?: (event: ContributionEvent) => void;
    onPayout?: (event: PayoutProcessedEvent) => void;
    // Add more event callbacks
  }
) => {
  const listeners = [
    program.addEventListener('ContributionEvent', (event: ContributionEvent) => {
      if (event.pool.equals(poolAddress) && callbacks.onContribution) {
        callbacks.onContribution(event);
      }
    }),
    program.addEventListener('PayoutProcessedEvent', (event: PayoutProcessedEvent) => {
      if (event.pool.equals(poolAddress) && callbacks.onPayout) {
        callbacks.onPayout(event);
      }
    }),
    // Add more event listeners
  ];

  return () => {
    listeners.forEach(listener => program.removeEventListener(listener));
  };
}; 