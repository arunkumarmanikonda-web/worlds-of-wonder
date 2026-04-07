'use strict';
// ============================================================
//  WOW Annual Passport Route
//  POST /api/passport            — issue a new passport
//  GET  /api/passport/:id        — fetch passport details
//  POST /api/passport/:id/redeem — record an entry redemption
//  GET  /api/passport/:id/history— redemption history
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const PASSPORT_PLANS = {
  WATER_ANNUAL:    { label: 'Water Annual',    price: 3999, park: 'WATER_DAY',     maxEntries: 365 },
  AMUSEMENT_ANNUAL:{ label: 'Amusement Annual',price: 3499, park: 'AMUSEMENT_DAY', maxEntries: 365 },
  COMBO_ANNUAL:    { label: 'WOW Passport',    price: 4999, park: 'COMBO_DAY',     maxEntries: 365 }
};

// ── POST /api/passport — Issue passport ──────────────────────
router.post('/', requireAuth, async (req, res) => {
  const { plan_code, holder_name, dob, contact, email, payment_ref } = req.body;

  if (!PASSPORT_PLANS[plan_code]) {
    return res.status(400).json({
      error: 'Invalid plan_code',
      valid: Object.keys(PASSPORT_PLANS)
    });
  }

  const plan = PASSPORT_PLANS[plan_code];
  const passportId = 'PAS' + Date.now().toString(36).toUpperCase()
                   + Math.random().toString(36).slice(2,6).toUpperCase();

  const validFrom = new Date();
  const validTo   = new Date(validFrom.getTime() + 365 * 86400000);

  try {
    const { rows } = await db.query(`
      INSERT INTO passport_holders (
        passport_id, plan_code, plan_label, holder_name, dob,
        contact, email, park_access, max_entries, entries_used,
        valid_from, valid_to, amount_paid, payment_ref, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,0,$10,$11,$12,$13,'active')
      RETURNING *`,
      [
        passportId, plan_code, plan.label, holder_name, dob||null,
        contact||null, email||null, plan.park, plan.maxEntries,
        validFrom.toISOString().slice(0,10),
        validTo.toISOString().slice(0,10),
        plan.price, payment_ref||null
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Passport issue error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// ── GET /api/passport/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM passport_holders WHERE passport_id=$1', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Passport not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/passport/:id/redeem — Gate scanner ─────────────
router.post('/:id/redeem',
  requireAuth,
  requireRole('gate','admin','super_admin'),
  async (req, res) => {
    const { gate_id, notes } = req.body;

    try {
      const result = await db.transaction(async (client) => {
        const { rows } = await client.query(
          'SELECT * FROM passport_holders WHERE passport_id=$1 FOR UPDATE',
          [req.params.id]
        );
        if (!rows.length) throw Object.assign(new Error('Passport not found'), { status: 404 });

        const p = rows[0];
        const today = new Date().toISOString().slice(0,10);

        if (p.status !== 'active') {
          throw Object.assign(new Error(`Passport is ${p.status}`), { status: 400 });
        }
        if (today < p.valid_from || today > p.valid_to) {
          throw Object.assign(new Error('Passport is outside validity period'), { status: 400 });
        }
        if (p.entries_used >= p.max_entries) {
          throw Object.assign(new Error('Maximum entries exhausted'), { status: 400 });
        }

        // Check if already redeemed today
        const { rows: todayRows } = await client.query(
          `SELECT 1 FROM passport_redemptions
           WHERE passport_id=$1 AND DATE(redeemed_at)=$2`,
          [req.params.id, today]
        );
        if (todayRows.length) {
          throw Object.assign(new Error('Already redeemed today'), { status: 400 });
        }

        await client.query(
          'UPDATE passport_holders SET entries_used=entries_used+1 WHERE passport_id=$1',
          [req.params.id]
        );

        const { rows: redemption } = await client.query(`
          INSERT INTO passport_redemptions (passport_id, gate_id, notes)
          VALUES ($1,$2,$3) RETURNING *`,
          [req.params.id, gate_id||null, notes||null]
        );

        return { passport: { ...p, entries_used: p.entries_used + 1 }, redemption: redemption[0] };
      });

      res.json({ status: 'admitted', ...result });
    } catch (e) {
      if (e.status) return res.status(e.status).json({ error: e.message });
      console.error('Redemption error:', e);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// ── GET /api/passport/:id/history ───────────────────────────
router.get('/:id/history', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM passport_redemptions WHERE passport_id=$1 ORDER BY redeemed_at DESC',
      [req.params.id]
    );
    res.json({ passport_id: req.params.id, redemptions: rows });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;

