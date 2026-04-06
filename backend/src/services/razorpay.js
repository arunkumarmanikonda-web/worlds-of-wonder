'use strict';
// ============================================================
//  Razorpay Integration Service
//  Docs: https://razorpay.com/docs/payments/server-integration/
// ============================================================
const Razorpay = require('razorpay');
const crypto   = require('crypto');

let _rzp = null;

function getRzp() {
  if (!_rzp) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in .env');
    }
    _rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }
  return _rzp;
}

/**
 * Create a Razorpay order (Step 1 of payment flow)
 * @param {object} booking - booking row from DB
 * @returns {object} Razorpay order
 */
async function createOrder(booking) {
  const rzp = getRzp();
  const order = await rzp.orders.create({
    amount:   booking.grand_total * 100,   // convert ₹ to paise
    currency: 'INR',
    receipt:  booking.booking_ref,
    notes: {
      booking_ref: booking.booking_ref,
      park:        booking.park,
      visit_date:  booking.visit_date
    }
  });
  return order;
}

/**
 * Verify Razorpay payment signature (Step 2 — after customer pays)
 * @param {string} orderId     - razorpay_order_id from callback
 * @param {string} paymentId   - razorpay_payment_id from callback
 * @param {string} signature   - razorpay_signature from callback
 * @returns {boolean}
 */
function verifySignature(orderId, paymentId, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/**
 * Verify Razorpay webhook signature
 * @param {string} rawBody   - raw request body string
 * @param {string} signature - X-Razorpay-Signature header
 */
function verifyWebhookSignature(rawBody, signature) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

/**
 * Fetch payment details from Razorpay (for reconciliation)
 */
async function fetchPayment(paymentId) {
  const rzp = getRzp();
  return rzp.payments.fetch(paymentId);
}

/**
 * Issue a refund
 */
async function refundPayment(paymentId, amount) {
  const rzp = getRzp();
  return rzp.payments.refund(paymentId, { amount: amount * 100 });
}

module.exports = {
  createOrder,
  verifySignature,
  verifyWebhookSignature,
  fetchPayment,
  refundPayment
};
