import dotenv from 'dotenv';

const provider = process.env.CLOUD_PROVIDER ?? 'vercel';
dotenv.config({ path: provider === 'tencent' ? '.env.tencent.local' : '.env.vercel.local' });

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URL!,
  },
});
