'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { DashboardData, ActivityWithLog } from '@/types/activity';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { WorkoutTimerModal } from '@/components/today/WorkoutTimerModal';
import { StepCounterModal } from '@/components/today/StepCounterModal';
import { LogDetailModal } from '@/components/today/LogDetailModal';
import TodayLoading from './loading';
import { CheckCircle2 } from 'lucide-react';

function TodayContent() {
  const searchParams = useSearchParams();
  const selectedDate = useAppStore((state) => state.selectedDate);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [timerModalActivity, setTimerModalActivity] = useState<ActivityWithLog | null>(null);
  const [stepsModalActivity, setStepsModalActivity] = useState<ActivityWithLog | null>(null);
  const [detailsModalActivity, setDetailsModalActivity] = useState<ActivityWithLog | null>(null);

  const fetchActivities = useCallback(async () => {
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
        setError(json.error || 'Failed to load activities from database');
      } else {
        setData(json);

        // Handle PWA shortcut actions from URL
        const action = searchParams.get('action');
        if (action === 'steps' && json.activities) {
          const stepsAct = json.activities.find(
            (a: any) => a.unit.toLowerCase() === 'steps' || a.name.toLowerCase().includes('step')
          );
          if (stepsAct) setStepsModalActivity(stepsAct);
        } else if (action === 'workout' && json.activities) {
          const workoutAct = json.activities.find((a: any) => a.type === 'duration');
          if (workoutAct) setTimerModalActivity(workoutAct);
        }
      }
    } catch (err: any) {
      console.error('Error fetching today data:', err);
      setError(err.message || 'Database network error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, searchParams]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  if (loading) {
    return <TodayLoading />;
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
            {error || 'Unable to connect to Neon PostgreSQL database.'}
          </p>
        </div>
        <button
          onClick={fetchActivities}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-royal-600 hover:bg-royal-500 text-white cursor-pointer"
        >
          Retry Database Query
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <span>Today&apos;s Checklist</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Quickly log your habits, track minutes, or check off daily milestones.
          </p>
        </div>

        <div className="text-right">
          <span className="text-sm font-bold text-cyan-300">
            {data.summary?.completed_count ?? 0} / {data.summary?.total_count ?? 0}
          </span>
          <p className="text-[10px] text-slate-400">Goals Done</p>
        </div>
      </div>

      {/* Full Activities List */}
      <div className="space-y-3">
        {data.activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            date={selectedDate}
            onOpenTimer={(act) => setTimerModalActivity(act)}
            onOpenSteps={(act) => setStepsModalActivity(act)}
            onOpenDetails={(act) => setDetailsModalActivity(act)}
            onRefresh={fetchActivities}
          />
        ))}
      </div>

      {/* Modals */}
      {timerModalActivity && (
        <WorkoutTimerModal
          isOpen={true}
          onClose={() => setTimerModalActivity(null)}
          date={selectedDate}
          activityId={timerModalActivity.id}
          activityName={timerModalActivity.name}
          targetMinutes={timerModalActivity.daily_target}
          onLogged={fetchActivities}
        />
      )}

      {stepsModalActivity && (
        <StepCounterModal
          isOpen={true}
          onClose={() => setStepsModalActivity(null)}
          date={selectedDate}
          activityId={stepsModalActivity.id}
          currentSteps={stepsModalActivity.value}
          onLogged={fetchActivities}
        />
      )}

      {detailsModalActivity && (
        <LogDetailModal
          isOpen={true}
          onClose={() => setDetailsModalActivity(null)}
          date={selectedDate}
          activity={detailsModalActivity}
          onSaved={fetchActivities}
        />
      )}
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<TodayLoading />}>
      <TodayContent />
    </Suspense>
  );
}
