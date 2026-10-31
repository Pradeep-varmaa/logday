import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = 'h-4 w-full' }) => {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-slate-800/60 border border-slate-700/30 ${className}`}
    />
  );
};

export const ActivitySkeletonCard: React.FC = () => {
  return (
    <div className="glass-panel rounded-2xl p-4 flex items-center justify-between gap-3 animate-pulse">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-11 h-11 rounded-xl bg-slate-800/80 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-slate-800/80 rounded w-3/4" />
          <div className="h-3 bg-slate-800/50 rounded w-1/2" />
        </div>
      </div>
      <div className="w-16 h-9 rounded-xl bg-slate-800/80 shrink-0" />
    </div>
  );
};
