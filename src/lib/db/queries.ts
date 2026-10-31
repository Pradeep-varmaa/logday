import { getDb } from './client';
import {
  Activity,
  ActivityLog,
  DashboardData,
  MonthAnalyticsData,
  YearAnalyticsData,
} from '@/types/activity';

/**
 * Fetch all activities directly from the database
 */
export async function dbGetActivities(): Promise<Activity[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, name, icon, type, unit, daily_target::numeric as daily_target, 
           sort_order, is_active, reminder_time::text as reminder_time,
           created_at, updated_at
    FROM activities
    ORDER BY sort_order ASC, name ASC
  `;

  return rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    type: r.type,
    unit: r.unit || '',
    daily_target: Number(r.daily_target),
    sort_order: r.sort_order,
    is_active: r.is_active,
    reminder_time: r.reminder_time,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

/**
 * Update an activity directly in the database
 */
export async function dbUpdateActivity(activity: Activity): Promise<Activity> {
  const sql = getDb();
  const rows = await sql`
    UPDATE activities
    SET name = ${activity.name},
        icon = ${activity.icon},
        type = ${activity.type},
        unit = ${activity.unit},
        daily_target = ${activity.daily_target},
        sort_order = ${activity.sort_order},
        is_active = ${activity.is_active},
        reminder_time = ${activity.reminder_time ? activity.reminder_time : null}
    WHERE id = ${activity.id}
    RETURNING id, name, icon, type, unit, daily_target::numeric, sort_order, is_active, reminder_time::text
  `;

  if (!rows || rows.length === 0) {
    throw new Error(`Activity with id ${activity.id} not found in database`);
  }

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    type: r.type,
    unit: r.unit || '',
    daily_target: Number(r.daily_target),
    sort_order: r.sort_order,
    is_active: r.is_active,
    reminder_time: r.reminder_time,
  };
}

/**
 * Create a new activity directly in the database
 */
export async function dbCreateActivity(activity: Omit<Activity, 'id'>): Promise<Activity> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO activities (name, icon, type, unit, daily_target, sort_order, is_active, reminder_time)
    VALUES (${activity.name}, ${activity.icon}, ${activity.type}, ${activity.unit}, ${activity.daily_target}, ${activity.sort_order}, ${activity.is_active}, ${activity.reminder_time || null})
    RETURNING id, name, icon, type, unit, daily_target::numeric, sort_order, is_active, reminder_time::text
  `;

  const r = rows[0];
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    type: r.type,
    unit: r.unit || '',
    daily_target: Number(r.daily_target),
    sort_order: r.sort_order,
    is_active: r.is_active,
    reminder_time: r.reminder_time,
  };
}

/**
 * Delete an activity directly from the database
 */
export async function dbDeleteActivity(id: string): Promise<boolean> {
  const sql = getDb();
  await sql`
    DELETE FROM activities
    WHERE id = ${id}::uuid
  `;
  return true;
}

/**
 * Upsert an activity log using the PostgreSQL sp_upsert_activity_log procedure
 */
export async function dbUpsertLog(
  activityId: string,
  logDate: string,
  value: number,
  note?: string | null,
  link?: string | null
): Promise<ActivityLog> {
  const sql = getDb();
  const rows = await sql`
    SELECT sp_upsert_activity_log(
      ${activityId}::uuid,
      ${logDate}::date,
      ${value}::numeric,
      ${note || null}::text,
      ${link || null}::text
    ) as result
  `;

  return rows[0].result;
}

/**
 * Get full dashboard data directly from the PostgreSQL fn_get_dashboard procedure
 */
export async function dbGetDashboard(today: string): Promise<DashboardData> {
  const sql = getDb();
  const rows = await sql`
    SELECT fn_get_dashboard(${today}::date) as dashboard
  `;

  return rows[0].dashboard as DashboardData;
}

/**
 * Get monthly analytics directly from the PostgreSQL fn_get_month_analytics procedure
 */
export async function dbGetMonthAnalytics(year: number, month: number): Promise<MonthAnalyticsData> {
  const sql = getDb();
  const rows = await sql`
    SELECT fn_get_month_analytics(${year}::int, ${month}::int) as analytics
  `;

  return rows[0].analytics as MonthAnalyticsData;
}

/**
 * Get yearly analytics directly from the PostgreSQL fn_get_year_analytics procedure
 */
export async function dbGetYearAnalytics(year: number): Promise<YearAnalyticsData> {
  const sql = getDb();
  const rows = await sql`
    SELECT fn_get_year_analytics(${year}::int) as analytics
  `;

  return rows[0].analytics as YearAnalyticsData;
}

/**
 * Full database JSON export directly from Postgres tables
 */
export async function dbExportAll(): Promise<any> {
  const sql = getDb();
  const activities = await sql`SELECT * FROM activities ORDER BY sort_order ASC`;
  const logs = await sql`SELECT * FROM activity_logs ORDER BY log_date DESC`;
  const summary = await sql`SELECT * FROM daily_summary ORDER BY log_date DESC`;
  const settings = await sql`SELECT * FROM app_settings`;

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    activities,
    logs,
    summary,
    settings,
  };
}

/**
 * Full database JSON import directly into Postgres tables
 */
export async function dbImportAll(data: any): Promise<{ importedActivities: number; importedLogs: number }> {
  if (!data || !Array.isArray(data.activities)) {
    throw new Error('Invalid backup schema format');
  }

  const sql = getDb();
  let countActivities = 0;
  let countLogs = 0;

  for (const a of data.activities) {
    await sql`
      INSERT INTO activities (id, name, icon, type, unit, daily_target, sort_order, is_active, reminder_time)
      VALUES (${a.id}::uuid, ${a.name}, ${a.icon}, ${a.type}, ${a.unit || ''}, ${a.daily_target}, ${a.sort_order}, ${a.is_active}, ${a.reminder_time || null})
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        icon = EXCLUDED.icon,
        type = EXCLUDED.type,
        unit = EXCLUDED.unit,
        daily_target = EXCLUDED.daily_target,
        sort_order = EXCLUDED.sort_order,
        is_active = EXCLUDED.is_active,
        reminder_time = EXCLUDED.reminder_time
    `;
    countActivities++;
  }

  if (Array.isArray(data.logs)) {
    for (const l of data.logs) {
      await sql`
        SELECT sp_upsert_activity_log(
          ${l.activity_id}::uuid,
          ${l.log_date}::date,
          ${l.value}::numeric,
          ${l.note || null}::text,
          ${l.link || null}::text
        )
      `;
      countLogs++;
    }
  }

  return { importedActivities: countActivities, importedLogs: countLogs };
}
