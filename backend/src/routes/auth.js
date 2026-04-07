'use strict';
// ============================================================
//  Auth Route — POST /api/auth/login  POST /api/auth/refresh
//  Staff login (Admin, Sales, Gate, CRM, Partner etc.)
// ============================================================
const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../db');
const { authRateLimit } = require('../middleware/rateLimit');
const { validateBody, schemas } = require('../middleware/validate');

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', authRateLimit, validateBody(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await db.query(
      'SELECT * FROM staff_users WHERE email = $1 AND active = true LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Log failed attempt
      await db.query(
        'UPDATE staff_users SET failed_logins = failed_logins + 1 WHERE id = $1',
        [user.id]
      );
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Reset failed logins on success
    await db.query(
      'UPDATE staff_users SET failed_logins = 0, last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const payload = {
      sub:   user.id,
      email: user.email,
      name:  user.name,
      role:  user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const refreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      refresh_token: refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid token type' });

    const { rows } = await db.query(
      'SELECT * FROM staff_users WHERE id = $1 AND active = true', [decoded.sub]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });

    const user  = rows[0];
    const token = jwt.sign(
      { sub: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', (req, res) => {
  // Stateless JWT — client discards token
  // Optionally add token to a Redis blacklist here
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;

