'use strict';
// ============================================================
//  Booking Reference Generator
//  Format: BK + base36(timestamp) + random5 = ~14 chars
//  e.g.  BKLRGX4A2F9P7
// ============================================================
const db = require('../db');

/**
 * Generate a unique booking reference.
 * Retries up to 5 times on collision (extremely rare).
 */
async function generateBookingRef(retries = 5) {
  for (let i = 0; i < retries; i++) {
    const ref = 'BK'
      + Date.now().toString(36).toUpperCase()
      + Math.random().toString(36).slice(2, 7).toUpperCase();

    // Check uniqueness in DB
    const { rows } = await db.query(
      'SELECT 1 FROM bookings WHERE booking_ref = $1', [ref]
    );
    if (rows.length === 0) return ref;
  }
  throw new Error('Could not generate unique booking reference after retries');
}

/**
 * Generate a session ID for grouping stress-test bookings
 */
function generateSessionId() {
  return 'SID-' + Date.now().toString(36).toUpperCase()
       + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

module.exports = { generateBookingRef, generateSessionId };

