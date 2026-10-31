'use client';

import React from 'react';
import { DaySteps } from '@/types/activity';
import { Footprints, Check } from 'lucide-react';

interface WeeklyStepsBarProps {
  data: DaySteps[];
  className?: string;
}

export const WeeklyStepsBar: React.FC<WeeklyStepsBarProps> = ({ data, className = '' }) => {
  const maxSteps = Math.max(12000, ...data.map((d) => d.steps));
  const target = 10000;
  const targetRatio = (target / maxSteps) * 100;

  return (
    <div className={`glass-panel rounded-2xl p-5 border border-white/5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Footprints className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Weekly Steps Activity</h3>
            <p className="text-xs text-slate-400">Target: 10,000 steps/day</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-cyan-300">Last 7 Days</span>
        </div>
      </div>

      {/* Chart container */}
      <div className="relative pt-6 pb-2">
        {/* 10,000 Target Reference Line */}
        <div
          className="absolute left-0 right-0 border-b border-dashed border-cyan-400/30 flex items-center justify-end pr-1 pointer-events-none z-10"
          style={{ bottom: `${targetRatio * 0.75 + 24}px` }}
        >
          <span className="text-[10px] text-cyan-400 bg-navy-900/80 px-1 rounded -translate-y-2">
            10k Target
          </span>
        </div>

        {/* Bars */}
        <div className="grid grid-cols-7 gap-2 items-end h-36">
          {data.map((item, idx) => {
            const heightPct = Math.min(100, Math.max(12, (item.steps / maxSteps) * 100));
            const hitTarget = item.steps >= target;

            return (
              <div key={item.date || idx} className="flex flex-col items-center h-full justify-end group">
                {/* Step tooltip on hover */}
                <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-semibold">
                  {Math.round(item.steps / 1000)}k
                </span>

                {/* The Bar */}
                <div className="w-full max-w-[28px] h-28 flex items-end justify-center rounded-xl bg-slate-800/40 p-1">
                  <div
                    className={`w-full rounded-lg transition-all duration-500 flex items-center justify-center ${
                      hitTarget
                        ? 'bg-gradient-to-t from-royal-600 to-cyan-400 shadow-glow-cyan'
                        : 'bg-gradient-to-t from-slate-700 to-slate-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  >
                    {hitTarget && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                  </div>
                </div>

                {/* Day label */}
                <span className="text-[11px] font-medium text-slate-400 mt-2">
                  {item.day_name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
