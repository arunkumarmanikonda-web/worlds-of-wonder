# 🎡 Worlds of Wonder — Full-Stack Digital Platform

**Worlds of Wonder, Noida** — Complete digital operations platform covering public website, customer portal, partner/TA portal, passport programme, admin ERP, and sales CRM.

Reference: [worldsofwonder.in](https://worldsofwonder.in)

---

## 📁 Project Structure

```
/                          → Public-facing website (root)
/admin/                    → Admin ERP (36 pages)
/partner/                  → TA/Reseller partner portal (13 pages)
/portal/                   → Customer portal (13 pages)
/passport/                 → WOW Passport holder portal (3 pages)
/sales/                    → Sales ERP (13 pages)
/book/                     → Booking flows
/groups/                   → Group/school booking
/css/                      → Shared design system
/js/                       → Shared scripts
/images/                   → Static assets
/data/                     → Static JSON data
```

---

## ✅ Completed Pages

### 🌐 Public Website (root)
| File | Description |
|------|-------------|
| `index.html` | Homepage — hero, rides preview, offers, passport CTA |
| `water-park.html` | Water Park rides & attractions |
| `amusement-park.html` | Amusement Park rides & attractions |
| `combo.html` | Combo ticket page |
| `offers.html` | Seasonal offers & discounts |
| `passport.html` | WOW Passport marketing page |
| `plan-your-visit.html` | Visitor guide |
| `rides-attractions.html` | Full rides & attractions listing |
| `safety-guidelines.html` | Safety guidelines |
| `schools.html` | School groups page |
| `birthdays.html` | Birthday packages |
| `corporate.html` | Corporate bookings |
| `travel-agent.html` | TA landing page |
| `reseller.html` | Reseller landing page |
| `gallery.html` | Photo/video gallery |
| `faq.html` | FAQ |
| `contact.html` | Contact page |

---

### 🎫 WOW Passport Holder Portal (`/passport/`)
| File | Description |
|------|-------------|
| `login.html` | Passport holder login — Mobile OTP or Passport ID + PIN |
| `register.html` | 5-step registration: Plan → Details → KYC → PIN → Payment |
| `my-passport.html` | Passport dashboard — Physical card, QR, vouchers, history, profile |

**3-Tier Passport Programme:**
| Tier | Badge | Price | Visits | Users | Validity |
|------|-------|-------|--------|-------|----------|
| WOW Explore Pass | 🔵 Entry | ₹2,499 | 4 | 1 adult | 6 months |
| WOW Together Pass | ⚪ Duo | ₹4,999 | 4 | 1A + 1C | 6–9 months |
| WOW Legacy Pass | 🔴 Premium | ₹9,999 | 8 | 2A + 2C | 12 months |

**Strategic Journey:** Explore → Together → Legacy (Entry → Attachment → Ownership)

---

### 👤 Customer Portal (`/portal/`)
| File | Description |
|------|-------------|
| `login.html` | Customer login |
| `register.html` | New customer registration |
| `dashboard.html` | Customer dashboard |
| `my-bookings.html` | Booking history |
| `tickets.html` | My tickets (QR codes) |
| `passport.html` | My passport view |
| `offers.html` | Available offers |
| `loyalty.html` | Loyalty points & rewards |
| `profile.html` | Profile management |
| `notifications.html` | Notifications centre |
| `wallet.html` | WOW Wallet |
| `forgot-password.html` | Password reset |

---

### 🤝 Partner / TA-Reseller Portal (`/partner/`)
| File | Description |
|------|-------------|
| `login.html` | Partner login |
| `onboarding.html` | Basic onboarding |
| `onboarding-kyc.html` | 6-step Razorpay-style KYC — camera, docs, IFSC verify, auto-login |
| `dashboard.html` | Mini-ERP — 5 KPIs, ECharts revenue, commission & TDS tracker |
| `quote-builder.html` | Segment quotes (School/Corporate/Birthday/FIT) — live pricing, add-ons, GST, T&C |
| `bulk-tickets.html` | Bulk QR ticket engine — 6 types, non-reusable IDs, CSV export |
| `invoice-gst.html` | GST invoice engine — forward/reverse GST, CGST/SGST/IGST, PDF/email/WhatsApp |
| `buy-tickets.html` | Buy tickets (partner rate) |
| `ticket-batches.html` | Ticket batch history |
| `invoices.html` | Partner invoice list |
| `statements.html` | Commission statements |
| `support.html` | Partner support |
| `reports.html` | Partner reports |

---

### 🛡️ Admin ERP (`/admin/`) — 36 Pages
#### Overview
| File | Description |
|------|-------------|
| `index.html` | Leadership Dashboard — live KPIs, revenue, footfall, leads |
| `bookings.html` | All bookings with filters |
| `tickets.html` | Tickets issued — QR search, extend/block controls |

#### Commerce
| File | Description |
|------|-------------|
| `inventory.html` | Inventory management — stock bars, restock alerts |
| `pricing.html` | Pricing rules engine — 4-tab: segments, complimentary, seasonal, GST |
| `offers.html` | Offers & campaigns |
| `passport-engine.html` | **WOW Passport Engine** — tier config, voucher rules, upsell logic, redemption rules, analytics |
| `loyalty-engine.html` | **Loyalty Engine** — Silver/Gold/Platinum/Diamond tiers, points rules, rewards, campaigns |
| `passport-products.html` | Passport plans configuration |

#### B2B & Partner
| File | Description |
|------|-------------|
| `crm.html` | CRM & pipeline |
| `b2b-approvals.html` | B2B group/corporate approval workflow |
| `ta-approvals.html` | TA/Reseller KYC review queue |
| `reseller-config.html` | Tier slabs, credit limits, TDS/payout rules |
| `partners.html` | Partner management |

#### Ticketing & F&B
| File | Description |
|------|-------------|
| `ticketing-engine.html` | Rate cards, combo builder, validity matrix, segment pricing |
| `fnb-packages.html` | F&B package grid, CSV upload, push campaigns |

#### Operations
| File | Description |
|------|-------------|
| `gate.html` | Gate redemption / QR scanner |
| `ops-dashboard.html` | Live ride status, gate status, footfall, staff deployment, incidents |
| `passport-redemptions.html` | **Passport voucher redemption** — QR scanner, redemption log, dispute audit |
| `call-center.html` | Call Center ERP — 3-level escalation, P1–P4 queue, SLA, live activity |

#### Finance
| File | Description |
|------|-------------|
| `finance.html` | Finance & GST dashboard |
| `invoices.html` | Invoice management — bulk email, status filters |

#### Content & System
| File | Description |
|------|-------------|
| `cms.html` | CMS |
| `users.html` | Users & Roles |
| `module-control.html` | Module on/off controls |
| `api-secrets.html` | API key management |
| `gst-engine.html` | GST configuration |
| `notifications.html` | Notification templates |
| `config.html` | System config — payment gateway, email, WhatsApp |
| `audit-logs.html` | Immutable audit trail |
| `advisories.html` | Emergency numbers, weather, traffic, safety alerts |

#### Reports
| File | Description |
|------|-------------|
| `reports.html` | Comprehensive reports dashboard — 12 report types, 5 charts, TA leaderboard |

---

### 💼 Sales ERP (`/sales/`) — 13 Pages
| File | Description |
|------|-------------|
| `erp-agents.html` | **Agent Sales Portal** — login, sell passport, dashboard, commission, leaderboard, passport lookup, renewals |
| `erp-crm.html` | **CRM & Leads** — pipeline board, all leads, follow-ups, analytics, segments |
| `erp-dashboard.html` | Sales ERP dashboard |
| `erp-crm.html` | CRM & leads management |
| `erp-reports.html` | Sales reports |
| `erp-products.html` | Product management |
| `leads.html` | Lead management |
| `pipeline.html` | Sales pipeline |
| `passport-login.html` | Passport agent login |
| `passport-dashboard.html` | Passport sales dashboard |
| `passport-kyc.html` | Passport KYC flow |
| `passport-payment.html` | Passport payment |
| `passport-issued.html` | Issued passport view |
| `quote-builder.html` | Quote builder |

---

## 🗄️ Data Tables (14 schemas)

| Table | Fields | Description |
|-------|--------|-------------|
| `passport_plans` | 13 | WOW Passport tier definitions (Explore/Together/Legacy) |
| `passport_vouchers` | 15 | Per-passport vouchers with QR — single-use, non-transferable |
| `passport_redemptions` | 13 | Voucher redemption audit trail — agent, device, timestamp, IP |
| `passport_holders` | 23 | Passport holder KYC + login credentials |
| `passport_products` | 14 | Passport product catalogue |
| `passport_sales` | 16 | Passport sale transactions |
| `passport_agents` | 12 | Sales agent profiles |
| `erp_leads` | 14 | CRM lead pipeline |
| `sales_agents` | 12 | Sales agent records |
| `ta_applications` | 22 | TA/Reseller KYC applications |
| `ta_quotes` | 17 | Partner segment quotes |
| `bulk_ticket_batches` | 14 | Bulk ticket batch records |
| `ta_invoices` | 17 | GST invoices for TA/partners |
| `fnb_packages` | 12 | F&B package catalogue |

---

## 🎫 Voucher & Redemption System

### How it works
1. **Issuance** — At passport purchase, vouchers are auto-generated with unique QR codes per holder
2. **QR Format** — `WOW-{TYPE}-{TIER}-{PASSPORT_ID}-{SEQ}` (e.g., `WOW-PHO-EXP-00142-001`)
3. **Redemption** — Gate/staff scans QR → system checks `is_redeemed` → marks used → logs in `passport_redemptions`
4. **Single-use lock** — Repeat scan returns ❌ INVALID
5. **Audit trail** — Every redemption stores agent ID, device ID, timestamp, IP for disputes

### Voucher types by tier
| Voucher | Explore | Together | Legacy |
|---------|---------|----------|--------|
| Photo Coupon | 2 | 3 | 4 (premium) |
| F&B Discount | 10% | 15% | 20% |
| Locker Voucher | — | 4 visits | All 8 visits |
| VIP Fast-Track | — | — | ✅ |
| Costume Voucher | — | — | All 8 visits |
| Guest Pass | — | — | 2–4 passes |
| Birthday Benefit | — | 1 free entry | Full celebration |
| Priority Event | — | — | ✅ |

---

## 🔗 Key Entry Points / URLs

| Role | URL |
|------|-----|
| Admin Dashboard | `admin/index.html` |
| Passport Engine | `admin/passport-engine.html` |
| Loyalty Engine | `admin/loyalty-engine.html` |
| Passport Redemptions | `admin/passport-redemptions.html` |
| Passport Login | `passport/login.html` |
| Buy Passport | `passport/register.html` |
| My Passport | `passport/my-passport.html` |
| Agent Sales Portal | `sales/erp-agents.html` |
| CRM & Leads | `sales/erp-crm.html` |
| Partner KYC | `partner/onboarding-kyc.html` |
| Partner Dashboard | `partner/dashboard.html` |
| Customer Portal | `portal/dashboard.html` |
| Public Website | `index.html` |

---

## 🚧 Not Yet Implemented / Recommended Next Steps

### High Priority
- [ ] **Payment gateway integration** — Razorpay/PhonePe live payment in `passport/register.html`
- [ ] **Real-time gate QR scanner** — Camera-based scan in `admin/passport-redemptions.html`
- [ ] **WhatsApp API integration** — Auto-message on voucher redemption, renewal alerts
- [ ] **OTP verification** — SMS OTP via MSG91 or Twilio in `passport/login.html`

### Medium Priority
- [ ] **Passport renewal flow** — Extend validity for existing holders
- [ ] **Passport physical card PDF** — Printable card design with gold logo
- [ ] **Loyalty points live calculation** — Real-time points ledger per customer
- [ ] **Discount/voucher engine** — Admin-configured discount codes and campaign vouchers
- [ ] **Push notifications** — FCM integration for app-style alerts
- [ ] **Multi-park config** — If WOW expands to second location

### Low Priority
- [ ] **Mobile app wrapper** — PWA manifest + service worker for offline use
- [ ] **Advanced analytics** — Google Analytics / Mixpanel event tracking
- [ ] **A/B testing** — Upsell message experiments on passport purchase flow
- [ ] **Chatbot** — WhatsApp bot for passport status, voucher balance queries

---

## 🛠️ Tech Stack

- **Frontend**: HTML5 · CSS3 · Vanilla JavaScript (ES2020+)
- **UI Libraries**: Chart.js · ECharts · QRCode.js · Font Awesome
- **Fonts**: Google Fonts (Inter, Nunito, Poppins)
- **Data**: RESTful Table API (tables/{name})
- **Design**: Custom WOW Design System (`css/wow-design-system.css`)
- **Deployment**: Static hosting (Netlify/Cloudflare Pages compatible)

---

## 📊 Platform Statistics

- **Total pages**: ~75 HTML pages
- **Admin pages**: 36
- **Partner pages**: 13
- **Customer portal pages**: 13
- **Passport portal pages**: 3
- **Sales ERP pages**: 13
- **Public website pages**: ~15
- **Data tables**: 14 schemas
- **Passport tiers**: 3 (Explore · Together · Legacy)
- **Loyalty tiers**: 4 (Silver · Gold · Platinum · Diamond)

---

*Last updated: March 2026 · WOW Digital Platform v3.0*
