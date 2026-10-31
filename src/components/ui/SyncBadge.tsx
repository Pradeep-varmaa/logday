'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';
import { flushOutbox } from '@/lib/storage/sync';
import { Cloud, CloudOff, RefreshCw, Check } from 'lucide-react';

export const SyncBadge: React.FC = () => {
  const syncStatus = useAppStore((state) => state.syncStatus);
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleManualSync = async () => {
    if (syncStatus === 'syncing' || isRetrying) return;
    setIsRetrying(true);
    try {
      await flushOutbox();
    } finally {
      setIsRetrying(false);
    }
  };

  if (syncStatus === 'synced') {
    return (
      <button
        onClick={handleManualSync}
        title="All changes synced to cloud. Tap to check."
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/30 transition-all cursor-pointer"
      >
        <Check className="w-3 h-3 text-emerald-400" />
        <span className="hidden sm:inline">Synced</span>
      </button>
    );
  }

  if (syncStatus === 'syncing') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/40 border border-blue-500/30 text-cyan-300">
        <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleManualSync}
      title="Offline. Changes saved locally to IndexedDB and will sync once reconnected."
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/50 border border-amber-500/30 text-amber-300 hover:bg-amber-900/40 transition-all cursor-pointer"
    >
      <CloudOff className="w-3 h-3 text-amber-400 animate-pulse" />
      <span className="truncate max-w-[130px] sm:max-w-none">Offline (will sync)</span>
    </button>
  );
};
