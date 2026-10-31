'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { DashboardData, ActivityWithLog } from '@/types/activity';
import { ActivityCard } from '@/components/dashboard/ActivityCard';
import { LogDetailModal } from '@/components/today/LogDetailModal';
import { WorkoutTimerModal } from '@/components/today/WorkoutTimerModal';
import { StepCounterModal } from '@/components/today/StepCounterModal';
import CalendarLoading from './loading';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function CalendarPage() {
  const { selectedDate, setSelectedDate } = useAppStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Month navigation state
  const [parts] = useState(() => selectedDate.split('-'));
  const [viewYear, setViewYear] = useState(() => parseInt(parts[0], 10));
  const [viewMonth, setViewMonth] = useState(() => parseInt(parts[1], 10));

  // Modals state
  const [timerModalActivity, setTimerModalActivity] = useState<ActivityWithLog | null>(null);
  const [stepsModalActivity, setStepsModalActivity] = useState<ActivityWithLog | null>(null);
  const [detailsModalActivity, setDetailsModalActivity] = useState<ActivityWithLog | null>(null);

  const fetchDayData = useCallback(async () => {
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
        setError(json.error || 'Failed to load entries from database');
      } else {
        setData(json);
      }
    } catch (err: any) {
      console.error('Error fetching calendar day data:', err);
      setError(err.message || 'Database network error');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchDayData();
  }, [fetchDayData]);

  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    setTodayStr(new Date().toISOString().split('T')[0]);
  }, []);

  const handlePrevMonth = () => {
    let nextY = viewYear;
    let nextM = viewMonth - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    setViewYear(nextY);
    setViewMonth(nextM);
  };

  const handleNextMonth = () => {
    let nextY = viewYear;
    let nextM = viewMonth + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setViewYear(nextY);
    setViewMonth(nextM);
  };

  if (loading) {
    return <CalendarLoading />;
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
          onClick={fetchDayData}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-royal-600 hover:bg-royal-500 text-white cursor-pointer"
        >
          Retry Database Query
        </button>
      </div>
    );
  }

  // Generate calendar days for viewMonth and viewYear
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 is Sun
  const leadingPad = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* Month Header Controller */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-white/5">
        <button
          onClick={handlePrevMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-base font-extrabold text-white">
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
        </div>

        <button
          onClick={handleNextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Month Calendar Grid */}
      <div className="glass-panel rounded-3xl p-5 border border-white/5 shadow-glass">
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {dayHeaders.map((dh) => (
            <span key={dh} className="text-xs font-semibold text-slate-400 py-1">
              {dh}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: leadingPad }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-transparent" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(
              dayNum
            ).padStart(2, '0')}`;
            const isSelected = dateStr === selectedDate;
            const isToday = Boolean(todayStr && dateStr === todayStr);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-tr from-royal-600 to-cyan-400 text-slate-950 font-black shadow-glow-cyan scale-105 z-10'
                    : isToday
                    ? 'border-2 border-cyan-400 text-white font-bold bg-cyan-950/30'
                    : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300 font-medium'
                }`}
              >
                <span className="text-sm">{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Entries for Selected Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Entries for {selectedDate}</h3>
            <p className="text-xs text-slate-400">Tap quick action to update this date&apos;s records</p>
          </div>
          <span className="text-xs text-cyan-400 font-semibold">
            {data.summary?.completion_pct ?? 0}% completed
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
              onRefresh={fetchDayData}
            />
          ))}
        </div>
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
          onLogged={fetchDayData}
        />
      )}

      {stepsModalActivity && (
        <StepCounterModal
          isOpen={true}
          onClose={() => setStepsModalActivity(null)}
          date={selectedDate}
          activityId={stepsModalActivity.id}
          currentSteps={stepsModalActivity.value}
          onLogged={fetchDayData}
        />
      )}

      {detailsModalActivity && (
        <LogDetailModal
          isOpen={true}
          onClose={() => setDetailsModalActivity(null)}
          date={selectedDate}
          activity={detailsModalActivity}
          onSaved={fetchDayData}
        />
      )}
    </div>
  );
}
