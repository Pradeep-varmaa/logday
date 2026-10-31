import { calculateDailyCompletion, calculateStreaks } from './logic';
import { Activity, ActivityLog } from '@/types/activity';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Test assertion failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ Passed: ${message}`);
}

console.log('--- Testing Daily Completion Logic ---');

const sampleActivities: Activity[] = [
  {
    id: 'act-1',
    name: 'Walk 10,000 steps',
    icon: 'Footprints',
    type: 'number',
    unit: 'steps',
    daily_target: 10000,
    sort_order: 1,
    is_active: true,
  },
  {
    id: 'act-2',
    name: 'Workout 15 minutes',
    icon: 'Flame',
    type: 'duration',
    unit: 'mins',
    daily_target: 15,
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'act-3',
    name: 'Instagram Post',
    icon: 'Share2',
    type: 'check',
    unit: '',
    daily_target: 1,
    sort_order: 3,
    is_active: true,
  },
];

// Test 1: Empty logs should return 0% completion and 0 completed count
const emptyLogs: ActivityLog[] = [];
const resEmpty = calculateDailyCompletion(sampleActivities, emptyLogs);
assert(resEmpty.completion_pct === 0, 'Empty logs completion_pct is 0');
assert(resEmpty.completed_count === 0, 'Empty logs completed_count is 0');
assert(resEmpty.is_streak_day === false, 'Empty logs is not streak day');

// Test 2: Partial progress
const partialLogs: ActivityLog[] = [
  { activity_id: 'act-1', log_date: '2026-11-01', value: 5000, is_completed: false }, // 50%
  { activity_id: 'act-2', log_date: '2026-11-01', value: 15, is_completed: true },    // 100%
  { activity_id: 'act-3', log_date: '2026-11-01', value: 0, is_completed: false },    // 0%
];
const resPartial = calculateDailyCompletion(sampleActivities, partialLogs);
// (50 + 100 + 0) / 3 = 50%
assert(resPartial.completion_pct === 50, 'Partial logs completion_pct is 50');
assert(resPartial.completed_count === 1, 'Partial logs completed_count is 1');
assert(resPartial.is_streak_day === false, 'Partial logs is not streak day');

// Test 3: Overachievement is capped at 100% per habit
const overLogs: ActivityLog[] = [
  { activity_id: 'act-1', log_date: '2026-11-01', value: 15000, is_completed: true }, // 150% capped to 100%
  { activity_id: 'act-2', log_date: '2026-11-01', value: 30, is_completed: true },    // 200% capped to 100%
  { activity_id: 'act-3', log_date: '2026-11-01', value: 1, is_completed: true },     // 100%
];
const resOver = calculateDailyCompletion(sampleActivities, overLogs);
assert(resOver.completion_pct === 100, 'Over logs completion_pct is capped at 100');
assert(resOver.completed_count === 3, 'Over logs completed_count is 3');
assert(resOver.is_streak_day === true, 'Over logs qualifies as streak day');

console.log('\n--- Testing Gaps-and-Islands Streak Logic ---');

// Test 4: Single island of 5 days leading up to today
const summaries1 = [
  { log_date: '2026-11-01', is_streak_day: true },
  { log_date: '2026-11-02', is_streak_day: true },
  { log_date: '2026-11-03', is_streak_day: true },
  { log_date: '2026-11-04', is_streak_day: true },
  { log_date: '2026-11-05', is_streak_day: true },
];
const streakRes1 = calculateStreaks(summaries1, '2026-11-05');
assert(streakRes1.current_streak === 5, 'Continuous 5 days yields current streak of 5');
assert(streakRes1.best_streak === 5, 'Best streak is 5');

// Test 5: Gap broken streak with older larger streak
const summaries2 = [
  // Island 1: 4 days
  { log_date: '2026-10-10', is_streak_day: true },
  { log_date: '2026-10-11', is_streak_day: true },
  { log_date: '2026-10-12', is_streak_day: true },
  { log_date: '2026-10-13', is_streak_day: true },
  // Gap on 10-14
  // Island 2: 2 days leading up to today (2026-10-16)
  { log_date: '2026-10-15', is_streak_day: true },
  { log_date: '2026-10-16', is_streak_day: true },
];
const streakRes2 = calculateStreaks(summaries2, '2026-10-16');
assert(streakRes2.current_streak === 2, 'Current streak resets to 2 after gap');
assert(streakRes2.best_streak === 4, 'Best streak retains historical high of 4');

// Test 6: Streak preserved if yesterday was completed but today not logged yet
const streakRes3 = calculateStreaks(summaries2, '2026-10-17');
assert(streakRes3.current_streak === 2, 'Current streak remains active during today before midnight');

console.log('\n🎉 All unit tests executed and passed successfully!\n');
