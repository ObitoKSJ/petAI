// Run with: npx dotenv-cli -e .env.tencent.local -- node scripts/migrate-tencent.js
const postgres = require('postgres');
const fs = require('fs');

const sql = postgres({
  host:     process.env.TENCENT_PG_HOST,
  port:     Number(process.env.TENCENT_PG_PORT ?? 5432),
  user:     process.env.TENCENT_PG_USER,
  password: process.env.TENCENT_PG_PASSWORD,
  database: process.env.TENCENT_PG_DATABASE ?? 'postgres',
  ssl:      false,
});

const migration = fs.readFileSync('drizzle/0000_silky_naoko.sql', 'utf8');
// Make CREATE TABLE idempotent
const safeSQL = migration.replace(/CREATE TABLE (?!IF NOT EXISTS)/g, 'CREATE TABLE IF NOT EXISTS ');
const statements = safeSQL.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

(async () => {
  for (const stmt of statements) {
    console.log('Running:', stmt.slice(0, 70) + '...');
    try {
      await sql.unsafe(stmt);
      console.log('  ✓');
    } catch (e) {
      // 42710 = duplicate_object (constraint already exists), 42P07 = duplicate_table
      if (e.code === '42710' || e.code === '42P07') {
        console.log('  ⚠ already exists, skipping');
      } else {
        throw e;
      }
    }
  }
  console.log('\nAll done — tables created.');
  await sql.end();
})().catch(e => {
  console.error('Migration failed:', e.message);
  process.exit(1);
});
