'use strict';
var crypto = require('crypto');
var _rzp = null;
function isPlaceholderKey(k) { return !k || k.indexOf('XXXX') !== -1 || k.indexOf('YYYY') !== -1 || k.length < 20; }
function isDevMock() {
  return process.env.NODE_ENV !== 'production' &&
    (isPlaceholderKey(process.env.RAZORPAY_KEY_ID) || isPlaceholderKey(process.env.RAZORPAY_KEY_SECRET));
}
function getRzp() {
  if (isDevMock()) return null;
  if (!_rzp) { var R = require('razorpay'); _rzp = new R({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET }); }
  return _rzp;
}
async function createOrder(booking) {
  if (isDevMock()) {
    var mid = 'order_MOCK' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
    console.log('[RAZORPAY MOCK] createOrder -> ' + mid + ' Rs.' + booking.grand_total);
    return { id: mid, amount: booking.grand_total * 100, currency: 'INR', receipt: booking.booking_ref, status: 'created', mock: true };
  }
  return await getRzp().orders.create({ amount: booking.grand_total*100, currency:'INR', receipt: booking.booking_ref, notes:{ booking_ref: booking.booking_ref, park: booking.park } });
}
function verifySignature(oid, pid, sig) {
  if (isDevMock()) return true;
  return crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(oid+'|'+pid).digest('hex') === sig;
}
function verifyWebhookSignature(raw, sig) {
  if (isDevMock()) return true;
  return crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex') === sig;
}
async function fetchPayment(pid) { if (isDevMock()) return { id:pid, status:'captured', mock:true }; return getRzp().payments.fetch(pid); }
async function refundPayment(pid, amt) {
  if (isDevMock()) { var r='rfnd_MOCK'+Date.now().toString(36).toUpperCase(); return { id:r, amount:amt*100, status:'processed', mock:true }; }
  return getRzp().payments.refund(pid, { amount: amt*100 });
}
module.exports = { createOrder, verifySignature, verifyWebhookSignature, fetchPayment, refundPayment, isDevMock };
