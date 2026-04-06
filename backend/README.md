# WOW Booking Platform — Backend API

**Node.js 20 + Express 4 + PostgreSQL 16 + Redis 7**

---

## 📁 File Structure

```
backend/
├── package.json                  ← dependencies & npm scripts
├── .env.example                  ← copy to .env and fill values
├── .gitignore
├── Dockerfile
├── docker-compose.yml            ← postgres + redis + api containers
│
├── migrations/
│   ├── 001_initial.sql           ← ALL table schemas (run first)
│   └── 002_seed_staff.sql        ← default staff user accounts
│
├── src/
│   ├── server.js                 ← Express entry point — start here
│   ├── db.js                     ← PostgreSQL pool (pg library)
│   │
│   ├── routes/
│   │   ├── health.js             ← GET  /api/health
│   │   ├── auth.js               ← POST /api/auth/login|refresh|logout
│   │   ├── bookings.js           ← POST/GET/PATCH/DELETE /api/bookings
│   │   ├── payments.js           ← POST /api/payments/initiate|confirm|webhook|refund
│   │   ├── calendar.js           ← GET  /api/calendar/:park/:year/:month
│   │   ├── stress.js             ← Full CRUD for stress test data
│   │   └── passport.js           ← Annual passport issue + gate redemption
│   │
│   ├── services/
│   │   ├── pricing.js            ← Server-side port of booking.js pricing engine
│   │   ├── gst.js                ← GST invoice builder (CGST/SGST/IGST)
│   │   ├── razorpay.js           ← Razorpay order + signature verification
│   │   ├── qrcode.js             ← QR code PNG generator for tickets
│   │   └── bookingRef.js         ← Unique booking reference generator
│   │
│   ├── middleware/
│   │   ├── auth.js               ← JWT verification (requireAuth, requireRole)
│   │   ├── rateLimit.js          ← Per-route rate limiters
│   │   └── validate.js           ← Joi request body validation
│   │
│   └── scripts/
│       ├── migrate.js            ← Migration runner (npm run migrate)
│       └── seed.js               ← Insert 50 sample bookings (npm run seed)
│
├── tests/
│   ├── pricing.test.js           ← Unit tests for pricing engine
│   └── bookings.test.js          ← Integration tests for bookings API
│
└── k6/
    ├── stress-test.js            ← Full k6 load test (smoke+load+stress+spike)
    └── api-benchmark.js          ← Pure POST write throughput benchmark
```

---

## 🚀 Quick Setup (5 steps)

### Step 1 — Prerequisites

Make sure you have installed:
- **Node.js 20+**  → https://nodejs.org
- **Docker Desktop** → https://www.docker.com/products/docker-desktop  
  *(Docker is only needed to run Postgres + Redis locally)*

### Step 2 — Install dependencies

```bash
cd backend
npm install
```

### Step 3 — Configure environment

```bash
cp .env.example .env
```

Open `.env` and set at minimum:
```env
DATABASE_URL=postgresql://wow_user:wow_pass@localhost:5432/wow_bookings
JWT_SECRET=any-long-random-string-here
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYY
```

> **Razorpay keys** → sign up free at https://dashboard.razorpay.com → Settings → API Keys → Generate Test Key

### Step 4 — Start PostgreSQL + Redis

```bash
docker-compose up -d postgres redis
```

Wait ~10 seconds for Postgres to be ready, then run migrations:

```bash
npm run migrate
```

This runs `migrations/001_initial.sql` (all tables) and `migrations/002_seed_staff.sql` (default users) automatically.

### Step 5 — Start the API

```bash
npm run dev
```

The API is now running at **http://localhost:3000**

```
✅ PostgreSQL connected
🚀 WOW API running on http://localhost:3000
   ENV: development
```

---

## 🌐 API Endpoints

### Health
```
GET  /api/health          → { status, postgres, memory, uptime }
GET  /api/health/live     → { status: "live" }
GET  /api/health/ready    → { status: "ready" }
```

### Auth
```
POST /api/auth/login      → { token, refresh_token, user }
POST /api/auth/refresh    → { token }
POST /api/auth/logout     → { message }
```

### Bookings
```
POST   /api/bookings              → Create booking (public)
GET    /api/bookings              → List bookings  (requires JWT: admin/gate/crm)
GET    /api/bookings/:ref         → Get booking    (public)
PATCH  /api/bookings/:ref         → Update status  (requires JWT: admin/gate/crm)
DELETE /api/bookings/:ref         → Cancel         (requires JWT: admin/super_admin)
```

#### Create Booking — Request Body
```json
{
  "park":           "WATER_DAY",
  "visit_date":     "2026-07-15",
  "adults":         2,
  "children":       1,
  "seniors":        0,
  "armed":          0,
  "differently_abled": 0,
  "offer_code":     "SUMMER25",
  "payment_mode":   "UPI",
  "customer_name":  "Rahul Sharma",
  "customer_email": "rahul@example.com",
  "customer_mobile":"9876543210"
}
```

#### Create Booking — Response (201)
```json
{
  "booking_ref": "BKLRGX4A2F9P7",
  "booking": { "id": "...", "park": "WATER_DAY", ... },
  "pricing": {
    "ticket_total": 3,
    "subtotal":     3220,
    "group_disc":   0,
    "offer_code":   "SUMMER25",
    "offer_disc":   805,
    "discount":     805,
    "gst_amount":   435,
    "cgst":         217,
    "sgst":         217,
    "grand_total":  2850
  },
  "invoice": { "invoice_no": "INV-...", "tax_lines": [...], ... }
}
```

### Payments
```
POST /api/payments/initiate   → Create Razorpay order  → { order_id, amount, key_id }
POST /api/payments/confirm    → Verify payment signature → { status: "confirmed", booking, qr_code }
POST /api/payments/webhook    → Razorpay server webhook (register URL in Razorpay dashboard)
POST /api/payments/refund     → Issue refund (requires JWT: admin/finance)
```

### Calendar
```
GET /api/calendar/:park/:year/:month   → Monthly availability
GET /api/calendar/:park/:date          → Single date status
```
Parks: `WATER_DAY` | `AMUSEMENT_DAY` | `COMBO_DAY`

### Stress Test Data
```
POST   /api/stress/bookings    → Write stress booking record
GET    /api/stress/bookings    → List with pagination
POST   /api/stress/runs        → Create run metadata record
PATCH  /api/stress/runs/:id    → Update run with final stats
GET    /api/stress/runs        → List past runs
DELETE /api/stress/runs/:id    → Delete run + its bookings
```

### Passport
```
POST /api/passport                → Issue annual passport
GET  /api/passport/:id            → Get passport details
POST /api/passport/:id/redeem     → Gate scan redemption (requires JWT: gate)
GET  /api/passport/:id/history    → Redemption log
```

---

## 💡 Quick API Test with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Create a booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "park": "WATER_DAY",
    "visit_date": "2026-07-20",
    "adults": 2,
    "children": 1,
    "payment_mode": "UPI",
    "customer_name": "Test User",
    "customer_mobile": "9876543210"
  }'

# Get that booking back
curl http://localhost:3000/api/bookings/BKXXXXXX

# Calendar for July 2026
curl http://localhost:3000/api/calendar/WATER_DAY/2026/7

# Staff login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rajesh@wow.in","password":"password"}'
```

---

## 🔐 Staff Login Credentials (Development Only)

| Name | Email | Password | Role |
|---|---|---|---|
| AKM Super Admin | akm@indiagully.com | password | super_admin |
| Rajesh Kumar | rajesh@wow.in | password | admin |
| Priya Finance | priya.fin@wow.in | password | finance |
| Sneha CRM | sneha.crm@wow.in | password | crm |
| Ravi Gate | ravi.gate@wow.in | password | gate |
| Sanjay Sales | sanjay@wow.in | password | sales |

> ⚠️ Change all passwords before going live: `node -e "require('bcryptjs').hash('NewPassword',10).then(console.log)"`

---

## 🧪 Run Tests

```bash
npm test
```

Tests cover:
- Pricing engine unit tests (all category/park combinations, GST, group discount, offers)
- Booking API integration tests (create, fetch, validation errors)
- Health endpoint

---

## 📊 Load Testing with k6

Install k6: https://k6.io/docs/getting-started/installation/

```bash
# Full stress test (smoke → load → stress → spike)
k6 run k6/stress-test.js -e API_URL=http://localhost:3000

# Pure write throughput benchmark (100 VUs × 1 min)
k6 run k6/api-benchmark.js -e API_URL=http://localhost:3000

# With HTML report
k6 run --out json=results.json k6/stress-test.js
```

### Scenarios in `stress-test.js`
| Scenario | VUs | Duration | Purpose |
|---|---|---|---|
| Smoke | 5 | 30s | Quick sanity check |
| Load | 50 | 2m | Normal expected load |
| Stress | 0→200 ramp | 4.5m | Find breaking point |
| Spike | 0→500 burst | 50s | Flash sale simulation |

---

## 🐳 Docker (Full Stack)

```bash
# Start everything (Postgres + Redis + API)
docker-compose up

# Start with pgAdmin GUI at http://localhost:5050
docker-compose --profile tools up

# Rebuild API image after code changes
docker-compose up --build api
```

---

## 🏭 Production Deployment Notes

1. Set `NODE_ENV=production` in `.env`
2. Use a managed PostgreSQL (AWS RDS, Supabase, Neon, Railway)
3. Use a managed Redis (Upstash, Redis Cloud)
4. Set a real 64-byte random `JWT_SECRET`
5. Use production Razorpay keys (`rzp_live_...`)
6. Add this server URL to Razorpay Webhook settings
7. Enable SSL on PostgreSQL connection (`ssl: { rejectUnauthorized: true }`)
8. Put behind Nginx or a CDN (Cloudflare) for TLS termination

---

## 🔗 Connect stress-test.html to This Backend

In `stress-test.html`, the API calls go to `tables/stress_bookings` (the platform's built-in API).

To point them at **this Node backend** instead, change the fetch URLs:

```js
// OLD (platform Tables API)
fetch('tables/stress_bookings', { method:'POST', ... })

// NEW (this Express backend)
fetch('http://localhost:3000/api/stress/bookings', { method:'POST', ... })
```

The `/api/stress/bookings` and `/api/stress/runs` routes accept the exact same JSON payload structure.
