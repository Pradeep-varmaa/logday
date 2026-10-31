'use client';

import React, { useState } from 'react';
import { ActivityWithLog } from '@/types/activity';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { queueLogUpsert } from '@/lib/storage/sync';
import { useAppStore } from '@/store/useAppStore';
import { Check, Plus, Timer, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';

interface ActivityCardProps {
  activity: ActivityWithLog;
  date: string;
  onOpenTimer?: (activity: ActivityWithLog) => void;
  onOpenSteps?: (activity: ActivityWithLog) => void;
  onOpenDetails?: (activity: ActivityWithLog) => void;
  onRefresh?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  date,
  onOpenTimer,
  onOpenSteps,
  onOpenDetails,
  onRefresh,
}) => {
  const triggerConfetti = useAppStore((state) => state.triggerConfetti);
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = activity.is_completed;
  const isSteps = activity.unit.toLowerCase() === 'steps' || activity.name.toLowerCase().includes('step');
  const isDuration = activity.type === 'duration';

  const handleToggleCheck = async () => {
    setIsUpdating(true);
    const nextVal = isCompleted ? 0 : 1;
    if (nextVal === 1) {
      triggerConfetti();
    }
    await queueLogUpsert(activity.id, date, nextVal, activity.note, activity.link);
    setIsUpdating(false);
    onRefresh?.();
  };

  const handleQuickAdd = async (delta: number) => {
    setIsUpdating(true);
    const nextVal = Math.max(0, (activity.value || 0) + delta);
    if (!isCompleted && nextVal >= activity.daily_target) {
      triggerConfetti();
    }
    await queueLogUpsert(activity.id, date, nextVal, activity.note, activity.link);
    setIsUpdating(false);
    onRefresh?.();
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-4 transition-all duration-200 border relative overflow-hidden ${
        isCompleted
          ? 'border-cyan-500/30 bg-gradient-to-r from-royal-900/30 via-slate-900/40 to-cyan-950/20 shadow-glow-cyan'
          : 'border-white/5 hover:border-white/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Icon and Title */}
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-colors shadow-inner ${
              isCompleted
                ? 'bg-gradient-to-tr from-cyan-400 to-royal-600 text-white'
                : 'bg-slate-800/80 text-cyan-400 border border-slate-700/50'
            }`}
          >
            <IconRenderer name={activity.icon} className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100 truncate">{activity.name}</h3>
              {isCompleted && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-cyan-400 px-1.5 py-0.2 rounded-full bg-cyan-400/10 border border-cyan-400/20">
                  <Sparkles className="w-2.5 h-2.5" /> Done
                </span>
              )}
            </div>

            {/* Target and current progress status */}
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>
                {activity.value} / {activity.daily_target} {activity.unit}
              </span>
              <span className="text-slate-600">•</span>
              <span className={activity.progress_pct >= 100 ? 'text-cyan-400 font-medium' : ''}>
                {Math.round(activity.progress_pct)}%
              </span>
            </div>

            {/* Mini progress bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted
                    ? 'bg-gradient-to-r from-royal-500 to-cyan-400'
                    : 'bg-gradient-to-r from-royal-700 to-royal-500'
                }`}
                style={{ width: `${Math.min(100, activity.progress_pct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 self-center">
          {activity.type === 'check' && (
            <button
              onClick={handleToggleCheck}
              disabled={isUpdating}
              aria-label={isCompleted ? 'Mark incomplete' : 'Mark completed'}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-cyan-400 text-slate-950 shadow-glow-cyan font-bold scale-105'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60'
              }`}
            >
              <Check className={`w-5 h-5 ${isCompleted ? 'stroke-[3]' : ''}`} />
            </button>
          )}

          {activity.type === 'number' && (
            <div className="flex items-center gap-1">
              {isSteps ? (
                <>
                  <button
                    onClick={() => handleQuickAdd(1000)}
                    disabled={isUpdating}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 transition-all cursor-pointer"
                  >
                    +1k
                  </button>
                  <button
                    onClick={() => onOpenSteps?.(activity)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-royal-600 hover:bg-royal-500 text-white shadow-glow-blue transition-all cursor-pointer"
                  >
                    Log
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleQuickAdd(activity.daily_target <= 5 ? 1 : 10)}
                    disabled={isUpdating}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenDetails?.(activity)}
                    className="px-2 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          )}

          {activity.type === 'duration' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onOpenTimer?.(activity)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-royal-600 to-cyan-500 text-white shadow-glow-cyan hover:opacity-95 transition-all cursor-pointer"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Timer</span>
              </button>
              <button
                onClick={() => handleQuickAdd(15)}
                disabled={isUpdating}
                className="px-2 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 border border-slate-700/40"
              >
                +15m
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Optional Note / Link Footer */}
      {(activity.note || activity.link) && (
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          {activity.note && (
            <div className="flex items-center gap-1.5 truncate max-w-[260px]">
              <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="truncate">{activity.note}</span>
            </div>
          )}
          {activity.link && (
            <a
              href={activity.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-cyan-400 hover:underline shrink-0 ml-auto"
            >
              <span>Instagram</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};
