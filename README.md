# Worlds of Wonder — EALCPL Digital Platform
### Complete Static Website · 100+ Pages · Full ERP Stack

**Status: Production-Ready Static Site** | Last Updated: 30 March 2026 (Sprint 11 COMPLETE + Sprint 12 Bug-Fix + Sprint 13 — Reseller Identity Engine fully implemented)

---

## 🎯 Project Overview

Worlds of Wonder (WOW), Noida — India's premier dual-park theme park destination (Water Park + Amusement Park). This is the complete digital platform covering the public website, customer portal, booking engine, admin ERP suite, and B2B partner portals — all as a static HTML/CSS/JS site.

- **Location**: Sector 38A, Noida, Uttar Pradesh
- **Parks**: Water Park (20+ rides) + Amusement Park (30+ rides)
- **Ticketing**: ₹1,299 (Water Park) · ₹1,199 (Amusement Park) · ₹1,999 (Combo) · ₹4,999 (Annual Passport)
- **GST**: 18% (CGST 9% + SGST 9%) on all B2C ticket sales

---

## 🐛 Sprint 12 Bug Fix Log (30 Mar 2026)

### Bug 1 — Super Admin bypass button did not open the login modal
**Root Cause:** `renderTopbarWidget(containerId)` returned early when the container element was not found (`if (!container) return`), which prevented `_injectBypassModal()` from being called. Pages that called `renderTopbarWidget('__dummy__')` to trigger modal injection therefore never got the modal injected.

**Fix** (`js/wow-auth.js`): `renderTopbarWidget` now injects the bypass modal unconditionally before the container guard check. The auto-inject floating button IIFE already handled DOMContentLoaded timing correctly and continues to work as before.

---

### Bug 2 — Offers configured in the admin panel (status: Live) did not appear on the booking frontend
**Root Cause:** `_computeStatus()` in the offer engine correctly handled `'paused'`, `'archived'`, `'draft'`, and `'expired'` but had no explicit branch for `'live'` (the v3 admin status string). While `'live'` fell through to the schedule check and ultimately returned `STATUS.ACTIVE`, a subtle interaction with the nested `else` block checking `STATUS.PAUSED`/`ARCHIVED`/`DRAFT` string constants could misidentify `'live'` in edge cases.

Additionally, `editOffer()` in `admin/offers.html` accessed `offer.parks` and `offer.categories` directly — crashing when editing v4 native DEFAULT_OFFERS (which use `conditionGroups` instead).

**Fixes:**
- `js/wow-offer-engine-v4.js` — `_computeStatus` now has an explicit `'live'` branch that explicitly falls through to the schedule/usage checks, ensuring no unintended early returns.
- `admin/offers.html` — `editOffer()` now extracts parks and categories from `conditionGroups` when `.parks`/`.categories` are absent (v4 native offers), and derives `type` and `value` from `actions[0]`.

---

### Bug 3 — Booking page was stuck after ticket selection; clicking Pay did not proceed
**Root Cause (infinite recursion):** `booking.js` defined `showSuccessModal` twice as a regular function declaration. Due to JavaScript function hoisting, both declarations were hoisted before any code ran. The line `const _origShowSuccessModal = showSuccessModal` at line ~963 therefore captured the *second* (overriding) declaration, not the first — meaning `_origShowSuccessModal` and `showSuccessModal` pointed to the same function. Calling `showSuccessModal()` triggered infinite recursion → stack overflow → the booking page froze after ticket selection and any "Pay" click.

**Root Cause (wrong flow):** Even without the recursion, `validateAndCheckout` showed a "Booking Confirmed!" modal *inline* on the booking page rather than redirecting to `book/payment.html`. The payment page had hardcoded dummy data and no connection to real booking data.

**Fixes:**
- `js/booking.js` — Removed the double declaration. `validateAndCheckout` now saves booking data to `sessionStorage` (`wow_booking`, `wow_tx_id`) and redirects to `payment.html`.
- `book/payment.html` — Now reads `sessionStorage.wow_booking` on load and dynamically populates the order summary, guest details panel, and GST table. On successful payment simulation, the confirmation card shows real guest name, mobile, visit date, booking ID, and QR code. If no session data is found (direct access), a user-friendly "No booking found" message is shown.

---

---

## 🏷️ Sprint 13 — Reseller Identity Code System (30 Mar 2026)

### Overview
Implemented a comprehensive, immutable Reseller Identity Architecture that flows through every core object in the platform. No batch, employee, ticket, QR record, or redemption log can exist without a traceable reseller code chain.

### Identity Code Architecture

#### §55 — Reseller Master Identity
- **Code Pattern:** `RS-{YEAR}-{SEQ4}` (configurable by Super Admin)
- **Immutability:** Code locked permanently at `activateReseller()` — `codeLockedAt` timestamp is set
- **Custom Codes:** Admin can specify `customCode` (e.g. `MMT-DELHI`) before activation
- **Registry Guard:** Global ID registry prevents duplicate codes across all resellers
- **Embedded In:** All downstream objects (batches, allocations, tickets, QR payloads, redemption logs, analytics, exports)

#### §56 — Bulk Batch Identity
- **Code Pattern:** `{RCODE}-{SEASON}-B{BSEQ3}` (e.g. `TM-INDIA-FY26-B001`)
- **Configurable:** Super Admin can change batch pattern and season string
- **Carries:** Reseller code as prefix + season label + sequential batch number
- **No Anonymous Batches:** Every batch must be assigned to an active reseller

#### §57 — Customer Ticket Identity
- **Code Pattern:** `{RCODE}-{ECODE_SHORT}-TKT-{TSEQ5}` (e.g. `TM-INDIA-SP001-TKT-00001`)
- **Full Chain Embedded:** Reseller code, batch code, employee code, allocation code all stored in every ticket record
- **QR Payload:** Base64 JWT-style payload containing the complete identity chain + nonce
- **Redemption Trace:** Every redemption log records the full chain

#### §58 — Employee/Salesperson Identity
- **Code Pattern:** `{RCODE}-SP{SEQ3}` (e.g. `TM-INDIA-SP001`)
- **Reseller Prefix Always Present:** Employee code inherits reseller prefix
- **Immutable from Assignment:** Even removed/suspended employees retain their code
- **Max Employees:** Configurable per reseller (default: 50)

#### §59 — Sub-Allocation Identity
- **Code Pattern:** `{ECODE}-A{ASEQ3}` (e.g. `TM-INDIA-SP001-A001`)
- **Full Trace:** Captures reseller code, employee code, parent batch code, quantity, dates, remaining balance, and recalls
- **Recall Support:** Admin can recall partial or full allocation back to batch pool

#### §63 — QR & Redemption Trace
- QR tokens are Base64-encoded JSON containing: ticketCode, resellerCode, batchCode, employeeCode, allocationId, productId, parkKey, visitDate, issuedAt, nonce
- Redemption records carry the full identity chain
- Audit trail entries always include: resellerId, resellerCode, employeeCode, batchCode, ticketCode

#### §64 — Immutability Rules
| Object | When Locked | Guard Mechanism |
|--------|-------------|-----------------|
| Reseller Code | On `activateReseller()` | `codeLockedAt` + `codeImmutableOnActivation` config flag |
| Employee Code | On creation | Protected fields list in `updateEmployee()` |
| Batch Code | On creation | Never in update path |
| Ticket Code | On issuance | Never updated |
| Allocation Code | On creation | Never updated |

### Files Implemented

| File | Description |
|------|-------------|
| `js/reseller-engine.js` | Core engine v1.0 — all identity code generators, CRUD, audit, reporting |
| `admin/reseller-engine.html` | **Super Admin Console** — 10-tab ERP with full CRUD modals, identity chain visualizer, central reports with all filters (by reseller code / batch code / salesperson code / date / channel / status), audit trail, immutable coding rules config |
| `reseller/index.html` | **Reseller ERP Dashboard** — Reseller-coded batch references, employee performance metrics, live balances, allocation management, ticket issuance, financial statements |
| `reseller/salesperson.html` | **Salesperson Performance Portal** — Multi-filter reports (date range, batch, employee code, channel, status), leaderboard with redemption rates and utilization metrics, individual ticket log with redemption trace |

### Central Report Filters (§62)
The central report tab in `admin/reseller-engine.html` supports all these filters simultaneously:
- Reseller code / name
- Batch code
- Salesperson code / name
- Date range (from / to)
- Ticket status (issued / redeemed / expired)
- Delivery channel (counter / online / field / digital)
- Quantities: issued, redeemed, expired, remaining

### Key Metrics Available (§61)
- Tickets sold (per SP, batch, reseller)
- Redemption rate %
- Utilization rate % (issued ÷ allocated)
- Balance remaining
- Revenue generated
- Commission earned
- Last sale date
- Batch breakdown per salesperson

### Demo Data
`ResellerEngine.seedDemoData()` auto-seeds on first load with:
- **3 Resellers**: TM-INDIA (Platinum), MMT-NCR (Gold), RS-2026-0003 (Silver)
- **7 Salespersons** with unique SP codes linked to their resellers
- **5 Batches** across different products and parks
- **7 Sub-Allocations** across salespersons
- **8+ Tickets** issued to sample customers (3 redeemed)
- Full audit trail of all operations

---

## 📁 Full File Tree

```
index.html                          # Homepage — Hero carousel, quick-book widget, park explorer
water-park.html                     # Water park landing page
amusement-park.html                 # Amusement park landing page
combo.html                          # Combo ticket page
offers.html                         # Offers & deals catalogue
passport.html                       # WOW Passport purchase page
contact.html                        # Contact form & info
plan-your-visit.html                # Visitor guide
rides-attractions.html              # Rides & attractions listing
safety-guidelines.html              # Safety rules
gallery.html                        # Photo gallery
faq.html                            # FAQ (searchable + filterable by category)

├── book/                           # BOOKING ENGINE
│   ├── water-park.html             # Water Park booking flow
│   ├── amusement-park.html         # Amusement Park booking flow
│   ├── combo.html                  # Combo booking flow
│   ├── group.html                  # ✅ Group booking (5-step: type → tickets → details → pay → confirm)
│   ├── passport.html               # Passport purchase booking
│   ├── payment.html                # ✅ Razorpay payment UI (cards, UPI, wallets, net-banking, GST split)
│   └── confirmation.html           # ✅ REBUILT: QR ticket + WhatsApp/Email delivery + ticket link + split fallback

├── portal/                         # CUSTOMER PORTAL
│   ├── login.html                  # Login (OTP / email / Google / Facebook / Business KYC)
│   ├── register.html               # Customer & business registration
│   ├── forgot-password.html        # Password reset
│   ├── dashboard.html              # ✅ UPGRADED: Rich dashboard (countdown, wallet, loyalty, QR, offers, charts)
│   ├── guest-details.html          # ✅ NEW: Booking step 2 — guest info, OTP verify, coins/promo, payment bridge
│   ├── tickets.html                # ✅ UPGRADED: My tickets + Ticket Split/Share (WhatsApp/Email per recipient)
│   ├── my-bookings.html            # Booking history & management
│   ├── wow-passport.html           # ✅ Indian-style e-Passport (3 tiers: Explore/Together/Legacy, MRZ, QR vouchers)
│   ├── passport-card.html          # Passport wallet card view
│   ├── loyalty.html                # Loyalty coins history & redemption
│   ├── wallet.html                 # WOW Wallet (top-up, history, auto-reload)
│   ├── offers.html                 # Personalised offers
│   ├── profile.html                # Account profile & settings
│   ├── referral.html               # ✅ NEW: Refer & Earn (unique code, share methods, leaderboard, tier progress, reward catalogue)
│   └── notifications.html          # ✅ UPGRADED: Rich notification centre (filters, tabs, mark-all-read, bulk select/delete, preferences panel, quiet hours)

├── admin/                          # ADMIN ERP (50+ pages)
│   ├── index.html                  # Admin dashboard (KPIs, activity feed)
│   ├── bookings.html               # ✅ UPGRADED: Full booking management (advanced filters, bulk actions, refund/cancel/reschedule flows, manual booking, 200-record dataset)
│   ├── tickets.html                # Tickets issued
│   ├── inventory.html              # ✅ UPGRADED: Full Capacity Management (live zone rings, ride slots, locker grid, F&B stock, daily allocation, stock movement log)
│   ├── pricing.html                # Legacy pricing config
│   ├── dynamic-pricing.html        # ✅ NEW: Dynamic Pricing Engine (peak/off-peak rules, surge calendar, price matrix, simulation, bulk overrides, scheduled changes, audit trail)
│   ├── offers.html                 # Offers & campaign management (legacy)
│   ├── offer-engine.html           # ✅ NEW: Offer Engine v4 Control Centre (offer CRUD, rule builder, scheduler, simulator, analytics, audit)
│   ├── offer-analytics.html        # ✅ NEW: CFO-Grade Offer Analytics Dashboard (revenue impact, leakage analysis, coupon trends, AOV lift)
│   ├── banners.html                # CMS banner management
│   ├── cms.html                    # Content management system
│   ├── crm.html                    # ✅ UPGRADED: Full CRM (lead pipeline Kanban, contact profiles, deal stages, activity feed, email/call log)
│   ├── call-center.html            # Call centre ERP (Hinglish AI agent, escalation, refunds)
│   ├── gate.html                   # Gate QR scanner & capacity monitoring
│   ├── ops-dashboard.html          # ✅ UPGRADED: Live Ops Command Centre (ticker, capacity rings, weather, incidents)
│   ├── revenue-analytics.html      # ✅ NEW: Full BI dashboard (trend, channel, hourly, forecast, 28-day table)
│   ├── finance.html                # ✅ UPGRADED: Full Finance Dashboard (P&L, daily revenue, receivables, payout tracker, reconciliation)
│   ├── gst-engine.html             # GST filing engine
│   ├── invoices.html               # Invoice management
│   ├── fnb-packages.html           # ✅ F&B Package Manager (CSV upload, quote builder, inventory)
│   ├── ticketing-engine.html       # Ticket configuration & allocation engine
│   ├── passport-engine.html        # ✅ SPRINT 11: Enterprise Passport Product Engine v2.0 (tier CRUD, product SKUs, voucher library, offer attachment, entry rights, KYC rules, analytics charts, passport records, audit log, import/export config)
│   ├── passport-kyc-review.html    # ✅ SPRINT 11: KYC Review Console (application queue, completeness scoring, approve/reject/query, bulk actions, reviewer notes thread, status history, export CSV, demo seeder)
│   ├── passport-scanner.html       # ✅ SPRINT 11: Gate & Voucher Scanner (park entry + voucher redemption modes, QR token parsing, camera simulation, manual override with audit, session log, demo seed)
│   ├── passport-redemptions.html   # Passport voucher redemption log
│   ├── passport-products.html      # Passport plan configuration
│   ├── passport.html               # Passport admin view
│   ├── loyalty-engine.html         # Loyalty engine rules
│   ├── notifications.html          # Push notification engine (Hinglish templates)
│   ├── b2b-approvals.html          # B2B group booking approvals
│   ├── ta-approvals.html           # Travel agent / reseller KYC approvals
│   ├── reseller-config.html        # Reseller configuration
│   ├── partners.html               # Partner management
│   ├── users.html                  # User & role management (KYC, 2FA, audit)
│   ├── user-management.html        # Extended user management
│   ├── super-admin.html            # ✅ UPGRADED: Super Admin (KYC queue, role matrix, audit-log links, module toggles) + AuthGate panel
│   ├── auth-gate.html              # ✅ NEW: AuthGate Manager (portal guard toggles, user CRUD, SA PIN, access logs)
│   ├── admin-login.html            # ✅ NEW: Admin Login (role tabs, demo credentials, SA bypass)
│   ├── module-control.html         # Module on/off control
│   ├── api-secrets.html            # API secrets management
│   ├── config.html                 # System configuration
│   ├── settings.html               # Admin settings
│   ├── reporting.html              # Reports centre
│   ├── reports.html                # Report summaries
│   ├── audit-logs.html             # Full audit trail
│   ├── advisories.html             # Park advisories management
│   └── ops-dashboard.html          # See above

├── groups/                         # GROUP LANDING PAGES
│   ├── index.html                  # Groups hub
│   ├── corporate.html              # Corporate events & team outings
│   ├── schools.html                # School & college trips
│   └── birthdays.html              # Birthday party packages

├── partner/                        # PARTNER / TRAVEL AGENT PORTAL
│   ├── login.html                  # Partner login
│   ├── dashboard.html              # Partner dashboard (KPIs, commissions, quick actions)
│   ├── onboarding.html             # Partner onboarding flow
│   ├── onboarding-kyc.html         # Full B2B KYC (GST, PAN, bank, digital signature)
│   ├── buy-tickets.html            # ✅ UPGRADED: Full B2B Ticket Purchase (4-step flow, pricing tiers, real-time cart, GST invoice preview, QR voucher issuance, order history, bulk upload)
│   ├── bulk-tickets.html           # Bulk QR ticket generator
│   ├── quote-builder.html          # Quote builder (GST invoice preview)
│   ├── invoice-gst.html            # GST invoice generation
│   ├── statements.html             # Commission statements
│   ├── invoices.html               # Invoice list
│   ├── ticket-batches.html         # Ticket batch management
│   ├── reports.html                # Partner reports
│   └── support.html                # Support tickets

├── passport/                       # PASSPORT HOLDER MINI-PORTAL
│   ├── login.html                  # PIN / OTP passport login
│   ├── register.html               # Register + KYC + payment
│   └── my-passport.html            # Passport holder dashboard + vouchers

├── ta/                             # TRAVEL AGENT MINI-ERP
│   └── index.html                  # ✅ Leads Kanban, bookings, team, commission ledger, charts

├── sales/                          # SALES ERP (PASSPORT SALES TEAM)
│   ├── passport-login.html         # ✅ FIXED: Form-wrapped login (no browser warnings), 4 roles, demo quick-logins, live agents strip, user creation modal
│   ├── erp-dashboard.html          # ✅ UPGRADED: 10 tabs (+ Bulk Issue), live API sync for passports & KYC queue
│   ├── gate-scanner.html           # ✅ NEW: Passport Redemption Gate Scanner — zone selector, camera QR, manual entry, allow/deny feedback, beeps, scan log, live API redemption recording
│   ├── erp-crm.html                # CRM & leads
│   ├── erp-agents.html             # Agent performance
│   ├── erp-products.html           # Products catalogue
│   ├── erp-reports.html            # Sales ERP reports
│   ├── leads.html                  # Lead management
│   ├── passport-dashboard.html     # Agent passport dashboard
│   ├── passport-kyc.html           # ✅ UPGRADED: Full KYC + Table API persistence (wow_kyc), auto login-ID gen, offline fallback
│   ├── passport-payment.html       # ✅ UPGRADED: Saves payment (wow_payments) + auto-issues passport (wow_passports) on confirmation
│   ├── passport-issued.html        # ✅ Indian-style WOW Digital Passport, link to gate scanner
│   ├── quote-builder.html          # Quote builder
│   └── bulk-tickets.html           # Bulk ticket generation

├── reseller/                       # RESELLER ERP
│   └── index.html                  # ✅ Inventory cards, bulk QR (200 max), commission ledger (TDS 2%), team mgmt

├── internal/                       # INTERNAL STAFF PORTAL
│   └── index.html                  # Internal dashboard with role-based login

├── css/                            # STYLESHEETS
│   ├── style.css                   # Main public site styles
│   ├── wow-design-system.css       # Admin ERP design system
│   ├── booking-page.css            # ✅ UPDATED: Booking flow styles + buffet add-on styles
│   └── forms.css                   # Form component styles

├── js/                             # JAVASCRIPT
│   ├── shell.js                    # Global header/footer injector (shell architecture)
│   ├── main.js                     # Public site JS
│   ├── wow-modules.js              # Module feature flags
│   ├── banner-engine.js            # Banner/offer engine
│   ├── wow-offer-engine.js         # ✅ v3.0 (legacy — still present for reference)
│   ├── wow-offer-engine-v4.js      # ✅ NEW Sprint 9: Enterprise Offer Engine v4.0 (see §Offer Engine below)
│   ├── wow-passport-engine.js      # ✅ SPRINT 11: WOW Passport Engine v1.0 — full in-browser engine: config store, tier/product master, voucher library, QR tokenizer, redemption engine, KYC state machine, renewal engine, analytics, audit trail (17 public APIs)
│   ├── wow-passport-api.js         # ✅ Shared Table API utility — CRUD helpers, ID generators, KYC/payment/passport/redemption methods, bulk issuance, MRZ/QR generation
│   ├── wow-auth.js                 # ✅ AuthGate Engine v1.0 — roles, sessions, SA bypass modal, portal guard, topbar widget
│   ├── wow-auth-guard.js           # ✅ Drop-in auth guard script for any portal page
│   └── wow-content-control.js      # ✅ COMPLETE Sprint 8: Content Control Engine v2.0 — 19 section toggles, 16 product toggles, text/HTML overrides, booking/QBB integration

├── images/                         # ASSETS
│   ├── logo.png                    # WOW Logo (white — hard adopted, no modifications)
│   └── [hero, ride images]

├── data/                           # STATIC DATA
├── _redirects                      # Netlify redirects
├── _headers                        # Security headers (CSP, HSTS)
├── github-push.html                # GitHub sync utility
└── README.md                       # This file
```

---

## 🌐 Key URLs & Entry Points

### Public Site
| URL | Description |
|-----|-------------|
| `/index.html` | Homepage — hero carousel, quick-book widget, explore parks |
| `/water-park.html` | Water Park landing page |
| `/amusement-park.html` | Amusement Park landing page |
| `/combo.html` | Combo ticket page |
| `/passport.html` | Annual Passport purchase |
| `/offers.html` | Current offers catalogue |
| `/faq.html` | FAQ (searchable, categorised) |
| `/plan-your-visit.html` | Visitor information |

### Booking Flow
| URL | Description |
|-----|-------------|
| `/book/water-park.html` | ✅ Water Park booking — max 8 tickets enforced, offer engine (BOGO/flash/auto), buffet add-on, promo code |
| `/book/amusement-park.html` | ✅ Amusement Park booking — same offer/buffet engine |
| `/book/combo.html` | ✅ Combo booking — same offer/buffet engine, family BOGO support |
| `/book/group.html` | Group booking (5 steps: type → tickets → details → pay → confirm) |
| `/portal/guest-details.html` | Step 2 guest info (OTP verify, coins/promo, GST) |
| `/book/payment.html` | Payment (Razorpay: cards/UPI/wallets/net-banking) |
| `/book/confirmation.html` | ✅ **REBUILT**: QR e-ticket, WhatsApp & Email delivery, shareable ticket link, delivery status tracker, SMS fallback |

### 🆕 Passport Sales Portal (Full End-to-End Workflow)
| URL | Description |
|-----|-------------|
| `/sales/passport-login.html` | **Agent Login** — 4 roles (Agent/Manager/Supervisor/Admin), demo quick-logins, active agents strip, Create Agent modal |
| `/sales/passport-kyc.html` | **Full KYC** — 4-step wizard: Select Plan → Live Photo Capture (camera + upload, Indian passport guidelines) → Customer Details (name/DOB/gender/email/phone/address/ID proof) → Review & Confirm + **auto login-ID generation** |
| `/sales/passport-payment.html` | **Payment** — Cash (denomination buttons, change calculator), UPI QR (countdown timer, share via WhatsApp), Card/POS (live card visualisation), animated success overlay, receipt modal, SMS sender |
| `/sales/passport-issued.html` | **Digital Passport** — Authentic Indian-style booklet: gold emblem cover, biometric data page, entry limits, plan benefits, vouchers, MRZ zone, hologram strip, customer login credentials card, WhatsApp/email share |
| `/sales/erp-dashboard.html` | **Salesforce ERP** — 10 tabs: Overview (charts, funnel, leaderboard), Passports ledger, KYC Queue (approve/reject), Payments, Agents (CRUD cards), Targets, Leaderboard, Reports (4 charts), Activity Feed, **Bulk Issue** (CSV upload, manual add, progress overlay, results summary) |
| `/sales/gate-scanner.html` | **🆕 Gate Scanner** — Passport redemption terminal: zone selector (Water/Amusement/F&B/Parking/Photo), camera QR scanning, manual ID entry, real-time allow/deny with audio+visual feedback, scan log with filters, live API redemption recording |
| `/admin/passport-engine.html` | **Admin Config** — Plan CRUD (price/validity/F&B discount/commission/vouchers/benefits all editable), GST settings, validity & expiry rules, login-ID format, SMS/email templates, commission structure per role, TDS config, config audit log |

#### Complete E2E Workflow (Sprint 5)
```
Login as Agent → KYC (Photo + Details + API save) → Auto Login-ID Generated → Payment (API save)
     → Passport Issued (API save) → Gate Scanner validates QR → Redemption recorded
                  ↓
Admin configures plans/prices/vouchers/validity → ERP tracks agents/targets/commissions
                  ↓
Bulk Issuance: Upload CSV → Validate → Save KYC + Payment + Passport for all records in batch
```

### 🛡️ Sprint 7 — AuthGate COMPLETE: Role-Based Access Control

> **Every single protected page across all 6 portals (80+ pages) now has AuthGate.**  
> The Super Admin `🛡 SA` bypass button is visible at the **extreme top-right** of every page — no login required to enter as Super Admin.

#### Architecture (`js/wow-auth.js` v1.0 + `js/wow-auth-guard.js`)
| Component | Detail |
|-----------|--------|
| **Central Auth Engine** | `js/wow-auth.js` — single source of truth for all portals |
| **Smart Guard** | `WOWAuth.smartGuard(portal)` — detects portal, shows login overlay or redirects |
| **Auth Guard Script** | `js/wow-auth-guard.js` — drop-in `<script data-portal="admin">` for any page |
| **Session TTL** | 8-hour auto-expire (configurable in AuthGate Manager) |
| **localStorage** | Users, config, and access logs persisted across tabs |
| **sessionStorage** | Active session (expires on browser close) |
| **Coverage** | 80+ pages across 6 portals — **100% complete** |

#### 🔴 Super Admin Bypass — Extreme Top-Right (No Login Required)
| Feature | Detail |
|---------|--------|
| **SA Button** | Red `🛡️ SA` button **always** visible at extreme top-right on **every** portal page |
| **Floating fallback** | If page has no topbar widget, a fixed floating button is injected by `wow-auth-guard.js` |
| **4-digit PIN** | Default `1234` — change in AuthGate Manager `/admin/auth-gate.html` |
| **Auto-submit** | Last digit filled → PIN auto-submits |
| **Page reload** | After bypass, page reloads with full Super Admin session active |
| **Works anywhere** | Works when logged out, wrong role, from login pages — always accessible |
| **Super Admin** | Arun Kumar M. · akm@indiagully.com · PIN: 1234 |

#### Role Map
| Role | Portal Access | Demo Credentials |
|------|--------------|-----------------|
| `SUPER_ADMIN` | **ALL portals** — bypasses all guards | akm@indiagully.com / **1234** |
| `ADMIN` | Admin ERP + Customer Portal | rajesh@wow.in / 2345 |
| `FINANCE` | Admin ERP | priya.fin@wow.in / 3456 |
| `OPS` | Admin ERP | vikram.ops@wow.in / 4567 |
| `CRM_AGENT` | Admin ERP | sneha.crm@wow.in / 5678 |
| `GATE_AGENT` | Admin ERP | ravi.gate@wow.in / 6789 |
| `SALES_AGENT` | Sales ERP | sanjay@wow.in / 7890 |
| `PARTNER` | Partner Portal | partner@mmt.in / 8901 |
| `RESELLER` | Reseller ERP | resell@wow.in / 9012 |
| `TA` | Travel Agent ERP | ta@travelease.in / 0123 |
| `CUSTOMER` | Customer Portal | OTP: 1234 |

#### Protected Portals — 100% Coverage
| Portal | Pages Guarded | Guard | Login Page |
|--------|:---:|-------|-----------|
| Admin ERP (`/admin/*`) | 40+ | ✅ AuthGate | `/admin/admin-login.html` |
| Customer Portal (`/portal/*`) | 14 | ✅ AuthGate | `/portal/login.html` |
| Sales ERP (`/sales/*`) | 13 | ✅ AuthGate | `/sales/passport-login.html` |
| Partner Portal (`/partner/*`) | 12 | ✅ AuthGate | `/partner/login.html` |
| Reseller ERP (`/reseller/*`) | 1 | ✅ AuthGate | `/reseller/index.html` |
| Travel Agent ERP (`/ta/*`) | 1 | ✅ AuthGate | `/ta/index.html` |
| Internal Staff (`/internal/*`) | 1 | Auth disabled (open) | `/internal/index.html` |

#### AuthGate Manager & Login Pages
| URL | Description |
|-----|-------------|
| `/admin/auth-gate.html` | **Full AuthGate Manager** — portal toggles, user CRUD, SA PIN change, access logs, session TTL |
| `/admin/admin-login.html` | **Admin Login Page** — role tabs, demo credential tiles, SA bypass button |
| `/admin/super-admin.html` → AuthGate tab | **Inline SA panel** — portal toggles, SA PIN widget, user summary |

#### How the Guard Works (per page)
```html
<!-- In <head> — loads auth engine -->
<script src="../js/wow-auth.js"></script>

<!-- Just before </body> — runs guard + injects SA button -->
<script src="../js/wow-auth-guard.js" data-portal="admin"></script>
```
1. `wow-auth-guard.js` runs `WOWAuth.smartGuard(portal)`
2. If **not logged in** → shows full-page login overlay (no redirect, stays on current URL)
3. If **wrong role** → clears session, shows overlay with allowed roles listed
4. If **Super Admin** → passes through regardless of portal
5. SA bypass button is **always injected** before the guard check completes

#### Key AuthGate API
```javascript
WOWAuth.smartGuard('admin', callback)   // Guard + callback on auth success
WOWAuth.openBypassModal()               // Show SA PIN modal (extreme top-right)
WOWAuth.renderTopbarWidget('elem-id')   // Render user chip + SA bypass button
WOWAuth.login(email, pin, portal)       // Authenticate user
WOWAuth.logout()                        // Clear session + redirect to login
WOWAuth.currentUser()                   // Get active session object
WOWAuth.isSuperAdmin()                  // true / false
WOWAuth.adminSaveUser(user)             // CRUD user from AuthGate Manager
WOWAuth.adminSaveConfig(cfg)            // Save portal/global config
WOWAuth.superAdminBypass(pin)           // Bypass login as Super Admin
```

### 🆕 Sprint 8 — Super Admin Live Control Engine (COMPLETE)

> **Every public page now reads configuration from `localStorage` set by the Super Admin panel.**  
> The Super Admin can disable parks, categories, sections, and banners — changes reflect on the public site on the next page load, with zero backend required.

#### Architecture (`js/wow-content-control.js` v2.0)
| Component | Detail |
|-----------|--------|
| **Central Config Store** | `wow_content_cfg` (sections), `wow_product_cfg` (products), `wow_content_overrides` (text), all in `localStorage` |
| **Section Visibility** | 19 named sections across Homepage + Booking pages, each with `data-wow-section` attribute |
| **Product Visibility** | 16 products/offerings (4 parks, 5 categories, 7 packages), each with `data-wow-product` attribute |
| **Content Overrides** | CSS-selector → new text mapping, applied by `WOWContent.apply()` on page load |
| **Public API** | `WOWContent.apply()`, `getProductCfg()`, `getSectionCfg()`, `saveSectionCfg()`, `saveProductCfg()`, `saveOverrides()`, `resetAll()` |
| **Booking integration** | `applyBookingCatToggles()` hides disabled ticket-category rows from the booking flow |
| **QBB integration** | `applyQBBToggles()` hides disabled park tabs from the Quick Book Widget |
| **Coverage** | All 9 public-facing pages call `WOWContent.apply()` on load |

#### Super Admin Panel — `/admin/super-admin.html` (6 Live-Control Modules)

| Module | Panel ID | What it does |
|--------|----------|-------------|
| **Products & Offerings Control** | `p-products` | Toggle parks/categories/packages on/off; summary counters; Enable All / Disable All per group; Save & Apply Live |
| **Page Sections Control** | `p-content` | Toggle 19 homepage + booking sections; inline text/HTML editing per field; Clear Overrides; page filter tabs (Homepage / Booking / All) |
| **Banner Manager** | `p-banners` | Manage hero banners for 4 sections (Homepage/Water/Amusement/Combo); image upload (stored as data: URL in localStorage); video URL; gradient fallback; overlay opacity, text alignment, badge/headline/subtitle/CTA per slide; reorder/delete slides |
| **Operational Calendar** | `p-calendar` | Per-park default open/closed; mini calendar with clickable days (open→closed→maintenance→limited→open cycle); quick-mark weekends/week/month; special date exceptions with notes; operating hours (open/last-entry/close) + max advance booking days |
| **Category Availability** | `p-categories` | Global on/off toggle per ticket category; date-range rules (enable/disable a category for a date range + park); price overrides per category per park type; all published to `wow_cat_config` for booking.js |
| **AuthGate Manager** | `p-authgate` | Portal protection toggles; Super Admin PIN change; user summary; links to full AuthGate page |

#### `js/wow-content-control.js` v2.0 — Public API Reference
```javascript
// ── READ ─────────────────────────────────────────────────────────
WOWContent.getSectionCfg()        // → { hero:{enabled,label}, quick_book_bar:{…}, … }
WOWContent.getProductCfg()        // → { WATER_DAY:{enabled,label,price,…}, … }
WOWContent.getOverrides()         // → { '.selector': 'override text', … }
WOWContent.getDefaults()          // → { sections: {…}, products: {…} }

// ── WRITE (super-admin only) ──────────────────────────────────────
WOWContent.saveSectionCfg(cfg)    // Persist section visibility to localStorage
WOWContent.saveProductCfg(cfg)    // Persist product visibility to localStorage
WOWContent.saveOverrides(cfg)     // Persist text overrides to localStorage
WOWContent.resetAll()             // Clear all three keys → back to defaults

// ── APPLY (every public page, once after DOM ready) ───────────────
WOWContent.apply()                // 1. Section vis  2. Product vis  3. Text overrides  4. Booking cat rows
WOWContent.applyQBBToggles(cfg)   // Hide disabled park tabs in Quick Book Widget
WOWContent.applyBookingCatToggles(cfg) // Hide disabled ticket-category rows
```

#### `data-wow-section` Attribute Map (all 19 sections)
| Key | Element | Page |
|-----|---------|------|
| `hero` | `#hero-section` | Homepage |
| `quick_book_bar` | `#quick-book-bar` | Homepage |
| `offer_strip` | `.offer-strip` | Homepage |
| `explore_parks` | `#explore` | Homepage |
| `why_wow_strip` | `.feature-strip-wrap` | Homepage |
| `attractions` | `[data-wow-section="attractions"]` | Homepage |
| `video_banner` | `.video-banner-section` | Homepage |
| `pricing` | `[data-wow-section="pricing"]` | Homepage |
| `tickets_cta` | `.cta-section` | Homepage |
| `passport` | `[data-module="passport_system"]` | Homepage |
| `groups_partners` | `[data-wow-section="groups_partners"]` | Homepage |
| `plan_your_visit` | `[data-wow-section="plan_your_visit"]` | Homepage |
| `weather_strip` | `[data-wow-section="weather_strip"]` | Homepage |
| `testimonials` | `#testimonials` | Homepage |
| `footer` | `footer, .site-footer` | All |
| `bk_hero` | `.bk-hero` | Booking |
| `bk_trust_strip` | `.bk-trust-strip` | Booking |
| `bk_buffet` | `#buffet-wrap` | Booking |
| `bk_promo` | `.promo-wrap` | Booking |
| `bk_upsell` | `.conf-upsell` | Confirmation |

#### localStorage Keys (Sprint 8)
| Key | Purpose | Written by | Read by |
|-----|---------|-----------|--------|
| `wow_content_cfg` | Section visibility map | CC.save() | WOWContent.apply() |
| `wow_product_cfg` | Product visibility map | PC.save() | WOWContent.apply(), booking.js |
| `wow_content_overrides` | Text override map | CC.save() | WOWContent.apply() |
| `wow_banners_override` | Banner slides per section | BM.save() | public pages (future) |
| `wow_calendar_config` | Park open/closed calendar | OC.save() | booking.js (getDateStatus) |
| `wow_category_availability` | Category global toggles + rules | CA.save() | booking.js (isCategoryAvailable) |
| `wow_price_overrides` | Price overrides per cat/park | CA.save() | booking.js (pricing engine) |
| `wow_cat_config` | Combined cat+price config | CA.save() | booking.js (unified read) |

---

## 🪪 Sprint 11 — Enterprise Passport Product Engine v2.0

### Architecture Overview

The WOW Passport Product Engine is a fully configurable, no-backend enterprise membership system built on top of `localStorage` and `js/wow-passport-engine.js`.

```
js/wow-passport-engine.js          ← Core engine (17 public APIs)
  ├── Config Store (wpe_config)     ← Tier + Product master
  ├── Voucher Library (wpe_voucher_lib)
  ├── Offer Library (wpe_offer_lib)
  ├── Passport Records (wpe_passports)
  ├── KYC Records (wpe_kyc)
  ├── Redemption Ledger (wpe_redemptions)
  ├── Audit Trail (wpe_audit)
  └── Customer Records (wpe_customers)
```

### Passport Product Engine — `js/wow-passport-engine.js`

| Component | Description |
|-----------|-------------|
| **Config Engine** | `WPE.getConfig()` / `WPE.saveConfig()` — tier master, product SKUs, program meta |
| **Voucher Library** | 15 default vouchers (F&B, locker, birthday, guest pass, merch, VIP lounge, concierge) |
| **Offer Library** | 5 default tier-linked offers (priority booking, guest discount, family events, VIP events, renewal bonus) |
| **QR Tokenizer** | `WPE.generateQRToken()` — tamper-proof base64 payload + 6-char checksum; `WPE.parseQRToken()` validates |
| **Issuance Engine** | `WPE.issuePassport()` — product lookup, KYC gate, passport number gen, voucher instance build, audit |
| **Redemption Engine** | `WPE.redeemVoucher()` — frequency/quantity guards, cooldown check, anti-replay, audit |
| **Park Entry Engine** | `WPE.recordParkEntry()` — daily limit, blackout date, park coverage, VIP lane detection |
| **KYC Engine** | `WPE.submitKYC()` / `WPE.updateKYCStatus()` — 6 states (not_started → pending → under_review → query_raised → approved → rejected) |
| **Renewal Engine** | `WPE.initiateRenewal()` — linked new passport, increments renewal counter, updates old status to `renewed` |
| **Analytics Engine** | `WPE.getAnalytics()` — by-tier breakdown, revenue, expiry forecast, breakage rate, KYC stats |
| **Lifecycle States** | `active`, `paused`, `suspended`, `expired`, `renewed`, `revoked`, `archived` |
| **Customer Engine** | `WPE.upsertCustomer()` / `WPE.findCustomer()` — deduplication by email/mobile |
| **Audit Trail** | Every action logged with actor, timestamp, meta — capped at 500 entries |

### Passport Tiers (Configurable, No Hard-Coding)

| Tier | Code | Holders | F&B | Guest Passes | VIP Lane | Price |
|------|------|:-------:|-----|:---:|:---:|-------|
| **WOW Explore** | `EXPLORE` | 1 | 10% | 0 | ❌ | ₹4,999 |
| **WOW Together** | `TOGETHER` | 4 | 15% | 2 | ❌ | ₹12,999 |
| **WOW Legacy** | `LEGACY` | 6 | 25% | 4 | ✅ | ₹24,999 |

All tiers are fully configurable via the admin UI — color gradients, emblem emoji, badge style, upgrade path, holder limits, guest passes.

### Voucher Library (15 Default Templates)

| Category | Voucher | Freq | Qty |
|----------|---------|------|-----|
| F&B Discount | 10%, 15%, 25% off | Per visit | Unlimited |
| Locker | Monthly, Per Visit, Unlimited | Varies | 1 / ∞ |
| Birthday | Upgrade (Explore), Party Pack (Together), VIP Suite (Legacy) | Annual | 1 |
| Guest Entry | 2 passes / 4 passes | Annual | 2 or 4 |
| Experience | Annual Photo Session | Annual | 1 |
| Merchandise | ₹1,000 Credit | Annual | 1 |
| Lounge | VIP Lounge Unlimited | Per visit | Unlimited |
| Service | Concierge Priority Line | On-demand | Unlimited |

### localStorage Keys (Sprint 11 Passport Engine)

| Key | Purpose | Written by | Read by |
|-----|---------|-----------|--------|
| `wpe_config` | Tier + Product master + program meta | `WPE.saveConfig()` | All passport flows |
| `wpe_voucher_lib` | Voucher template library | `WPE.saveVouchers()` | Issuance, Admin |
| `wpe_offer_lib` | Linked offer library | `WPE.saveOffers()` | Admin, Storefront |
| `wpe_passports` | Issued passport records | `WPE.issuePassport()` | Portal, Scanner |
| `wpe_kyc` | KYC application records | `WPE.submitKYC()` | KYC Review Console |
| `wpe_redemptions` | Redemption ledger | `WPE.redeemVoucher()` | Scanner, Analytics |
| `wpe_audit` | Audit trail (last 500 events) | Internal `_audit()` | Admin, Audit Log |
| `wpe_customers` | Customer records | `WPE.upsertCustomer()` | Portal, Sales |
| `wpe_passport_seq` | Auto-increment sequence for passport numbers | `generatePassportNumber()` | Issuance |
| `wow_scanner_settings` | Gate scanner staff/gate config | Scanner settings modal | Gate Scanner |

### Passport Engine URLs

| URL | Role | Description |
|-----|------|-------------|
| `/admin/passport-engine.html` | Super Admin / Passport Admin | No-code product admin: tier CRUD, product SKUs, voucher library, offer attachment, entry rights, KYC rules, analytics charts, passport records, audit log, config export/import |
| `/admin/passport-kyc-review.html` | KYC Reviewer | Application queue with completeness scoring, approve/reject/query workflow, bulk approve, reviewer notes thread, status history, export CSV |
| `/admin/passport-scanner.html` | Gate Staff | QR validation for park entry + voucher redemption; camera simulation; manual override with supervisor PIN; session log with export |
| `/portal/wow-passport.html` | Customer | Digital passport dashboard: flippable card, MRZ, QR, voucher book, entry log, redemption history, renewal trigger |
| `/sales/passport-kyc.html` | Sales Agent | 4-step KYC wizard: plan select → photo capture → details form → review → submit |
| `/sales/erp-dashboard.html` | Sales Agent / Manager | Salesforce ERP with KYC queue, passport ledger, agent management, bulk issuance |
| `/passport.html` | Public | Premium storefront with 3-tier comparison, benefit matrix, FAQ, purchase CTA |

### WPE Public API Reference

```javascript
// ── CONFIG ───────────────────────────────────────────────────
WPE.getConfig()                     // Full config object (tiers + products + meta)
WPE.saveConfig(cfg)                 // Save + audit
WPE.getDefaults()                   // { config: DEFAULT_CONFIG, vouchers: […], offers: […] }
WPE.getTiers()                      // → Tier[]
WPE.getTierById(id)                 // → Tier | null
WPE.getProducts()                   // → Product[]
WPE.getProductById(id)              // → Product | null

// ── VOUCHERS ─────────────────────────────────────────────────
WPE.getVouchers()                   // → Voucher[]
WPE.getVoucherById(id)              // → Voucher | null
WPE.addVoucher(v)                   // Create + audit
WPE.updateVoucher(id, data)         // Update + audit
WPE.saveVouchers(list)              // Full replace

// ── OFFERS ───────────────────────────────────────────────────
WPE.getOffers()                     // → Offer[]
WPE.saveOffers(list)                // Full replace

// ── PASSPORTS ────────────────────────────────────────────────
WPE.issuePassport(opts)             // → { success, passport } — KYC gate enforced
WPE.getPassports()                  // → Passport[]
WPE.getPassportById(id)             // → Passport | null
WPE.getPassportsByCustomer(cid)     // → Passport[]
WPE.updatePassport(id, data)        // Partial update + audit
WPE.suspendPassport(id, reason, by) // Status → suspended
WPE.revokePassport(id, reason, by)  // Status → revoked
WPE.reactivatePassport(id, note, by)// Status → active
WPE.initiateRenewal(passportId, opts)// → { success, oldPassport, newPassport }

// ── KYC ──────────────────────────────────────────────────────
WPE.getKYCRecords()                 // → KYCRecord[]
WPE.getKYCById(id)                  // → KYCRecord | null
WPE.submitKYC(opts)                 // → { success, kycId, record }
WPE.updateKYCStatus(id, status, note, by) // → { success, record }

// ── QR / REDEMPTION ──────────────────────────────────────────
WPE.generateQRToken(passportId, voucherInstanceId, counter) // → 'WOW-QR.xxx.chk'
WPE.parseQRToken(token)             // → payload | null (validates checksum)
WPE.validateQR(token, ctx)          // → { valid, passport, voucherInstance, reason }
WPE.redeemVoucher(token, ctx, overrideReason) // → { success, redemptionId, passport, vi }
WPE.validateParkEntry(passportId, park)// → { valid, passport, vipLane, reason }
WPE.recordParkEntry(passportId, park, ctx) // → { success, entryRecord }

// ── CUSTOMERS ────────────────────────────────────────────────
WPE.upsertCustomer(data)            // Create or update by email/mobile
WPE.findCustomer(query)             // Search by name/email/mobile

// ── ANALYTICS ────────────────────────────────────────────────
WPE.getAnalytics()                  // Full analytics object (byTier, revenue, KYC, redemptions)
WPE.getRedemptions()                // → Redemption[]
WPE.getAuditLog()                   // → AuditEvent[]
```

### KYC State Machine

```
not_started
    ↓ [submit form]
pending_review
    ↓ [reviewer opens]         ↓ [reviewer raises query]
under_review            query_raised
    ↓ [approve]                ↓ [customer resubmits]
  approved          ←──── pending_review (re-cycle)
    ↓ [issue passport]
  [Passport Issued]
    
  [Any state]
    ↓ [reject]
  rejected  (permanent — customer must re-apply)
```

### Passport Lifecycle

```
draft → pending → approved → issued → active ──┐
                                    ↓            │ renew
                              suspended          ↓
                                    ↓         renewed
                                revoked
                                    │
                               expired (auto on expiry date)
                                    │
                               archived (manual)
```

### QR Token Format

```
WOW-QR.<base64url-payload>.<6-char-checksum>

Payload (JSON, base64url-encoded):
{
  p: "WOW-PAX-2025-000001",   // passport ID
  v: "WOW-PAX-...-v_fnb-abc", // voucher instance ID
  c: "fnb",                    // counter scope
  ts: 1711800000000,           // issue timestamp (ms)
  n: "x7k2q9m4"               // nonce (replay prevention)
}
```

---

### 🆕 Sprint 6 Enhancements

#### Booking Engine — Offer & Add-On System (`js/wow-offer-engine.js` v3.0)
| Feature | Detail |
|---------|--------|
| **Max tickets / transaction** | Hardcapped at 8 (admin-configurable). Toast shown if exceeded. |
| **BOGO (Buy 1 Get 1)** | Free cheapest eligible ticket. Code-based or auto-apply. |
| **B2G1 (Buy 2 Get 1)** | Buy 2 tickets, get 1 free. Category-specific. |
| **Buy 4 — Discount** | % or flat discount when 4+ tickets in cart. |
| **Percentage Discount** | Any park/category, auto-apply or promo code, date range. |
| **Flat Amount Discount** | e.g. ₹1,000 off Family of 4 Combo booking. |
| **Flash Sale** | Time-limited: weekday/weekend, hourly window, fixed duration, daily. |
| **Family Auto-Apply** | Triggers when specific adult+child combination detected in cart. |
| **Promo Codes** | Manual code entry at checkout; validated against offer rules. |
| **Buffet Add-on** | ₹599 base (₹100 pre-book discount) · Max qty configurable · Sold-out detection + alternatives shown. |

#### `book/confirmation.html` — QR Ticket & Delivery
| Feature | Detail |
|---------|--------|
| **QR Code** | High-error-correction QR generated from booking payload (JSON). |
| **WhatsApp delivery** | Direct WhatsApp link to customer mobile with ticket URL + QR details. |
| **Email delivery** | mailto: link with full booking details + ticket URL. |
| **Ticket link** | Shareable URL with base64-encoded booking payload. |
| **SMS fallback** | Always sent; ticket link included. |
| **WhatsApp unavailable** | Manual share panel revealed with copy link button. |
| **Delivery status** | Live status strip showing WhatsApp/Email/SMS sent or failed. |
| **Download** | Full-resolution canvas ticket PNG with QR embedded. |

#### `portal/tickets.html` — Ticket Split & Share
| Feature | Detail |
|---------|--------|
| **Split ticket** | From My Tickets → Split button on each active ticket. |
| **Multiple recipients** | Add any number of recipients (name + mobile or email). |
| **Channel selection** | WhatsApp / Email / Both. |
| **WhatsApp unavailable** | Shows ticket link with copy button for manual share. |
| **Individual QR links** | Each recipient gets unique sub-booking ID + shareable e-ticket link. |

#### `admin/offers.html` — Fully Functional Offer Definition Modal
| Feature | Detail |
|---------|--------|
| **6 offer types** | %, Flat, BOGO, B2G1, Buy4Discount, Flash Sale (each with type-specific fields). |
| **Flash schedule** | Weekday/weekend, hourly window, fixed duration, daily repeat. |
| **Park selector** | Multi-select: Water Park, Amusement, Combo. |
| **Category selector** | Multi-select: Adult, Child, Senior, Armed, Diff. Abled. |
| **Family rule** | Auto-apply when X adults + Y children in cart. |
| **Limits** | Min tickets, min cart value, max total uses, max per customer. |
| **CRUD** | Create, Edit, Clone, Pause/Activate, Delete — all live. |
| **Offer Analytics Modal** | Per-offer analytics: total uses, usage progress bar, revenue generated, discount cost, ROI calculation. |
| **Buffet Config Modal** | Name, description, base price, discount type/value, max qty, inventory, sold-out threshold, alternative F&B outlets (add/remove dynamic rows). |
| **Settings Modal** | Max tickets per transaction (enforced in all booking flows). |
| **Persistence** | All changes saved to localStorage, read by `wow-offer-engine.js` in real time. |

#### `portal/tickets.html` — Enhanced Ticket Split & Share
| Feature | Detail |
|---------|--------|
| **WhatsApp delivery** | Opens wa.me link for each recipient with personalised message + unique sub-ticket link. |
| **Email delivery (mailto)** | Opens mailto: compose window with full ticket details, date, sub-ID and ticket link. |
| **Both channels** | Sequential WhatsApp + email for each recipient. |
| **Copy-link fallback** | If neither WhatsApp nor email works, full ticket link shown with 1-click copy button. |
| **Re-send button** | Each result row has a Re-send button that opens WA/email for that specific recipient again. |
| **Unique sub-ticket IDs** | Each recipient gets `{bookingId}-R01`, `-R02`, etc. with a shareable confirmation URL. |
| **Input link row** | Full ticket URL shown in a read-only input for manual sharing. |

### Customer Portal
| URL | Description |
|-----|-------------|
| `/portal/login.html` | Sign in (OTP / email / social) |
| `/portal/dashboard.html` | Customer dashboard (countdown, tickets, wallet, loyalty) |
| `/portal/wow-passport.html` | WOW Passport (3 tiers, MRZ, QR vouchers) |
| `/portal/wallet.html` | WOW Wallet |
| `/portal/loyalty.html` | Loyalty coins |
| `/portal/referral.html` | ✅ Refer & Earn (code share, leaderboard, tier progress, reward catalogue) |
| `/portal/notifications.html` | ✅ UPGRADED Notification Centre (7 filter tabs, bulk actions, mark-all-read, preference settings) |

### Admin ERP
| URL | Description |
|-----|-------------|
| `/admin/index.html` | Admin dashboard |
| `/admin/ops-dashboard.html` | Live Ops Command Centre |
| `/admin/revenue-analytics.html` | Full BI / Revenue Analytics Dashboard |
| `/admin/call-center.html` | Call Centre ERP |
| `/admin/gate.html` | Gate QR Scanner |
| `/admin/fnb-packages.html` | F&B Package Manager |
| `/admin/super-admin.html` | ✅ **Sprint 8 COMPLETE** — 13 panels: Dashboard, KYC Queue, User Mgmt, Create Account, Modules, Rights Matrix, Audit Logs, **Products & Offerings Control**, **Page Sections Control**, **Banner Manager**, **Operational Calendar**, **Category Availability**, AuthGate |
| `/admin/auth-gate.html` | ✅ **NEW** AuthGate Manager (portals, users, SA PIN, logs) |
| `/admin/admin-login.html` | ✅ **NEW** Admin Login (role-aware, demo tiles, SA bypass) |
| `/admin/bookings.html` | ✅ UPGRADED Booking Management (filters, bulk actions, refund, reschedule, manual booking) |
| `/admin/dynamic-pricing.html` | ✅ NEW Dynamic Pricing Engine (rules, calendar, matrix, surge, bulk overrides) |
| `/admin/passport-engine.html` | Passport Engine |
| `/admin/ticketing-engine.html` | Ticketing Engine |
| `/admin/notifications.html` | Push Notification Engine |
| `/admin/inventory.html` | ✅ UPGRADED Capacity Management (zones, ride slots, lockers, F&B, daily allocation, movement log) |
| `/admin/finance.html` | ✅ UPGRADED Finance Dashboard (P&L, receivables, payouts, reconciliation) |
| `/admin/crm.html` | ✅ UPGRADED CRM (pipeline Kanban, contact profiles, deal stages, activity log) |

### B2B / Partner
| URL | Description |
|-----|-------------|
| `/partner/dashboard.html` | Partner portal dashboard |
| `/partner/onboarding-kyc.html` | Partner KYC onboarding |
| `/partner/quote-builder.html` | Quote builder |
| `/partner/buy-tickets.html` | ✅ UPGRADED B2B Ticket Purchase (4-step: select → details → invoice → issue; tiers, cart, GST invoice) |
| `/ta/index.html` | Travel Agent Mini-ERP |
| `/sales/erp-dashboard.html` | Sales ERP (Salesforce-style CRM) |
| `/reseller/index.html` | Reseller ERP |

---

## 💾 Data Models & Pricing

### 🗃️ Table API — Passport Sales Portal (Sprint 5)
All passport sales data is persisted via the RESTful Table API (`tables/{table}`):

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `wow_agents` | Sales agent accounts | id, fname, lname, mobile, role, location, target, commission_rate, status, passports_sold |
| `wow_kyc` | Customer KYC records | id, passport_id, plan, fname, lname, dob, gender, mobile, email, address, photo_data, login_id, temp_password, kyc_status, payment_status |
| `wow_passports` | Issued passports | id, kyc_id, holder_name, plan, plan_price, gst_amount, total_paid, payment_mode, issued_date, expiry_date, entries_water, entries_amuse, entries_used_water, entries_used_amuse, status, qr_code, mrz_line1, mrz_line2 |
| `wow_payments` | Payment transactions | id, passport_id, kyc_id, holder_name, plan, base_amount, cgst, sgst, total_amount, payment_mode, upi_ref, card_last4, cash_received, cash_change, agent_id, status |
| `wow_redemptions` | Gate scan log | id, passport_id, holder_name, park_zone, gate_id, scan_result, entries_remaining, scanned_by |

**Shared utility**: `js/wow-passport-api.js` — all pages import this for consistent API calls, ID generation (WOW-PAX-XXXXXX, KYC-XXXXX, WOW-TXN-XXXXXX), MRZ/QR generation, bulk issuance, and session management.

### Ticket Pricing (GST inclusive)
| Type | Adult | Child (90–120cm) | Infant |
|------|-------|-------------------|--------|
| Water Park | ₹1,299 | ₹799 | Free |
| Amusement Park | ₹1,199 | ₹799 | Free |
| Combo (Both Parks) | ₹1,999 | ₹1,199 | Free |

### Group Pricing (GST inclusive)
| Group Size | Water/Amusement | Combo |
|------------|-----------------|-------|
| 20–49 | ₹799 | ₹1,299 |
| 50–99 | ₹749 | ₹1,199 |
| 100–199 | ₹699 | ₹1,099 |
| 200+ | ₹649 | ₹999 |

### WOW Passport Tiers
| Tier | Price | Holders | Key Benefit |
|------|-------|---------|-------------|
| Explore | ₹4,999 | 1 | Unlimited both parks, 10% F&B |
| Together | ₹12,999 | Family of 4 | 15% F&B, birthday pack, 3x loyalty |
| Legacy | ₹24,999 | Premium family of 6 | 25% F&B, VIP lounge, 5x loyalty, ₹1K merch |

### Commission Structure (B2B)
| Partner Type | Commission | TDS |
|-------------|------------|-----|
| Travel Agent (Bronze) | 8% | 5% on net |
| Travel Agent (Silver) | 10% | 5% on net |
| Travel Agent (Gold) | 12% | 5% on net |
| Travel Agent (Platinum) | 15% | 5% on net |
| Reseller (Bronze) | 10% | 2% |
| Reseller (Platinum) | 15% + ₹2L bonus | 2% |

### GST Breakdown
- B2C Tickets: **18%** (CGST 9% + SGST 9%)
- F&B: **5%** on group packages
- Passport: **18%**
- Services: **18%**

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| HTML | HTML5 Semantic |
| CSS | Custom CSS + Tailwind (some pages) |
| JS | Vanilla ES6+ |
| Charts | Chart.js 4.x |
| QR Codes | QRCode.js |
| Icons | Font Awesome 6 |
| Fonts | Google Fonts (Inter, Nunito, Poppins, Cinzel) |
| Payment UI | Razorpay (frontend flow only — no backend) |
| Weather | Open-Meteo API (free, no key) |
| Hosting | Netlify (static) |
| Data | RESTful Table API (via platform) |

---

## 🔒 Security & Compliance

- `_headers` file: CSP, X-Frame-Options, HSTS, XSS protection
- `_redirects` file: Route normalisation
- All external API calls: CORS-safe, no API keys in frontend
- GST: CGST + SGST split on all invoices (Maharashtra: CGST+SGST, others: IGST)
- KYC: Manual review workflow (no Aadhaar API — frontend simulation only)

---

## 📱 Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| > 1200px | Full desktop (sidebar + multi-column) |
| 900–1200px | Tablet (collapsed columns) |
| 600–900px | Mobile-L (2-column grids) |
| < 600px | Mobile (single column, slide-out sidebar) |

---

## ✅ Completed Features (as of March 2026)

### Sprint 8 — Live Control Engine (NEW ✅)
- [x] **`js/wow-content-control.js` v2.0** — Central config engine; section/product/override keys in `localStorage`; `apply()`, `applyQBBToggles()`, `applyBookingCatToggles()` wired to all 9 public pages
- [x] **Products & Offerings Control** — Toggle 16 products (4 parks, 5 ticket categories, 7 packages); per-group Enable All / Disable All; live summary counters; `wow_product_cfg` in localStorage
- [x] **Page Sections Control** — Toggle 19 sections (Homepage + Booking); inline text/HTML editing per field (selector-mapped overrides); Clear Overrides per drawer; homepage/booking/all filter tabs; `wow_content_cfg` + `wow_content_overrides` in localStorage
- [x] **Banner Manager** — 4 sections (Homepage/Water/Amusement/Combo); drag-reorder slides; image upload stored as base-64 data URL; video URL + gradient fallback; overlay opacity, alignment, badge/headline/subtitle/CTA per slide; `wow_banners_override` in localStorage
- [x] **Operational Calendar** — Per-park default open/closed; mini-calendar click-to-cycle (open→closed→maintenance→limited); quick-mark (weekends / this week / whole month); special date exception list with notes; operating hours (open/last-entry/close) + max advance days; `wow_calendar_config` published for booking.js
- [x] **Category Availability & Price Overrides** — Global on/off per category; date-range disable/enable rules per park; editable price per category per park type; publishes `wow_cat_config` consumed by booking.js pricing engine
- [x] **Zero JS errors** — `admin/super-admin.html` confirmed 0 console errors; all panels have null-guards; `PC.init()` re-init guard prevents duplicate DOM build; `OC`/`CA`/`BM`/`PC`/`CC` all lazy-initialized via `showPanel()`
- [x] **All public pages integrate** — `data-wow-section` on all 19 sections; `data-wow-product` on park cards, QBB tabs, pricing cards; `WOWContent.apply()` called at page-bottom on every page; booking pages have `date-unavailable-msg` and calendar integration

### Public Site
- [x] Homepage with video carousel + quick-book widget + group & passport tabs
- [x] Water Park, Amusement Park, Combo pages
- [x] Offers catalogue with promo codes
- [x] WOW Passport purchase page (3 tiers, benefits, FAQ)
- [x] Groups landing (corporate / school / birthday)
- [x] FAQ, Contact, Gallery, Plan Your Visit, Safety Guidelines

### Booking Engine (5-step flow)
- [x] Individual booking: Water Park, Amusement, Combo
- [x] Group booking: 5-step flow (type → tickets + F&B addons → contact → payment → confirm)
- [x] Guest details: Step 2 with OTP verify, promo codes, WOW Coins, GST breakdown
- [x] Payment: Razorpay UI (cards, UPI, wallets, net-banking), promo codes (WOW20/SPLASH10/FIRST50)
- [x] Confirmation: QR tickets, WhatsApp share, calendar add

### Customer Portal
- [x] Login (OTP, email, Google, Facebook, Business KYC)
- [x] Dashboard: countdown timer, live wallet, loyalty coins, QR ticket, offers, spend chart, visit timeline
- [x] WOW Passport: 3 tiers (Explore/Together/Legacy), full e-Passport design, MRZ, QR vouchers
- [x] Loyalty engine (coins, tier progress, redemption)
- [x] WOW Wallet (top-up, history, auto-reload)
- [x] Tickets, My Bookings, Profile
- [x] **Notifications (UPGRADED)**: 7 category tabs (All/Unread/Bookings/Rewards/Promotions/System/Prefs), filter/search, sort, bulk select+delete+mark-read, 18-notification dataset, live simulation (new notification arrives after 5s), quiet hours, per-channel preference toggles (Push/Email/SMS/WhatsApp), email digest frequency
- [x] **Refer & Earn**: unique referral code, WhatsApp/email/social share, 5-tier reward system, monthly leaderboard, reward catalogue, earnings chart

### Admin ERP
- [x] Admin dashboard with KPI + booking + revenue overview
- [x] **Live Ops Command Centre**: live ticker, capacity rings, weather, ride status, gate status, staff deployment, incidents, broadcast
- [x] **Revenue Analytics BI Dashboard**: trend (daily/weekly/monthly), channel donut, hourly heat, category mix, 28-day daily table, B2B chart, top products table, demand forecasts
- [x] Call Centre ERP (Hinglish AI, escalation, refunds)
- [x] Gate QR Scanner (capacity monitoring, fraud detection)
- [x] F&B Package Manager (CSV upload, 9 packages, quote builder)
- [x] Ticketing Engine (full configuration)
- [x] Passport Engine + Redemptions
- [x] GST Engine (auto reverse-charge, filing)
- [x] Notifications Engine (Hinglish templates, WhatsApp/SMS/Push)
- [x] Super Admin: KYC queue (7 pending), role matrix, audit-log links, module toggles
- [x] **Booking Management (UPGRADED)**: 200-record dataset, advanced search + 4 filters + date range, bulk actions (resend/export/cancel), refund modal (full/partial/GST/none + 4 methods), reschedule modal, cancel modal, manual booking wizard (3-step), audit trail drawer, sort by field, per-page selector
- [x] **Dynamic Pricing Engine (NEW)**: 6 pricing rules with CRUD + priority, month-view pricing calendar with per-day overrides, full price matrix editor (5 categories × 6 park types), price simulation tool, surge trigger config (4 triggers), demand forecast, bulk price override with live preview, scheduled future price changes, change history audit trail
- [x] **Inventory & Capacity (UPGRADED)**: 7 tabs — live zone capacity rings (Water/Amusement/Common areas, Chart.js doughnuts), ride status table with maintenance/offline filters, SKU stock grid (search/filter by category/level, restock drawer), locker grid per block (A/B/C/VIP, colour-coded cells), F&B inventory by outlet with consumption chart, 7-day daily allocation editor, stock movement log (20 entries)
- [x] **Finance Dashboard (UPGRADED)**: P&L chart, daily revenue breakdown, receivables ageing, payout tracker, bank reconciliation, GST summary
- [x] **CRM (UPGRADED)**: Kanban pipeline, contact profiles, deal stages, email/call activity log

### B2B & Partner
- [x] **Buy Tickets (UPGRADED)**: 4-step flow (Select Tickets → Order Details → Review Invoice → Vouchers Issued), 4 park types (Water/Amusement/Combo/Annual Passport), tier-based discounts (Gold 12%), F&B add-ons, real-time GST invoice preview (CGST+SGST breakdown), group tier pricing, QR voucher cards, batch download, order history table with Chart.js bar, bulk CSV upload
- [x] Partner Portal (dashboard, KYC, quote builder, bulk tickets, invoices)
- [x] Travel Agent Mini-ERP (leads Kanban, commission ledger, team management)
- [x] Sales ERP (Salesforce-style CRM, deal pipeline, agent targets, reports)
- [x] Reseller ERP (inventory, bulk QR generator max 200, commission, Platinum tier)

---

## 🚧 Not Yet Implemented (Future Roadmap)

### Sprint 10 — COMPLETED ✅ (Offer Engine v4 Full Delivery)
- [x] **A/B Testing Framework** — `admin/offer-engine.html` Panel: Create tests, assign variants by hash(userId+testId), weight-based traffic split (must sum 100%), start/pause/complete lifecycle, simulate 1000-user distribution. `WOWOfferEngine.ABEngine` API fully public.
- [x] **Conflict Resolution Matrix** — Visual grid showing stack compatibility between all active offers (✓ Stackable, ✗ Exclusive blocks all, ? Best-only per family, ~ Mixed). Stack-family grouping and real-time risk overlay.
- [x] **Priority Ranking & Drag-to-Reorder** — Drag handles to reorder evaluation sequence, direct numeric input per offer, distribution histogram, auto-reassign step-weights on drop.
- [x] **Bulk Operations Panel** — Export JSON (all/active/draft), Import with merge/replace_all/add_new modes, Bulk Activate Drafts, Bulk Pause Active, Archive Expired, Reset Usage Counts, Factory Reset, Clear Audit/Exec logs.
- [x] **Deep Drill Modal** — Per-offer: 90-day stats (uses, discount, avg), risk alerts, version history with rollback, quick edit + quick sim shortcuts.
- [x] **Demand-Based Pricing Engine** — `WOWOfferEngine.DemandEngine` module: surge rules (booking_velocity trigger), off-peak incentive rules, configurable inventory thresholds (highDemand 80% / lowDemand 20%). `getSuggestedSurgePercent(parkKey)` API.
- [x] **Maker-Checker Workflow API** — `WOWOfferEngine.MakerChecker` module: `submit(offerData, action, submittedBy)`, `approve(requestId, approvedBy, comments)`, `reject(requestId, rejectedBy, reason)`, `getPending()`, `getHistory(offerId)`. Approval auto-executes the action on the engine.
- [x] **Booking.js v4 Integration** — `refreshOffers()` now uses `evaluateCart()` (full stacking + conflict resolution), explainability ribbon showing ✓ applied / rejected offers, stacked savings badge with multiple offer names, F&B credit badge, `fnbDiscount` row in order summary, `commitEvaluation()` called on checkout to persist usage counts + audit log.
- [x] **Promo Code v4 UX** — Uses `validatePromoCode()` with v4 stacking engine; shows exact savings amount on success, clear error messaging, `clearPromoCode()` utility.
- [x] **CFO Analytics — Time Heatmap** — Hour × Day heatmap (24h × 7 days), colour intensity = booking velocity, peak hour/day KPIs, hour-of-day bar chart, day-of-week bar chart.
- [x] **CFO Analytics — A/B Test Results** — Live results panel: test summaries, variant assignment counts, discount-given per variant (bar chart), status tracking.
- [x] **CFO Analytics — Approvals Queue** — Full Maker-Checker UI in analytics: pending list with Approve/Reject buttons, approval history table with status colours, KPI stats.

### Sprint 9 Candidates (Pending)
- [ ] **Banner Manager → public page integration** — banners.json / localStorage banners currently managed by admin but not yet read by public hero carousel (`js/banner-engine.js` hook needed)
- [ ] **Operational Calendar → booking.js date-picker** — `wow_calendar_config` is published but the booking page date input needs to use `getDateStatus()` to grey-out closed days in the native `<input type="date">` (requires custom date-picker or Flatpickr integration)
- [ ] **Price overrides → booking.js pricing engine** — `wow_cat_config.prices` is published; booking.js needs to merge these overrides into the base price table on init
- [ ] **Category availability → booking.js UI** — `isCategoryAvailable()` is wired; needs to actually hide cat-rows at init time (currently only hides via `WOWContent.apply()`)
- [ ] **Offer engine → admin offers page sync** — `wow-offer-engine.js` reads `wow_offers_cfg` from admin/offers.html; ensure cross-page consistency with super-admin content toggles
- [ ] **Real-time multi-tab sync** — Use `window.addEventListener('storage', ...)` so when Super Admin saves, already-open public pages update without requiring a reload
- [ ] **CMS text overrides → shell.js** — Footer and nav text overrides in `wow_content_overrides` not yet applied to shell-injected elements (shell runs after WOWContent.apply)

### Backend / Integration (out of scope for static site)
- [ ] Real Razorpay backend integration (currently frontend-only UI)
- [ ] Live OTP verification (currently simulated)
- [ ] Aadhaar/DigiLocker eKYC API integration
- [ ] Real-time IoT ride status feed
- [ ] WhatsApp Business API (currently templated)
- [ ] Mobile app (React Native)
- [ ] Multi-language: Hindi full translation
- [ ] Loyalty points live deduction on checkout
- [ ] Push notifications via service worker
- [ ] A/B testing for conversion optimisation

---

## 🏗 Offer Engine v4.0 — Architecture Reference

### Overview
`js/wow-offer-engine-v4.js` (62KB) is a self-contained IIFE that exposes `window.WOWOfferEngine` / `window.WOE4`. It persists all state in localStorage and is fully functional without any backend.

### Core Engine Layers

| Layer | Section | Description |
|-------|---------|-------------|
| Storage Helpers | §3 | JSON safe read/write for 7 localStorage keys |
| Audit Log | §4 | 500-entry rolling audit log with action + user + meta |
| Schedule Checker | §5 | IST-aware date/time/day/hour/blackout evaluation |
| Usage & Budget | §6 | Global/per-user/per-day/budget cap enforcement |
| Condition Evaluator | §7 | 22 condition types: park, category, qty, cart_value, promo, date_range, day_of_week, hour_range, segment, A/B variant, cross-category, demand_level, etc. AND/OR/NOT groups |
| Action Executor | §8 | 12 action types: percent, flat, per_ticket, free_tickets, slab_percent, slab_flat, credit, fnb_credit, fee_waiver, price_override, percent_cap, hybrid |
| Conflict Resolution | §9 | Exclusive/Best-Only/Stackable stacking modes; family-based best-selection |
| Status Lifecycle | §10 | draft→scheduled→active→paused→expired→archived state machine |
| Main Eval Engine | §11 | `evaluateCart(cart, opts)` — full evaluation with rule path + explainability |
| Promo Validator | §12 | `validatePromoCode(code, cart, opts)` — v4 stacking-aware code validation |
| Commit | §13 | `commitEvaluation(evalResult, opts)` — usage increment + exec log write |
| Simulation | §14 | `simulate(cart, opts)` — dry-run without usage increment, persists history |
| Admin CRUD | §15 | adminListOffers, adminGetOffer, adminSaveOffer, adminDeleteOffer, adminCloneOffer, adminActivateOffer, adminPauseOffer, adminRollback, adminGetVersionHistory |
| A/B Testing | §16 | Deterministic hash-based assignment, 100-bucket split |
| Analytics | §17 | summary(days), offerDetail(offerId, days) — daily trend, per-offer stats, AOV before/after |
| Backward Compat | §18 | v3 API shim: computeBestOffer, applyPromoCode, isOfferActive, applyOffer, getFlashOffers, buffet helpers |
| Demand Engine | §19 | Surge/discount rules by booking velocity + inventory threshold |
| Maker-Checker | §20 | submit → pending → approve/reject → auto-execute workflow |

### localStorage Keys

| Key | Purpose | Writer | Reader |
|-----|---------|--------|--------|
| `wow_offers_v4` | Offer master array (JSON) | adminSaveOffer | loadOffers |
| `wow_offer_audit` | 500-entry audit log | AuditLog.write | AuditLog.read |
| `wow_exec_log` | 2000-entry execution log | _writeExecLog | readExecLog |
| `wow_ab_assignments` | User→variant map | ABEngine.assignVariant | ABEngine.getVariant |
| `wow_sim_history` | 100 simulation snapshots | simulate() | loadSimHistory |
| `wow_usage_v4` | Per-user/per-day usage counters | _incrementUsage | _checkUsage |
| `wow_budget_v4` | Per-offer budget spend | _incrementUsage | _checkUsage |
| `wow_offer_versions` | Version snapshots per offer | adminSaveOffer | adminGetVersionHistory |
| `wow_ab_tests` | A/B test config array | Admin UI | Admin UI |
| `wow_demand_config` | Demand engine rules | DemandEngine.saveConfig | DemandEngine.loadConfig |
| `wow_offer_pending_approvals` | Maker-checker queue | MakerChecker.submit | MakerChecker.getPending |

### Admin UI Pages

| Page | Description |
|------|-------------|
| `/admin/offer-engine.html` | Full Offer Engine Super Admin — Dashboard, Offer Library (CRUD/Clone/Pause/Archive/Rollback), Simulator Sandbox, Analytics, **A/B Testing**, **Conflict Matrix**, **Priority Ranking**, **Bulk Ops (Import/Export)**, Audit Log |
| `/admin/offer-analytics.html` | CFO-Grade Analytics — Overview KPIs, Revenue Waterfall, AOV Lift, Leakage Analysis, Coupon Intelligence, **Time Heatmap**, **A/B Test Results**, **Approvals Queue (Maker-Checker)** |

### Offer Condition Types
`park` · `category` · `qty_total` · `qty_category` · `qty_mix` · `cart_value` · `promo_code` · `coupon_code` · `date_range` · `day_of_week` · `hour_range` · `visit_date` · `channel` · `segment` · `first_booking` · `booking_count` · `ab_variant` · `inventory` · `demand_level` · `cross_category` · `spend_threshold` · `presence`

### Action Types
`percent` · `flat` · `per_ticket` · `free_tickets` · `slab_percent` · `slab_flat` · `credit` · `fnb_credit` · `fee_waiver` · `price_override` · `percent_cap` · `hybrid`

### Stacking Modes
- **STACKABLE** — Combines with all other stackable offers (cumulative by priority)
- **EXCLUSIVE** — Blocks all other offers; best exclusive wins alone
- **BEST_ONLY** — Best offer within the same `stackFamily` group wins
- **FAMILY_ONLY** — Only applies alongside other family-specific offers

### Default Offer Library (v4)

| ID | Name | Type | Status | Priority | Stack |
|----|------|------|--------|----------|-------|
| WOE4_SUMMER20 | Summer Splash 20% Off | Auto (percent) | Active | 80 | Stackable |
| WOE4_FAMILY4 | Family of 4 Rs.1,000 Off | Auto (flat) | Active | 75 | Best-Only |
| WOE4_BOGO_WATER | Buy 1 Get 1 Water Park | Code: BOGO1 | Active | 90 | Exclusive |
| WOE4_BUY4 | Buy 4 Tickets 10% Off | Auto (percent) | Active | 70 | Stackable |
| WOE4_WKND_FLASH | Weekend Flash 15% Off | Auto (Fri–Sun) | Active | 85 | Stackable |
| WOE4_SLAB_TIER | Slab Qty Tiers 5/10/15% | Auto (slab_percent) | Active | 65 | Best-Only |
| WOE4_PARTNER_CORP | Corporate 18% Off | Code: CORP2026 | Active | 95 | Exclusive |
| WOE4_FNB_CREDIT | F&B Credit Rs.200 | Auto (fnb_credit) | Active | 60 | Stackable |

---

## 🚀 Deployment

**To deploy:** Go to the **Publish tab** to publish the site with one click.

**Environment**: Netlify static hosting  
**Build command**: None (static files)  
**Publish directory**: `/` (root)

---

## 📞 Contact & Credits

- **Platform**: Worlds of Wonder, EALCPL (Entertainment and Amusement Limited)
- **Address**: A-2, Sector 38A, Noida — 201 301, Uttar Pradesh
- **Support**: support@worldsofwonder.in
- **Groups**: groups@worldsofwonder.in
- **Corporate**: corporate@worldsofwonder.in
