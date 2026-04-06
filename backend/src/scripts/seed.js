'use strict';
// ============================================================
//  Seed script — inserts sample bookings for testing
//  Run with: npm run seed
// ============================================================
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PARKS = ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'];
const MODES = ['UPI','Card','Cash','NetBanking'];

function rand(lo, hi) { return Math.floor(Math.random()*(hi-lo+1))+lo; }
function uid() { return Math.random().toString(36).slice(2,7).toUpperCase(); }
function futureDate(days) {
  const d = new Date(Date.now() + days*86400000);
  return d.toISOString().slice(0,10);
}

async function seed() {
  console.log('Seeding sample bookings...');
  const client = await pool.connect();

  try {
    for (let i = 0; i < 50; i++) {
      const park    = PARKS[i % 3];
      const adults  = rand(1,4);
      const children= rand(0,2);
      const tickets = adults + children;
      const PRICES  = { WATER_DAY:1101, AMUSEMENT_DAY:1016, COMBO_DAY:1694 };
      const base    = PRICES[park] * adults + Math.round(PRICES[park]*0.69) * children;
      const gst     = Math.round(base * 0.18);
      const grand   = base + gst;

      await client.query(`
        INSERT INTO bookings (
          booking_ref, park, visit_date, adults, children, ticket_total,
          base_amount, gst_amount, cgst, sgst, grand_total,
          payment_mode, payment_status, booking_status,
          customer_name, customer_email, customer_mobile
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'paid','confirmed',$13,$14,$15)
        ON CONFLICT (booking_ref) DO NOTHING`,
        [
          'BK' + Date.now().toString(36).toUpperCase() + uid(),
          park, futureDate(rand(1,45)), adults, children, tickets,
          base, gst, Math.round(base*0.09), Math.round(base*0.09), grand,
          MODES[i%4],
          'Test User '+(i+1),
          `user${i+1}@test.com`,
          '9' + String(rand(100000000,999999999))
        ]
      );
    }
    console.log('✅ 50 sample bookings inserted.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });
