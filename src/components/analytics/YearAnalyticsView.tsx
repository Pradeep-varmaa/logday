'use client';

import React, { useState, useEffect } from 'react';
import { YearAnalyticsData } from '@/types/activity';
import { Skeleton } from '@/components/ui/SkeletonCard';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { Trophy, ChevronLeft, ChevronRight, Activity, Footprints, Flame } from 'lucide-react';

interface YearAnalyticsViewProps {
  initialYear: number;
  onYearChange: (year: number) => void;
}

export const YearAnalyticsView: React.FC<YearAnalyticsViewProps> = ({
  initialYear,
  onYearChange,
}) => {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<YearAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    fetch(`/api/analytics/year?y=${year}`)
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
        console.error('Error fetching year analytics:', err);
        if (!ignore) {
          setError(err.message || 'Database query failed');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [year]);

  const handlePrev = () => {
    const nextY = year - 1;
    setYear(nextY);
    onYearChange(nextY);
  };

  const handleNext = () => {
    const nextY = year + 1;
    setYear(nextY);
    onYearChange(nextY);
  };

  const getHeatmapColor = (pct: number) => {
    if (pct >= 100) return 'bg-cyan-400';
    if (pct >= 70) return 'bg-royal-500';
    if (pct >= 40) return 'bg-royal-800';
    if (pct > 0) return 'bg-slate-800';
    return 'bg-slate-900/60';
  };

  return (
    <div className="space-y-6">
      {/* Year Selector */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl border border-white/5">
        <button
          onClick={handlePrev}
          aria-label="Previous year"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <span className="text-base font-extrabold text-white tracking-wide">{year} Overview</span>

        <button
          onClick={handleNext}
          aria-label="Next year"
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
          No data available for {year}.
        </div>
      ) : (
        <>
          {/* Yearly KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Yearly Average
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-white">
                  {data.kpis.yearly_avg_completion_pct}%
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                Across {data.kpis.active_days} active days
              </span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Steps
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-cyan-300">
                  {(Number(data.kpis.total_steps) / 1000000).toFixed(2)}M
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                {Number(data.kpis.total_steps).toLocaleString()} total
              </span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Workout Total
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-extrabold text-amber-300">
                  {Math.round(data.kpis.total_workout_minutes / 60)}
                </span>
                <span className="text-xs text-slate-400">hrs</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                {data.kpis.total_workout_minutes} mins
              </span>
            </div>

            <div className="glass-panel p-4 rounded-2xl border border-white/5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Best Month
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-extrabold text-violet-400 truncate">
                  {data.kpis.best_month?.month_name || 'N/A'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 mt-2 block">
                {data.kpis.best_month?.avg_completion_pct}% completion
              </span>
            </div>
          </div>

          {/* GitHub-style 365-Day Heatmap */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Annual Activity Heatmap</h3>
                <p className="text-xs text-slate-400">365-day visual streak map for {year}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>0%</span>
                <div className="w-2.5 h-2.5 rounded-sm bg-slate-900 border border-slate-800" />
                <div className="w-2.5 h-2.5 rounded-sm bg-royal-800" />
                <div className="w-2.5 h-2.5 rounded-sm bg-royal-500" />
                <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                <span>100%</span>
              </div>
            </div>

            {/* Horizontal scrollable calendar grid */}
            <div className="overflow-x-auto pb-2 pt-1">
              <div
                className="grid grid-rows-7 grid-flow-col gap-1 min-w-[700px]"
                style={{ height: '110px' }}
              >
                {data.heatmap_365.map((d) => (
                  <div
                    key={d.date}
                    title={`${d.date}: ${d.completion_pct}% completion`}
                    className={`w-3 h-3 rounded-[3px] transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(
                      d.completion_pct
                    )}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 12-Month Bar Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <h3 className="text-sm font-semibold text-slate-100 mb-1">Month-by-Month Completion</h3>
            <p className="text-xs text-slate-400 mb-4">Average daily goal completion % per month</p>

            <div className="grid grid-cols-12 gap-1.5 items-end h-40 pt-4 border-b border-white/5">
              {data.months_series.map((m) => (
                <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-semibold">
                    {Math.round(m.avg_completion_pct)}%
                  </span>

                  <div className="w-full rounded-t-lg bg-slate-800/40 p-0.5 h-32 flex items-end">
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-royal-600 to-cyan-400 transition-all duration-500"
                      style={{ height: `${Math.max(8, m.avg_completion_pct)}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                    {m.month_name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-Activity Yearly Rates */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Annual Goal Completion Rates</h3>
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
        </>
      )}
    </div>
  );
};
