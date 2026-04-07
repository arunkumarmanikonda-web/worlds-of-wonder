'use strict';
require('dotenv').config();
const { Client } = require('pg');

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const db   = process.env.DB_NAME || 'wow_bookings';
const user = process.env.DB_USER || 'wow_user';
const pass = process.env.DB_PASS || 'wow_pass';

console.log('\n================================================');
console.log('  WOW — PostgreSQL Connection Test');
console.log('================================================\n');
console.log('  Host:', host + ':' + port);
console.log('  DB  :', db);
console.log('  User:', user + '\n');

async function run() {
  // Test 1
  console.log('  TEST 1: Connecting...');
  const c1 = new Client({ host, port, database:'postgres', user, password:pass, connectionTimeoutMillis:5000 });
  try {
    await c1.connect();
    const { rows } = await c1.query('SELECT version()');
    console.log('  OK  PostgreSQL is running');
    console.log('     ', rows[0].version.split(',')[0]);
    await c1.end();
  } catch(e) {
    console.error('  FAIL', e.message);
    if (e.message.includes('ECONNREFUSED'))
      console.error('\n  PostgreSQL not running.\n  Start it or install from: https://www.postgresql.org/download/windows/\n  Then run: npm run setup-db');
    else if (e.message.includes('password') || e.code==='28P01')
      console.error('\n  Wrong password. Run: npm run setup-db');
    else if (e.message.includes('role') && e.message.includes('does not exist'))
      console.error('\n  User "' + user + '" not found. Run: npm run setup-db');
    await c1.end().catch(()=>{});
    process.exit(1);
  }

  // Test 2
  console.log('\n  TEST 2: Connecting to "' + db + '"...');
  const c2 = new Client({ host, port, database:db, user, password:pass, connectionTimeoutMillis:5000 });
  try {
    await c2.connect();
    console.log('  OK  Database exists');
    await c2.end();
  } catch(e) {
    console.error('  FAIL', e.message);
    if (e.message.includes('does not exist') || e.code==='3D000')
      console.error('\n  Database "' + db + '" missing. Run: npm run setup-db');
    await c2.end().catch(()=>{});
    process.exit(1);
  }

  // Test 3
  console.log('\n  TEST 3: Checking tables...');
  const c3 = new Client({ host, port, database:db, user, password:pass });
  await c3.connect();
  const { rows } = await c3.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  if (!rows.length) {
    console.log('  NO TABLES yet. Run: npm run migrate');
  } else {
    console.log('  OK  ' + rows.length + ' tables found:');
    rows.forEach(r => console.log('      - ' + r.table_name));
  }
  await c3.end();

  console.log('\n================================================');
  if (!rows.length) {
    console.log('  Next: npm run migrate');
  } else {
    console.log('  All good! Run: npm run dev');
  }
  console.log('================================================\n');
}

run().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
