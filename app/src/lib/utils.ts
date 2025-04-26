import { BN } from "@coral-xyz/anchor";

export const lamportsToSol = (lamports: BN): string => {
    const sol = lamports.toNumber() / 1000000000; // 1 SOL = 1e9 LAMPORTS
    return `${sol} SOL`;
};

export const formatDurationHours = (cycleDurationSeconds: BN): string => {
    const seconds = Number(cycleDurationSeconds.toString());
    const hours = seconds / 3600;
    return `${Math.floor(hours)} hours`;
};

export const formatDurationMinutes = (cycleDurationSeconds: BN): string => {
    const seconds = Number(cycleDurationSeconds.toString());
    const minutes = seconds / 60;
    return `${Math.floor(minutes)} minutes`;
};

export const formatDurationSeconds = (cycleDurationSeconds: BN): string => {
    const seconds = Number(cycleDurationSeconds.toString());
    return `${seconds} seconds`;
};
export const getStatusString = (status: any): string => {
    // Check if status exists
    if (!status) return 'Unknown';
    
    // Check which key exists in the status object
    try {
      if ('initializing' in status) return 'Initializing';
      if ('active' in status) return 'Active';
      if ('completed' in status) return 'Completed';
      return 'Unknown'; // fallback
    } catch (error) {
      console.error('Error parsing status:', status);
      return 'Unknown';
    }
  };
export const bpsToPercentage = (bps: number): string => {
  return `${(bps / 100).toFixed(1)}%`; // Will show one decimal place
};


