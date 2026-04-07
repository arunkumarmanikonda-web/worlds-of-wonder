'use strict';
var express = require('express');
var router  = express.Router();
var db      = require('../db');
var rzp     = require('../services/razorpay');
router.get('/', async function(req, res) {
  var r = { status:'ok', timestamp: new Date().toISOString(), checks:{} };
  try { var t0=Date.now(); await db.query('SELECT 1'); r.checks.postgres={status:'ok',latency_ms:Date.now()-t0}; }
  catch(e) { r.checks.postgres={status:'fail',error:e.message}; r.status='degraded'; }
  var m=process.memoryUsage();
  r.checks.memory={ status:'ok', heap_used:Math.round(m.heapUsed/1024/1024)+'MB', heap_total:Math.round(m.heapTotal/1024/1024)+'MB', rss:Math.round(m.rss/1024/1024)+'MB' };
  r.uptime_seconds = Math.round(process.uptime());
  r.node_version   = process.version;
  r.env            = process.env.NODE_ENV || 'development';
  r.booking_window = parseInt(process.env.BOOKING_WINDOW_DAYS || '365', 10);
  r.razorpay_mode  = rzp.isDevMock() ? 'mock' : 'live';
  res.status(r.status==='ok'?200:503).json(r);
});
router.get('/live',  function(req,res){ res.json({status:'live'}); });
router.get('/ready', async function(req,res){ try { await db.query('SELECT 1'); res.json({status:'ready'}); } catch(e){ res.status(503).json({status:'not_ready',error:e.message}); } });
module.exports = router;
