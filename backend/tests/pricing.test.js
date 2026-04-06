'use strict';
// ============================================================
//  Unit Tests — Pricing Engine
//  Run with: npm test
// ============================================================
const { computeOrder, validateOfferCode, MAX_TICKETS } = require('../src/services/pricing');

describe('computeOrder()', () => {
  test('basic Water Day adult ticket', () => {
    const order = computeOrder('WATER_DAY', { adult:1 });
    expect(order.ticket_total).toBe(1);
    expect(order.grand_total).toBeGreaterThan(0);
    // Price is GST-inclusive: ₹1,299 shown to customer
    // net = round(1299/1.18) = 1101
    expect(order.base_amount).toBe(1101);
    expect(order.cgst).toBe(Math.round(1101 * 0.09));
    expect(order.sgst).toBe(Math.round(1101 * 0.09));
  });

  test('Combo Day 2 adults + 1 child', () => {
    const order = computeOrder('COMBO_DAY', { adult:2, child:1 });
    expect(order.ticket_total).toBe(3);
    expect(order.grand_total).toBeGreaterThan(0);
    // cgst + sgst should equal gst_amount (±1 for rounding)
    expect(Math.abs(order.cgst + order.sgst - order.gst_amount)).toBeLessThanOrEqual(1);
  });

  test('group discount applies at 10+ tickets', () => {
    // 10 adults on Water Day → group discount = 10 × 75 = ₹750
    const order = computeOrder('WATER_DAY', { adult:10 });
    expect(order.group_disc).toBe(750);
    expect(order.discount).toBe(750);
  });

  test('group discount does NOT apply below 10 tickets', () => {
    const order = computeOrder('WATER_DAY', { adult:9 });
    expect(order.group_disc).toBe(0);
  });

  test('offer code BOGO20 applies 20% discount', () => {
    const order = computeOrder('WATER_DAY', { adult:2 }, 'BOGO20');
    expect(order.offer_disc).toBe(Math.round(order.subtotal * 0.20));
  });

  test('offer code beats group discount when higher', () => {
    const order = computeOrder('WATER_DAY', { adult:10 }, 'FLASH30');
    // FLASH30 = 30% vs group = 750
    const offerAmt = Math.round(order.subtotal * 0.30);
    expect(order.discount).toBe(Math.max(offerAmt, 750));
  });

  test('rejects invalid park', () => {
    expect(() => computeOrder('INVALID_PARK', { adult:1 })).toThrow('Invalid parkKey');
  });

  test('rejects 0 tickets', () => {
    expect(() => computeOrder('WATER_DAY', { adult:0 })).toThrow('At least 1 ticket');
  });

  test('rejects more than 8 tickets', () => {
    expect(() => computeOrder('WATER_DAY', { adult:9 })).toThrow(`Maximum ${MAX_TICKETS}`);
  });

  test('invalid offer code throws', () => {
    expect(() => computeOrder('WATER_DAY', { adult:1 }, 'BADCODE')).toThrow('Invalid or expired offer code');
  });
});

describe('validateOfferCode()', () => {
  test('valid code SUMMER25', () => {
    const r = validateOfferCode('SUMMER25');
    expect(r.valid).toBe(true);
    expect(r.discount_pct).toBe(25);
  });

  test('case insensitive', () => {
    const r = validateOfferCode('bogo20');
    expect(r.valid).toBe(true);
  });

  test('invalid code', () => {
    const r = validateOfferCode('NOTACODE');
    expect(r.valid).toBe(false);
  });
});
