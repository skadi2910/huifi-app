import React from 'react';

export interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={`bg-[#121212] border border-[#2a2a2a] rounded-lg shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={`p-4 border-b border-[#2a2a2a] ${className}`}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <h3 className={`text-xl font-bold text-[#ffdd00] ${className}`}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <p className={`mt-1 text-sm text-[#ffdd00]/60 ${className}`}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<CardProps> = ({ className = '', children }) => {
  return (
    <div className={`p-4 border-t border-[#2a2a2a] ${className}`}>
      {children}
    </div>
  );
};

export const Button: React.FC<CardProps & { onClick?: () => void, variant?: 'default' | 'outline', size?: 'sm' | 'md' | 'lg' }> = ({ 
  className = '', 
  children, 
  onClick,
  variant = 'default',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    default: 'bg-[#ffdd00] hover:bg-[#e6c900] text-black',
    outline: 'bg-transparent border border-[#ffdd00] text-[#ffdd00] hover:bg-[#ffdd00]/10'
  };
  
  return (
    <button 
      onClick={onClick}
      className={`rounded font-medium transition-colors ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}; 