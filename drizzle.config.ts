import dotenv from 'dotenv';

const provider = process.env.CLOUD_PROVIDER ?? 'vercel';
dotenv.config({ path: provider === 'tencent' ? '.env.tencent.local' : '.env.vercel.local' });

import { defineConfig } from 'drizzle-kit';

const dbCredentials = provider === 'tencent'
  ? {
      host:     process.env.TENCENT_PG_HOST!,
      port:     Number(process.env.TENCENT_PG_PORT ?? 5432),
      user:     process.env.TENCENT_PG_USER!,
      password: process.env.TENCENT_PG_PASSWORD!,
      database: process.env.TENCENT_PG_DATABASE ?? 'postgres',
      ssl:      false,
    }
  : { url: process.env.POSTGRES_URL! };

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials,
});
