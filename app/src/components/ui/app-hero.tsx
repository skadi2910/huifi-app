import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface AppHeroProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  variant?: 'default' | 'error' | 'success';
}

/**
 * AppHero component - displays a hero section with title, subtitle and CTA
 */
export const AppHero: React.FC<AppHeroProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  variant = 'default',
}) => {
  // Define variant-specific styles
  const bgStyles = {
    default: 'bg-[#1a1a18]',
    error: 'bg-[#281415]',
    success: 'bg-[#15281a]',
  };
  
  const titleStyles = {
    default: 'text-[#e6ce04]',
    error: 'text-red-400',
    success: 'text-green-400',
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[60vh] px-4 ${bgStyles[variant]}`}>
      <div className="max-w-2xl mx-auto text-center">
        <h1 className={`text-4xl font-bold mb-4 ${titleStyles[variant]}`}>
          {title}
        </h1>
        
        {subtitle && (
          <p className="text-[#f8e555]/80 text-lg mb-8">
            {subtitle}
          </p>
        )}
        
        {ctaText && ctaLink && (
          <Link 
            href={ctaLink}
            className={`inline-flex items-center px-6 py-3 rounded-lg 
              ${variant === 'error' 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                : 'bg-[#e6ce04] text-[#010200] hover:bg-yellow-300'
              } 
              font-medium transition-colors`}
          >
            {ctaText}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default AppHero;