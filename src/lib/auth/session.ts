import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'daylog_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET || 'fallback-daylog-jwt-secret-min-32-chars-long-123456';
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  authenticated: boolean;
  role: 'owner';
  issuedAt: number;
}

/**
 * Creates and signs a JWT session token
 */
export async function createSessionToken(): Promise<string> {
  const secret = getSecretKey();
  const token = await new SignJWT({ authenticated: true, role: 'owner' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  return token;
}

/**
 * Verifies a JWT session token string
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    if (payload.authenticated === true) {
      return {
        authenticated: true,
        role: 'owner',
        issuedAt: (payload.iat || 0) * 1000,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Server-side helper to verify current request session from cookies.
 * Throws or returns null if not authenticated.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

/**
 * Server-side helper to require authentication.
 * Throws an Error if unauthorized.
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session || !session.authenticated) {
    throw new Error('UNAUTHORIZED: Valid session cookie required');
  }
  return session;
}

/**
 * Helper to set session cookie on response
 */
export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: Math.floor(SESSION_DURATION / 1000),
  };
}
