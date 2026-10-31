import React from 'react';
import { Skeleton, ActivitySkeletonCard } from '@/components/ui/SkeletonCard';

export default function CalendarLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-5 w-32 rounded-md" />
        <ActivitySkeletonCard />
        <ActivitySkeletonCard />
      </div>
    </div>
  );
}
