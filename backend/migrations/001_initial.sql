-- ============================================================
--  WOW Booking Platform — Master Database Schema
--  PostgreSQL 16
--  Run with: psql $DATABASE_URL -f migrations/001_initial.sql
--  Or via:   npm run migrate
-- ============================================================

\echo 'Running WOW migrations...'

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
--  STAFF USERS  (Admin, Sales, Gate, CRM, Finance etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(120)  NOT NULL,
  email           VARCHAR(120)  UNIQUE NOT NULL,
  password_hash   VARCHAR(255)  NOT NULL,
  role            VARCHAR(40)   NOT NULL DEFAULT 'staff'
                  CHECK (role IN ('super_admin','admin','finance','ops','crm','gate','sales','partner','reseller','ta')),
  zone            VARCHAR(60),
  mobile          VARCHAR(15),
  active          BOOLEAN       DEFAULT true,
  failed_logins   SMALLINT      DEFAULT 0,
  last_login      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
--  BOOKINGS  (Core transaction table)
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref     VARCHAR(30)   UNIQUE NOT NULL,
  session_id      VARCHAR(60),
  park            VARCHAR(20)   NOT NULL
                  CHECK (park IN ('WATER_DAY','AMUSEMENT_DAY','COMBO_DAY')),
  visit_date      DATE          NOT NULL,

  -- Ticket quantities per category
  adults          SMALLINT      NOT NULL DEFAULT 0,
  children        SMALLINT      NOT NULL DEFAULT 0,
  seniors         SMALLINT      NOT NULL DEFAULT 0,
  armed           SMALLINT      NOT NULL DEFAULT 0,
  differently_abled SMALLINT    NOT NULL DEFAULT 0,
  ticket_total    SMALLINT      NOT NULL,

  -- Pricing (all in INR ₹, not paise)
  base_amount     INTEGER       NOT NULL,   -- net pre-GST amount
  gst_amount      INTEGER       NOT NULL,   -- total GST
  cgst            INTEGER       NOT NULL,   -- CGST 9%
  sgst            INTEGER       NOT NULL,   -- SGST 9%
  grand_total     INTEGER       NOT NULL,   -- customer pays this

  -- Offer / promo
  offer_code      VARCHAR(20),
  offer_discount  INTEGER       NOT NULL DEFAULT 0,

  -- Payment
  payment_mode    VARCHAR(20)   CHECK (payment_mode IN ('UPI','Card','Cash','NetBanking')),
  payment_status  VARCHAR(20)   NOT NULL DEFAULT 'pending'
                  CHECK (payment_status IN ('pending','paid','failed','refunded')),
  razorpay_order_id   VARCHAR(80),
  razorpay_payment_id VARCHAR(80),

  -- Booking status
  booking_status  VARCHAR(20)   NOT NULL DEFAULT 'pending'
                  CHECK (booking_status IN ('pending','confirmed','failed','refunded','cancelled')),

  -- Customer
  customer_name   VARCHAR(120),
  customer_email  VARCHAR(120),
  customer_mobile VARCHAR(15),
  customer_gstin  VARCHAR(20),

  -- Ticket QR (base64 PNG data URI)
  qr_code_data    TEXT,
  notes           TEXT,

  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_ref        ON bookings(booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_visit_date ON bookings(visit_date);
CREATE INDEX IF NOT EXISTS idx_bookings_park       ON bookings(park);
CREATE INDEX IF NOT EXISTS idx_bookings_status     ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created    ON bookings(created_at DESC);

-- ============================================================
--  CALENDAR EXCEPTIONS  (blocked / special-priced dates)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_exceptions (
  id                UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  park              VARCHAR(20) NOT NULL,
  date              DATE    NOT NULL,
  status            VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','limited','closed','maintenance','sold_out')),
  capacity_override INTEGER,      -- override default daily cap
  special_price     INTEGER,      -- override adult price for this date
  notes             VARCHAR(255),
  created_by        UUID    REFERENCES staff_users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(park, date)
);

-- ============================================================
--  PASSPORT HOLDERS  (Annual membership)
-- ============================================================
CREATE TABLE IF NOT EXISTS passport_holders (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id     VARCHAR(30)   UNIQUE NOT NULL,
  plan_code       VARCHAR(30)   NOT NULL,
  plan_label      VARCHAR(80),
  holder_name     VARCHAR(120)  NOT NULL,
  dob             DATE,
  contact         VARCHAR(15),
  email           VARCHAR(120),
  park_access     VARCHAR(20),
  max_entries     INTEGER       NOT NULL DEFAULT 365,
  entries_used    INTEGER       NOT NULL DEFAULT 0,
  valid_from      DATE          NOT NULL,
  valid_to        DATE          NOT NULL,
  amount_paid     INTEGER,
  payment_ref     VARCHAR(80),
  status          VARCHAR(20)   NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','expired','suspended','cancelled')),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
--  PASSPORT REDEMPTIONS  (Gate scan log)
-- ============================================================
CREATE TABLE IF NOT EXISTS passport_redemptions (
  id            UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_id   VARCHAR(30) NOT NULL REFERENCES passport_holders(passport_id),
  redeemed_at   TIMESTAMPTZ DEFAULT NOW(),
  gate_id       VARCHAR(30),
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_redemptions_passport ON passport_redemptions(passport_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_date     ON passport_redemptions(redeemed_at DESC);

-- ============================================================
--  STRESS TEST RUNS  (load test metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS stress_test_runs (
  id              VARCHAR(40)   PRIMARY KEY,
  run_label       VARCHAR(120),
  started_at      BIGINT,
  ended_at        BIGINT,
  concurrency     INTEGER,
  total_bookings  INTEGER,
  success_count   INTEGER       DEFAULT 0,
  failed_count    INTEGER       DEFAULT 0,
  timeout_count   INTEGER       DEFAULT 0,
  avg_latency_ms  NUMERIC(10,2),
  p95_latency_ms  NUMERIC(10,2),
  p99_latency_ms  NUMERIC(10,2),
  min_latency_ms  INTEGER,
  max_latency_ms  INTEGER,
  throughput_rps  NUMERIC(10,3),
  total_revenue   BIGINT        DEFAULT 0,
  total_gst       BIGINT        DEFAULT 0,
  avg_order_value INTEGER,
  parks_mix       JSONB,
  config_json     JSONB,
  status          VARCHAR(20)   DEFAULT 'running'
                  CHECK (status IN ('running','completed','aborted')),
  notes           TEXT,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

-- ============================================================
--  STRESS TEST BOOKINGS  (individual booking records per run)
-- ============================================================
CREATE TABLE IF NOT EXISTS stress_bookings (
  id              VARCHAR(40)   PRIMARY KEY,
  session_id      VARCHAR(60),
  run_label       VARCHAR(120),
  booking_ref     VARCHAR(40),
  park            VARCHAR(20),
  visit_date      DATE,
  adults          SMALLINT      DEFAULT 0,
  children        SMALLINT      DEFAULT 0,
  ticket_total    SMALLINT      DEFAULT 0,
  base_amount     INTEGER       DEFAULT 0,
  gst_amount      INTEGER       DEFAULT 0,
  cgst            INTEGER       DEFAULT 0,
  sgst            INTEGER       DEFAULT 0,
  grand_total     INTEGER       DEFAULT 0,
  offer_code      VARCHAR(20),
  offer_discount  INTEGER       DEFAULT 0,
  payment_mode    VARCHAR(20),
  booking_status  VARCHAR(20),
  step_reached    VARCHAR(30),
  latency_ms      INTEGER       DEFAULT 0,
  api_latency_ms  INTEGER       DEFAULT 0,
  error_msg       TEXT,
  concurrency_slot INTEGER,
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbk_session  ON stress_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_sbk_status   ON stress_bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_sbk_park     ON stress_bookings(park);
CREATE INDEX IF NOT EXISTS idx_sbk_created  ON stress_bookings(created_at DESC);

-- ============================================================
--  CRM BOOKINGS CACHE  (quick lookup for CRM agents)
-- ============================================================
CREATE TABLE IF NOT EXISTS crm_bookings_cache (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id      VARCHAR(30)   UNIQUE NOT NULL,
  customer_name   VARCHAR(120),
  customer_mobile VARCHAR(15),
  customer_email  VARCHAR(120),
  booking_date    DATE,
  visit_date      DATE,
  ticket_type     VARCHAR(30),
  ticket_count    SMALLINT,
  total_amount    INTEGER,
  payment_status  VARCHAR(20)   DEFAULT 'pending',
  booking_status  VARCHAR(20)   DEFAULT 'pending',
  notes           TEXT,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_mobile  ON crm_bookings_cache(customer_mobile);
CREATE INDEX IF NOT EXISTS idx_crm_email   ON crm_bookings_cache(customer_email);

\echo 'Migration complete!'
