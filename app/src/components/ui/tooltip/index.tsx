import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

// Create context for the tooltip
const TooltipContext = createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => {},
});

export const TooltipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      {children}
    </TooltipContext.Provider>
  );
};

export const Tooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const TooltipTrigger: React.FC<TooltipTriggerProps> = ({ 
  children, 
  asChild = false
}) => {
  const { setOpen } = useContext(TooltipContext);
  
  if (asChild) {
    return React.cloneElement(children as React.ReactElement, {
      onMouseEnter: () => setOpen(true),
      onMouseLeave: () => setOpen(false),
      onFocus: () => setOpen(true),
      onBlur: () => setOpen(false),
    });
  }
  
  return (
    <span
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
    </span>
  );
};

export const TooltipContent: React.FC<{ children: React.ReactNode, className?: string }> = ({ 
  children, 
  className = ''
}) => {
  const { open } = useContext(TooltipContext);
  
  if (!open) return null;
  
  return (
    <div 
      className={`absolute z-50 px-3 py-2 text-sm bg-[#2a2a2a] text-[#ffdd00] rounded shadow-lg 
      bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 
      whitespace-nowrap ${className}`}
    >
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 bg-[#2a2a2a]" />
      {children}
    </div>
  );
}; 