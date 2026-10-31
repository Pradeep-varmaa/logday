'use client';

import React, { useState, useEffect } from 'react';
import { MonthAnalyticsData } from '@/types/activity';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { Skeleton } from '@/components/ui/SkeletonCard';
import {
  TrendingUp,
  TrendingDown,
  Footprints,
  Flame,
  Share2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trophy,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface MonthAnalyticsViewProps {
  initialYear: number;
  initialMonth: number;
  onDateChange: (year: number, month: number) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const MonthAnalyticsView: React.FC<MonthAnalyticsViewProps> = ({
  initialYear,
  initialMonth,
  onDateChange,
}) => {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [data, setData] = useState<MonthAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetch(`/api/analytics/month?y=${year}&m=${month}`)
      .then((res) => res.json())
      .then((resData) => {
        if (!ignore) {
          if (resData.error) {
            setError(resData.error);
            setData(null);
          } else {
            setData(resData);
            setError(null);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching month analytics:', err);
        if (!ignore) {
          setError(err.message || 'Database query failed');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [year, month]);

  const handlePrev = () => {
    let nextY = year;
    let nextM = month - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setYear(nextY);
    setMonth(nextM);
    onDateChange(nextY, nextM);
  };

  const handleNext = () => {
    let nextY = year;
    let nextM = month + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setYear(nextY);
    setMonth(nextM);
    onDateChange(nextY, nextM);
  };

  return (
    <div className="space-y-6">
      {/* Month & Year Selectors with Next / Prev */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl border border-white/5">
        <button
          onClick={handlePrev}
          aria-label="Previous month"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => {
              const m = parseInt(e.target.value, 10);
              setMonth(m);
              onDateChange(year, m);
            }}
            className="bg-slate-800/90 text-white font-semibold text-sm rounded-xl px-3 py-1.5 border border-slate-700/60 focus:border-cyan-400 focus:outline-none cursor-pointer"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => {
              const y = parseInt(e.target.value, 10);
              setYear(y);
              onDateChange(y, month);
            }}
            className="bg-slate-800/90 text-white font-semibold text-sm rounded-xl px-3 py-1.5 border border-slate-700/60 focus:border-cyan-400 focus:outline-none cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleNext}
          aria-label="Next month"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      ) : error ? (
        <div className="glass-panel p-6 rounded-2xl text-center space-y-2 border border-rose-500/20">
          <p className="text-sm font-bold text-white">Database Query Error</p>
          <p className="text-xs text-slate-400">{error}</p>
        </div>
      ) : !data ? (
        <div className="glass-panel p-8 rounded-2xl text-center text-slate-400">
          No data available for this month.
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Avg Completion */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Avg Completion
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-white">
                  {data.kpis.avg_completion_pct}%
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] mt-2 font-medium">
                {data.comparison_prev_month.diff_avg_completion_pct >= 0 ? (
                  <span className="text-emerald-400 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-0.5" /> +
                    {data.comparison_prev_month.diff_avg_completion_pct}%
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-0.5" />
                    {data.comparison_prev_month.diff_avg_completion_pct}%
                  </span>
                )}
                <span className="text-slate-500">vs prev mo</span>
              </div>
            </div>

            {/* Total Steps */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Steps
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-cyan-300">
                  {Number(data.kpis.total_steps).toLocaleString()}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                ~{Number(data.kpis.avg_steps).toLocaleString()} / day
              </span>
            </div>

            {/* Workout Minutes */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Workout
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-amber-300">
                  {data.kpis.workout_minutes}
                </span>
                <span className="text-xs text-slate-400">mins</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                {Math.round(data.kpis.workout_minutes / 60)} hrs total
              </span>
            </div>

            {/* Instagram Posts & Longest Streak */}
            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Longest Streak
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-extrabold text-violet-400">
                  {data.kpis.longest_streak}
                </span>
                <span className="text-xs text-slate-400">days</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block flex items-center gap-1">
                <Share2 className="w-3 h-3 text-pink-400" />
                {data.kpis.instagram_posts} IG posts
              </span>
            </div>
          </div>

          {/* Daily Completion Sparkline / Bar Graph */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Daily Completion Trend</h3>
                <p className="text-xs text-slate-400">Progress across all days in {MONTH_NAMES[month - 1]}</p>
              </div>
              <span className="text-xs text-cyan-400 font-medium">100% Target</span>
            </div>

            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-16 gap-1 items-end h-36 pt-4 border-b border-white/5">
              {data.daily_series.map((d) => (
                <div key={d.date} className="flex flex-col items-center h-full justify-end group">
                  <div
                    title={`${d.day_label}: ${d.completion_pct}%`}
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      d.completion_pct >= 100
                        ? 'bg-gradient-to-t from-royal-600 to-cyan-400'
                        : d.completion_pct > 0
                        ? 'bg-royal-700/60'
                        : 'bg-slate-800/40'
                    }`}
                    style={{ height: `${Math.max(6, d.completion_pct)}%` }}
                  />
                  <span className="text-[9px] text-slate-500 mt-1">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Activity Completion Breakdown */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Per-Activity Consistency Rate</h3>
            <div className="space-y-3">
              {data.activity_rates.map((act) => (
                <div key={act.activity_id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <IconRenderer name={act.icon} className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="font-medium text-slate-200">{act.name}</span>
                    </div>
                    <span className="font-bold text-cyan-300">{act.completion_rate}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-royal-600 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.min(100, act.completion_rate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best vs Weakest Day Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Best Day
                </span>
                <span className="text-sm font-bold text-white">
                  {data.kpis.best_day?.date || 'N/A'}
                </span>
                <p className="text-xs text-slate-400">
                  {data.kpis.best_day?.completion_pct ?? 0}% overall score
                </p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Weakest Day
                </span>
                <span className="text-sm font-bold text-white">
                  {data.kpis.weakest_day?.date || 'N/A'}
                </span>
                <p className="text-xs text-slate-400">
                  {data.kpis.weakest_day?.completion_pct ?? 0}% overall score
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
