'use strict';
// ============================================================
//  Health Check Route
//  GET /api/health
// ============================================================
const express = require('express');
const router  = express.Router();
const db      = require('../db');

router.get('/', async (req, res) => {
  const checks = { status: 'ok', timestamp: new Date().toISOString(), checks: {} };

  // DB check
  try {
    const t0 = Date.now();
    await db.query('SELECT 1');
    checks.checks.postgres = { status: 'ok', latency_ms: Date.now() - t0 };
  } catch (e) {
    checks.checks.postgres = { status: 'fail', error: e.message };
    checks.status = 'degraded';
  }

  // Memory usage
  const mem = process.memoryUsage();
  checks.checks.memory = {
    status:     'ok',
    heap_used:  Math.round(mem.heapUsed / 1024 / 1024) + 'MB',
    heap_total: Math.round(mem.heapTotal / 1024 / 1024) + 'MB',
    rss:        Math.round(mem.rss / 1024 / 1024) + 'MB'
  };

  checks.uptime_seconds = Math.round(process.uptime());
  checks.node_version   = process.version;
  checks.env            = process.env.NODE_ENV;

  const code = checks.status === 'ok' ? 200 : 503;
  res.status(code).json(checks);
});

// Liveness probe (Kubernetes)
router.get('/live',  (req, res) => res.json({ status: 'live' }));
// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ready' });
  } catch (e) {
    res.status(503).json({ status: 'not_ready', error: e.message });
  }
});

module.exports = router;
