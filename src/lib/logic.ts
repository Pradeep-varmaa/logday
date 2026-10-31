import { Activity, ActivityLog, DailySummary } from '@/types/activity';

/**
 * Pure calculation logic for daily completion percentage and counts
 */
export function calculateDailyCompletion(
  activities: Activity[],
  logs: ActivityLog[]
): {
  completion_pct: number;
  completed_count: number;
  total_count: number;
  is_streak_day: boolean;
} {
  const activeActivities = activities.filter((a) => a.is_active);
  const total_count = activeActivities.length;

  if (total_count === 0) {
    return {
      completion_pct: 0,
      completed_count: 0,
      total_count: 0,
      is_streak_day: false,
    };
  }

  let completed_count = 0;
  let total_pct_sum = 0;

  for (const act of activeActivities) {
    const log = logs.find((l) => l.activity_id === act.id);
    const val = log?.value ?? 0;
    const isCompleted = act.type === 'check' ? val >= 1 : val >= act.daily_target;

    if (isCompleted) {
      completed_count += 1;
    }

    let actPct = 0;
    if (act.type === 'check') {
      actPct = val >= 1 ? 100 : 0;
    } else {
      if (act.daily_target <= 0) {
        actPct = isCompleted ? 100 : 0;
      } else {
        actPct = Math.min(100, (val / act.daily_target) * 100);
      }
    }

    total_pct_sum += actPct;
  }

  const completion_pct = Math.round((total_pct_sum / total_count) * 100) / 100;
  const is_streak_day = completion_pct >= 100;

  return {
    completion_pct,
    completed_count,
    total_count,
    is_streak_day,
  };
}

/**
 * Pure gaps-and-islands calculation for streaks
 */
export function calculateStreaks(
  summaries: Array<{ log_date: string; is_streak_day: boolean }>,
  asOfDate: string
): { current_streak: number; best_streak: number } {
  // Filter only streak days and sort by date ascending
  const streakDays = summaries
    .filter((s) => s.is_streak_day)
    .map((s) => s.log_date)
    .sort();

  if (streakDays.length === 0) {
    return { current_streak: 0, best_streak: 0 };
  }

  // Gaps-and-islands: consecutive dates grouping
  const islands: string[][] = [];
  let currentIsland: string[] = [];

  for (let i = 0; i < streakDays.length; i++) {
    const dStr = streakDays[i];
    if (currentIsland.length === 0) {
      currentIsland.push(dStr);
    } else {
      const prevDate = new Date(currentIsland[currentIsland.length - 1] + 'T00:00:00Z');
      const currDate = new Date(dStr + 'T00:00:00Z');
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentIsland.push(dStr);
      } else if (diffDays > 1) {
        islands.push(currentIsland);
        currentIsland = [dStr];
      }
    }
  }

  if (currentIsland.length > 0) {
    islands.push(currentIsland);
  }

  let bestStreak = 0;
  for (const island of islands) {
    if (island.length > bestStreak) {
      bestStreak = island.length;
    }
  }

  // Current streak requires the latest island to include asOfDate OR (asOfDate - 1 day)
  let currentStreak = 0;
  const asOf = new Date(asOfDate + 'T00:00:00Z');
  const yesterday = new Date(asOf);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const lastIsland = islands[islands.length - 1];
  if (lastIsland) {
    const lastDate = lastIsland[lastIsland.length - 1];
    if (lastDate === asOfDate || lastDate === yesterdayStr) {
      currentStreak = lastIsland.length;
    }
  }

  return {
    current_streak: currentStreak,
    best_streak: Math.max(bestStreak, currentStreak),
  };
}
