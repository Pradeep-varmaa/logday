import React from 'react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function RootLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
      <BrandLogo size="lg" spin={true} />
      <p className="text-xs font-semibold text-cyan-400 tracking-wider uppercase animate-pulse">
        Loading DayLog...
      </p>
    </div>
  );
}
