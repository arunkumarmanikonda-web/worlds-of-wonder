'use strict';
// ============================================================
//  Calendar / Availability Route
//  GET /api/calendar/:park/:year/:month  — monthly availability
//  GET /api/calendar/:park/:date         — single date status
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');

const VALID_PARKS = ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'];

// ── GET /api/calendar/:park/:year/:month ─────────────────────
// Returns availability for each day of the month
router.get('/:park/:year/:month', async (req, res) => {
  const { park, year, month } = req.params;

  if (!VALID_PARKS.includes(park)) {
    return res.status(400).json({ error: `Invalid park. Use: ${VALID_PARKS.join(', ')}` });
  }

  const y = parseInt(year,  10);
  const m = parseInt(month, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    return res.status(400).json({ error: 'Invalid year or month' });
  }

  try {
    // Get blocked/special dates from DB
    const { rows: exceptions } = await db.query(`
      SELECT date, status, capacity_override, special_price, notes
      FROM calendar_exceptions
      WHERE park = $1
        AND EXTRACT(YEAR  FROM date) = $2
        AND EXTRACT(MONTH FROM date) = $3`,
      [park, y, m]
    );

    // Get booking counts per date (to estimate availability)
    const { rows: bookingCounts } = await db.query(`
      SELECT visit_date, SUM(ticket_total) AS total_tickets_booked
      FROM bookings
      WHERE park = $1
        AND EXTRACT(YEAR  FROM visit_date) = $2
        AND EXTRACT(MONTH FROM visit_date) = $3
        AND booking_status NOT IN ('cancelled','failed','refunded')
      GROUP BY visit_date`,
      [park, y, m]
    );

    const countMap = {};
    bookingCounts.forEach(r => {
      countMap[r.visit_date.toISOString().slice(0,10)] = parseInt(r.total_tickets_booked, 10);
    });

    const exMap = {};
    exceptions.forEach(e => {
      exMap[e.date.toISOString().slice(0,10)] = e;
    });

    // Build day-by-day response
    const daysInMonth = new Date(y, m, 0).getDate();
    const today       = new Date();
    today.setHours(0,0,0,0);
    const days = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dateObj = new Date(dateStr);

      let status   = 'open';
      let capacity = null;
      let price    = null;
      let notes    = null;

      if (dateObj < today) {
        status = 'past';
      } else if (exMap[dateStr]) {
        const ex = exMap[dateStr];
        status   = ex.status;
        capacity = ex.capacity_override;
        price    = ex.special_price;
        notes    = ex.notes;
      }

      // Check capacity (soft limit 2000 tickets/day default)
      const booked = countMap[dateStr] || 0;
      const cap    = capacity || 2000;
      if (status === 'open' && booked >= cap * 0.90) status = 'limited';
      if (status === 'open' && booked >= cap)        status = 'sold_out';

      days.push({
        date:        dateStr,
        status,
        tickets_booked: booked,
        capacity:    cap,
        special_price: price || null,
        notes:       notes || null
      });
    }

    res.json({
      park,
      year:  y,
      month: m,
      days
    });

  } catch (e) {
    console.error('Calendar error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// ── GET /api/calendar/:park/:date — Single date status ───────
router.get('/:park/:date', async (req, res) => {
  const { park, date } = req.params;

  if (!VALID_PARKS.includes(park)) {
    return res.status(400).json({ error: 'Invalid park' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Date must be YYYY-MM-DD' });
  }

  try {
    const { rows: ex } = await db.query(
      'SELECT * FROM calendar_exceptions WHERE park=$1 AND date=$2',
      [park, date]
    );

    const { rows: bc } = await db.query(`
      SELECT SUM(ticket_total) AS booked
      FROM bookings
      WHERE park=$1 AND visit_date=$2
        AND booking_status NOT IN ('cancelled','failed','refunded')`,
      [park, date]
    );

    const booked = parseInt(bc[0]?.booked || '0', 10);
    const cap    = ex[0]?.capacity_override || 2000;
    let status   = ex[0]?.status || 'open';
    if (status === 'open' && booked >= cap * 0.90) status = 'limited';
    if (status === 'open' && booked >= cap)        status = 'sold_out';

    res.json({ park, date, status, tickets_booked: booked, capacity: cap });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

