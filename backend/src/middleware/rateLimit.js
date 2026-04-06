'use strict';
// ============================================================
//  Rate Limiting Middleware
//  Uses express-rate-limit (in-memory, no Redis required)
//  Swap to RedisStore for multi-instance deployments
// ============================================================
const rateLimit = require('express-rate-limit');

// ── Global limiter — all routes ───────────────────────────────
const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
  max:      parseInt(process.env.RATE_LIMIT_MAX        || '200',   10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests, please try again later.' }
});

// ── Booking endpoint — stricter ───────────────────────────────
const bookingRateLimit = rateLimit({
  windowMs: 60000,  // 1 minute
  max:      parseInt(process.env.BOOKING_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many booking attempts. Please wait 1 minute.' }
});

// ── Auth endpoint — strictest ─────────────────────────────────
const authRateLimit = rateLimit({
  windowMs: 900000, // 15 minutes
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

// ── Stress test endpoint — relaxed (for bulk writes) ──────────
const stressRateLimit = rateLimit({
  windowMs: 60000,
  max:      5000,   // allow high concurrency for stress tests
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Stress test rate limit exceeded.' }
});

module.exports = {
  globalRateLimit,
  bookingRateLimit,
  authRateLimit,
  stressRateLimit
};
