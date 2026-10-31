import React from 'react';
import { Skeleton, ActivitySkeletonCard } from '@/components/ui/SkeletonCard';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <div className="glass-panel rounded-3xl p-6 flex items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-1/3 rounded-lg" />
          <Skeleton className="h-4 w-1/2 rounded-lg" />
        </div>
        <div className="w-24 h-24 rounded-full bg-slate-800/80 shrink-0" />
      </div>

      {/* Streak Card Skeleton */}
      <Skeleton className="h-20 rounded-2xl" />

      {/* Activities Grid Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28 rounded-md" />
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <ActivitySkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Weekly Steps & Month Heatmap Skeletons */}
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-44 rounded-2xl" />
    </div>
  );
}
