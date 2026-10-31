'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckCircle2, Calendar, BarChart3, Settings, LogOut } from 'lucide-react';
import { SyncBadge } from '@/components/ui/SyncBadge';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Today', href: '/today', icon: CheckCircle2 },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export const DesktopSidebar: React.FC = () => {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-white/5 h-screen sticky top-0 shrink-0 z-30 p-5 justify-between">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <BrandLogo size="md" />
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              DayLog
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                PWA
              </span>
            </h1>
            <p className="text-xs text-slate-400">Daily Activity Tracker</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5" aria-label="Desktop Navigation">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
            const Icon = item.icon;

            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-royal-600/30 to-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-glow-cyan font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      {/* Footer info & Logout */}
      <div className="space-y-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-slate-400">Sync Status</span>
          <SyncBadge />
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Lock / Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
