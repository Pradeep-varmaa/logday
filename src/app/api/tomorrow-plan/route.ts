import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { getDb } from '@/lib/db/client';

const PlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  tasks: z.array(z.string()).max(10),
  note: z.string().max(300).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 });
    }

    const sql = getDb();
    const key = `plan_${date}`;
    const rows = await sql`
      SELECT value FROM app_settings WHERE key = ${key}
    `;

    if (rows.length === 0) {
      return NextResponse.json({ plan: null });
    }

    try {
      const plan = JSON.parse(rows[0].value);
      return NextResponse.json({ plan });
    } catch {
      return NextResponse.json({ plan: null });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = PlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { date, tasks, note } = parsed.data;
    const sql = getDb();
    const key = `plan_${date}`;
    const planData = JSON.stringify({ date, tasks, note });

    await sql`
      INSERT INTO app_settings (key, value, description)
      VALUES (${key}, ${planData}, ${'Tomorrow focus plan for ' + date})
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true, plan: { date, tasks, note } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
