import React from 'react';
import { Skeleton } from '@/components/ui/SkeletonCard';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* View Switcher Skeleton */}
      <Skeleton className="h-11 rounded-2xl w-48 mx-auto" />

      {/* Date controller Skeleton */}
      <Skeleton className="h-14 rounded-2xl" />

      {/* 4 KPI cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* Big chart area skeleton */}
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
