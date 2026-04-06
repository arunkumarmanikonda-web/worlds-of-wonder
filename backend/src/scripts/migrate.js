'use strict';
// ============================================================
//  Migration runner — reads all .sql files from /migrations
//  Run with: npm run migrate
// ============================================================
require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // runs in filename order: 001, 002, ...

  console.log(`Found ${files.length} migration file(s):\n`);

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql      = fs.readFileSync(filePath, 'utf8');
    console.log(`  ▶ Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(`  ✅ ${file} done\n`);
    } catch (e) {
      console.error(`  ❌ ${file} FAILED:`, e.message);
      process.exit(1);
    }
  }

  console.log('All migrations complete.');
  await pool.end();
}

runMigrations().catch(e => {
  console.error('Migration error:', e);
  process.exit(1);
});
