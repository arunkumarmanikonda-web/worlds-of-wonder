'use strict';
require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });

async function run() {
  console.log('\n================================================');
  console.log('  WOW — Database Migration Runner');
  console.log('================================================\n');
  console.log('  DATABASE_URL:', (process.env.DATABASE_URL||'NOT SET').replace(/:([^:@]+)@/,':****@'), '\n');

  // Connect
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query('SELECT current_database(), current_user');
    console.log('  Connected to:', rows[0].current_database, 'as', rows[0].current_user);
    client.release();
  } catch(e) {
    console.error('\n  CANNOT CONNECT:', e.message);
    if (e.message.includes('ECONNREFUSED'))
      console.error('\n  PostgreSQL not running.\n  Run: npm run setup-db  (after installing PostgreSQL)');
    else if (e.message.includes('password') || e.code==='28P01')
      console.error('\n  Wrong password. Run: npm run setup-db');
    else if (e.message.includes('does not exist') || e.code==='3D000')
      console.error('\n  Database missing. Run: npm run setup-db');
    else if (e.message.includes('role') && e.message.includes('does not exist'))
      console.error('\n  User not found. Run: npm run setup-db');
    await pool.end().catch(()=>{});
    process.exit(1);
  }

  // Run SQL files
  const dir   = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  console.log('\n  Found', files.length, 'migration file(s):\n');

  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    process.stdout.write('  Running ' + file + ' ... ');
    try {
      await pool.query(sql);
      console.log('OK');
    } catch(e) {
      console.log('FAILED');
      console.error('\n  Error in ' + file + ':');
      console.error('  Code   :', e.code);
      console.error('  Message:', e.message);
      if (e.detail)   console.error('  Detail :', e.detail);
      if (e.hint)     console.error('  Hint   :', e.hint);
      await pool.end().catch(()=>{});
      process.exit(1);
    }
  }

  console.log('\n  All migrations done!\n');
  await pool.end();
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });