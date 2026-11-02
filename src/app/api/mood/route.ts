import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';

const MoodSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  mood: z.string().max(30),
  reflection: z.string().max(500).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = MoodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { date, mood, reflection } = parsed.data;
    const sql = getDb();

    // Ensure daily_summary row exists or update it
    const rows = await sql`
      INSERT INTO daily_summary (log_date, completion_pct, completed_count, total_count, steps_total, is_streak_day, mood, reflection)
      VALUES (${date}::date, 0, 0, 0, 0, FALSE, ${mood}, ${reflection || null})
      ON CONFLICT (log_date) DO UPDATE SET
        mood = EXCLUDED.mood,
        reflection = EXCLUDED.reflection,
        updated_at = NOW()
      RETURNING log_date::text, mood, reflection
    `;

    return NextResponse.json({ success: true, summary: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
