import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { dbGetMonthAnalytics } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const yearParam = searchParams.get('y');
  const monthParam = searchParams.get('m');

  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
  }

  try {
    const data = await dbGetMonthAnalytics(year, month);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching monthly analytics:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
