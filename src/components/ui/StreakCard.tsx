'use client';

import React from 'react';
import { Flame, Trophy, Sparkles } from 'lucide-react';
import { StreakInfo } from '@/types/activity';

interface StreakCardProps {
  streaks: StreakInfo;
  className?: string;
}

export const StreakCard: React.FC<StreakCardProps> = ({ streaks, className = '' }) => {
  const isHeatingUp = streaks.current_streak >= 3;

  return (
    <div
      className={`glass-panel rounded-2xl p-4 flex items-center justify-between border border-cyan-500/15 relative overflow-hidden ${className}`}
    >
      {/* Background glow accent */}
      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-600/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-3.5 z-10">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
            isHeatingUp
              ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 shadow-orange-500/20'
              : 'bg-slate-800/80 text-cyan-400 border border-slate-700/40'
          }`}
        >
          <Flame className={`w-6 h-6 ${isHeatingUp ? 'animate-bounce' : ''}`} />
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
            {streaks.current_streak > 0 ? (
              <>
                <Sparkles className="w-3 h-3 text-cyan-400" /> Keep the momentum going!
              </>
            ) : (
              'Complete all goals today to ignite your streak!'
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end z-10 pl-2">
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Record</span>
        </div>
        <span className="text-sm font-semibold text-slate-200 mt-0.5">
          {streaks.best_streak} {streaks.best_streak === 1 ? 'day' : 'days'}
        </span>
      </div>
    </div>
  );
};
