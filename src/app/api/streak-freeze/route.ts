import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT key, value FROM app_settings WHERE key IN ('streak_freeze_dates', 'streak_freeze_limit')
    `;

    let frozenDates: string[] = [];
    let freezeLimit = 2; // 2 freezes allowed per month

    for (const r of rows) {
      if (r.key === 'streak_freeze_dates') {
        try {
          frozenDates = JSON.parse(r.value);
        } catch (_) {}
      } else if (r.key === 'streak_freeze_limit') {
        freezeLimit = parseInt(r.value, 10) || 2;
      }
    }

    // Calculate freezes used this month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usedThisMonth = frozenDates.filter((d) => d.startsWith(currentMonth)).length;
    const available = Math.max(0, freezeLimit - usedThisMonth);

    const todayStr = new Date().toISOString().slice(0, 10);
    const isFrozenToday = frozenDates.includes(todayStr);

    return NextResponse.json({
      available,
      limit: freezeLimit,
      usedThisMonth,
      frozenDates,
      isFrozenToday,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

const FreezeSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  action: z.enum(['freeze', 'unfreeze']).default('freeze'),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = FreezeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { date, action } = parsed.data;
    const sql = getDb();

    // Fetch existing frozen dates
    const rows = await sql`
      SELECT value FROM app_settings WHERE key = 'streak_freeze_dates'
    `;

    let frozenDates: string[] = [];
    if (rows.length > 0) {
      try {
        frozenDates = JSON.parse(rows[0].value);
      } catch (_) {}
    }

    if (action === 'freeze') {
      if (!frozenDates.includes(date)) {
        frozenDates.push(date);
      }

      // Mark the day in daily_summary as a protected streak day
      await sql`
        INSERT INTO daily_summary (log_date, completion_pct, completed_count, total_count, steps_total, is_streak_day)
        VALUES (${date}::date, 100.0, 1, 1, 0, TRUE)
        ON CONFLICT (log_date) DO UPDATE SET
          is_streak_day = TRUE,
          updated_at = NOW()
      `;
    } else {
      // Unfreeze
      frozenDates = frozenDates.filter((d) => d !== date);

      // Re-evaluate daily summary for that date
      await sql`SELECT sp_refresh_daily_summary(${date}::date)`;
    }

    // Save updated dates to app_settings
    await sql`
      INSERT INTO app_settings (key, value, description)
      VALUES ('streak_freeze_dates', ${JSON.stringify(frozenDates)}, 'List of dates where streak freeze was used')
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;

    return NextResponse.json({
      success: true,
      frozenDates,
      isFrozen: action === 'freeze',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
