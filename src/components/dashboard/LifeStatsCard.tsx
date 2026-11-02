'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Footprints, Flame, Droplets, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';

interface LifeStats {
  totalSteps: number;
  totalKm: number;
  totalWorkoutMinutes: number;
  totalWorkoutHours: number;
  totalWaterLiters: number;
  perfectDays: number;
  activeDays: number;
  totalCompletions: number;
}

export const LifeStatsCard: React.FC = () => {
  const [stats, setStats] = useState<LifeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/life-stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-5 border border-white/5 flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-4 shadow-glass">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              Lifetime Odometers
              <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                All-time
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Cumulative physical impact of your daily consistency</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Distance */}
        <div className="p-3.5 rounded-2xl bg-navy-950/40 border border-white/5 hover:border-cyan-500/20 transition-all space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Footprints className="w-3.5 h-3.5 text-cyan-400" />
            <span>Distance</span>
          </div>
          <div className="text-lg font-black text-white">
            {stats.totalKm.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">km</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {stats.totalSteps.toLocaleString()} steps logged
          </div>
        </div>

        {/* Total Training */}
        <div className="p-3.5 rounded-2xl bg-navy-950/40 border border-white/5 hover:border-orange-500/20 transition-all space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Training</span>
          </div>
          <div className="text-lg font-black text-white">
            {stats.totalWorkoutHours.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">hrs</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {stats.totalWorkoutMinutes.toLocaleString()} mins active
          </div>
        </div>

        {/* Total Water */}
        <div className="p-3.5 rounded-2xl bg-navy-950/40 border border-white/5 hover:border-cyan-500/20 transition-all space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Droplets className="w-3.5 h-3.5 text-cyan-300" />
            <span>Hydration</span>
          </div>
          <div className="text-lg font-black text-white">
            {stats.totalWaterLiters.toLocaleString()} <span className="text-xs text-slate-400 font-semibold">L</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Pure water consumed
          </div>
        </div>

        {/* Total Completions */}
        <div className="p-3.5 rounded-2xl bg-navy-950/40 border border-white/5 hover:border-emerald-500/20 transition-all space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Goals Hit</span>
          </div>
          <div className="text-lg font-black text-white">
            {stats.totalCompletions.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {stats.perfectDays} perfect days
          </div>
        </div>
      </div>
    </div>
  );
};
