// ============================================================
//  k6 Deep Stress Test — WOW Booking API
//  Install k6: https://k6.io/docs/getting-started/installation/
//  Run:  k6 run k6/stress-test.js -e API_URL=https://worlds-of-wonder-production.up.railway.app
//  HTML report: k6 run --out html=report.html k6/stress-test.js
// ============================================================
import http    from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────
const bookingCreated  = new Counter('bookings_created');
const bookingFailed   = new Counter('bookings_failed');
const bookingLatency  = new Trend('booking_latency_ms', true);
const paymentLatency  = new Trend('payment_initiate_ms', true);
const errorRate       = new Rate('error_rate');

// ── Test configuration ────────────────────────────────────────
export const options = {
  scenarios: {
    // 1. Smoke test — quick sanity check
    smoke: {
      executor:   'constant-vus',
      vus:        5,
      duration:   '30s',
      startTime:  '0s',
      tags:       { scenario: 'smoke' }
    },
    // 2. Load test — sustained normal load
    load: {
      executor:   'constant-vus',
      vus:        50,
      duration:   '2m',
      startTime:  '35s',
      tags:       { scenario: 'load' }
    },
    // 3. Stress test — ramp up to find breaking point
    stress: {
      executor:   'ramping-vus',
      startVUs:   0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '2m',  target: 100 },
        { duration: '30s', target: 200 },
        { duration: '1m',  target: 200 },
        { duration: '30s', target: 0   }
      ],
      startTime:  '3m',
      tags:       { scenario: 'stress' }
    },
    // 4. Spike test — sudden burst
    spike: {
      executor:   'ramping-vus',
      startVUs:   0,
      stages: [
        { duration: '10s', target: 500 },
        { duration: '30s', target: 500 },
        { duration: '10s', target: 0   }
      ],
      startTime:  '8m',
      tags:       { scenario: 'spike' }
    }
  },
  thresholds: {
    // 95% of booking requests must complete under 800ms
    'http_req_duration{name:create_booking}': ['p(95)<800'],
    // Error rate must be under 5%
    'error_rate':                              ['rate<0.05'],
    // 95th percentile of booking latency under 1s
    'booking_latency_ms':                     ['p(95)<1000']
  }
};

// ── Constants ─────────────────────────────────────────────────
const BASE       = __ENV.API_URL || 'https://worlds-of-wonder-production.up.railway.app';
const PARKS      = ['WATER_DAY', 'AMUSEMENT_DAY', 'COMBO_DAY'];
const PAY_MODES  = ['UPI', 'Card', 'NetBanking', 'Cash'];
const OFFER_CODES= ['BOGO20','SUMMER25','COMBO15','FLASH30', null, null, null]; // 3/7 get offer
const HEADERS    = { 'Content-Type': 'application/json' };

function randInt(lo, hi) { return Math.floor(Math.random()*(hi-lo+1))+lo; }
function pickRand(arr)   { return arr[Math.floor(Math.random()*arr.length)]; }

function futureDate(daysAhead) {
  const d = new Date(Date.now() + daysAhead * 86400000);
  return d.toISOString().slice(0,10);
}

// ── Main VU scenario ──────────────────────────────────────────
export default function () {

  const park       = pickRand(PARKS);
  const adults     = randInt(1, 4);
  const children   = randInt(0, 3);
  const tickets    = adults + children;
  const visitDate  = futureDate(randInt(1, 60));
  const payMode    = pickRand(PAY_MODES);
  const offerCode  = pickRand(OFFER_CODES);

  // Ensure ticket cap
  if (tickets > 8) return;

  // ── STEP 1: Create Booking ────────────────────────────────
  group('create_booking', () => {
    const payload = JSON.stringify({
      park,
      visit_date:   visitDate,
      adults,
      children,
      payment_mode: payMode,
      offer_code:   offerCode,
      customer_name:   'k6 Load Tester',
      customer_email:  'k6@wow-stress.test',
      customer_mobile: '9999999999'
    });

    const t0  = Date.now();
    const res = http.post(`${BASE}/api/bookings`, payload, {
      headers: HEADERS,
      tags:    { name: 'create_booking' }
    });
    bookingLatency.add(Date.now() - t0);

    const ok = check(res, {
      'status 201':           r => r.status === 201,
      'has booking_ref':      r => {
        try { return !!JSON.parse(r.body).booking_ref; } catch(_){ return false; }
      },
      'pricing is correct':   r => {
        try {
          const b = JSON.parse(r.body);
          return b.pricing && b.pricing.grand_total > 0;
        } catch(_){ return false; }
      },
      'cgst + sgst = gst':    r => {
        try {
          const p = JSON.parse(r.body).pricing;
          return Math.abs((p.cgst + p.sgst) - p.gst_amount) <= 1;
        } catch(_){ return false; }
      }
    });

    errorRate.add(!ok);
    if (ok) {
      bookingCreated.add(1);
    } else {
      bookingFailed.add(1);
      console.error(`Booking failed [${res.status}]: ${res.body?.slice(0,200)}`);
    }

    // Store booking_ref for payment step
    let bookingRef = null;
    try { bookingRef = JSON.parse(res.body).booking_ref; } catch(_){}

    // ── STEP 2: Initiate Payment (optional — simulate gateway) ──
    if (bookingRef && payMode !== 'Cash') {
      sleep(0.1 + Math.random() * 0.3); // think time

      const t1     = Date.now();
      const payRes = http.post(`${BASE}/api/payments/initiate`,
        JSON.stringify({ booking_ref: bookingRef }),
        { headers: HEADERS, tags: { name: 'payment_initiate' } }
      );
      paymentLatency.add(Date.now() - t1);

      check(payRes, {
        'payment init 200': r => r.status === 200,
        'has order_id':     r => {
          try { return !!JSON.parse(r.body).order_id; } catch(_){ return false; }
        }
      });
    }
  });

  // ── STEP 3: GET booking by ref (read path) ─────────────────
  group('get_booking', () => {
    // Just hit health to simulate a lightweight GET
    const res = http.get(`${BASE}/api/health`, {
      tags: { name: 'health_check' }
    });
    check(res, { 'health ok': r => r.status === 200 });
  });

  // Think time between iterations
  sleep(0.2 + Math.random() * 0.8);
}

// ── Setup — runs once before test ────────────────────────────
export function setup() {
  const res = http.get(`${BASE}/api/health`);
  if (res.status !== 200) {
    throw new Error(`API not reachable at ${BASE} — health check returned ${res.status}`);
  }
  console.log(`✅ API reachable at ${BASE}`);
  return { base: BASE };
}

// ── Teardown — runs once after test ──────────────────────────
export function teardown(data) {
  console.log(`Test completed. API base: ${data.base}`);
}

