'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export const ServiceWorkerRegister: React.FC = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setWaitingWorker(newWorker);
                  setShowUpdate(true);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 right-4 z-50 glass-panel p-3 rounded-2xl border border-cyan-400/40 shadow-glow-cyan flex items-center gap-3 animate-bounce">
      <div className="text-xs">
        <p className="font-bold text-white">Update Available</p>
        <p className="text-slate-400">A new version of DayLog is ready.</p>
      </div>
      <button
        onClick={handleUpdate}
        className="px-3 py-1.5 rounded-xl bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-sm cursor-pointer"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Refresh</span>
      </button>
    </div>
  );
};
