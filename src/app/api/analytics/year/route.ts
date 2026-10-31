import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { dbGetYearAnalytics } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const yearParam = searchParams.get('y');
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

  if (isNaN(year)) {
    return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
  }

  try {
    const data = await dbGetYearAnalytics(year);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Error fetching yearly analytics:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
