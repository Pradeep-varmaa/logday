'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

export default function LoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm glass-panel rounded-3xl p-7 border border-cyan-500/20 shadow-glass">
      <div className="text-center mb-6">
        <BrandLogo size="lg" className="mx-auto mb-3" />
        <h1 className="text-2xl font-black tracking-tight text-white">DayLog</h1>
        <p className="text-xs text-slate-400 mt-1">
          Personal Daily Tracker &amp; Challenge Journal
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Enter App Passcode</span>
          </label>
          <input
            type="password"
            autoFocus
            inputMode="numeric"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="e.g. 2468"
            className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-white text-center text-lg tracking-widest font-mono focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs text-center font-medium animate-pulse">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !passcode}
          className="w-full py-3.5 rounded-2xl font-bold text-sm text-slate-950 bg-gradient-to-r from-royal-500 to-cyan-400 shadow-glow-cyan flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-40 transition-all cursor-pointer"
        >
          {loading ? (
            <span>Verifying...</span>
          ) : (
            <>
              <span>Unlock DayLog</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-4 border-t border-white/5 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>End-to-end encrypted single-user session</span>
      </div>
    </div>
  );
}
