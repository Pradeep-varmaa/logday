import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { dbGetDashboard } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get('date');

  const todayStr = dateParam || new Date().toISOString().split('T')[0];

  try {
    const dashboard = await dbGetDashboard(todayStr);
    return NextResponse.json(dashboard);
  } catch (err: any) {
    console.error('Error fetching dashboard:', err);
    return NextResponse.json({ error: err.message || 'Failed to load dashboard' }, { status: 500 });
  }
}
