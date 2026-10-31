'use client';

import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { queueLogUpsert } from '@/lib/storage/sync';
import { Play, Pause, RotateCcw, Check, X, Flame } from 'lucide-react';

interface WorkoutTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  activityId: string;
  activityName: string;
  targetMinutes: number;
  onLogged?: () => void;
}

export const WorkoutTimerModal: React.FC<WorkoutTimerModalProps> = ({
  isOpen,
  onClose,
  date,
  activityId,
  activityName,
  targetMinutes,
  onLogged,
}) => {
  const { activeTimer, startTimer, pauseTimer, resumeTimer, tickTimer, stopTimer, resetTimer, triggerConfetti } =
    useAppStore();

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize interval when modal is open and timer is running
  useEffect(() => {
    if (activeTimer && activeTimer.running) {
      timerRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimer?.running, tickTimer]);

  if (!isOpen) return null;

  const seconds = activeTimer ? activeTimer.secondsElapsed : 0;
  const targetSec = (targetMinutes || 15) * 60;
  const progressPct = Math.min(100, Math.round((seconds / targetSec) * 100));

  const minutesDisplay = Math.floor(seconds / 60);
  const secondsDisplay = seconds % 60;
  const timeFormatted = `${String(minutesDisplay).padStart(2, '0')}:${String(secondsDisplay).padStart(2, '0')}`;

  const handleStart = () => {
    if (!activeTimer) {
      startTimer(activityId, activityName, targetMinutes);
    } else {
      resumeTimer();
    }
  };

  const handleCompleteAndLog = async () => {
    const loggedMinutes = Math.max(1, Math.round(seconds / 60) || targetMinutes);
    triggerConfetti();
    await queueLogUpsert(activityId, date, loggedMinutes, 'Workout completed via timer');
    stopTimer();
    onLogged?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 border border-cyan-500/20 shadow-glass relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-4">
          <Flame className="w-3.5 h-3.5" />
          <span>{activityName}</span>
        </div>

        {/* Big Progress Ring with Timer in Center */}
        <div className="my-4 flex justify-center">
          <ProgressRing
            progress={progressPct}
            size={180}
            strokeWidth={12}
            showPercentage={false}
          />
          <div className="absolute flex flex-col items-center justify-center mt-12 pointer-events-none">
            <span className="text-4xl font-extrabold tracking-tight text-white font-mono">
              {timeFormatted}
            </span>
            <span className="text-xs text-slate-400 mt-1 font-medium">
              Target: {targetMinutes} mins
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={resetTimer}
            title="Reset timer"
            className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {!activeTimer?.running ? (
            <button
              onClick={handleStart}
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-royal-600 to-cyan-400 text-slate-950 font-bold shadow-glow-cyan hover:scale-105 transition-all cursor-pointer"
            >
              <Play className="w-7 h-7 fill-slate-950" />
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-bold shadow-glow-cyan hover:scale-105 transition-all cursor-pointer"
            >
              <Pause className="w-7 h-7 fill-slate-950" />
            </button>
          )}

          <button
            onClick={handleCompleteAndLog}
            title="Log workout now"
            className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg cursor-pointer"
          >
            <Check className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-6">
          Tap the checkmark at any time to record your elapsed minutes to DayLog.
        </p>
      </div>
    </div>
  );
};
