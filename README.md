# Worlds of Wonder — Digital Platform
**Version 8.0 · March 2025**  
Live: https://worldsofwonder.in | Repo: https://github.com/arunkumarmanikonda-web/worlds-of-wonder

---

## Platform Overview

Full-stack digital platform for Worlds of Wonder (WOW), Delhi NCR's premier dual-park destination. Includes the public website, customer portal, internal staff portals, partner ERPs, passport system, and sales tools.

---

## Directory Structure

```
/                   Public website (index.html, water-park, amusement-park, combo, etc.)
/css/               Master stylesheets
/js/                Shared JS (shell.js, modules, booking)
/images/            All park images and logo (logo.png — unaltered)
/book/              Booking flow (payment, confirmation)
/groups/            Group pages (corporate, schools, birthdays)
/portal/            Customer portal (login, dashboard, tickets, passport, loyalty, wallet)
/passport/          Passport holder portal (login, register, my-passport)
/internal/          Staff gateway — single login selector for all portals
/admin/             Admin & Operations ERP (36+ pages)
/sales/             Sales Force ERP (passport sales, CRM, agents, reports)
/partner/           Partner portal (TA/reseller onboarding, KYC, dashboard)
/reseller/          Reseller ERP (inventory, bulk tickets, team, commissions)
/ta/                Travel Agent ERP (leads, pipeline, team, bookings)
/data/              Static JSON data files
```

---

## Completed Features

### Public Website
- [x] Homepage with cinematic hero carousel (YouTube BG + photo slides)
- [x] Water Park, Amusement Park, Combo, Passport public pages
- [x] Offers, Gallery, FAQ, Plan Your Visit, Safety Guidelines, Contact
- [x] Mega-nav with dropdown menus, live weather chip (Open-Meteo)
- [x] Cheeky Hinglish comms ticker
- [x] Customer login buttons (Individual + Business) BEFORE the WOW logo in nav
- [x] All internal/staff portal links in footer
- [x] Groups pages (Corporate, Schools, Birthdays)
- [x] Real-time weather display
- [x] WOW logo unaltered across all 100+ pages

### WOW Passport System (Indian Passport Design)
- [x] `portal/wow-passport.html` — Full Indian passport-style digital passport
- [x] Three tiers: **Explore** (₹1,999 · 5 visits), **Together** (₹3,499 · 10 visits · 4 pax), **Legacy** (₹5,999 · Unlimited · 1 year)
- [x] Passport cover with embossed guilloché background, emblem, gold bar accent
- [x] Biographical data page with MRZ (Machine Readable Zone)
- [x] Visa-stamp style voucher pages — each voucher has its own QR code (used/unused states)
- [x] Validity circle with days/tier info
- [x] Passport privileges page per tier
- [x] Back cover with master QR code
- [x] QRCode.js integration for dynamic QR generation
- [x] Download / Share / Scan at Gate actions

### Internal Staff Gateway
- [x] `internal/index.html` — Unified portal selector for all staff roles
- [x] Single-page with login modals per portal (Super Admin, Admin, Sales, Passport, Call Centre, Reseller, Travel Agent, Corporate)
- [x] Full Authority & Access Matrix table
- [x] Super Admin shortcut with credentials pre-noted

### Super Admin Panel
- [x] `admin/super-admin.html` — Complete super admin control panel
- [x] Dashboard with stats + pending KYC approvals
- [x] User Management — create, edit, suspend all role types
- [x] Module Control — 21 modules with live toggle (on/off checkboxes)
- [x] Rights & Roles — full escalation matrix
- [x] Audit Logs — system event trail
- [x] Super Admin credentials: `akm@indiagully.com` / `India@5327`

### Customer Portal (`/portal/`)
- [x] Multi-method login: Mobile OTP, Email/Password, Google OAuth
- [x] Business login with redirect to KYC onboarding
- [x] Dashboard, My Bookings, Tickets, Notifications, Wallet, Loyalty, Offers
- [x] WOW Passport (Indian passport design, all 3 tiers)
- [x] Profile & KYC

### Passport Holder Portal (`/passport/`)
- [x] Login, Register with full KYC, My Passport dashboard

### Admin ERP (`/admin/`) — 38+ pages
- [x] Dashboard, Bookings, Tickets, Inventory, Pricing, Offers, Banners
- [x] Passport Engine, Loyalty Engine, CRM, B2B/TA Approvals
- [x] Ticketing Engine (Water Park + Amusement Park separate)
- [x] F&B Packages, Reseller Config, Call Centre, Finance, Invoices
- [x] GST Engine, Notifications, CMS, Users & Roles, Module Control
- [x] API Secrets, System Config, Audit Logs, Advisories, Reports
- [x] **Super Admin Panel** (user management, module toggle, rights matrix)

### Sales ERP (`/sales/`) — 13 pages
- [x] Passport Sales Portal (login, dashboard, KYC, payment, issued)
- [x] Main ERP Dashboard, CRM & Leads, Agent Management
- [x] Reports, Products, Quote Builder, Pipeline

### Partner Portal (`/partner/`) — 13 pages
- [x] Onboarding, KYC, Dashboard, Buy Tickets, Ticket Batches
- [x] Quote Builder, Bulk Tickets, GST Invoice, Statements, Reports, Support

### Reseller ERP (`/reseller/`) — NEW
- [x] Dashboard with inventory alerts
- [x] Ticket inventory tracking (allocated/sold/remaining with visual bars)
- [x] Bulk ticket batch creation with QR code generation
- [x] Team management (add agents, set daily limits, toggle rights)
- [x] Sales history, GST invoices, commission statements
- [x] Inventory restock request workflow

### Travel Agent ERP (`/ta/`) — NEW
- [x] Dashboard with leads and booking overview
- [x] Full leads management (add, assign, score: HOT/WARM/COLD/BOOKED)
- [x] Kanban pipeline (New → Quoted → Negotiating → Confirmed)
- [x] Booking history with GST invoices
- [x] Sub-agent creation with granular rights (Full / Leads Only / Bookings Only / View Only)
- [x] Commission ledger and payout tracking
- [x] Dedicated account manager contact card

### Module Toggle System
21 modules controllable by Super Admin:
Ticketing Engine, WOW Passport, Loyalty Program, Combo Tickets, CRM, GST Auto-Reverse, QR Ticket Validation, F&B Packages, Weather Alerts, WhatsApp Comms, Email Engine, SMS Gateway, Reseller Module, Travel Agent Module, Corporate/Groups, Call Centre CRM, CMS & Banners, Advanced Reporting, Audit Trail, Dual Voucher Storage, Finance & Invoicing

---

## Key URLs / Entry Points

| Path | Description |
|------|-------------|
| `/` | Public homepage |
| `/portal/login.html` | Customer login (individual + business) |
| `/internal/index.html` | **Staff & Partner Gateway** |
| `/admin/super-admin.html` | Super Admin Panel |
| `/admin/index.html` | Admin & Ops ERP |
| `/sales/erp-dashboard.html` | Sales Force ERP |
| `/sales/passport-login.html` | Passport Sales Portal |
| `/reseller/index.html` | Reseller ERP |
| `/ta/index.html` | Travel Agent ERP |
| `/partner/dashboard.html` | Partner Portal |
| `/portal/wow-passport.html` | WOW Passport (Indian-style, 3 tiers) |
| `/passport/login.html` | Passport Holder Portal |
| `/github-push.html` | Push all files to GitHub |

---

## Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | akm@indiagully.com | India@5327 |
| Admin (demo) | admin@wow.com | admin123 |
| Sales (demo) | sales@wow.com | sales123 |
| Passport Agent (demo) | passport@wow.com | passport123 |
| Reseller (demo) | reseller@wow.com | reseller123 |
| Travel Agent (demo) | ta@wow.com | ta123 |

---

## Technology Stack

- **Frontend:** Pure HTML5, CSS3, Vanilla JavaScript
- **CDN Libraries:** Font Awesome 6.4, Google Fonts (Nunito, Poppins, Cinzel, Courier Prime, Libre Baskerville)
- **QR Codes:** QRCode.js (CDN)
- **Charts:** Chart.js / ECharts (where applicable)
- **Data API:** RESTful Table API (tables/{table})
- **Weather:** Open-Meteo API (no key required)
- **Deployment:** Cloudflare Pages

---

## Deployment

1. Open `github-push.html` in preview
2. Enter GitHub PAT (`ghp_...` with `repo` scope)
3. Owner: `arunkumarmanikonda-web` · Repo: `worlds-of-wonder` · Branch: `main`
4. Click "Push All Files to GitHub"
5. Connect repo to Cloudflare Pages → deploy (no build command, output: `/`)
6. Live at: `worlds-of-wonder.pages.dev`

---

## Not Yet Implemented

- [ ] Real OTP gateway (Twilio/MSG91 — currently demo)
- [ ] Real Google OAuth flow
- [ ] Real Razorpay/payment gateway integration
- [ ] Real email/WhatsApp automation (backend required)
- [ ] On-gate QR scanner app (camera-based, PWA)
- [ ] Single-use QR validation (requires backend)
- [ ] Dual-backend voucher dispute storage (requires DB)
- [ ] Real-time push notifications
- [ ] AI-driven demand forecasting

---

## Logo Policy

**The WOW logo (`images/logo.png`) is used AS-IS across all pages with NO filters, NO alterations, NO changes.**  
Every page renders `<img src="../images/logo.png" alt="Worlds of Wonder" style="filter:none!important;">`.

---

© 2025 India Gully Technologies · Worlds of Wonder · Noida, UP
