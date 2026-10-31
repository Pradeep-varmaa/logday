import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { dbUpsertLog } from '@/lib/db/queries';

const UpsertLogSchema = z.object({
  activity_id: z.string().min(1, 'activity_id is required'),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'log_date must be YYYY-MM-DD'),
  value: z.number().min(0, 'Value cannot be negative'),
  note: z.string().nullable().optional(),
  link: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = UpsertLogSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { activity_id, log_date, value, note, link } = parsed.data;
    const result = await dbUpsertLog(activity_id, log_date, value, note, link);

    return NextResponse.json({ success: true, log: result });
  } catch (err: any) {
    console.error('Error in log upsert:', err);
    return NextResponse.json({ error: err.message || 'Failed to save log' }, { status: 500 });
  }
}
