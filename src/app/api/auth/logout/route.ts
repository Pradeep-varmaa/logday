import { NextResponse } from 'next/server';
import { getSessionCookieOptions } from '@/lib/auth/session';

export async function POST() {
  const cookieOptions = getSessionCookieOptions();
  const response = NextResponse.json({ success: true, message: 'Logged out' });

  // Clear cookie
  response.cookies.set(cookieOptions.name, '', {
    ...cookieOptions,
    maxAge: 0,
  });

  return response;
}
