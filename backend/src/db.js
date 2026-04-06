'use strict';
// ============================================================
//  PostgreSQL connection pool
//  Uses pg (node-postgres) — pool is shared across the app
// ============================================================
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Fallback to individual vars if DATABASE_URL not set
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'wow_bookings',
  user:     process.env.DB_USER     || 'wow_user',
  password: process.env.DB_PASS     || 'wow_pass',
  max:      parseInt(process.env.DB_POOL_MAX || '20', 10),
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

pool.on('error', (err) => {
  console.error('⚠ Unexpected PostgreSQL pool error:', err.message);
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    // console.debug('  pg: new client connected');
  }
});

module.exports = {
  // Simple query wrapper
  query: (text, params) => pool.query(text, params),

  // Transaction helper — auto commit/rollback
  transaction: async (fn) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  },

  pool
};
