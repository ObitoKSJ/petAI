import * as schema from './schema';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

type AppDatabase = NeonHttpDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

function createDb(): AppDatabase {
  const provider = (process.env.CLOUD_PROVIDER ?? 'vercel').toLowerCase();

  if (provider === 'tencent') {
    // Use individual params to avoid URL-encoding issues with special chars in passwords
    const postgres = require('postgres');
    const { drizzle } = require('drizzle-orm/postgres-js');
    const client = postgres({
      host:     process.env.TENCENT_PG_HOST!,
      port:     Number(process.env.TENCENT_PG_PORT ?? 5432),
      user:     process.env.TENCENT_PG_USER!,
      password: process.env.TENCENT_PG_PASSWORD!,
      database: process.env.TENCENT_PG_DATABASE ?? 'postgres',
      ssl:      false,
      max:      5, // limit pool size for serverless
    });
    return drizzle(client, { schema }) as PostgresJsDatabase<typeof schema>;
  }

  // Default: Neon serverless HTTP driver for Vercel deployment
  const { neon } = require('@neondatabase/serverless');
  const { drizzle } = require('drizzle-orm/neon-http');
  const sql = neon(process.env.POSTGRES_URL!);
  return drizzle(sql, { schema }) as NeonHttpDatabase<typeof schema>;
}

export const db = createDb();
