'use strict';
// ============================================================
//  Integration Tests — Bookings API
//  Requires running PostgreSQL (use TEST_DATABASE_URL in .env)
//  Run with: npm test
// ============================================================
const request = require('supertest');

// Use a separate test DB if available
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
process.env.NODE_ENV = 'test';

const app = require('../src/server');

describe('POST /api/bookings', () => {
  const validPayload = {
    park:          'WATER_DAY',
    visit_date:    new Date(Date.now() + 7*86400000).toISOString().slice(0,10),
    adults:        2,
    children:      1,
    payment_mode:  'UPI',
    customer_name: 'Test User',
    customer_email:'test@wow.in',
    customer_mobile:'9876543210'
  };

  test('creates booking and returns 201 with pricing', async () => {
    const res = await request(app).post('/api/bookings').send(validPayload);
    expect(res.status).toBe(201);
    expect(res.body.booking_ref).toMatch(/^BK/);
    expect(res.body.pricing.grand_total).toBeGreaterThan(0);
    expect(res.body.pricing.ticket_total).toBe(3);
  });

  test('rejects past visit date', async () => {
    const res = await request(app).post('/api/bookings').send({
      ...validPayload,
      visit_date: '2020-01-01'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/future/i);
  });

  test('rejects invalid park', async () => {
    const res = await request(app).post('/api/bookings').send({
      ...validPayload,
      park: 'INVALID'
    });
    expect(res.status).toBe(400);
  });

  test('rejects 0 tickets', async () => {
    const res = await request(app).post('/api/bookings').send({
      ...validPayload,
      adults: 0, children: 0
    });
    expect(res.status).toBe(400);
  });

  test('rejects more than 8 tickets', async () => {
    const res = await request(app).post('/api/bookings').send({
      ...validPayload,
      adults: 5, children: 4  // total 9
    });
    expect(res.status).toBe(400);
  });

  test('applies valid offer code', async () => {
    const res = await request(app).post('/api/bookings').send({
      ...validPayload,
      offer_code: 'SUMMER25'
    });
    expect(res.status).toBe(201);
    expect(res.body.pricing.discount).toBeGreaterThan(0);
  });

  test('rejects invalid offer code', async () => {
    const res = await request(app).post('/api/bookings').send({
      ...validPayload,
      offer_code: 'BADCODE999'
    });
    expect(res.status).toBe(400);
  });

  test('missing payment_mode returns 400', async () => {
    const { payment_mode, ...noPayment } = validPayload;
    const res = await request(app).post('/api/bookings').send(noPayment);
    expect(res.status).toBe(400);
  });
});

describe('GET /api/bookings/:ref', () => {
  let createdRef;

  beforeAll(async () => {
    const res = await request(app).post('/api/bookings').send({
      park:         'AMUSEMENT_DAY',
      visit_date:   new Date(Date.now() + 14*86400000).toISOString().slice(0,10),
      adults:       1,
      payment_mode: 'Card'
    });
    createdRef = res.body.booking_ref;
  });

  test('returns booking by ref', async () => {
    const res = await request(app).get(`/api/bookings/${createdRef}`);
    expect(res.status).toBe(200);
    expect(res.body.booking_ref).toBe(createdRef);
  });

  test('returns 404 for unknown ref', async () => {
    const res = await request(app).get('/api/bookings/BK_DOES_NOT_EXIST');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/health', () => {
  test('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
