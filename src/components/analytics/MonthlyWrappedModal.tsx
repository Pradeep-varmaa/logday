'use client';

import React, { useState } from 'react';
import { MonthAnalyticsData } from '@/types/activity';
import { X, Share2, Sparkles, Trophy, Footprints, Flame, Camera, Check, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playCompleteFanfare } from '@/lib/audio/sound';

interface MonthlyWrappedModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: MonthAnalyticsData;
}

export const MonthlyWrappedModal: React.FC<MonthlyWrappedModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const monthName = monthNames[data.month - 1] || 'Month';
  const totalKm = Math.round(data.kpis.total_steps * 0.000762 * 10) / 10;
  const workoutHours = Math.round((data.kpis.workout_minutes / 60) * 10) / 10;

  const handleShare = async () => {
    playCompleteFanfare();
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22d3ee', '#1d4ed8', '#6366f1', '#e11d48'],
      });
    } catch (_) {}

    const textToShare = `🔥 My ${monthName} ${data.year} DayLog Recap:
✨ ${data.kpis.avg_completion_pct}% Consistency
👟 ${data.kpis.total_steps.toLocaleString()} Steps (${totalKm} km)
💪 ${data.kpis.workout_minutes} Workout Mins (${workoutHours} hrs)
📸 ${data.kpis.instagram_posts} Posts
⚡ Longest Streak: ${data.kpis.longest_streak} days

Tracked with DayLog PWA!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `DayLog - ${monthName} ${data.year} Recap`,
          text: textToShare,
        });
        return;
      } catch (_) {}
    }

    // Fallback: Copy to clipboard
    try {
      await navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-sm rounded-3xl p-6 border border-cyan-400/30 bg-gradient-to-br from-royal-950 via-navy-900 to-slate-950 shadow-glass text-center overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-royal-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/60 text-slate-400 hover:text-white flex items-center justify-center z-10 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Story Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-royal-500/20 to-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Monthly Wrapped</span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-black text-white tracking-tight">
          {monthName} {data.year}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">Your monthly habit &amp; momentum recap</p>

        {/* Big Highlight Ring */}
        <div className="my-6 p-4 rounded-3xl bg-navy-950/60 border border-white/5 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
            Consistency Score
          </span>
          <div className="text-5xl font-black bg-gradient-to-r from-cyan-300 via-royal-300 to-white bg-clip-text text-transparent">
            {data.kpis.avg_completion_pct}%
          </div>
          <span className="text-xs text-cyan-400 font-semibold block">
            {data.kpis.avg_completion_pct >= 80 ? '🔥 Exceptional Dedication' : '💪 Solid Momentum'}
          </span>
        </div>

        {/* 4 Story KPI Blocks */}
        <div className="grid grid-cols-2 gap-2.5 my-4 text-left">
          <div className="p-3 rounded-2xl bg-navy-950/50 border border-white/5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Footprints className="w-3.5 h-3.5 text-cyan-400" />
              <span>Total Steps</span>
            </div>
            <div className="text-sm font-black text-white">
              {data.kpis.total_steps.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-500">{totalKm} km walked</div>
          </div>

          <div className="p-3 rounded-2xl bg-navy-950/50 border border-white/5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Training</span>
            </div>
            <div className="text-sm font-black text-white">
              {data.kpis.workout_minutes} mins
            </div>
            <div className="text-[10px] text-slate-500">{workoutHours} hours logged</div>
          </div>

          <div className="p-3 rounded-2xl bg-navy-950/50 border border-white/5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Best Streak</span>
            </div>
            <div className="text-sm font-black text-white">
              {data.kpis.longest_streak} Days
            </div>
            <div className="text-[10px] text-slate-500">Consecutive wins</div>
          </div>

          <div className="p-3 rounded-2xl bg-navy-950/50 border border-white/5 space-y-0.5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Posts</span>
            </div>
            <div className="text-sm font-black text-white">
              {data.kpis.instagram_posts}
            </div>
            <div className="text-[10px] text-slate-500">Instagram shared</div>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-royal-600 via-royal-500 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-cyan flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Recap Copied to Clipboard!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>Share Monthly Story</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
