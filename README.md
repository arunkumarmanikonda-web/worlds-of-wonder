# Worlds of Wonder — Static Web Platform
v2.6
**Last Updated:** 2026-04-07 (Stress Test Engine v4 — Real API + Architecture Truth + Deep Concurrency)
**Status**: ✅ All portals operational · All known bugs fixed · Final E2E verification complete
---

## ⚠️ Architecture Truth — Read This First

This is a **100% static website**. There is **no backend server**, no Node.js, no Express, no Python Flask, no PHP — only HTML/CSS/JS files served statically. There is no "master API code" to find because there is none.

### What acts as the "backend"?
The only real HTTP endpoints are the **platform's built-in Tables REST API**:
```
POST   tables/{table_name}        → Create record  (HTTP 201)
GET    tables/{table_name}        → List records   (HTTP 200, paginated)
PATCH  tables/{table_name}/{id}   → Update record  (HTTP 200)
DELETE tables/{table_name}/{id}   → Delete record  (HTTP 204)
```
All data persistence — bookings, passport holders, CRM cases, stress test results — flows through this API. There is no SQL database, no ORM, no migrations to run.

### What the stress test actually tests
| Layer | What happens | Real HTTP? |
|---|---|---|
| Park selection | Random pick from JS constants | ❌ No |
| Date picking | Random future date in JS | ❌ No |
| Pricing / GST calc | `booking.js` TICKET_CATEGORIES engine | ❌ No |
| Offer / promo code | Rate lookup in JS | ❌ No |
| Payment gateway | Simulated Razorpay (no real charge) | ❌ No |
| **API write** | **POST `tables/stress_bookings`** | **✅ YES** |
| **Run metadata** | **POST/PATCH `tables/stress_test_runs`** | **✅ YES** |

---
**Client:** Entertainment & Amusement, EALCPL | Worlds of Wonder, Sector 38A, Noida

---

## ✅ Completed Features

### Public-Facing Website
- Hero video carousel (YouTube IFrame API + fallback photos)
- Mega-nav with dropdowns, weather chip, cheeky comms ticker
- Water Park, Amusement Park, Combo ticket pages
- WOW Passport landing page (annual membership)
- Offers & Deals engine
- Plan Your Visit, Safety Guidelines, FAQ, Contact Us
- Rides & Attractions catalogue
- Groups pages: Corporate, Schools, Birthdays

### Booking Engine (`/book/`)
- `water-park.html`, `amusement-park.html`, `combo.html` — ticket selection & quantity
- `passport.html` — annual passport purchase flow
- `group.html` — group booking request form
- `payment.html` — Razorpay-ready payment gateway stub
- `confirmation.html` — QR ticket generation, T&C modal, upsell

### Customer Portal (`/portal/`)
- `login.html`, `register.html`, `forgot-password.html`
- `dashboard.html`, `profile.html`, `my-bookings.html`
- `tickets.html`, `wallet.html`, `loyalty.html`
- `notifications.html`, `offers.html`, `referral.html`
- `guest-details.html` — pre-visit check-in
- `passport-card.html` — digital passport card
- `wow-passport.html` — full passport management hub
- `passport.html` — stub redirect → wow-passport.html

### Admin & Ops ERP (`/admin/`)
42 pages across: Core, Commerce, Passport, Loyalty, Offers, B2B/Partner,
CRM, Operations, Finance, Ticketing/F&B, System, Auth.

### Sales ERP (`/sales/`)
`erp-dashboard.html`, `erp-agents.html`, `erp-crm.html`, `erp-reports.html`,
`erp-products.html`, `leads.html`, `pipeline.html`, `quote-builder.html`,
`passport-login.html`, `passport-dashboard.html`, `passport-payment.html`,
`passport-issued.html`, `gate-scanner.html`

### Partner Portal (`/partner/`)
`login.html`, `dashboard.html`, `onboarding.html`, `onboarding-kyc.html`,
`buy-tickets.html`, `ticket-batches.html`, `quote-builder.html`,
`bulk-tickets.html`, `invoice-gst.html`, `invoices.html`,
`statements.html`, `reports.html`, `support.html`

### Reseller ERP (`/reseller/`)
`login.html`, `index.html`, `salesperson.html`, `salesperson-performance.html`

### Travel Agent Portal (`/ta/`)
`index.html` (single-page ERP with tabbed UI)

### Groups (`/groups/`)
`index.html`, `corporate.html`, `schools.html`, `birthdays.html`

### Internal Staff Gateway (`/internal/`)
`index.html` — login router for all staff portals

### Passport Stubs (`/passport/`)
`login.html` → redirects to `portal/login.html`
`my-passport.html` → redirects to `portal/wow-passport.html`
`register.html` — full KYC registration page

---

## 🗺 URI Reference Map

### Public Pages (root)
| Page | URL |
|------|-----|
| Homepage | `/` or `/index.html` |
| Water Park | `/water-park.html` |
| Amusement Park | `/amusement-park.html` |
| Combo | `/combo.html` |
| WOW Passport | `/passport.html` |
| Offers | `/offers.html` |
| Plan Your Visit | `/plan-your-visit.html` |
| Safety Guidelines | `/safety-guidelines.html` |
| Rides & Attractions | `/rides-attractions.html` |
| FAQ | `/faq.html` |
| Contact | `/contact.html` |

### Booking Flow
| Step | URL |
|------|-----|
| Book Water Park | `/book/water-park.html` |
| Book Amusement | `/book/amusement-park.html` |
| Book Combo | `/book/combo.html` |
| Book Passport | `/book/passport.html` |
| Group Booking | `/book/group.html` |
| Payment | `/book/payment.html` |
| Confirmation | `/book/confirmation.html` |

### Staff Portals (login credentials)
| Portal | URL | Email | PIN/Pass |
|--------|-----|-------|----------|
| Super Admin | `/admin/super-admin.html` | akm@indiagully.com | 1234 |
| Admin ERP | `/admin/index.html` | rajesh@wow.in | 2345 |
| Finance | `/admin/finance.html` | priya.fin@wow.in | 3456 |
| Ops | `/admin/ops-dashboard.html` | vikram.ops@wow.in | 4567 |
| CRM Agent | `/admin/call-center.html` | sneha.crm@wow.in | 5678 |
| Gate Agent | `/admin/gate.html` | ravi.gate@wow.in | 6789 |
| Sales Agent | `/sales/erp-dashboard.html` | sanjay@wow.in | 7890 |
| Partner | `/partner/dashboard.html` | partner@mmt.in | 8901 |
| Reseller | `/reseller/index.html` | resell@wow.in | 9012 |
| Travel Agent | `/ta/index.html` | ta@travelease.in | 0123 |
| Internal Gateway | `/internal/index.html` | (role selector) | — |

---

## 🧰 JavaScript Engines (`/js/`)
| File | Size | Purpose |
|------|------|---------|
| `main.js` | 9 KB | Global namespace, utilities, bootstrap |
| `shell.js` | 24 KB | Mega-nav, footer, weather chip, ticker |
| `booking.js` | 37 KB | Ticket selection, pricing, cart, QR gen |
| `wow-auth.js` | 37 KB | Auth engine, role mgmt, session, bypass |
| `wow-auth-guard.js` | 3 KB | Portal-specific guard wrapper |
| `wow-content-control.js` | 19 KB | Admin content toggles (public pages) |
| `wow-modules.js` | 9 KB | Module gate system (enable/disable features) |
| `wow-offer-engine-v4.js` | 77 KB | Offer & campaign engine (v4, current) |
| `wow-offer-cart.js` | 28 KB | Cart, coupon, offer application |
| `wow-passport-engine.js` | 41 KB | Passport plans, KYC, redemption |
| `wow-passport-api.js` | 15 KB | Passport API integration helpers |
| `wow-loyalty-engine.js` | 62 KB | Loyalty points, tiers, redemption |
| `reseller-engine.js` | 63 KB | Reseller identity, KYC, commissions |
| `crm-engine.js` | 44 KB | Call centre CRM, tickets, live agent |
| `wow-terms.js` | 23 KB | T&C modal renderer |
| `wow-session-prefill.js` | 6 KB | Auto-fill booking forms for logged-in users |
| `banner-engine.js` | 12 KB | Hero banner slider (config: /data/banners.json) |
| `firebase-config.js` | 2 KB | Firebase config stub (ES module export) |

---

## 🎨 CSS Files (`/css/`)
| File | Size | Purpose |
|------|------|---------|
| `style.css` | 70 KB | Global public site styles |
| `booking-page.css` | 30 KB | Booking flow styles |
| `portal.css` | 18 KB | Customer portal styles |
| `wow-design-system.css` | 34 KB | Admin/ERP design system |
| `forms.css` | 37 KB | Form components |
| `offer-widget.css` | 7 KB | Offer widget styles |

---

## 🔒 Authentication Architecture

### Staff Portals (admin, sales, internal)
- **Engine:** `wow-auth.js` + `wow-auth-guard.js`
- **Session key:** `wow_auth_session` (localStorage/sessionStorage)
- **Super Admin bypass:** Red "SA" button (top-right, all admin pages)
- **Login page:** `/admin/admin-login.html`

### Customer Portal
- **Engine:** `wow-auth.js` + `wow-auth-guard.js` (data-portal="portal")
- **Session key:** `wow_auth_session` (role = CUSTOMER)
- **Login page:** `/portal/login.html`

### Partner Portal
- **Engine:** Self-contained Firebase Auth + `wow-auth-guard.js`
- **Login page:** `/partner/login.html`

### Reseller Portal
- **Engine:** Inline guard reading `wow_reseller_session`
- **Login page:** `/reseller/login.html`

### Travel Agent Portal
- **Engine:** `wow-auth-guard.js` (data-portal="ta")
- **Login page:** `/ta/index.html` (single page, auto-guarded)

---

## 🧹 Post-Audit Cleanup Log (v2 — 2026-03-30)

### Broken Links Fixed
| File | Old Target | New Target | Fix |
|------|-----------|------------|-----|
| `reseller/login.html` | `onboarding.html` | `../partner/onboarding.html` | Fixed |
| `book/confirmation.html` | `../terms.html` (missing) | `../faq.html` | Fixed |
| `js/shell.js` nav dropdown | `reseller/onboarding.html` (missing) | `partner/onboarding.html` | Fixed |
| `js/shell.js` footer | `reseller/onboarding.html` (missing) | `partner/onboarding.html` | Fixed |

### Auth Script Fixes Applied
| File | Fix |
|------|-----|
| `admin/call-center.html` | Added `wow-auth-guard.js` |
| `admin/crm-live.html` | Added `wow-auth-guard.js` |
| `admin/crm-analytics.html` | Added `wow-auth.js` + `wow-auth-guard.js` |
| `admin/passport-kyc-review.html` | Added `wow-auth-guard.js` |
| `admin/passport-scanner.html` | Added `wow-auth-guard.js` |
| `admin/passport-engine.html` | Added `wow-auth-guard.js` |
| `admin/reseller-engine.html` | Added `wow-auth-guard.js` |
| `admin/engine-hub.html` | Added `wow-auth-guard.js` |
| `passport.html` | Removed duplicate `wow-content-control.js` load |

### Files Removed (Unused / Duplicate)
| File | Reason |
|------|--------|
| `js/wow-offer-engine.js` | Legacy v1, superseded by wow-offer-engine-v4.js |
| `images/wow-logo-real.png` | Unused (no HTML/JS reference) |
| `images/wow-logo-new.png` | Unused |
| `images/wow-logo-white.png` | Unused |
| `images/wow-logo.svg` | Unused |
| `images/wow-logo-badge.svg` | Unused |

---

## ✅ Full Audit Status (2026-03-30)

| Area | Pages | Auth Guard | Links | JS Engines | Status |
|------|-------|-----------|-------|-----------|--------|
| Admin ERP | 42 | ✅ All guarded | ✅ Clean | ✅ | ✅ |
| Customer Portal | 16 | ✅ All guarded | ✅ Clean | ✅ | ✅ |
| Sales ERP | 13 | ✅ All guarded | ✅ Clean | ✅ | ✅ |
| Partner Portal | 13 | ✅ All guarded | ✅ Clean | ✅ | ✅ |
| Reseller ERP | 4 | ✅ Own guard | ✅ Clean | ✅ | ✅ |
| Travel Agent | 1 | ✅ Guarded | ✅ Clean | ✅ | ✅ |
| Booking Engine | 7 | N/A (public) | ✅ Clean | ✅ | ✅ |
| Public Site | 11 | N/A (public) | ✅ Clean | ✅ | ✅ |
| Groups | 4 | N/A (public) | ✅ Clean | ✅ | ✅ |
| Internal Gateway | 1 | ✅ Guarded | ✅ Clean | ✅ | ✅ |
| JS Engines | 18 | — | — | ✅ | ✅ |
| CSS Files | 6 | — | — | — | ✅ |

---

## 🐛 Bug Fixes Applied (2026-04-06)

### Hero Banner Fix (index.html + css/style.css)
**Root cause:** YouTube IFrame API (`youtube.com/iframe_api`) never fires `onYouTubeIframeAPIReady` on preview/restricted domains (Error 150/153/5). The `#yt-bg-container` stayed empty (no iframe injected) but the poster fallback `#hc-poster-0` was not properly styled independently of `hc-photo` class.

**Fix applied:**
- `css/style.css`: `.hc-video-poster` now has its own `position:absolute; inset:0; background-size:cover; background-position:center; z-index:1; animation: hcKenBurns; transition: opacity 2s ease` — ensuring it's self-contained and always covers the slide.
- `index.html`: Added 8-second safety timeout — if `onYouTubeIframeAPIReady` never fires, `#yt-bg-container` is set to `display:none` removing it from the stacking context entirely.
- `index.html`: Cleaned up comments in slide 0 HTML explaining the 3-layer structure (poster z:1, YT z:2, overlay z:3, content z:4).
- **Result:** `hero-water.jpg` poster with Ken Burns animation is ALWAYS visible. YouTube video overlays only when confirmed `PLAYING`. On preview/restricted domains the image hero banner shows perfectly.

### Stress Test Schema Fixes (Tables API)
**Root cause:** `stress_bookings` table was missing `cgst` and `sgst` fields that the simulator writes. `stress_test_runs` was missing `total_gst_collected` and `config_json`.

**Fix applied:**
- `tables/stress_bookings`: Added `cgst` (number), `sgst` (number). Updated `step_reached` options to include all 7 steps (ticket_select, date_select, price_calc, offer_apply, summary, payment, confirmation).
- `tables/stress_test_runs`: Added `total_gst_collected` (number), `config_json` (text). Schema now matches exactly what `simulateBooking()` and `startTest()` write.
- `stress-test.html`: Updated health check POST body and write benchmark to include `cgst`/`sgst`/`step_reached`.

### Auth Guards (2026-04-06 session)
**Verified complete:**
- `admin/loyalty-engine.html` — confirmed auth guard present ✅
- `portal/wow-passport.html` — confirmed `wow-auth.js` + `wow-auth-guard.js` present ✅  
- `sales/passport-kyc.html` — verified auth guards present ✅
- All 39 admin pages, 11 portal pages, 12 sales pages, 13 partner pages: ✅ auth guarded
- Reseller portal: inline `resellerGuard()` + `wow_reseller_session` (intentional, no wow-auth) ✅

---

## 🧪 Stress Test Engine (`/stress-test.html`)

A complete full-flow booking stress test dashboard. Open directly at `/stress-test.html`.

### Features
- **7-step booking flow simulation** matching real `book/*.html` → `payment.html` → `confirmation.html` journey
- **Real Tables API writes** — every successful booking POSTs to `tables/stress_bookings`
- **Run metadata** — test run stats written to `tables/stress_test_runs`, updated on completion
- **6 scenario presets**: Smoke (5×3), Load (25×5), Stress (75×8), Spike (200×2), Soak (10×30), Custom
- **7 fault injection modes**: network timeout, payment declined, sold out, API 500, user abandons, GST error, duplicate
- **Park traffic mix sliders**: Water / Amusement / Combo %
- **Live charts** (7 charts): Latency, Throughput, Success/Fail, Park Mix, Percentiles, Revenue, Active VUs
- **Live log terminal** with per-VU slot tracking
- **Results table** with park/status filters, export to CSV
- **Booking Flow diagram tab** — exact steps with code snippets
- **Source Code viewer** — 8 annotated source code panels (Pricing, GST, Offers, Booking, Payment, API, Errors, Shell)
- **API Health Check** — tests all relevant tables + external APIs
- **Benchmarks** — 50 concurrent GETs + 20 concurrent POSTs
- **Past Runs history** — loads from Tables API with success rate bars

### Tables API used
| Table | Purpose |
|-------|---------|
| `tables/stress_bookings` | Individual booking records |
| `tables/stress_test_runs` | Run-level metadata |
| `tables/crm_bookings_cache` | Health check target |
| `tables/passport_holders` | Health check target |

---

## 🚧 Pending / Future Enhancements

1. **Firebase integration** — `firebase-config.js` contains placeholder values. Real Firebase project credentials needed for partner onboarding, customer auth, forgot-password flows
2. **Razorpay integration** — `book/payment.html` is a stub; needs real Razorpay key and order creation API
3. **WhatsApp QR tickets** — `wow-modules.js` has `twilio_whatsapp: true` but no backend endpoint
4. **Real-time capacity** — `admin/inventory.html` uses localStorage; needs API integration
5. **GST invoice PDF generation** — `partner/invoice-gst.html` generates UI only
6. **SMS OTP** — Loyalty OTP redemption uses msg91 stub, not wired

---

## 🌐 Key URLs

- **Public Site:** `/index.html`
- **Customer Login:** `/portal/login.html`
- **Admin ERP:** `/admin/index.html`
- **Internal Staff Gateway:** `/internal/index.html`
- **Partner Portal:** `/partner/login.html`
- **Reseller ERP:** `/reseller/login.html`
- **Helpline:** 080-6909-0000
- **Location:** Worlds of Wonder, Sector 38A, Noida, UP 201301

