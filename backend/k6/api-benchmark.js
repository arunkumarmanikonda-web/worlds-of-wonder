// ============================================================
//  k6 API Write Benchmark — pure POST throughput test
//  Run: k6 run k6/api-benchmark.js -e API_URL=http://localhost:3000
// ============================================================
import http  from 'k6/http';
import { check } from 'k6';

export const options = {
  vus:      100,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed:   ['rate<0.01']
  }
};

const BASE    = __ENV.API_URL || 'http://localhost:3000';
const PARKS   = ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'];
const HEADERS = { 'Content-Type': 'application/json' };

export default function () {
  const park = PARKS[Math.floor(Math.random()*3)];
  const d    = new Date(Date.now() + (1 + Math.floor(Math.random()*30))*86400000);
  const res  = http.post(`${BASE}/api/bookings`,
    JSON.stringify({
      park,
      visit_date:   d.toISOString().slice(0,10),
      adults:       1 + Math.floor(Math.random()*3),
      children:     Math.floor(Math.random()*2),
      payment_mode: 'UPI',
      customer_name:'Benchmark User',
      customer_email:'bench@wow.test',
      customer_mobile:'9000000000'
    }),
    { headers: HEADERS }
  );
  check(res, { '201 created': r => r.status === 201 });
}
