'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MonthAnalyticsView } from '@/components/analytics/MonthAnalyticsView';
import { YearAnalyticsView } from '@/components/analytics/YearAnalyticsView';
import AnalyticsLoading from './loading';

function AnalyticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dynamically resolve real-time date
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  // Read URL query params
  const viewParam = searchParams.get('view') === 'year' ? 'year' : 'month';
  const yearParam = searchParams.get('y') ? parseInt(searchParams.get('y')!, 10) : defaultYear;
  const monthParam = searchParams.get('m') ? parseInt(searchParams.get('m')!, 10) : defaultMonth;

  const [activeView, setActiveView] = useState<'month' | 'year'>(viewParam);
  const [selectedYear, setSelectedYear] = useState(yearParam);
  const [selectedMonth, setSelectedMonth] = useState(monthParam);

  const updateUrl = (view: 'month' | 'year', y: number, m: number) => {
    const params = new URLSearchParams();
    params.set('view', view);
    params.set('y', String(y));
    if (view === 'month') {
      params.set('m', String(m));
    }
    router.replace(`/analytics?${params.toString()}`);
  };

  const handleToggleView = (view: 'month' | 'year') => {
    setActiveView(view);
    updateUrl(view, selectedYear, selectedMonth);
  };

  const handleMonthDateChange = (y: number, m: number) => {
    setSelectedYear(y);
    setSelectedMonth(m);
    updateUrl('month', y, m);
  };

  const handleYearChange = (y: number) => {
    setSelectedYear(y);
    updateUrl('year', y, selectedMonth);
  };

  return (
    <div className="space-y-6">
      {/* Top Toggle: Monthly | Yearly */}
      <div className="flex justify-center">
        <div className="p-1 glass-panel rounded-2xl border border-white/5 inline-flex items-center gap-1 shadow-glass">
          <button
            onClick={() => handleToggleView('month')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'month'
                ? 'bg-gradient-to-r from-royal-600 to-cyan-400 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Monthly View
          </button>
          <button
            onClick={() => handleToggleView('year')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeView === 'year'
                ? 'bg-gradient-to-r from-royal-600 to-cyan-400 text-slate-950 shadow-glow-cyan'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Yearly View
          </button>
        </div>
      </div>

      {activeView === 'month' ? (
        <MonthAnalyticsView
          key={`month-${selectedYear}-${selectedMonth}`}
          initialYear={selectedYear}
          initialMonth={selectedMonth}
          onDateChange={handleMonthDateChange}
        />
      ) : (
        <YearAnalyticsView
          key={`year-${selectedYear}`}
          initialYear={selectedYear}
          onYearChange={handleYearChange}
        />
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}
