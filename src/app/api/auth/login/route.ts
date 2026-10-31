import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/auth/rate-limit';
import { createSessionToken, getSessionCookieOptions } from '@/lib/auth/session';

const LoginSchema = z.object({
  passcode: z.string().min(1, 'Passcode is required'),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed attempts. Please wait ${rateCheck.retryAfterSec}s before retrying.`,
          retryAfterSec: rateCheck.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid passcode format' }, { status: 400 });
    }

    const expectedPasscode = process.env.APP_PASSCODE || '2468';

    if (parsed.data.passcode !== expectedPasscode) {
      const failed = recordFailedAttempt(ip);
      return NextResponse.json(
        {
          error: failed.locked
            ? `Passcode incorrect. Too many attempts, locked for ${failed.retryAfterSec}s.`
            : `Incorrect passcode. ${failed.remainingAttempts} attempts remaining.`,
          remainingAttempts: failed.remainingAttempts,
        },
        { status: 401 }
      );
    }

    // Passcode correct - reset rate limits
    resetRateLimit(ip);

    // Generate JWT token
    const token = await createSessionToken();
    const cookieOptions = getSessionCookieOptions();

    const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });
    response.cookies.set(cookieOptions.name, token, cookieOptions);

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
