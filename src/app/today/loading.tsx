import React from 'react';
import { Skeleton, ActivitySkeletonCard } from '@/components/ui/SkeletonCard';

export default function TodayLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-6 w-36 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-md" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ActivitySkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
