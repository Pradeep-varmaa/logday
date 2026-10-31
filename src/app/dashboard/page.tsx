'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardData, ActivityWithLog } from '@/types/activity';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { StreakCard } from '@/components/ui/StreakCard';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { WeeklyStepsBar } from '@/components/dashboard/WeeklyStepsBar';
import { MonthHeatmap } from '@/components/dashboard/MonthHeatmap';
import { WorkoutTimerModal } from '@/components/today/WorkoutTimerModal';
import { StepCounterModal } from '@/components/today/StepCounterModal';
import { LogDetailModal } from '@/components/today/LogDetailModal';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import DashboardLoading from './loading';
import { Sparkles, Calendar, PlusCircle } from 'lucide-react';

export default function DashboardPage() {
  const selectedDate = useAppStore((state) => state.selectedDate);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [timerModalActivity, setTimerModalActivity] = useState<ActivityWithLog | null>(null);
  const [stepsModalActivity, setStepsModalActivity] = useState<ActivityWithLog | null>(null);
  const [detailsModalActivity, setDetailsModalActivity] = useState<ActivityWithLog | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?date=${selectedDate}`);
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load database records');
      } else {
        setData(json);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard:', err);
      setError(err.message || 'Database network error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardLoading />;
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-3xl p-8 text-center space-y-4 border border-rose-500/20">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center font-bold">
          !
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Database Connection Required</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
            {error || 'Unable to connect to Neon PostgreSQL. Ensure DATABASE_URL is configured in .env.local and migrations have been executed.'}
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-royal-600 hover:bg-royal-500 text-white cursor-pointer"
        >
          Retry Database Query
        </button>
      </div>
    );
  }

  const completionPct = Number(data.summary?.completion_pct ?? 0);
  const completedCount = Number(data.summary?.completed_count ?? 0);
  const totalCount = Number(data.summary?.total_count ?? 0);

  return (
    <div className="space-y-6">
      <InstallPrompt />

      {/* Hero Card: Today's Completion Status */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-white/5 bg-gradient-to-br from-royal-950/40 via-navy-900/60 to-cyan-950/20 shadow-glass">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today&apos;s Progress</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {completionPct >= 100
                ? 'All goals achieved today!'
                : `${completedCount} of ${totalCount} completed`}
            </h2>
            <p className="text-xs text-slate-400">
              {completionPct >= 100
                ? 'Fantastic job keeping your momentum alive.'
                : 'Stay consistent. Check off your remaining daily targets.'}
            </p>
          </div>

          <div className="shrink-0">
            <ProgressRing
              progress={completionPct}
              size={110}
              strokeWidth={10}
              showPercentage={true}
              sublabel="Complete"
            />
          </div>
        </div>
      </div>

      {/* Gaps-and-Islands Streak Card */}
      <StreakCard streaks={data.streaks} />

      {/* Activities Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 tracking-tight">Today&apos;s Targets</h3>
          <span className="text-xs text-slate-400 font-medium">
            {completedCount}/{totalCount} Completed
          </span>
        </div>

        <div className="space-y-2.5">
          {data.activities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              date={selectedDate}
              onOpenTimer={(act) => setTimerModalActivity(act)}
              onOpenSteps={(act) => setStepsModalActivity(act)}
              onOpenDetails={(act) => setDetailsModalActivity(act)}
              onRefresh={fetchDashboard}
            />
          ))}
        </div>
      </div>

      {/* Weekly Steps Bar Chart */}
      {data.weekly_steps && data.weekly_steps.length > 0 && (
        <WeeklyStepsBar data={data.weekly_steps} />
      )}

      {/* Month Consistency Heatmap */}
      {data.month_heatmap && data.month_heatmap.length > 0 && (
        <MonthHeatmap days={data.month_heatmap} currentDate={selectedDate} />
      )}

      {/* Modals */}
      {timerModalActivity && (
        <WorkoutTimerModal
          isOpen={true}
          onClose={() => setTimerModalActivity(null)}
          date={selectedDate}
          activityId={timerModalActivity.id}
          activityName={timerModalActivity.name}
          targetMinutes={timerModalActivity.daily_target}
          onLogged={fetchDashboard}
        />
      )}

      {stepsModalActivity && (
        <StepCounterModal
          isOpen={true}
          onClose={() => setStepsModalActivity(null)}
          date={selectedDate}
          activityId={stepsModalActivity.id}
          currentSteps={stepsModalActivity.value}
          onLogged={fetchDashboard}
        />
      )}

      {detailsModalActivity && (
        <LogDetailModal
          isOpen={true}
          onClose={() => setDetailsModalActivity(null)}
          date={selectedDate}
          activity={detailsModalActivity}
          onSaved={fetchDashboard}
        />
      )}
    </div>
  );
}
