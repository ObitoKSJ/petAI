import * as schema from './schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type AppDatabase = NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

function createDb(): AppDatabase {
  const provider = (process.env.CLOUD_PROVIDER ?? 'vercel').toLowerCase();

  if (provider === 'tencent') {
    // Standard PostgreSQL driver for TDSQL-C (or any standard PG host)
    const postgres = require('postgres');
    const { drizzle } = require('drizzle-orm/postgres-js');
    const client = postgres(process.env.POSTGRES_URL!);
    return drizzle(client, { schema }) as PostgresJsDatabase<typeof schema>;
  }

  // Default: Neon serverless HTTP driver for Vercel deployment
  const { neon } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-http');
  const sql = neon(process.env.POSTGRES_URL!);
  return drizzle(sql, { schema }) as NeonHttpDatabase<typeof schema>;
}

export const db = createDb();
