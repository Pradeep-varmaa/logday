import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();

    // 1. Total steps & perfect days from daily_summary
    const summaryRows = await sql`
      SELECT 
        COALESCE(SUM(steps_total), 0)::bigint as total_steps,
        COALESCE(COUNT(CASE WHEN completion_pct >= 100 THEN 1 END), 0)::int as perfect_days,
        COALESCE(COUNT(CASE WHEN completion_pct > 0 THEN 1 END), 0)::int as active_days
      FROM daily_summary
    `;

    // 2. Total habit checkoffs from activity_logs
    const logRows = await sql`
      SELECT 
        COALESCE(COUNT(CASE WHEN is_completed = TRUE THEN 1 END), 0)::int as total_completions
      FROM activity_logs
    `;

    // 3. Total workout minutes
    const workoutRows = await sql`
      SELECT 
        COALESCE(SUM(l.value), 0)::numeric as total_workout_minutes
      FROM activity_logs l
      JOIN activities a ON a.id = l.activity_id
      WHERE a.type = 'duration' AND a.name ILIKE '%workout%'
    `;

    // 4. Total water liters
    const waterRows = await sql`
      SELECT 
        COALESCE(SUM(l.value), 0)::numeric as total_water_liters
      FROM activity_logs l
      JOIN activities a ON a.id = l.activity_id
      WHERE a.name ILIKE '%water%'
    `;

    const totalSteps = Number(summaryRows[0]?.total_steps || 0);
    const totalKm = Math.round(totalSteps * 0.000762 * 10) / 10;
    const totalWorkoutMinutes = Number(workoutRows[0]?.total_workout_minutes || 0);
    const totalWorkoutHours = Math.round((totalWorkoutMinutes / 60) * 10) / 10;
    const totalWaterLiters = Math.round(Number(waterRows[0]?.total_water_liters || 0) * 10) / 10;

    return NextResponse.json({
      totalSteps,
      totalKm,
      totalWorkoutMinutes,
      totalWorkoutHours,
      totalWaterLiters,
      perfectDays: Number(summaryRows[0]?.perfect_days || 0),
      activeDays: Number(summaryRows[0]?.active_days || 0),
      totalCompletions: Number(logRows[0]?.total_completions || 0),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
