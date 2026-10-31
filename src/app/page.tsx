import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootPage() {
  const session = await getSession();

  if (!session || !session.authenticated) {
    redirect('/login');
  }

  redirect('/dashboard');
}
