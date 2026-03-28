# Worlds of Wonder — EALCPL Digital Platform
### Complete Static Website · 100+ Pages · Full ERP Stack

**Status: Production-Ready Static Site** | Last Updated: March 2026

---

## 🎯 Project Overview

Worlds of Wonder (WOW), Noida — India's premier dual-park theme park destination (Water Park + Amusement Park). This is the complete digital platform covering the public website, customer portal, booking engine, admin ERP suite, and B2B partner portals — all as a static HTML/CSS/JS site.

- **Location**: Sector 38A, Noida, Uttar Pradesh
- **Parks**: Water Park (20+ rides) + Amusement Park (30+ rides)
- **Ticketing**: ₹1,299 (Water Park) · ₹1,199 (Amusement Park) · ₹1,999 (Combo) · ₹4,999 (Annual Passport)
- **GST**: 18% (CGST 9% + SGST 9%) on all B2C ticket sales

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
│   └── confirmation.html           # Booking confirmation + QR ticket

├── portal/                         # CUSTOMER PORTAL
│   ├── login.html                  # Login (OTP / email / Google / Facebook / Business KYC)
│   ├── register.html               # Customer & business registration
│   ├── forgot-password.html        # Password reset
│   ├── dashboard.html              # ✅ UPGRADED: Rich dashboard (countdown, wallet, loyalty, QR, offers, charts)
│   ├── guest-details.html          # ✅ NEW: Booking step 2 — guest info, OTP verify, coins/promo, payment bridge
│   ├── tickets.html                # My tickets (active, past, QR codes)
│   ├── my-bookings.html            # Booking history & management
│   ├── wow-passport.html           # ✅ Indian-style e-Passport (3 tiers: Explore/Together/Legacy, MRZ, QR vouchers)
│   ├── passport-card.html          # Passport wallet card view
│   ├── loyalty.html                # Loyalty coins history & redemption
│   ├── wallet.html                 # WOW Wallet (top-up, history, auto-reload)
│   ├── offers.html                 # Personalised offers
│   ├── profile.html                # Account profile & settings
│   └── notifications.html          # Notification centre

├── admin/                          # ADMIN ERP (50+ pages)
│   ├── index.html                  # Admin dashboard (KPIs, activity feed)
│   ├── bookings.html               # All bookings management
│   ├── tickets.html                # Tickets issued
│   ├── inventory.html              # Inventory management
│   ├── pricing.html                # Dynamic pricing rules
│   ├── offers.html                 # Offers & campaign management
│   ├── banners.html                # CMS banner management
│   ├── cms.html                    # Content management system
│   ├── crm.html                    # CRM & lead pipeline
│   ├── call-center.html            # Call centre ERP (Hinglish AI agent, escalation, refunds)
│   ├── gate.html                   # Gate QR scanner & capacity monitoring
│   ├── ops-dashboard.html          # ✅ UPGRADED: Live Ops Command Centre (ticker, capacity rings, weather, incidents)
│   ├── revenue-analytics.html      # ✅ NEW: Full BI dashboard (trend, channel, hourly, forecast, 28-day table)
│   ├── finance.html                # Finance & P&L
│   ├── gst-engine.html             # GST filing engine
│   ├── invoices.html               # Invoice management
│   ├── fnb-packages.html           # ✅ F&B Package Manager (CSV upload, quote builder, inventory)
│   ├── ticketing-engine.html       # Ticket configuration & allocation engine
│   ├── passport-engine.html        # Passport issuance & management engine
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
│   ├── super-admin.html            # ✅ QA'd: Super Admin (KYC queue, role matrix, audit-log links, module toggles)
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
│   ├── buy-tickets.html            # Bulk ticket purchase
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
│   ├── passport-login.html         # Sales agent login
│   ├── erp-dashboard.html          # ✅ Salesforce-like CRM/ERP dashboard
│   ├── erp-crm.html                # CRM & leads
│   ├── erp-agents.html             # Agent performance
│   ├── erp-products.html           # Products catalogue
│   ├── erp-reports.html            # Sales ERP reports
│   ├── leads.html                  # Lead management
│   ├── passport-dashboard.html     # Agent passport dashboard
│   ├── passport-kyc.html           # KYC onboarding flow
│   ├── passport-payment.html       # Payment collection
│   ├── passport-issued.html        # Issued passport confirmation
│   ├── quote-builder.html          # Quote builder
│   └── bulk-tickets.html           # Bulk ticket generation

├── reseller/                       # RESELLER ERP
│   └── index.html                  # ✅ Inventory cards, bulk QR (200 max), commission ledger (TDS 2%), team mgmt

├── internal/                       # INTERNAL STAFF PORTAL
│   └── index.html                  # Internal dashboard with role-based login

├── css/                            # STYLESHEETS
│   ├── style.css                   # Main public site styles
│   ├── wow-design-system.css       # Admin ERP design system
│   ├── booking-page.css            # Booking flow styles
│   └── forms.css                   # Form component styles

├── js/                             # JAVASCRIPT
│   ├── shell.js                    # Global header/footer injector (shell architecture)
│   ├── main.js                     # Public site JS
│   ├── wow-modules.js              # Module feature flags
│   └── banner-engine.js            # Banner/offer engine

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
| `/book/water-park.html` | Water Park booking (date, guests, add-ons) |
| `/book/amusement-park.html` | Amusement Park booking |
| `/book/combo.html` | Combo booking |
| `/book/group.html` | Group booking (5 steps: type → tickets → details → pay → confirm) |
| `/portal/guest-details.html` | Step 2 guest info (OTP verify, coins/promo, GST) |
| `/book/payment.html` | Payment (Razorpay: cards/UPI/wallets/net-banking) |
| `/book/confirmation.html` | Booking confirmation + QR ticket |

### Customer Portal
| URL | Description |
|-----|-------------|
| `/portal/login.html` | Sign in (OTP / email / social) |
| `/portal/dashboard.html` | Customer dashboard (countdown, tickets, wallet, loyalty) |
| `/portal/wow-passport.html` | WOW Passport (3 tiers, MRZ, QR vouchers) |
| `/portal/wallet.html` | WOW Wallet |
| `/portal/loyalty.html` | Loyalty coins |

### Admin ERP
| URL | Description |
|-----|-------------|
| `/admin/index.html` | Admin dashboard |
| `/admin/ops-dashboard.html` | Live Ops Command Centre |
| `/admin/revenue-analytics.html` | Full BI / Revenue Analytics Dashboard |
| `/admin/call-center.html` | Call Centre ERP |
| `/admin/gate.html` | Gate QR Scanner |
| `/admin/fnb-packages.html` | F&B Package Manager |
| `/admin/super-admin.html` | Super Admin (KYC, roles, audit) |
| `/admin/passport-engine.html` | Passport Engine |
| `/admin/ticketing-engine.html` | Ticketing Engine |
| `/admin/notifications.html` | Push Notification Engine |

### B2B / Partner
| URL | Description |
|-----|-------------|
| `/partner/dashboard.html` | Partner portal dashboard |
| `/partner/onboarding-kyc.html` | Partner KYC onboarding |
| `/partner/quote-builder.html` | Quote builder |
| `/ta/index.html` | Travel Agent Mini-ERP |
| `/sales/erp-dashboard.html` | Sales ERP (Salesforce-style CRM) |
| `/reseller/index.html` | Reseller ERP |

---

## 💾 Data Models & Pricing

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
- [x] Tickets, My Bookings, Profile, Notifications

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

### B2B & Partner
- [x] Partner Portal (dashboard, KYC, quote builder, bulk tickets, invoices)
- [x] Travel Agent Mini-ERP (leads Kanban, commission ledger, team management)
- [x] Sales ERP (Salesforce-style CRM, deal pipeline, agent targets, reports)
- [x] Reseller ERP (inventory, bulk QR generator max 200, commission, Platinum tier)

---

## 🚧 Not Yet Implemented (Future Roadmap)

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
