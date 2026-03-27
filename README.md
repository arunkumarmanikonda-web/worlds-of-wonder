# 🎡 Worlds of Wonder — Digital Commerce & Operations Platform
**Version**: 6.0 | **Last Updated**: March 2026 | **Status**: ✅ Full Platform — All Blueprint Modules Delivered

> Delhi NCR's premier dual-park destination: Water Park + Amusement Park, Sector 38A, Noida.
> Complete platinum-grade unified digital commerce & operations platform — static-first front-end shell
> aligned to the Enterprise Architecture Blueprint v1.0 (Mar 2026).

---

## 🏗 Platform Architecture

```
wow-platform/
│
├── index.html                        # 🏠 Premium public home
├── water-park.html                   # 🌊 Water Park experience
├── amusement-park.html               # 🎢 Amusement Park experience
├── combo.html                        # 🎉 Combo deal page
├── passport.html                     # 🪪 Annual Passport public page
├── offers.html                       # 🏷 Offers & Deals
├── contact.html                      # 📞 Contact + FAQ
├── plan-your-visit.html              # 🗺 Visitor guide
├── rides-attractions.html            # 🎠 Full ride catalogue
├── safety-guidelines.html            # 🛡 Safety & health info
├── travel-agent.html                 # ✈️ Travel agent CTA
├── corporate.html                    # 🏢 Corporate sales CTA
├── reseller.html                     # 🏪 Reseller onboarding CTA
│
├── book/                             # 🎟 TICKET BOOKING ENGINE
│   ├── water-park.html               # Water Park booking
│   ├── amusement-park.html           # Amusement Park booking
│   ├── combo.html                    # Combo booking
│   ├── passport.html                 # Passport purchase flow
│   ├── group.html                    # Group & bulk booking
│   └── confirmation.html             # ✅ Booking confirmation + QR e-ticket
│
├── portal/                           # 👤 GUEST SELF-SERVICE PORTAL
│   ├── login.html                    # Sign in
│   ├── register.html                 # Create account
│   ├── forgot-password.html          # Password reset
│   ├── dashboard.html                # Guest dashboard
│   ├── my-bookings.html              # Booking history + QR tickets
│   ├── tickets.html                  # My e-tickets (QR viewer)
│   ├── profile.html                  # Profile & preferences
│   ├── passport.html                 # Passport management
│   ├── wallet.html                   # 💳 Wallet, refunds, gift vouchers
│   ├── offers.html                   # Personalised offers
│   ├── loyalty.html                  # ⭐ Loyalty wallet & tiers
│   └── notifications.html            # 🔔 Notification centre
│
├── partner/                          # 🤝 TRAVEL AGENT / RESELLER PORTAL
│   ├── login.html                    # Partner sign in
│   ├── onboarding.html               # Registration + KYC
│   ├── dashboard.html                # Partner overview
│   ├── buy-tickets.html              # Bulk ticket purchase (12% commission)
│   ├── ticket-batches.html           # Batch management + QR download
│   ├── invoices.html                 # GST-compliant invoices
│   ├── statements.html               # Credit wallet + ledger
│   ├── reports.html                  # 📊 Analytics & commission reports
│   └── support.html                  # Support tickets
│
├── groups/                           # 🏢 GROUPS & EVENTS HUB
│   ├── index.html                    # Groups hub
│   ├── corporate.html                # Corporate events
│   ├── schools.html                  # Schools & colleges
│   └── birthdays.html                # Birthday events
│
├── sales/                            # 💼 B2B SALES ENGINE
│   ├── pipeline.html                 # 📊 Kanban pipeline + forecast
│   ├── leads.html                    # CRM Leads management
│   └── quote-builder.html            # Multi-product quote builder
│
├── admin/                            # ⚙️ SUPER ADMIN PANEL (14 pages)
│   ├── index.html                    # 📊 Leadership Dashboard
│   ├── bookings.html                 # 🎟 Bookings management
│   ├── products.html                 # 📦 Products & inventory + pricing matrix
│   ├── users.html                    # 👥 User management + RBAC + KYC + audit
│   ├── gate.html                     # 🔐 Gate Redemption Console
│   ├── passport.html                 # 🪪 Passport Engine
│   ├── loyalty.html                  # ⭐ Loyalty Engine
│   ├── offers.html                   # 🏷 Offer & Campaign Engine
│   ├── finance.html                  # 💰 Finance & GST
│   ├── reporting.html                # 📈 Revenue Reporting Dashboards
│   ├── partners.html                 # 🤝 Partner management
│   ├── crm.html                      # 🎯 CRM / Salesforce-style pipeline
│   ├── cms.html                      # 🖼 CMS content manager
│   ├── banners.html                  # 📢 Banner & hero manager
│   └── settings.html                 # ⚙️ System configuration
│
├── css/
│   ├── style.css                     # Master stylesheet v7
│   ├── portal.css                    # Portal & dashboard styles
│   └── booking-page.css              # Booking flow styles
│
├── js/
│   ├── shell.js                      # Shared nav shell v4.1 (BASE-aware)
│   ├── booking.js                    # Booking engine
│   ├── banner-engine.js              # CMS banner runtime
│   └── firebase-config.js            # Auth config (Firebase-ready)
│
├── data/                             # Static data / config files
├── images/                           # All park imagery + real WOW logos
└── README.md                         # This file
```

---

## ✅ Completed Features — Full Blueprint Coverage

### 🌐 1. Premium Public Website
- Full-screen hero carousel (Water Park / Amusement Park / Combo)
- Must-Try Attractions horizontal scroll (13 ride cards with real photography)
- Quick-book widget (3-tab: Water Park / Amusement Park / Combo)
- Sticky mega-nav: 6 dropdown groups (Parks, Tickets, Groups, Offers, Visit, Partners)
- Real-time weather chip (Open-Meteo API — Noida coordinates, no API key required)
- Cheeky 10-message comms ticker (auto-scroll, live weather interpolation)
- Rides & Attractions catalogue page with full ride listings
- Plan Your Visit guide (maps, timings, tips, parking)
- Safety Guidelines page (rules, health requirements, height restrictions)
- Footer: social links, contact, park links, My Account, directions

### 🎟 2. Ticket Booking Engine (`book/`)
- **Water Park**: ₹1,299 adult | ₹999 child | ₹999 senior/armed/DA | Group ₹75–₹125 off
- **Amusement Park**: ₹1,199 adult | similar category pricing
- **Combo**: ₹1,999 (both parks, one day)
- **Annual Passport**: purchase flow with plan selection, holder details, photo upload
- **Group Booking**: multi-category step-flow with bulk pricing tiers
- Live GST (18%) calculation, date picker, guest count
- Step-flow: Details → Categories → Payment summary → QR issuance
- **Booking Confirmation** (`book/confirmation.html`):
  - QR code generation per ticket (qrcode.js)
  - Confetti animation on confirmation
  - Booking reference (e.g. WOW-2K9X-7Q4M)
  - Payment badge (Razorpay / UPI / Card)
  - Loyalty points earned display
  - Download & Share ticket actions
  - WhatsApp Support link + rescheduling

### 👤 3. Guest Portal (`portal/`)
- **Login / Register / Forgot Password** (Firebase-ready auth hooks)
- **Dashboard**: KPI widgets (upcoming visit, points, passport status, active offers)
- **My Bookings**: history, status filters, QR ticket cards, download
- **My Tickets**: per-ticket QR viewer, filter by park/date, share/download
- **Profile**: name, mobile, email, DOB, preferences, communication settings
- **Passport**: active plan, validity, visit count, renewal, upgrade prompts
- **Wallet** (`portal/wallet.html`):
  - Wallet balance card with credit/debit history
  - Add Money modal (UPI / Card / Net Banking)
  - Refund requests with timeline tracking
  - Gift vouchers — redeem, share, send
  - Spend analytics (Chart.js monthly trend + category doughnut)
- **Loyalty & Rewards**: WOW Star / Gold / Platinum / Diamond tiers, earn/redeem, activity chart, referral code
- **My Offers**: personalised offer cards with eligibility
- **Notifications**: booking, offer, system, loyalty tabs with unread state

### 🤝 4. Partner Portal (`partner/`)
- Partner login with branding
- **Onboarding wizard**: OTP → business profile → GST/PAN/CIN docs → verification queue
- **Dashboard**: KPIs, status bar, quick actions, revenue widget
- **Buy Tickets**: park selector, all categories, live pricing with 12% commission
- **Ticket Batches**: batch list, utilisation bars, QR PDF download
- **Invoices**: GST-compliant invoice list with PDF print
- **Statements**: credit wallet + commission ledger
- **Reports** (`partner/reports.html`):
  - Revenue & commission trend charts
  - Batch utilisation progress bars
  - Commission breakdown by product table
  - Payout schedule with status
  - Partner scorecard (5-metric performance rating)
  - Report downloads (GST invoice, commission statement, batch report)
  - Top-selling products, day-of-week chart, category split
- **Support**: ticket submission, WhatsApp / email / phone

### 🏢 5. Groups Hub (`groups/`)
- Index hub with corporate / school / birthday segmentation
- Corporate events (MICE, team outings, leadership retreats)
- School trips (educational day-trip packages, teacher ratio discounts)
- Birthday events (private celebrations, themed packages, decoration add-ons)
- All link to B2B Quote Builder

### 💼 6. B2B Sales Engine (`sales/`)
- **Sales Pipeline** (`sales/pipeline.html`):
  - Kanban board: Prospecting → Qualified → Quote Sent → Negotiation → Won
  - Deal cards with value, probability, tags, assignee, due date
  - List view with full deal table + stage/priority filters
  - Revenue forecast: committed / probable / possible stacked bar chart
  - Pipeline by stage doughnut chart
  - Forecast breakdown table (weighted value)
  - Task management (call / email / meeting / proposal types)
  - Activity log (all interactions per deal)
  - Add/Edit deal modal
- **CRM Leads** (`sales/leads.html`): full lead management with Salesforce-style pipeline
- **Quote Builder** (`sales/quote-builder.html`): 9 product categories, PDF preview, send/download

### ⚙️ 7. Super Admin Panel (`admin/` — 14 pages)

#### 📊 Leadership Dashboard (`admin/index.html`)
- Revenue, footfall, bookings, passport KPIs
- Revenue vs target chart, channel mix, park performance, Offer ROI, partner leaderboard

#### 🎟 Bookings (`admin/bookings.html`)
- Full booking table with search/filter, status management
- Booking detail drawer, cancellation workflow, refund triggers

#### 📦 Products & Inventory (`admin/products.html`)
- Ticket products table (park, category, price+GST, stock bar)
- Add-ons & F&B management
- Passport plan cards with edit/clone/delete
- **Pricing Matrix**: per-category MRP / Online / Counter / Partner prices (editable inline)
- Product add/edit modal with full field set (name, SKU, park, category, price, GST, stock, status, horizon, tags)

#### 👥 User Management & RBAC (`admin/users.html`)
- Guest user table (48K+ records, tier filter, search, bulk action)
- Staff & admin table (roles, 2FA status, last login, park access)
- **RBAC Permissions Matrix**: 14 permissions × 8 roles (Super Admin → Read Only)
- Role cards with user counts, edit, clone
- **Audit Log**: full tamper-evident event trail (login, role change, export, config, suspension)
- **KYC / Identity**: Aadhaar / DigiLocker / PAN / GST document review queue (approve/reject)
- Invite user modal with granular permission overrides
- User detail slide-over drawer (account info, loyalty, booking history link)

#### 🔐 Gate Redemption Console (`admin/gate.html`)
- Live QR scanner interface (camera / manual entry)
- Error detection (duplicate, expired, invalid, wrong park)
- Supervisor PIN override workflow
- Scan event log with timestamps
- Real-time footfall counter + hourly chart

#### 🪪 Passport Engine (`admin/passport.html`)
- Passport holder table, validity, visit count, tier
- Renewal workflow, upgrade paths, usage analytics

#### ⭐ Loyalty Engine (`admin/loyalty.html`)
- Tier management (Star / Gold / Platinum / Diamond thresholds)
- Points earn / burn rules per product
- Loyalty segment analytics, redemption reports

#### 🏷 Offer & Campaign Engine (`admin/offers.html`)
- Create / Edit / Pause / Clone / Version offers
- Flash-sale timer, segment targeting (tier/channel/park/product)
- Schedule + auto-expire, holiday/weather-triggered rules
- Discount approval workflow (>20% needs manager sign-off)
- Offer ROI performance table

#### 💰 Finance & GST (`admin/finance.html`)
- Revenue vs refunds chart, payment breakdown (Razorpay / UPI / Cards / Wallets)
- GST compliance summary (CGST / SGST / IGST), GSTR-1 / GSTR-3B
- Refund workflow with approval, commission payout management

#### 📈 Reporting (`admin/reporting.html`)
- Multi-dimensional revenue dashboards
- Park-wise / channel-wise / date-range reporting
- Footfall trends, conversion funnels, cohort analysis

#### 🤝 Partners (`admin/partners.html`)
- Partner onboarding queue, KYC verification
- Commission management, batch allocation, payout processing

#### 🎯 CRM (`admin/crm.html`)
- Kanban pipeline (Prospecting → Won/Lost)
- Leads with source tracking, assignment, priority
- Quotes tab, Tasks tab, sales reports with charts

#### 🖼 CMS (`admin/cms.html`)
- Content blocks management (hero, about, FAQ, attraction cards)
- Publish / draft / schedule workflow

#### 📢 Banner Manager (`admin/banners.html`)
- Homepage hero / notices / offer cards / ride cards
- Device-specific (desktop / mobile / tablet) preview
- Schedule + auto-expire banners

#### ⚙️ System Settings (`admin/settings.html`)
- Park configuration (hours, capacity, pricing, tax rates)
- Integration settings (Razorpay / PayU, MSG91 / Twilio, SendGrid / SES, Firebase)
- Notification templates (SMS, email, WhatsApp)
- GST / finance configuration
- Role and permission configuration

---

## 🔌 External Integrations (Architecture-Ready)

| Integration | Purpose | Implementation |
|---|---|---|
| **Razorpay / PayU** | Payments (cards, UPI, wallets) | booking.js → `/api/payments/create-order` |
| **MSG91 / Twilio** | SMS OTP + booking confirmations | `/api/notifications/sms` |
| **WhatsApp Business API** | Booking QR + updates | `/api/notifications/whatsapp` |
| **SendGrid / AWS SES** | Email confirmations + marketing | `/api/notifications/email` |
| **Google OAuth 2.0** | Social sign-in | Firebase Auth / `/api/auth/google` |
| **DigiLocker / Aadhaar** | KYC for B2B onboarding | `/api/kyc/verify` |
| **GST API (GSTIN)** | GST number validation | `/api/finance/gst/validate` |
| **Open-Meteo** | Live weather chip (no API key) | `shell.js` — live in production |
| **Google Calendar** | Holiday triggers for offers | `/api/scheduler/holidays` |
| **Salesforce CRM** | Lead/deal sync | `/api/crm/salesforce/webhook` |
| **Firebase** | Auth, push notifications | `js/firebase-config.js` |
| **QRCode.js** | E-ticket QR generation | CDN — `book/confirmation.html` |
| **Chart.js** | All analytics dashboards | CDN — admin + partner pages |

---

## 📡 API Route Architecture

### Public Routes
```
GET  /                              → index.html
GET  /water-park.html               → Water Park page
GET  /amusement-park.html           → Amusement Park page
GET  /combo.html                    → Combo deal page
GET  /passport.html                 → Annual Passport public page
GET  /offers.html                   → Offers listing
GET  /plan-your-visit.html          → Visitor guide
GET  /rides-attractions.html        → Ride catalogue
GET  /groups/                       → Groups hub
GET  /contact.html                  → Contact + FAQ
```

### Booking Routes
```
GET  /book/water-park.html          → WP booking flow
GET  /book/amusement-park.html      → AP booking flow
GET  /book/combo.html               → Combo booking flow
GET  /book/passport.html            → Passport purchase flow
GET  /book/group.html               → Group booking flow
GET  /book/confirmation.html        → Post-payment confirmation + QR
```

### Guest Portal Routes
```
GET  /portal/login.html             → Sign in
GET  /portal/register.html          → Create account
GET  /portal/dashboard.html         → Guest dashboard
GET  /portal/my-bookings.html       → Booking history
GET  /portal/tickets.html           → My e-tickets
GET  /portal/wallet.html            → Wallet + refunds + vouchers
GET  /portal/loyalty.html           → Loyalty wallet & tiers
GET  /portal/passport.html          → Passport management
GET  /portal/offers.html            → My offers
GET  /portal/notifications.html     → Notification centre
GET  /portal/profile.html           → Profile settings
```

### B2B / Partner Routes
```
GET  /partner/login.html            → Partner sign in
GET  /partner/dashboard.html        → Partner dashboard
GET  /partner/buy-tickets.html      → Bulk ticket purchase
GET  /partner/ticket-batches.html   → Batch management
GET  /partner/invoices.html         → GST invoices
GET  /partner/statements.html       → Commission ledger
GET  /partner/reports.html          → Analytics & reports
GET  /partner/support.html          → Support tickets
```

### B2B Sales Routes
```
GET  /sales/pipeline.html           → Sales pipeline (Kanban + forecast)
GET  /sales/leads.html              → Lead management
GET  /sales/quote-builder.html      → Quote builder
```

### Admin Routes
```
GET  /admin/index.html              → Leadership dashboard
GET  /admin/bookings.html           → Booking management
GET  /admin/products.html           → Products & pricing matrix
GET  /admin/users.html              → User management + RBAC + KYC
GET  /admin/gate.html               → Gate Redemption Console
GET  /admin/passport.html           → Passport Engine
GET  /admin/loyalty.html            → Loyalty Engine
GET  /admin/offers.html             → Offer & Campaign Engine
GET  /admin/finance.html            → Finance & GST
GET  /admin/reporting.html          → Reporting dashboards
GET  /admin/partners.html           → Partner management
GET  /admin/crm.html                → CRM Pipeline
GET  /admin/cms.html                → CMS Content Manager
GET  /admin/banners.html            → Banner Manager
GET  /admin/settings.html           → System configuration
```

---

## 📊 Data Models (Relational Schema)

| Table | Key Fields |
|---|---|
| `users` | id, name, email, mobile, dob, tier, points, passport_id, created_at |
| `business_accounts` | id, name, type, gstin, pan, contact, status, credit_limit |
| `park_products` | id, park_id, name, sku, category, mrp, gst_rate, stock, status |
| `bookings` | id, user_id, park_id, product_ids, visit_date, guests, total, gst, status |
| `tickets_issued` | id, booking_id, qr_data, ticket_type, status, scanned_at |
| `passport_plans` | id, name, price, validity_days, parks, features |
| `passport_holders` | id, user_id, plan_id, start_date, end_date, visit_count, status |
| `loyalty_accounts` | id, user_id, tier, points_balance, lifetime_points |
| `loyalty_transactions` | id, account_id, type, points, reference, created_at |
| `offers` | id, name, discount_type, value, segment, trigger, start, end, status |
| `leads` | id, org, contact, source, stage, value, owner, created_at |
| `quotes` | id, lead_id, ref, total, discount, status, valid_until |
| `quote_line_items` | id, quote_id, product, qty, unit_price, discount |
| `invoices` | id, entity_id, ref, gst_breakdown, total, status, due_date |
| `wallet_transactions` | id, user_id, type, amount, balance, reference, created_at |
| `audit_log` | id, actor_id, action, entity, changes, ip, timestamp |
| `notifications` | id, user_id, type, title, body, read, created_at |
| `kyc_documents` | id, entity_id, doc_type, status, reviewer_id, reviewed_at |
| `gate_scans` | id, ticket_id, gate_id, operator_id, status, timestamp |
| `partner_batches` | id, partner_id, product_id, qty, used, expiry, qr_seed |

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary | `#0055B3` (WOW Blue) |
| Gold | `#F5A800` |
| Background | `#0a0f1e` |
| Surface | `#111827` |
| Card | `#1a2235` |
| Border | `rgba(255,255,255,.08)` |
| Green | `#10b981` |
| Red | `#ef4444` |
| Fonts | Nunito (body/headings) + Poppins (numbers/prices) |

---

## 🚀 Platform Deliverables Checklist (Blueprint IDs 1–15)

| ID | Deliverable | Status |
|---|---|---|
| 1 | Public Website (home, parks, rides, visit, safety) | ✅ Complete |
| 2 | Ticket Booking Flows (WP / AP / Combo / Passport / Group + Confirmation) | ✅ Complete |
| 3 | Guest Portal (dashboard, bookings, tickets, wallet, passport, loyalty, notifications) | ✅ Complete |
| 4 | B2B Partner Portal (8 pages + reports) | ✅ Complete |
| 5 | Admin Backend (14 pages incl. products + users/RBAC) | ✅ Complete |
| 6 | Gate Ops / Redemption Console | ✅ Complete |
| 7 | CRM / Sales Pipeline (Kanban, forecast, leads, quotes) | ✅ Complete |
| 8 | Finance / GST Engine | ✅ Complete |
| 9 | CMS (banner manager + content manager) | ✅ Complete |
| 10 | Offer / Campaign Engine (create, schedule, approve, auto-expire) | ✅ Complete |
| 11 | Passport Engine (purchase flow + admin console) | ✅ Complete |
| 12 | Loyalty Engine (tiers, earn/burn, wallet, referral) | ✅ Complete |
| 13 | Reporting Dashboards (admin + partner) | ✅ Complete |
| 14 | System Configuration (settings, integrations, roles) | ✅ Complete |
| 15 | README / Blueprint Documentation | ✅ Complete |

---

## 📁 File Count Summary

| Directory | Pages |
|---|---|
| Root public site | 13 pages |
| `book/` | 6 pages |
| `portal/` | 12 pages |
| `partner/` | 9 pages |
| `groups/` | 4 pages |
| `sales/` | 3 pages |
| `admin/` | 15 pages |
| **Total** | **62 pages** |

---

## ⚠️ Important Notes

- **Logo**: `images/logo.png` is the REAL Worlds of Wonder logo — **HARD ADOPTED. DO NOT MODIFY, FILTER, OR REPLACE.**
- **Weather API**: Open-Meteo (no key required) fetches live temperature for Noida (28.5355°N, 77.3910°E).
- **Auth**: Firebase Auth hooks are wired throughout the portal. Configure `js/firebase-config.js` with your Firebase project credentials.
- **Payments**: Razorpay / PayU order creation calls are stubbed — wire to `/api/payments/create-order` in production.
- **QR Codes**: Generated client-side via `qrcode.js` CDN in `book/confirmation.html`. Production QR should be server-signed for tamper-proofing.
- **shell.js BASE**: Auto-detects subdirectory depth for `book/`, `admin/`, `groups/`, `sales/`, `portal/`, `partner/`.

---

## 🏢 About

**Worlds of Wonder** · A-2, Sector 38A, Noida — 201301, Uttar Pradesh, India
Part of **Entertainment City Ltd.** · CIN: U92410DL1994PTC057935
📞 080-6909-0000 · ✉️ support@worldsofwonder.in · 🕙 Open daily 10:00 AM – 6:00 PM
