'use strict';
// ============================================================
//  WOW Booking API — Express Server Entry Point
//  Node 20 + Express 4 + PostgreSQL 16 + Redis 7
// ============================================================
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const db       = require('./db');

// ── Route imports ────────────────────────────────────────────
const healthRouter        = require('./routes/health');
const bookingsRouter      = require('./routes/bookings');
const paymentsRouter      = require('./routes/payments');
const calendarRouter      = require('./routes/calendar');
const stressRouter        = require('./routes/stress');
const passportRouter      = require('./routes/passport');
const authRouter          = require('./routes/auth');

// ── Middleware imports ───────────────────────────────────────
const { globalRateLimit } = require('./middleware/rateLimit');

const app = express();

// ── Security headers ─────────────────────────────────────────
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Request-ID'],
  credentials: true
}));

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ── HTTP logging ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// ── Global rate limiter ──────────────────────────────────────
app.use(globalRateLimit);

// ── Request ID ───────────────────────────────────────────────
app.use((req, res, next) => {
  req.requestId = req.headers['x-request-id'] || require('uuid').v4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// ── API Routes ───────────────────────────────────────────────
app.use('/api/health',    healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api/bookings',  bookingsRouter);
app.use('/api/payments',  paymentsRouter);
app.use('/api/calendar',  calendarRouter);
app.use('/api/stress',    stressRouter);
app.use('/api/passport',  passportRouter);

// ── Root ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    service:  'WOW Booking API',
    version:  '1.0.0',
    status:   'running',
    env:      process.env.NODE_ENV,
    endpoints: [
      'GET    /api/health',
      'POST   /api/auth/login',
      'POST   /api/bookings',
      'GET    /api/bookings/:ref',
      'POST   /api/payments/initiate',
      'POST   /api/payments/confirm',
      'POST   /api/payments/webhook',
      'GET    /api/calendar/:park/:year/:month',
      'POST   /api/stress/bookings',
      'GET    /api/stress/bookings',
      'POST   /api/stress/runs',
      'PATCH  /api/stress/runs/:id',
      'GET    /api/stress/runs',
    ]
  });
});

// ── 404 ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error(`[ERROR] ${req.method} ${req.path} —`, err.message);
  if (process.env.NODE_ENV === 'development') {
    return res.status(err.status || 500).json({ error: err.message, stack: err.stack });
  }
  res.status(err.status || 500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '3000', 10);

async function start() {
  // Verify DB connection before listening
  try {
    await db.query('SELECT 1');
    console.log('✅ PostgreSQL connected');
  } catch (e) {
    console.error('❌ PostgreSQL connection failed:', e.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 WOW API running on http://localhost:${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV}`);
    console.log(`   DB:  ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@')}`);
  });
}

start();

module.exports = app; // for tests
