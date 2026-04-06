'use strict';
// ============================================================
//  Bookings Route
//  POST   /api/bookings          — create booking
//  GET    /api/bookings          — list bookings (admin)
//  GET    /api/bookings/:ref     — get single booking
//  PATCH  /api/bookings/:ref     — update status
//  DELETE /api/bookings/:ref     — cancel booking
// ============================================================
const express   = require('express');
const router    = express.Router();
const db        = require('../db');
const { computeOrder }      = require('../services/pricing');
const { generateBookingRef} = require('../services/bookingRef');
const { generateTicketQR }  = require('../services/qrcode');
const { buildInvoice }      = require('../services/gst');
const { validateBody, schemas } = require('../middleware/validate');
const { bookingRateLimit }  = require('../middleware/rateLimit');
const { requireAuth, requireRole, optionalAuth } = require('../middleware/auth');

// ── POST /api/bookings — Create a new booking ────────────────
router.post('/',
  bookingRateLimit,
  validateBody(schemas.booking),
  async (req, res) => {
    const b = req.body;

    const qtys = {
      adult:             b.adults   || 0,
      child:             b.children || 0,
      senior:            b.seniors  || 0,
      armed:             b.armed    || 0,
      differently_abled: b.differently_abled || 0
    };

    // ── Server-side pricing (client cannot tamper) ────────────
    let pricing;
    try {
      pricing = computeOrder(b.park, qtys, b.offer_code || null);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    // ── Validate visit date ───────────────────────────────────
    const today     = new Date();
    today.setHours(0,0,0,0);
    const visitDate = new Date(b.visit_date);
    if (visitDate <= today) {
      return res.status(400).json({ error: 'Visit date must be in the future' });
    }
    const maxDate = new Date(today.getTime() + 90 * 86400000);
    if (visitDate > maxDate) {
      return res.status(400).json({ error: 'Booking window is 90 days in advance' });
    }

    let bookingRef;
    try {
      bookingRef = await generateBookingRef();
    } catch (e) {
      return res.status(500).json({ error: 'Failed to generate booking reference' });
    }

    try {
      const result = await db.transaction(async (client) => {
        const { rows } = await client.query(`
          INSERT INTO bookings (
            booking_ref, park, visit_date,
            adults, children, seniors, armed, differently_abled,
            ticket_total, base_amount, gst_amount, cgst, sgst, grand_total,
            offer_code, offer_discount, payment_mode,
            customer_name, customer_email, customer_mobile,
            booking_status, payment_status
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
            'pending','pending'
          ) RETURNING *`,
          [
            bookingRef, b.park, b.visit_date,
            qtys.adult, qtys.child, qtys.senior, qtys.armed, qtys.differently_abled,
            pricing.ticket_total, pricing.base_amount, pricing.gst_amount,
            pricing.cgst, pricing.sgst, pricing.grand_total,
            pricing.offer_code, pricing.discount, b.payment_mode,
            b.customer_name || null, b.customer_email || null, b.customer_mobile || null
          ]
        );
        return rows[0];
      });

      // Generate GST invoice object
      const invoice = buildInvoice(pricing, {
        name:  b.customer_name,
        gstin: b.customer_gstin || null
      });

      return res.status(201).json({
        booking_ref: bookingRef,
        booking:     result,
        pricing,
        invoice
      });

    } catch (e) {
      console.error('Booking insert error:', e);
      if (e.code === '23505') {
        return res.status(409).json({ error: 'Duplicate booking reference. Please retry.' });
      }
      return res.status(500).json({ error: 'Database error creating booking' });
    }
  }
);

// ── GET /api/bookings — List bookings (admin/staff only) ─────
router.get('/',
  requireAuth,
  requireRole('admin','super_admin','gate','crm'),
  async (req, res) => {
    const page  = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '20', 10));
    const offset = (page - 1) * limit;

    const filters = [];
    const params  = [];

    if (req.query.park) {
      params.push(req.query.park);
      filters.push(`park = $${params.length}`);
    }
    if (req.query.date) {
      params.push(req.query.date);
      filters.push(`visit_date = $${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`booking_status = $${params.length}`);
    }
    if (req.query.search) {
      params.push('%' + req.query.search + '%');
      filters.push(`(booking_ref ILIKE $${params.length} OR customer_name ILIKE $${params.length} OR customer_email ILIKE $${params.length})`);
    }

    const where = filters.length ? 'WHERE ' + filters.join(' AND ') : '';

    try {
      const countRes = await db.query(`SELECT COUNT(*) FROM bookings ${where}`, params);
      const total    = parseInt(countRes.rows[0].count, 10);

      params.push(limit, offset);
      const { rows } = await db.query(
        `SELECT * FROM bookings ${where} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`,
        params
      );

      res.json({ data: rows, total, page, limit });
    } catch (e) {
      console.error('List bookings error:', e);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// ── GET /api/bookings/:ref — Get booking by reference ────────
router.get('/:ref', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM bookings WHERE booking_ref = $1', [req.params.ref]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    const booking = rows[0];
    // Generate QR if booking is confirmed and QR not yet stored
    if (booking.booking_status === 'confirmed' && !booking.qr_code_data) {
      const { dataUri } = await generateTicketQR(booking);
      await db.query(
        'UPDATE bookings SET qr_code_data=$1 WHERE booking_ref=$2',
        [dataUri, req.params.ref]
      );
      booking.qr_code_data = dataUri;
    }

    res.json(booking);
  } catch (e) {
    console.error('Get booking error:', e);
    res.status(500).json({ error: 'Database error' });
  }
});

// ── PATCH /api/bookings/:ref — Update booking status ─────────
router.patch('/:ref',
  requireAuth,
  requireRole('admin','super_admin','gate','crm'),
  async (req, res) => {
    const allowed = ['booking_status','payment_status','notes'];
    const updates = [];
    const params  = [];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    });

    if (!updates.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(new Date().toISOString(), req.params.ref);
    const sql = `UPDATE bookings SET ${updates.join(', ')}, updated_at=$${params.length-1}
                 WHERE booking_ref=$${params.length} RETURNING *`;

    try {
      const { rows } = await db.query(sql, params);
      if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
      res.json(rows[0]);
    } catch (e) {
      console.error('Update booking error:', e);
      res.status(500).json({ error: 'Database error' });
    }
  }
);

// ── DELETE /api/bookings/:ref — Cancel booking ────────────────
router.delete('/:ref',
  requireAuth,
  requireRole('admin','super_admin'),
  async (req, res) => {
    try {
      const { rows } = await db.query(
        `UPDATE bookings SET booking_status='cancelled', updated_at=NOW()
         WHERE booking_ref=$1 RETURNING booking_ref, booking_status`,
        [req.params.ref]
      );
      if (!rows.length) return res.status(404).json({ error: 'Booking not found' });
      res.json({ message: 'Booking cancelled', ...rows[0] });
    } catch (e) {
      res.status(500).json({ error: 'Database error' });
    }
  }
);

module.exports = router;
