'use strict';
// ============================================================
//  Stress Test Data Routes — mirrors Tables REST API contract
//  so stress-test.html can point to THIS server instead
//
//  POST   /api/stress/bookings        — write one booking record
//  GET    /api/stress/bookings        — list with pagination
//  POST   /api/stress/runs            — create run metadata
//  PATCH  /api/stress/runs/:id        — update run with final stats
//  GET    /api/stress/runs            — list past runs
//  DELETE /api/stress/runs/:id        — delete a run + its bookings
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { stressRateLimit } = require('../middleware/rateLimit');

// ── POST /api/stress/bookings ─────────────────────────────────
router.post('/bookings', stressRateLimit, async (req, res) => {
  const b = req.body;
  if (!b.id) return res.status(400).json({ error: 'id is required' });

  try {
    const { rows } = await db.query(`
      INSERT INTO stress_bookings (
        id, session_id, run_label, booking_ref, park, visit_date,
        adults, children, ticket_total,
        base_amount, gst_amount, cgst, sgst, grand_total,
        offer_code, offer_discount, payment_mode,
        booking_status, step_reached, latency_ms, api_latency_ms,
        error_msg, concurrency_slot
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
      )
      ON CONFLICT (id) DO UPDATE SET
        booking_status = EXCLUDED.booking_status,
        latency_ms     = EXCLUDED.latency_ms,
        error_msg      = EXCLUDED.error_msg
      RETURNING *`,
      [
        b.id, b.session_id||null, b.run_label||null, b.booking_ref||null,
        b.park||null, b.visit_date||null,
        b.adults||0, b.children||0, b.ticket_total||0,
        b.base_amount||0, b.gst_amount||0, b.cgst||0, b.sgst||0, b.grand_total||0,
        b.offer_code||null, b.offer_discount||0, b.payment_mode||null,
        b.booking_status||'pending', b.step_reached||null,
        b.latency_ms||0, b.api_latency_ms||0,
        b.error_msg||null, b.concurrency_slot||0
      ]
    );
    return res.status(201).json(rows[0]);
  } catch (e) {
    console.error('Stress booking insert error:', e.message);
    return res.status(500).json({ error: 'Database error', detail: e.message });
  }
});

// ── GET /api/stress/bookings ──────────────────────────────────
router.get('/bookings', async (req, res) => {
  const page    = Math.max(1, parseInt(req.query.page  || '1', 10));
  const limit   = Math.min(2000, parseInt(req.query.limit || '100', 10));
  const offset  = (page - 1) * limit;
  const session = req.query.session_id;
  const run_label = req.query.run_label;

  const params   = [];
  const filters  = [];
  if (session) { params.push(session); filters.push(`session_id = $${params.length}`); }
  if (run_label){ params.push(run_label); filters.push(`run_label = $${params.length}`); }
  const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

  try {
    const countRes = await db.query(`SELECT COUNT(*) FROM stress_bookings ${where}`, params);
    const total    = parseInt(countRes.rows[0].count, 10);

    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT * FROM stress_bookings ${where}
       ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );

    res.json({ data: rows, total, page, limit });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── POST /api/stress/runs ─────────────────────────────────────
router.post('/runs', async (req, res) => {
  const r = req.body;
  if (!r.id) return res.status(400).json({ error: 'id is required' });

  try {
    const { rows } = await db.query(`
      INSERT INTO stress_test_runs (
        id, run_label, started_at, concurrency, total_bookings,
        status, parks_mix, config_json, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        r.id, r.run_label||null, r.started_at||Date.now(),
        r.concurrency||0, r.total_bookings||0,
        r.status||'running',
        r.parks_mix ? JSON.stringify(r.parks_mix) : null,
        r.config_json ? JSON.stringify(r.config_json) : null,
        r.notes||null
      ]
    );
    return res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Run ID already exists' });
    return res.status(500).json({ error: 'Database error', detail: e.message });
  }
});

// ── PATCH /api/stress/runs/:id ────────────────────────────────
router.patch('/runs/:id', async (req, res) => {
  const r = req.body;
  const allowed = [
    'ended_at','success_count','failed_count','timeout_count',
    'avg_latency_ms','p95_latency_ms','p99_latency_ms',
    'min_latency_ms','max_latency_ms','throughput_rps',
    'total_revenue','total_gst','avg_order_value','status','notes'
  ];

  const updates = [];
  const params  = [];
  allowed.forEach(field => {
    if (r[field] !== undefined) {
      params.push(r[field]);
      updates.push(`${field} = $${params.length}`);
    }
  });

  if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });

  params.push(req.params.id);
  try {
    const { rows } = await db.query(
      `UPDATE stress_test_runs SET ${updates.join(', ')} WHERE id=$${params.length} RETURNING *`,
      params
    );
    if (!rows.length) return res.status(404).json({ error: 'Run not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── GET /api/stress/runs ──────────────────────────────────────
router.get('/runs', async (req, res) => {
  const limit = Math.min(100, parseInt(req.query.limit || '30', 10));
  try {
    const { rows } = await db.query(
      'SELECT * FROM stress_test_runs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    const countRes = await db.query('SELECT COUNT(*) FROM stress_test_runs');
    res.json({ data: rows, total: parseInt(countRes.rows[0].count, 10) });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

// ── DELETE /api/stress/runs/:id ───────────────────────────────
router.delete('/runs/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM stress_bookings WHERE session_id = (SELECT run_label FROM stress_test_runs WHERE id=$1)', [req.params.id]);
    const { rowCount } = await db.query('DELETE FROM stress_test_runs WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Run not found' });
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
