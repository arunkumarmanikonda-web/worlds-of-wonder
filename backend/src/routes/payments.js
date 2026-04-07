'use strict';
// ============================================================
//  Payments Route
//  POST /api/payments/initiate  — create Razorpay order
//  POST /api/payments/confirm   — verify payment signature
//  POST /api/payments/webhook   — Razorpay webhook handler
//  POST /api/payments/refund    — issue refund
// ============================================================
const express   = require('express');
const router    = express.Router();
const db        = require('../db');
const rzp       = require('../services/razorpay');
const { generateTicketQR } = require('../services/qrcode');
const { requireAuth, requireRole } = require('../middleware/auth');

// ── POST /api/payments/initiate ───────────────────────────────
router.post('/initiate', async (req, res) => {
  const { booking_ref } = req.body;
  if (!booking_ref) return res.status(400).json({ error: 'booking_ref is required' });

  try {
    const { rows } = await db.query(
      'SELECT * FROM bookings WHERE booking_ref = $1', [booking_ref]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    const booking = rows[0];
    if (booking.payment_status === 'paid') {
      return res.status(400).json({ error: 'This booking has already been paid' });
    }
    if (booking.booking_status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for a cancelled booking' });
    }

    const order = await rzp.createOrder(booking);

    // Store Razorpay order ID against booking
    await db.query(
      'UPDATE bookings SET razorpay_order_id=$1, updated_at=NOW() WHERE booking_ref=$2',
      [order.id, booking_ref]
    );

    return res.json({
      order_id:    order.id,
      amount:      order.amount,       // in paise
      amount_inr:  order.amount / 100, // in ₹
      currency:    order.currency,
      booking_ref: booking.booking_ref,
      key_id:      process.env.RAZORPAY_KEY_ID,
      prefill: {
        name:    booking.customer_name  || '',
        email:   booking.customer_email || '',
        contact: booking.customer_mobile|| ''
      },
      notes: {
        park:       booking.park,
        visit_date: booking.visit_date
      }
    });

  } catch (e) {
    console.error('Payment initiate error:', e);
    if (e.message?.includes('RAZORPAY')) {
      return res.status(500).json({ error: 'Razorpay configuration error' });
    }
    res.status(502).json({ error: 'Payment gateway error', detail: e.message });
  }
});

// ── POST /api/payments/confirm ────────────────────────────────
router.post('/confirm', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, booking_ref } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !booking_ref) {
    return res.status(400).json({ error: 'Missing required payment confirmation fields' });
  }

  // ── Signature verification ────────────────────────────────
  const isValid = rzp.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
  if (!isValid) {
    console.warn(`[PAYMENT] Signature mismatch for booking ${booking_ref}`);
    return res.status(400).json({ error: 'Payment signature verification failed' });
  }

  try {
    const result = await db.transaction(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM bookings WHERE booking_ref=$1', [booking_ref]
      );
      if (!rows.length) throw Object.assign(new Error('Booking not found'), { status: 404 });

      const booking = rows[0];
      if (booking.payment_status === 'paid') {
        return { booking, alreadyPaid: true };
      }

      // Confirm the booking
      const updated = await client.query(`
        UPDATE bookings
        SET payment_status='paid', booking_status='confirmed',
            razorpay_payment_id=$1, updated_at=NOW()
        WHERE booking_ref=$2 RETURNING *`,
        [razorpay_payment_id, booking_ref]
      );
      return { booking: updated.rows[0], alreadyPaid: false };
    });

    const { booking, alreadyPaid } = result;

    // Generate QR ticket
    let qr = null;
    if (!alreadyPaid) {
      try {
        const qrResult = await generateTicketQR(booking);
        await db.query(
          'UPDATE bookings SET qr_code_data=$1 WHERE booking_ref=$2',
          [qrResult.dataUri, booking_ref]
        );
        qr = qrResult.dataUri;
      } catch (qErr) {
        console.warn('QR generation failed (non-fatal):', qErr.message);
      }
    }

    return res.json({
      status:      'confirmed',
      booking_ref: booking.booking_ref,
      booking,
      qr_code:     qr,
      already_paid: alreadyPaid
    });

  } catch (e) {
    console.error('Payment confirm error:', e);
    if (e.status) return res.status(e.status).json({ error: e.message });
    res.status(500).json({ error: 'Database error during payment confirmation' });
  }
});

// ── POST /api/payments/webhook — Razorpay server-to-server ───
// Add this URL in Razorpay Dashboard → Webhooks
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody   = req.body.toString();

  if (!rzp.verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch(e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  console.log(`[WEBHOOK] Event: ${event.event}`);

  if (event.event === 'payment.captured') {
    const payment     = event.payload.payment.entity;
    const booking_ref = payment.notes?.booking_ref;
    if (booking_ref) {
      await db.query(`
        UPDATE bookings
        SET payment_status='paid', booking_status='confirmed',
            razorpay_payment_id=$1, updated_at=NOW()
        WHERE booking_ref=$2 AND payment_status != 'paid'`,
        [payment.id, booking_ref]
      ).catch(e => console.error('Webhook DB update error:', e));
    }
  }

  if (event.event === 'payment.failed') {
    const payment     = event.payload.payment.entity;
    const booking_ref = payment.notes?.booking_ref;
    if (booking_ref) {
      await db.query(`
        UPDATE bookings SET payment_status='failed', updated_at=NOW()
        WHERE booking_ref=$1 AND payment_status = 'pending'`,
        [booking_ref]
      ).catch(e => console.error('Webhook DB update error:', e));
    }
  }

  res.json({ received: true });
});

// ── POST /api/payments/refund — Initiate refund ───────────────
router.post('/refund',
  requireAuth,
  requireRole('admin','super_admin','finance'),
  async (req, res) => {
    const { booking_ref, reason } = req.body;
    if (!booking_ref) return res.status(400).json({ error: 'booking_ref required' });

    try {
      const { rows } = await db.query(
        'SELECT * FROM bookings WHERE booking_ref=$1', [booking_ref]
      );
      if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

      const booking = rows[0];
      if (booking.payment_status !== 'paid') {
        return res.status(400).json({ error: 'Booking is not in paid state' });
      }
      if (!booking.razorpay_payment_id) {
        return res.status(400).json({ error: 'No Razorpay payment ID found for this booking' });
      }

      const refund = await rzp.refundPayment(booking.razorpay_payment_id, booking.grand_total);

      await db.query(`
        UPDATE bookings SET payment_status='refunded', booking_status='refunded',
          updated_at=NOW() WHERE booking_ref=$1`,
        [booking_ref]
      );

      res.json({ status: 'refunded', refund_id: refund.id, amount: refund.amount / 100 });
    } catch (e) {
      console.error('Refund error:', e);
      res.status(500).json({ error: e.message });
    }
  }
);

module.exports = router;

