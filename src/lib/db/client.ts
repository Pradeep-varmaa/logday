import { neon } from '@neondatabase/serverless';

/**
 * Returns a Neon serverless PostgreSQL SQL executor instance.
 * All queries and stored procedures execute directly against the database.
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is missing. Please set your Neon pooled connection string in .env.local.');
  }
  return neon(url);
}
