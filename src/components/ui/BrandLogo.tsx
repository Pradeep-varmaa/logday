import React from 'react';
import { RefreshCw } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  spin?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  spin = false,
  className = '',
}) => {
  const containerSizes = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-2xl',
    lg: 'w-14 h-14 rounded-3xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  return (
    <div
      className={`${containerSizes[size]} bg-gradient-to-tr from-royal-600 via-royal-500 to-cyan-400 flex items-center justify-center text-white shadow-glow-cyan shrink-0 ${className}`}
    >
      {/* 2 circular arrows loading symbol */}
      <RefreshCw
        className={`${iconSizes[size]} text-white stroke-[2.5] ${
          spin ? 'animate-spin' : ''
        }`}
      />
    </div>
  );
};
