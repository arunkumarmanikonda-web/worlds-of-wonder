'use strict';
require('dotenv').config();
const { Client } = require('pg');
const readline   = require('readline');

function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(r => rl.question(q, a => { rl.close(); r(a); }));
}

async function setupDb() {
  console.log('\n================================================');
  console.log('  WOW — PostgreSQL Database Setup');
  console.log('================================================\n');
  console.log('  Creates: Database wow_bookings  /  User wow_user\n');

  // Quick port check first
  const net = require('net');
  const isOpen = await new Promise(resolve => {
    const s = net.createConnection(5432, 'localhost');
    s.on('connect', () => { s.destroy(); resolve(true); });
    s.on('error',   () => { s.destroy(); resolve(false); });
    setTimeout(() => { s.destroy(); resolve(false); }, 3000);
  });

  if (!isOpen) {
    console.error('  ERROR: PostgreSQL is NOT running on port 5432!\n');
    console.error('  Install PostgreSQL first:');
    console.error('    https://www.postgresql.org/download/windows/\n');
    console.error('  After installing, run:  npm run setup-db\n');
    process.exit(1);
  }

  const pgPass = await ask('  Enter PostgreSQL superuser password\n  (the one you set during installation): ');

  const client = new Client({
    host: 'localhost', port: 5432, database: 'postgres',
    user: 'postgres', password: pgPass, connectionTimeoutMillis: 8000
  });

  try {
    await client.connect();
    console.log('\n  Connected as postgres superuser\n');

    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'wow_user') THEN
          CREATE USER wow_user WITH PASSWORD 'wow_pass';
        ELSE
          ALTER USER wow_user WITH PASSWORD 'wow_pass';
        END IF;
      END $$;`);
    console.log('  User wow_user ready (password: wow_pass)');

    const dbExists = await client.query("SELECT 1 FROM pg_database WHERE datname='wow_bookings'");
    if (!dbExists.rows.length) {
      await client.query('CREATE DATABASE wow_bookings OWNER wow_user');
      console.log('  Database wow_bookings CREATED');
    } else {
      console.log('  Database wow_bookings already exists');
    }

    await client.query('GRANT ALL PRIVILEGES ON DATABASE wow_bookings TO wow_user');
    await client.end();

    // Grant schema privileges (needed for PostgreSQL 15+)
    const c2 = new Client({ host:'localhost', port:5432, database:'wow_bookings', user:'postgres', password:pgPass });
    await c2.connect();
    await c2.query('GRANT ALL ON SCHEMA public TO wow_user');
    await c2.end();
    console.log('  Schema privileges granted\n');

    // Update .env
    const fs = require('fs'), path = require('path');
    const envPath = path.join(__dirname, '../../.env');
    if (fs.existsSync(envPath)) {
      let env = fs.readFileSync(envPath, 'utf8');
      if (!env.includes('DATABASE_URL=postgresql://wow_user')) {
        env = env.replace(/^DATABASE_URL=.*/m, 'DATABASE_URL=postgresql://wow_user:wow_pass@localhost:5432/wow_bookings');
        fs.writeFileSync(envPath, env);
        console.log('  .env DATABASE_URL updated');
      }
    }

    console.log('================================================');
    console.log('  DONE! Now run: npm run migrate');
    console.log('================================================\n');

  } catch(e) {
    console.error('\n  FAILED:', e.message);
    if (e.message.includes('password') || e.code === '28P01')
      console.error('  Wrong superuser password. Run this script again.\n');
    await client.end().catch(()=>{});
    process.exit(1);
  }
}

setupDb();
