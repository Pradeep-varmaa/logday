'use client';

import React from 'react';
import { MonthHeatmapDay } from '@/types/activity';
import { useAppStore } from '@/store/useAppStore';
import { Flame } from 'lucide-react';

interface MonthHeatmapProps {
  days: MonthHeatmapDay[];
  currentDate: string;
  className?: string;
}

export const MonthHeatmap: React.FC<MonthHeatmapProps> = ({ days, currentDate, className = '' }) => {
  const setSelectedDate = useAppStore((state) => state.setSelectedDate);

  const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Pad days if month starts on day of week > 1
  const firstDay = days[0];
  const leadingPadding = firstDay ? (firstDay.day_of_week === 0 ? 6 : firstDay.day_of_week - 1) : 0;

  const getColorClass = (day: MonthHeatmapDay) => {
    if (day.completion_pct >= 100) {
      return 'bg-gradient-to-tr from-royal-600 to-cyan-400 text-slate-950 font-bold shadow-glow-cyan';
    }
    if (day.completion_pct >= 70) {
      return 'bg-royal-600/70 text-white font-semibold';
    }
    if (day.completion_pct >= 30) {
      return 'bg-royal-900/60 text-slate-300';
    }
    if (day.completion_pct > 0) {
      return 'bg-slate-800 text-slate-400';
    }
    return 'bg-slate-900/60 text-slate-500 border border-slate-800/40';
  };

  return (
    <div className={`glass-panel rounded-2xl p-5 border border-white/5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Monthly Consistency</h3>
          <p className="text-xs text-slate-400">Tap any day to view or edit entries</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-cyan-400">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>Daily Goal Hit</span>
        </div>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
        {dayHeaders.map((d, i) => (
          <span key={i} className="text-[11px] font-medium text-slate-500">
            {d}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: leadingPadding }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square rounded-xl bg-transparent" />
        ))}

        {days.map((d) => {
          const isSelected = d.date === currentDate;
          const isStreak = d.is_streak_day;

          return (
            <button
              key={d.date}
              onClick={() => setSelectedDate(d.date)}
              title={`${d.date}: ${d.completion_pct}% completion, ${d.steps_total} steps`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center relative transition-all duration-150 cursor-pointer ${getColorClass(
                d
              )} ${
                isSelected
                  ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-navy-950 scale-105 z-10'
                  : 'hover:scale-105'
              }`}
            >
              <span className="text-xs font-semibold leading-none">{d.day_of_month}</span>
              {isStreak && (
                <span className="w-1 h-1 rounded-full bg-amber-400 absolute bottom-1" />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-[10px] text-slate-400">
        <span>Less</span>
        <div className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-800" />
        <div className="w-2.5 h-2.5 rounded bg-royal-900/60" />
        <div className="w-2.5 h-2.5 rounded bg-royal-600/70" />
        <div className="w-2.5 h-2.5 rounded bg-cyan-400" />
        <span>100%</span>
      </div>
    </div>
  );
};
