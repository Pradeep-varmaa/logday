'use client';

import React, { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { ConfettiBurst } from '@/components/ui/ConfettiBurst';
import { TopProgressBar } from './TopProgressBar';
import { initSyncListeners } from '@/lib/storage/sync';
import { useAppStore } from '@/store/useAppStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const setTheme = useAppStore((state) => state.setTheme);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('daylog_theme') as 'dark' | 'light' | null;
      if (saved) {
        setTheme(saved);
      }
    } catch (_) {}
  }, [setTheme]);

  useEffect(() => {
    const cleanup = initSyncListeners();
    return cleanup;
  }, []);

  if (isLoginPage) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 app-container">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen flex app-container antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
      <Suspense fallback={null}>
        <TopProgressBar />
      </Suspense>
      <ConfettiBurst />

      {/* Desktop sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-8">
        <Header />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-5 pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

