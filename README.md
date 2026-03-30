# 🎡 Worlds of Wonder — Full-Stack Ticketing & Booking Ecosystem

> **Enterprise-grade, fully dynamic, real-time ticketing, booking, and revenue optimization platform** built as a static-site SPA with a RESTful data layer and modular JavaScript engines.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Public-Facing Frontend                      │
│  index.html · water-park.html · amusement-park.html · combo.html│
│  passport.html · offers.html · contact.html + group pages       │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                     Booking Engine Layer                        │
│  book/water-park.html  book/amusement-park.html  book/combo.html│
│  book/passport.html    book/payment.html          book/group.html│
│  book/confirmation.html                                         │
│                                                                 │
│  JS: booking.js · wow-offer-engine-v4.js · wow-offer-cart.js   │
│      wow-terms.js · wow-session-prefill.js · wow-modules.js    │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│                    Revenue & Offer Engines                      │
│  admin/offer-engine.html       (Offer CRUD & rule builder)      │
│  admin/offer-analytics.html    (Offer KPIs & A/B testing)      │
│  admin/engine-hub.html         (Unified engine monitoring hub)  │
│  js/wow-offer-engine-v4.js     (Core evaluation engine)        │
│  js/wow-offer-cart.js          (Cart-side offer integration)   │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│              Passport Engine                                    │
│  admin/passport-engine.html    (Full issuance & KYC console)   │
│  admin/passport-kyc-review.html (KYC approval workflow)        │
│  admin/passport-scanner.html   (QR gate entry scanner)         │
│  admin/passport-redemptions.html (Redemption log)             │
│  sales/passport-login.html     (Passport Sales Portal)        │
│  js/wow-passport-engine.js     (Core passport engine)         │
│  portal/wow-passport.html      (Customer passport view)       │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│              Reseller & Salesperson Engine                      │
│  reseller/index.html           (Reseller ERP)                  │
│  reseller/salesperson.html     (Salesperson dashboard)        │
│  reseller/salesperson-performance.html (Analytics)            │
│  admin/reseller-engine.html    (Admin reseller config)        │
│  js/reseller-engine.js         (Core reseller engine)        │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│              Call Center CRM Engine                             │
│  admin/call-center.html        (Full CRM with case management)  │
│  admin/crm-analytics.html      (CRM KPIs & agent performance)  │
│  admin/crm-live.html           (Live agent dashboard)          │
│  js/crm-engine.js              (Core CRM engine)               │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│         Customer Portal                                         │
│  portal/login.html · portal/register.html                      │
│  portal/dashboard.html · portal/my-bookings.html               │
│  portal/profile.html · portal/tickets.html                     │
│  portal/loyalty.html · portal/wallet.html                      │
│  portal/offers.html · portal/notifications.html                │
│  portal/referral.html · portal/wow-passport.html               │
│  js/wow-auth.js (auth engine) · js/wow-auth-guard.js           │
└──────────────┬──────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────────┐
│         Admin / Ops / Finance Portals                           │
│  admin/super-admin.html  (Super Admin — all controls)          │
│  admin/index.html        (Admin ERP home)                      │
│  admin/bookings.html     (Booking management)                  │
│  admin/inventory.html    (Inventory & capacity management)     │
│  admin/dynamic-pricing.html (Demand-based pricing engine)      │
│  admin/gst-engine.html   (GST computation & invoicing)        │
│  admin/finance.html      (Financial reporting)                 │
│  admin/notifications.html (Push notification management)      │
│  admin/users.html / user-management.html                       │
│  admin/loyalty-engine.html  admin/reporting.html               │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Completed Features

### 🎟 Booking Engine
- **3 booking flows**: Water Park, Amusement Park, Combo (both parks)
- **Dynamic pricing** per category (Adult, Child, Senior, Armed Forces, Specially Abled)
- **Group discount** engine: auto-applied at 10+ tickets
- **Buffet add-on** integration
- **Offer/promo widget** (WOWOfferCart) — real-time evaluation, live savings display
- **T&C consent** gating before checkout (WOWTerms)
- **Session prefill** for logged-in customers
- **Booking confirmation** page with QR ticket display
- **Payment page** with UPI/card/wallet/net banking options

### 🏷 Offer Configuration & Execution Engine (v4.0)
- **`js/wow-offer-engine-v4.js`** — 77KB core engine
- **Offer types**: percent, flat, per_ticket, free_tickets, slab_percent, slab_flat, credit, fnb_credit, fee_waiver, price_override, percent_cap, hybrid
- **Conditions**: date_range, day_of_week, hour_range, cart_value, qty_total, qty_category, park, category, promo_code, coupon_code, channel, segment, first_booking, ab_variant, demand_level, inventory
- **Lifecycle**: draft → scheduled → active → paused → expired → archived → superseded
- **A/B Testing**: variant assignment, holdout groups, conversion tracking
- **Stacking & Conflict Resolution**: priority-based best-deal selection
- **Budget caps**: per-offer spend and usage limits
- **Audit logging**: full immutable trail (localStorage, max 500 entries)
- **Admin UI**: `admin/offer-engine.html` — complete CRUD, rule builder, simulation, version history
- **Analytics**: `admin/offer-analytics.html` — revenue impact, redemption funnels, A/B results
- **Cart Integration**: `js/wow-offer-cart.js` wired into all 3 booking pages
- **CSS**: `css/offer-widget.css` — standalone, responsive offer panel

### 🪪 WOW Passport Engine
- **`js/wow-passport-engine.js`** — 41KB engine
- **Tiers**: Explore (single), Together (family 4), Legacy (legacy 6)
- **Digital issuance** with QR code generation
- **KYC workflow**: photo + ID proof upload, admin review (`admin/passport-kyc-review.html`)
- **Entry rights**: unlimited multi-entry, park-specific entitlements
- **Voucher management**: FnB, locker, birthday upgrade vouchers
- **Guest passes**: tier-based guest pass allocation
- **Renewal/upgrade flow** with pricing logic
- **Admin scanner**: `admin/passport-scanner.html` — QR scan, live validity check
- **Redemption log**: `admin/passport-redemptions.html`
- **Sales portal**: `sales/passport-login.html` + `sales/passport-dashboard.html`
- **KYC review console**: `admin/passport-kyc-review.html`

### 🏪 Reseller Engine
- **`js/reseller-engine.js`** — 63KB engine
- **Unique reseller identity codes** (WOW-RS-xxxx format, tier-prefixed)
- **Salesperson identity codes** (WOW-SA-xxxx + WOW-SM-xxxx)
- **Coded batch & ticket IDs** (batch: WOW-BT-{year}-{seq}, tickets: {resellerId}-{batchSeq}-{ticketSeq})
- **Traceable allocation**: batch → ticket → redemption chain
- **Tier system**: Platinum, Gold, Silver, Bronze
- **Commission engine**: tier-based commission rates
- **Reseller ERP**: `reseller/index.html` — dashboard, allocations, issued tickets, statements
- **Salesperson dashboard**: `reseller/salesperson.html`
- **Salesperson analytics**: `reseller/salesperson-performance.html` — full performance charts
- **Admin engine**: `admin/reseller-engine.html` — reseller CRUD, code generation, audit

### 📞 Call Center CRM Engine
- **`js/crm-engine.js`** — 44KB engine
- **Structured case capture**: caller info, issue type, priority, booking reference
- **Case lifecycle**: NEW → RECORDED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
- **Escalation matrix**: SLA-based auto-escalation (CRITICAL: 2h, URGENT: 4h, HIGH: 8h, NORMAL: 24h, LOW: 72h)
- **Business lead forms**: corporate, group, birthday, school, travel agent
- **Agent assignment & routing**: skill-based routing, round-robin
- **Timeline/worklog**: full audit trail per case
- **Follow-up management**: scheduled callbacks, reminder flags
- **Full CRM UI**: `admin/call-center.html` — 113KB comprehensive module
- **Live agent dashboard**: `admin/crm-live.html`
- **Analytics dashboard**: `admin/crm-analytics.html` — KPIs, SLA gauges, agent leaderboard, heatmaps

### 👤 Customer Portal
- **Authentication**: email OTP (PIN: 1234), social login stubs, business sign-in
- **My Bookings**: QR ticket view, cancel/reschedule
- **My Rewards**: loyalty points, redemption history
- **My Wallet**: WOW Wallet balance, top-up, transaction history
- **WOW Passport**: digital passport card view
- **Notifications**: push notification preferences
- **Referral**: referral code sharing, earnings track
- **Profile**: personal info, KYC, preferences

### 🛡 Admin & Operations
- **Super Admin**: `admin/super-admin.html` — 145KB master control panel
- **Engine Hub**: `admin/engine-hub.html` — unified status monitoring for all engines
- **Dynamic Pricing**: `admin/dynamic-pricing.html` — demand-based price rules
- **GST Engine**: `admin/gst-engine.html` — tax computation, invoicing
- **Inventory**: `admin/inventory.html` — capacity management per park & date
- **Ops Dashboard**: `admin/ops-dashboard.html` — gate counts, queue status
- **Revenue Analytics**: `admin/revenue-analytics.html`
- **Audit Logs**: `admin/audit-logs.html`

### 🤝 Partner Portals
- **Travel Agent Portal**: `ta/index.html` — bookings, commissions, approvals
- **Partner Portal**: `partner/login.html` — B2B partner access
- **B2B Approvals**: `admin/b2b-approvals.html`
- **TA Approvals**: `admin/ta-approvals.html`

---

## 🗺 URI Reference Map

### Public Pages
| Path | Description |
|------|-------------|
| `/index.html` | Home page |
| `/water-park.html` | Water Park info |
| `/amusement-park.html` | Amusement Park info |
| `/passport.html` | WOW Passport product page |
| `/offers.html` | Current offers listing |
| `/contact.html` | Contact page |

### Booking Flows
| Path | Park Key | Description |
|------|----------|-------------|
| `/book/water-park.html` | `WATER_DAY` | Water Park ticket booking |
| `/book/amusement-park.html` | `AMUSEMENT_DAY` | Amusement Park ticket booking |
| `/book/combo.html` | `COMBO_DAY` | Combo (both parks) booking |
| `/book/passport.html` | — | Passport purchase flow |
| `/book/group.html` | — | Group booking form |
| `/book/payment.html` | — | Payment gateway |
| `/book/confirmation.html` | — | Booking confirmation + QR |

### Customer Portal
| Path | Description |
|------|-------------|
| `/portal/login.html` | Customer sign-in (OTP: 1234) |
| `/portal/login.html?type=business` | Business sign-in |
| `/portal/register.html` | Registration |
| `/portal/dashboard.html` | Customer dashboard |
| `/portal/my-bookings.html` | Booking history + QR tickets |
| `/portal/profile.html` | Profile & KYC |
| `/portal/loyalty.html` | Rewards & points |
| `/portal/wallet.html` | WOW Wallet |
| `/portal/tickets.html` | Active tickets |
| `/portal/offers.html` | Customer offers |
| `/portal/notifications.html` | Notification preferences |
| `/portal/referral.html` | Referral program |
| `/portal/wow-passport.html` | Digital passport view |

### Staff Portals
| Path | Role | Credentials |
|------|------|-------------|
| `/admin/admin-login.html` | All Admin | PIN-based |
| `/admin/super-admin.html` | SUPER_ADMIN | akm@indiagully.com / 1234 |
| `/admin/index.html` | Admin ERP | rajesh@wow.in / 2345 |
| `/admin/call-center.html` | CRM_AGENT | sneha.crm@wow.in / 5678 |
| `/admin/crm-analytics.html` | ADMIN+ | Full analytics |
| `/admin/crm-live.html` | CRM_AGENT | Live dashboard |
| `/admin/engine-hub.html` | ADMIN+ | All engine status |
| `/admin/offer-engine.html` | ADMIN+ | Offer CRUD |
| `/admin/offer-analytics.html` | ADMIN+ | Offer KPIs |
| `/admin/passport-engine.html` | ADMIN+ | Passport management |
| `/admin/reseller-engine.html` | ADMIN+ | Reseller management |
| `/admin/dynamic-pricing.html` | ADMIN+ | Pricing rules |
| `/admin/inventory.html` | OPS | Capacity management |
| `/admin/gate.html` | GATE_AGENT | Gate entry scanner |
| `/admin/finance.html` | FINANCE | Financial reports |
| `/internal/index.html` | All Staff | Staff gateway |

### Partner / Reseller
| Path | Role | Credentials |
|------|------|-------------|
| `/reseller/login.html` | RESELLER | resell@wow.in / 901200 |
| `/reseller/index.html` | RESELLER | Reseller ERP |
| `/reseller/salesperson.html` | RESELLER | Salesperson dashboard |
| `/reseller/salesperson-performance.html` | RESELLER | Analytics |
| `/ta/index.html` | TRAVEL_AGENT | ta@travelease.in / 0123 |
| `/partner/login.html` | PARTNER | partner@mmt.in / 8901 |
| `/sales/passport-login.html` | SALES_AGENT | WOW-SA-2401 |
| `/sales/erp-dashboard.html` | SALES_AGENT | Sales ERP |

---

## 🔑 Test Credentials

| Portal | Email / Code | PIN | Role |
|--------|-------------|-----|------|
| Super Admin | akm@indiagully.com | 1234 | SUPER_ADMIN |
| Admin | rajesh@wow.in | 2345 | ADMIN |
| Finance | priya.fin@wow.in | 3456 | FINANCE |
| Ops | vikram.ops@wow.in | 4567 | OPS |
| CRM Agent | sneha.crm@wow.in | 5678 | CRM_AGENT |
| Gate Agent | ravi.gate@wow.in | 6789 | GATE_AGENT |
| Sales Agent | sanjay@wow.in | 7890 | SALES_AGENT |
| Passport Sales | WOW-SA-2401 | (demo button) | SALES_AGENT |
| Partner | partner@mmt.in | 8901 | PARTNER |
| Reseller Platinum | resell@wow.in | 901200 | RESELLER |
| Reseller Gold | delhi@trips.in | 654321 | RESELLER |
| Travel Agent | ta@travelease.in | 0123 | TRAVEL_AGENT |
| Customer | any email | OTP: 1234 | CUSTOMER |

---

## 📦 JavaScript Engine Library

| File | Size | Description |
|------|------|-------------|
| `js/wow-offer-engine-v4.js` | 77KB | Core offer evaluation engine |
| `js/wow-offer-cart.js` | 28KB | Cart-side offer integration layer |
| `js/wow-passport-engine.js` | 41KB | Passport issuance & management |
| `js/reseller-engine.js` | 63KB | Reseller & salesperson identity engine |
| `js/crm-engine.js` | 44KB | CRM case management engine |
| `js/wow-auth.js` | 37KB | Authentication & session management |
| `js/booking.js` | 37KB | Core booking flow engine |
| `js/shell.js` | 24KB | Site shell (nav, footer, topbar) |
| `js/wow-content-control.js` | 19KB | Module-level feature flags |
| `js/wow-terms.js` | 23KB | T&C consent management |
| `js/wow-modules.js` | 9KB | Module registry |
| `js/wow-auth-guard.js` | 3KB | Route-level auth guard |
| `js/wow-session-prefill.js` | 6KB | Session-based form prefill |
| `js/main.js` | 9KB | Global init & utilities |
| `js/banner-engine.js` | 12KB | Promotional banner management |
| `js/firebase-config.js` | 2KB | Firebase stub config |

---

## 🗃 Data Storage Model

All data is persisted in **browser localStorage** using structured JSON arrays keyed by engine namespace:

### Offer Engine (wow_offer_engine-v4.js)
| Key | Description |
|-----|-------------|
| `wow_offers_v4` | All offer definitions |
| `wow_offer_audit` | Immutable audit trail (max 500) |
| `wow_exec_log` | Execution log (max 2000) |
| `wow_ab_assignments` | A/B variant assignments |
| `wow_usage_v4` | Per-offer usage counters |
| `wow_budget_v4` | Per-offer budget spend |
| `wow_offer_versions` | Version history |

### Passport Engine
| Key | Description |
|-----|-------------|
| `wpe_config` | Engine meta config |
| `wpe_passports` | All passport records |
| `wpe_kyc` | KYC submissions |
| `wpe_redemptions` | Entry redemption log |
| `wpe_voucher_lib` | Voucher library |
| `wpe_customers` | Customer passport profiles |
| `wpe_audit` | Audit trail |

### Reseller Engine
| Key | Description |
|-----|-------------|
| `wow_resellers` | Reseller master records |
| `wow_reseller_batches` | Ticket batch allocations |
| `wow_reseller_tickets` | Individual ticket records |
| `wow_salespersons` | Salesperson records |
| `wow_reseller_audit` | Audit log |

### CRM Engine
| Key | Description |
|-----|-------------|
| `wow_crm_cases` | All CRM cases |
| `wow_crm_timeline` | Per-case timeline events |
| `wow_crm_users` | Agent user records |
| `wow_crm_escalation_rules` | SLA escalation matrix |

### Booking
| Key | Description |
|-----|-------------|
| `wow_bookings` | All booking records |
| `wow_cart_coupon` | Active coupon in session |
| `wow_auth_session` | Staff auth session |
| `wow_portal_session` | Customer auth session |
| `wow_reseller_session` | Reseller auth session |

---

## 🚦 RESTful Table API Endpoints

Uses relative `/tables/{tableName}` endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `tables/{table}?page=1&limit=100` | List records |
| GET | `tables/{table}/{id}` | Get single record |
| POST | `tables/{table}` | Create record |
| PUT | `tables/{table}/{id}` | Full update |
| PATCH | `tables/{table}/{id}` | Partial update |
| DELETE | `tables/{table}/{id}` | Soft delete |

---

## 🔮 Pending / Future Enhancements

- [ ] **Real payment gateway** integration (Razorpay / PayU)
- [ ] **Firebase Realtime Database** sync for live inventory counts
- [ ] **Push notifications** via Firebase Cloud Messaging
- [ ] **Email/SMS delivery** via SendGrid / Twilio API
- [ ] **PDF ticket generation** (jsPDF) on confirmation page
- [ ] **Dynamic QR scanning** with camera API on gate pages
- [ ] **AI-powered demand forecasting** in dynamic pricing engine
- [ ] **Multi-language support** (Hindi, Tamil, Telugu)
- [ ] **Accessibility audit** (WCAG 2.1 AA compliance)
- [ ] **Service Worker** for offline booking capability

---

## 🌐 Navigation & Shell

The shared shell (`js/shell.js`) injects:
- **Topbar**: Logo, weather chip, session-aware auth widget
- **Ticker**: Rotating promotional messages
- **Mega-nav**: Parks, Tickets, Groups, Offers, Visit dropdowns
- **Footer**: All portal links including Staff/Partner sections

Footer "My Account" links: Sign In, Business Sign In, My Bookings, My Rewards  
Staff portals: Internal Gateway, Super Admin, Admin ERP, Sales ERP, Passport Sales, Call Centre CRM, CRM Analytics, Engine Hub

---

*Built for Worlds of Wonder (A-2, Sector 38A, Noida — 201301) · Part of Entertainment City Ltd.*  
*Last updated: 2026-03-30*
