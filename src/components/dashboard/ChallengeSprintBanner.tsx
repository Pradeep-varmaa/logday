'use client';

import React, { useState } from 'react';
import { Trophy, Award, Flame, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { MonthHeatmapDay } from '@/types/activity';

interface ChallengeSprintBannerProps {
  currentDate: string; // YYYY-MM-DD
  monthHeatmap?: MonthHeatmapDay[];
}

export const ChallengeSprintBanner: React.FC<ChallengeSprintBannerProps> = ({
  currentDate,
  monthHeatmap = [],
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Extract year, month, day
  const parts = currentDate.split('-');
  const year = parseInt(parts[0], 10) || 2026;
  const monthNum = parseInt(parts[1], 10) || 11;
  const dayNum = parseInt(parts[2], 10) || 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[monthNum - 1] || 'Monthly';
  const totalDaysInMonth = new Date(year, monthNum, 0).getDate();

  // Completed streak days in this month
  const completedStreakDays = monthHeatmap.filter((d) => d.is_streak_day || d.completion_pct >= 100).length;
  const progressPct = Math.min(100, Math.round((dayNum / totalDaysInMonth) * 100));

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full py-2 px-4 rounded-2xl glass-panel border border-cyan-500/20 text-xs font-semibold text-cyan-300 flex items-center justify-between transition-all hover:border-cyan-500/40 cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>{monthName} Challenge: Day {dayNum} of {totalDaysInMonth}</span>
        </span>
        <span className="text-slate-400 text-[10px]">Tap to expand</span>
      </button>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-5 border border-amber-500/20 bg-gradient-to-br from-amber-950/20 via-navy-950/40 to-royal-950/20 relative overflow-hidden space-y-3.5 shadow-glass">
      {/* Background glow accent */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              {monthName} 30-Day Sprint
              <span className="text-[10px] uppercase font-bold px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Challenge
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Day {dayNum} of {totalDaysInMonth} • {completedStreakDays} Perfect {completedStreakDays === 1 ? 'Day' : 'Days'} Logged
            </p>
          </div>
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          Hide
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Sprint Journey</span>
          <span className="text-cyan-300 font-bold">{progressPct}% elapsed</span>
        </div>
        <div className="w-full h-2 bg-navy-950 rounded-full overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-orange-400 to-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Sprint Milestone Badges */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div
          className={`p-2.5 rounded-2xl border text-center transition-all ${
            completedStreakDays >= 10
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
              : 'bg-navy-950/40 border-white/5 text-slate-500'
          }`}
        >
          <div className="text-sm font-black">🥉 10 Days</div>
          <div className="text-[10px] mt-0.5 font-medium">
            {completedStreakDays >= 10 ? 'Unlocked!' : `${Math.max(0, 10 - completedStreakDays)} to go`}
          </div>
        </div>

        <div
          className={`p-2.5 rounded-2xl border text-center transition-all ${
            completedStreakDays >= 20
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-sm'
              : 'bg-navy-950/40 border-white/5 text-slate-500'
          }`}
        >
          <div className="text-sm font-black">🥈 20 Days</div>
          <div className="text-[10px] mt-0.5 font-medium">
            {completedStreakDays >= 20 ? 'Unlocked!' : `${Math.max(0, 20 - completedStreakDays)} to go`}
          </div>
        </div>

        <div
          className={`p-2.5 rounded-2xl border text-center transition-all ${
            completedStreakDays >= totalDaysInMonth
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm'
              : 'bg-navy-950/40 border-white/5 text-slate-500'
          }`}
        >
          <div className="text-sm font-black">🥇 Finisher</div>
          <div className="text-[10px] mt-0.5 font-medium">
            {completedStreakDays >= totalDaysInMonth ? 'Champion!' : `${Math.max(0, totalDaysInMonth - completedStreakDays)} to go`}
          </div>
        </div>
      </div>
    </div>
  );
};
