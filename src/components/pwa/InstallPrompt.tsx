'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running in standalone display mode already
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 shadow-glow-cyan mb-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-slate-400 hover:text-white p-1"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-royal-600 to-cyan-400 text-slate-950 flex items-center justify-center shrink-0">
          <Download className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div className="flex-1 pr-6">
          <h4 className="text-sm font-bold text-white">Install DayLog App</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Add DayLog to your home screen for quick offline access, fullscreen mode, and instant goal logging.
          </p>

          {isIOS ? (
            <div className="mt-3 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-cyan-300">
                <Share className="w-3.5 h-3.5" />
                <span>On iPhone Safari:</span>
              </div>
              <p>
                Tap the <strong>Share</strong> button in Safari's bottom toolbar, then scroll down and tap{' '}
                <strong className="text-white">Add to Home Screen</strong>.
              </p>
            </div>
          ) : deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="mt-3 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-royal-500 to-cyan-400 hover:opacity-95 shadow-glow-cyan transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install to Device</span>
            </button>
          ) : (
            <p className="text-[11px] text-slate-500 mt-2">
              Tip: Use your browser menu &rarr; &quot;Install app&quot; or &quot;Add to Home Screen&quot;.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
