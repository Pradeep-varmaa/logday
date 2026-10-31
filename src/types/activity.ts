export type ActivityType = 'check' | 'number' | 'duration';

export interface Activity {
  id: string;
  name: string;
  icon: string;
  type: ActivityType;
  unit: string;
  daily_target: number;
  sort_order: number;
  is_active: boolean;
  reminder_time?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ActivityLog {
  id?: string;
  activity_id: string;
  log_date: string; // YYYY-MM-DD
  value: number;
  is_completed: boolean;
  note?: string | null;
  link?: string | null;
  updated_at?: string;
}

export interface ActivityWithLog extends Activity {
  value: number;
  is_completed: boolean;
  note?: string | null;
  link?: string | null;
  progress_pct: number;
}

export interface DailySummary {
  log_date: string;
  completion_pct: number;
  completed_count: number;
  total_count: number;
  steps_total: number;
  is_streak_day: boolean;
  updated_at?: string;
}

export interface StreakInfo {
  current_streak: number;
  best_streak: number;
}

export interface DaySteps {
  date: string;
  day_name: string;
  steps: number;
  target: number;
  is_completed: boolean;
}

export interface MonthHeatmapDay {
  date: string;
  day_of_month: number;
  day_of_week: number;
  completion_pct: number;
  is_streak_day: boolean;
  steps_total: number;
  completed_count: number;
}

export interface DashboardData {
  date: string;
  activities: ActivityWithLog[];
  summary: DailySummary;
  streaks: StreakInfo;
  weekly_steps: DaySteps[];
  month_heatmap: MonthHeatmapDay[];
}

export interface MonthAnalyticsKPIs {
  avg_completion_pct: number;
  total_steps: number;
  avg_steps: number;
  workout_minutes: number;
  instagram_posts: number;
  longest_streak: number;
  best_day: { date: string; completion_pct: number } | null;
  weakest_day: { date: string; completion_pct: number } | null;
}

export interface MonthComparison {
  prev_avg_completion_pct: number;
  diff_avg_completion_pct: number;
  prev_total_steps: number;
  diff_total_steps: number;
  prev_workout_minutes: number;
  diff_workout_minutes: number;
  prev_instagram_posts: number;
  diff_instagram_posts: number;
}

export interface MonthDailySeriesItem {
  date: string;
  day: number;
  day_label: string;
  completion_pct: number;
  steps: number;
  is_streak_day: boolean;
}

export interface ActivityRateItem {
  activity_id: string;
  name: string;
  icon: string;
  unit: string;
  target?: number;
  completed_days: number;
  total_logged: number;
  completion_rate: number;
}

export interface MonthAnalyticsData {
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  kpis: MonthAnalyticsKPIs;
  comparison_prev_month: MonthComparison;
  daily_series: MonthDailySeriesItem[];
  activity_rates: ActivityRateItem[];
}

export interface YearMonthSeriesItem {
  month: number;
  month_name: string;
  avg_completion_pct: number;
  total_steps: number;
  active_days: number;
  streak_days: number;
}

export interface YearAnalyticsKPIs {
  yearly_avg_completion_pct: number;
  total_steps: number;
  total_workout_minutes: number;
  active_days: number;
  longest_streak: number;
  best_month: { month: number; month_name: string; avg_completion_pct: number } | null;
}

export interface YearHeatmapDay {
  date: string;
  month: number;
  day: number;
  day_of_week: number;
  completion_pct: number;
  is_streak_day: boolean;
  steps_total: number;
}

export interface YearAnalyticsData {
  year: number;
  kpis: YearAnalyticsKPIs;
  months_series: YearMonthSeriesItem[];
  activity_rates: ActivityRateItem[];
  heatmap_365: YearHeatmapDay[];
}

// Outbox item for offline synchronization
export interface OutboxItem {
  id?: number;
  action: 'UPSERT_LOG' | 'UPDATE_ACTIVITY' | 'CREATE_ACTIVITY';
  payload: any;
  timestamp: number;
  retryCount: number;
}
