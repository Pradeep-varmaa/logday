import React from 'react';

export default function TasksLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-navy-800/80 rounded-xl" />
          <div className="h-4 w-56 bg-navy-850/60 rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-navy-800/80 rounded-xl" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 glass-panel rounded-2xl bg-navy-900/50 p-4 space-y-2">
            <div className="h-3 w-12 bg-navy-800 rounded" />
            <div className="h-6 w-8 bg-navy-700 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Input Card Skeleton */}
      <div className="h-16 glass-panel rounded-2xl bg-navy-900/50" />

      {/* Task List Items Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 glass-panel rounded-2xl bg-navy-900/40 border border-white/5 p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-navy-800" />
              <div className="h-4 w-44 bg-navy-800 rounded" />
            </div>
            <div className="h-5 w-14 bg-navy-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
