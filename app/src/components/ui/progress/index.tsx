import React from 'react';

export interface ProgressProps {
  className?: string;
  value: number; // 0-100
}

export const Progress: React.FC<ProgressProps> = ({ 
  className = '', 
  value = 0
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className={`h-1 w-full bg-[#2a2a2a] rounded overflow-hidden ${className}`}>
      <div 
        className="h-full bg-[#ffdd00]" 
        style={{ width: `${clampedValue}%` }}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}; 