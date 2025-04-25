import React from 'react';

export interface BadgeProps {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'secondary' | 'error';
}

export const Badge: React.FC<BadgeProps> = ({ 
  className = '', 
  children, 
  variant = 'default' 
}) => {
  const variantClasses = {
    default: 'bg-[#2a2a2a] text-[#ffdd00]',
    success: 'bg-green-900/30 text-green-400',
    secondary: 'bg-purple-900/30 text-purple-400',
    error: 'bg-red-900/30 text-red-400',
  };
  
  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}; 