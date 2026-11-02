'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Trophy, Sparkles, ShieldCheck, Snowflake, Loader2 } from 'lucide-react';
import { StreakInfo } from '@/types/activity';
import { playCheckPop, playCompleteFanfare } from '@/lib/audio/sound';
import confetti from 'canvas-confetti';

interface StreakCardProps {
  streaks: StreakInfo;
  currentDate?: string;
  onRefresh?: () => void;
  className?: string;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  streaks,
  currentDate,
  onRefresh,
  className = '',
}) => {
  const isHeatingUp = streaks.current_streak >= 3;
  const [freezeData, setFreezeData] = useState<{
    available: number;
    limit: number;
    usedThisMonth: number;
    isFrozenToday: boolean;
  } | null>(null);
  const [toggling, setToggling] = useState(false);

  const targetDate = currentDate || new Date().toISOString().slice(0, 10);

  const fetchFreezeInfo = async () => {
    try {
      const res = await fetch('/api/streak-freeze');
      if (res.ok) {
        const data = await res.json();
        setFreezeData({
          available: data.available,
          limit: data.limit,
          usedThisMonth: data.usedThisMonth,
          isFrozenToday: data.frozenDates?.includes(targetDate) ?? false,
        });
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchFreezeInfo();
  }, [targetDate]);

  const handleToggleFreeze = async () => {
    if (!freezeData) return;
    const isCurrentlyFrozen = freezeData.isFrozenToday;
    const action = isCurrentlyFrozen ? 'unfreeze' : 'freeze';

    setToggling(true);
    playCheckPop();

    if (!isCurrentlyFrozen) {
      playCompleteFanfare();
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#38bdf8', '#22d3ee', '#67e8f9', '#ffffff'],
        });
      } catch (_) {}
    }

    try {
      const res = await fetch('/api/streak-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: targetDate, action }),
      });

      if (res.ok) {
        await fetchFreezeInfo();
        onRefresh?.();
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={`glass-panel rounded-3xl p-5 border border-cyan-500/15 relative overflow-hidden space-y-3.5 ${className}`}
    >
      {/* Background glow accent */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top row: Flame, Streak count, and Record */}
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              freezeData?.isFrozenToday
                ? 'bg-gradient-to-tr from-cyan-400 to-sky-600 text-white shadow-cyan-500/30'
                : isHeatingUp
                ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 shadow-orange-500/20'
                : 'bg-slate-800/80 text-cyan-400 border border-slate-700/40'
            }`}
          >
            {freezeData?.isFrozenToday ? (
              <Snowflake className="w-6 h-6 animate-pulse" />
            ) : (
              <Flame className={`w-6 h-6 ${isHeatingUp ? 'animate-bounce' : ''}`} />
            )}
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tracking-tight text-white">
                {streaks.current_streak}
              </span>
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">
                {streaks.current_streak === 1 ? 'Day Streak' : 'Days Streak'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              {freezeData?.isFrozenToday ? (
                <>
                  <Snowflake className="w-3 h-3 text-cyan-400" /> Protected by Streak Freeze
                </>
              ) : streaks.current_streak > 0 ? (
                <>
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Keep the momentum going!
                </>
              ) : (
                'Complete all goals today to ignite your streak!'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end pl-2">
          <div className="flex items-center gap-1 text-slate-400 text-xs">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Record</span>
          </div>
          <span className="text-sm font-semibold text-slate-200 mt-0.5">
            {streaks.best_streak} {streaks.best_streak === 1 ? 'day' : 'days'}
          </span>
        </div>
      </div>

      {/* Bottom row: Streak Shield / Grace Day Protection */}
      {freezeData && (
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between gap-3 text-xs z-10 relative">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-slate-300">Streak Shield: </span>
              <span className="text-slate-400">
                {freezeData.available} of {freezeData.limit} freeze left this month
              </span>
            </div>
          </div>

          <button
            onClick={handleToggleFreeze}
            disabled={toggling || (!freezeData.isFrozenToday && freezeData.available <= 0)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
              freezeData.isFrozenToday
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                : freezeData.available > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                : 'bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
            title="Freeze this day so it doesn't break your streak"
          >
            {toggling ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : freezeData.isFrozenToday ? (
              <>
                <Snowflake className="w-3.5 h-3.5 text-cyan-300" />
                <span>Frozen</span>
              </>
            ) : (
              <>
                <Snowflake className="w-3.5 h-3.5 text-slate-400" />
                <span>Freeze Day</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
