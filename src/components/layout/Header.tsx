'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SyncBadge } from '@/components/ui/SyncBadge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Sun, Moon, Calendar as CalendarIcon } from 'lucide-react';

export const Header: React.FC = () => {
  const { selectedDate, setSelectedDate, theme, toggleTheme } = useAppStore();
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const formattedDate = React.useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/5 px-4 sm:px-6 py-3.5 backdrop-blur-xl">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand & Greeting */}
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandLogo size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-white">DayLog</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{greeting}</p>
          </div>
        </div>

        {/* Right: Date selector, Sync Badge, Theme toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              title="Change active date"
            />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-800/80 border border-slate-700/50 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors">
              <CalendarIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
          </div>

          <SyncBadge />

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 transition-all cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
