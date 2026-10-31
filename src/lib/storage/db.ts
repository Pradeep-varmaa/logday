import Dexie, { type Table } from 'dexie';
import { Activity, ActivityLog, DailySummary, OutboxItem } from '@/types/activity';

export class DayLogOfflineDB extends Dexie {
  activities!: Table<Activity, string>;
  logs!: Table<ActivityLog, string>;
  dailySummary!: Table<DailySummary, string>;
  outbox!: Table<OutboxItem, number>;

  constructor() {
    super('DayLogOfflineDB');
    this.version(1).stores({
      activities: 'id, name, sort_order, is_active',
      logs: '++id, [activity_id+log_date], activity_id, log_date',
      dailySummary: 'log_date, is_streak_day',
      outbox: '++id, timestamp, action',
    });
  }
}

export const offlineDb = new DayLogOfflineDB();
