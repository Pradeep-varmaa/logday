import { create } from 'zustand';

export type SyncStatus = 'synced' | 'syncing' | 'offline';

export interface ActiveTimerState {
  activityId: string;
  activityName: string;
  running: boolean;
  secondsElapsed: number;
  targetSeconds: number;
}

interface AppState {
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;

  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;

  activeTimer: ActiveTimerState | null;
  startTimer: (activityId: string, activityName: string, targetMinutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  tickTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;

  confettiCount: number;
  triggerConfetti: () => void;

  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
}

// Local calendar date helper
export function getLocalTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const useAppStore = create<AppState>((set, get) => ({
  syncStatus: 'synced',
  setSyncStatus: (syncStatus) => set({ syncStatus }),

  selectedDate: getLocalTodayString(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),

  activeTimer: null,
  startTimer: (activityId, activityName, targetMinutes) => {
    set({
      activeTimer: {
        activityId,
        activityName,
        running: true,
        secondsElapsed: 0,
        targetSeconds: targetMinutes * 60,
      },
    });
  },
  pauseTimer: () => {
    const cur = get().activeTimer;
    if (cur) set({ activeTimer: { ...cur, running: false } });
  },
  resumeTimer: () => {
    const cur = get().activeTimer;
    if (cur) set({ activeTimer: { ...cur, running: true } });
  },
  tickTimer: () => {
    const cur = get().activeTimer;
    if (cur && cur.running) {
      set({ activeTimer: { ...cur, secondsElapsed: cur.secondsElapsed + 1 } });
    }
  },
  stopTimer: () => set({ activeTimer: null }),
  resetTimer: () => {
    const cur = get().activeTimer;
    if (cur) set({ activeTimer: { ...cur, secondsElapsed: 0, running: false } });
  },

  confettiCount: 0,
  triggerConfetti: () => set((state) => ({ confettiCount: state.confettiCount + 1 })),

  theme: 'dark',
  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      try {
        localStorage.setItem('daylog_theme', theme);
      } catch (_) {}
    }
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
}));
