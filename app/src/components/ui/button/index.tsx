import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'link' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  children, 
  variant = 'default',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };
  
  const variantClasses = {
    default: 'bg-[#ffdd00] hover:bg-[#e6c900] text-black',
    outline: 'bg-transparent border border-[#ffdd00] text-[#ffdd00] hover:bg-[#ffdd00]/10',
    link: 'bg-transparent text-[#ffdd00] hover:underline px-0',
    primary: 'bg-[#ffdd00] hover:bg-[#e6c900] text-black font-bold',
    secondary: 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ffdd00]'
  };
  
  const isDisabled = disabled || isLoading;
  
  return (
    <button 
      className={`
        rounded font-medium transition-colors
        ${sizeClasses[size]} 
        ${variantClasses[variant]} 
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
}; 