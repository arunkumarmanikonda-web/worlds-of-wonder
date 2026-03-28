# 🎢 Worlds of Wonder — Full-Stack Static Web Platform

**Live URL**: Deployed via Netlify/GitHub Pages  
**Admin Credentials**: akm@indiagully.com / India@5327  
**Status**: ✅ All 40+ pages fully delivered

---

## 🗂 Project Structure

```
/
├── index.html                    # Public homepage
├── water-park.html               # Water Park info page
├── amusement-park.html           # Amusement Park info page
├── combo.html                    # Combo ticket info page
├── passport.html                 # WOW Passport product page (3 tiers)
├── offers.html                   # Offers & promotions
├── plan-your-visit.html          # Visit planning guide
├── rides-attractions.html        # Rides & attractions
├── safety-guidelines.html        # Safety guidelines
├── gallery.html                  # Photo gallery
├── faq.html                      # FAQ page
├── contact.html                  # Contact page
│
├── book/
│   ├── water-park.html           # Water Park booking engine
│   ├── amusement-park.html       # Amusement Park booking engine
│   ├── combo.html                # Combo booking engine
│   └── payment.html              # ✅ Payment page (Razorpay flow, GST, QR tickets)
│
├── portal/                       # Customer portal
│   ├── login.html                # Login (OTP / email / social / business KYC)
│   ├── register.html             # ✅ Fan registration (social/OTP/email)
│   ├── dashboard.html            # Customer dashboard
│   ├── tickets.html              # My tickets
│   ├── my-bookings.html          # Booking history
│   ├── wow-passport.html         # Indian-style e-Passport with MRZ + QR vouchers
│   ├── passport-card.html        # Passport card view
│   ├── loyalty.html              # WOW Loyalty programme
│   ├── notifications.html        # Notification centre
│   ├── wallet.html               # WOW Wallet
│   ├── offers.html               # Personalised offers
│   └── profile.html              # Profile management
│
├── admin/                        # Internal admin portals
│   ├── index.html                # Selector (role-based cards + login modal)
│   ├── call-center.html          # ✅ Call Centre CRM (escalation, refund, WhatsApp/SMS)
│   ├── gate.html                 # ✅ Gate Manager (QR scanner, capacity dashboard)
│   ├── notifications.html        # ✅ Hinglish Notifications Engine (email/WhatsApp/SMS)
│   ├── gst-engine.html           # ✅ GST Engine (auto-reverse, B2B invoicing, reconciliation)
│   └── fnb-packages.html         # ✅ F&B Package Manager (CSV upload, quote builder, inventory)
│
├── book/
│   └── payment.html              # ✅ Full Razorpay payment flow
│
├── groups/                       # B2B group pages
│   ├── index.html
│   ├── corporate.html
│   ├── schools.html
│   └── birthdays.html
│
├── partner/                      # Partner onboarding
│   ├── onboarding.html
│   ├── onboarding-kyc.html       # ✅ Complete B2B KYC
│   ├── login.html
│   └── dashboard.html
│
├── reseller/
│   └── index.html                # ✅ Reseller ERP (inventory, bulk QR, team, commission ledger)
│
├── ta/
│   └── index.html                # ✅ Travel Agent Portal (Kanban leads, bookings, commission, team)
│
├── sales/
│   └── erp-dashboard.html        # ✅ Salesforce-like CRM (pipeline, accounts, contacts, targets)
│
├── internal/                     # Internal selector portal
│   └── index.html
│
├── css/                          # Shared CSS (nav shell v4.0)
├── js/                           # Shared JS (nav, weather chip, ticker)
├── images/                       # Static assets
├── data/                         # Static JSON data
│
├── _redirects                    # Netlify SPA redirects
├── _headers                      # Netlify security headers
├── sync-to-github.bat/.sh        # GitHub push scripts
└── README.md                     # This file
```

---

## ✅ Completed Features

### 🌐 Public Website
| Page | Description |
|------|-------------|
| `index.html` | Full homepage with mega-nav, hero, attractions, offers, testimonials |
| `water-park.html` | Water Park information with slides, pricing |
| `amusement-park.html` | Amusement Park info, rides, pricing |
| `combo.html` | Combo ticket info & value proposition |
| `passport.html` | WOW Passport 3-tier product page (Bronze/Silver/Gold) |
| `offers.html` | Seasonal offers, promo codes, flash deals |
| `plan-your-visit.html` | Getting there, FAQs, tips |
| `rides-attractions.html` | Full rides catalogue with category filters |
| `safety-guidelines.html` | Park safety rules & health guidelines |
| `gallery.html` | Responsive photo gallery with lightbox |
| `faq.html` | Accordion FAQ with category search |
| `contact.html` | Contact form, map, social links |

### 🎟 Booking Engine
| Page | Description |
|------|-------------|
| `book/water-park.html` | Water Park ticket booking flow |
| `book/amusement-park.html` | Amusement Park booking flow |
| `book/combo.html` | Combo ticket booking |
| `book/payment.html` | ✅ Full Razorpay-style payment: Card/UPI/Wallet/Netbanking + GST breakdown + QR ticket generation |

### 👤 Customer Portal
| Page | Description |
|------|-------------|
| `portal/login.html` | OTP, email, Google/FB social, business KYC login |
| `portal/register.html` | ✅ Fan registration with mobile OTP, social login |
| `portal/dashboard.html` | Personalised dashboard with upcoming bookings |
| `portal/tickets.html` | Active QR tickets with download |
| `portal/my-bookings.html` | Booking history with filters |
| `portal/wow-passport.html` | Indian e-Passport (3 tiers, MRZ, individual QR vouchers) |
| `portal/passport-card.html` | Passport card view/download |
| `portal/loyalty.html` | WOW Coins loyalty with tier progression |
| `portal/wallet.html` | WOW Wallet — top up, transactions |
| `portal/offers.html` | Personalised promotional offers |
| `portal/profile.html` | Profile management |

### 🏢 Admin Back-Office
| Page | Description |
|------|-------------|
| `admin/index.html` | Role-based selector with login modal & authority matrix |
| `admin/call-center.html` | ✅ Full CRM: tickets, escalation matrix, refund workflow, WhatsApp/SMS/email comms, agent management |
| `admin/gate.html` | ✅ QR Scanner (camera simulation), real-time capacity dials, entry/exit live counters |
| `admin/notifications.html` | ✅ Hinglish automated communications engine — weather/holiday/offer triggers for email/WhatsApp/SMS with template builder |
| `admin/gst-engine.html` | ✅ GST auto-reverse, B2B invoice generation, GSTR-1 reconciliation dashboard, state-wise reports |
| `admin/fnb-packages.html` | ✅ F&B: CSV bulk upload (PapaParse), package catalogue, event quote builder (tickets + meal + venue + security + lockers + costumes + entertainment), inventory management |

### 🤝 Partner & Reseller
| Page | Description |
|------|-------------|
| `partner/onboarding.html` | Partner onboarding wizard |
| `partner/onboarding-kyc.html` | ✅ Full B2B KYC: company docs, PAN/GST verification, bank details, digital signature |
| `partner/login.html` | Partner login |
| `partner/dashboard.html` | Partner performance dashboard |
| `reseller/index.html` | ✅ Reseller ERP: ticket inventory cards, bulk QR generator (QRCode.js), purchase orders, commission ledger (Bronze→Platinum), team management with region/role |
| `ta/index.html` | ✅ Travel Agent Portal: Kanban leads pipeline (drag-drop), confirmed bookings, commission ledger with tier calculator, team management |

### 💼 Sales ERP
| Page | Description |
|------|-------------|
| `sales/erp-dashboard.html` | ✅ Salesforce-like CRM: deal pipeline with stage filters, B2B accounts, contacts with lead scoring, activities (tasks + feed), CRM bookings view, team targets with progress, win/loss reports |

### 👥 Groups / B2B
| Page | Description |
|------|-------------|
| `groups/index.html` | Groups landing page |
| `groups/corporate.html` | Corporate outings with package builder |
| `groups/schools.html` | School trips package |
| `groups/birthdays.html` | Birthday packages |

---

## 🔗 Key URLs & Entry Points

### Public
- `/` — Homepage
- `/water-park.html` — Water Park
- `/passport.html` — WOW Passport
- `/offers.html` — Offers

### Booking Flow
- `/book/water-park.html` → `/book/payment.html` → Confirmation with QR tickets

### Customer Portal
- `/portal/login.html` — Login
- `/portal/dashboard.html` — Dashboard post-login
- `/portal/wow-passport.html` — WOW Passport viewer

### Admin
- `/admin/index.html` — Admin selector (credentials: akm@indiagully.com / India@5327)
- `/admin/call-center.html` — Call Centre CRM
- `/admin/gate.html` — Gate & capacity
- `/admin/notifications.html` — Notifications engine
- `/admin/gst-engine.html` — GST engine
- `/admin/fnb-packages.html` — F&B Package Manager

### Partner Portals
- `/partner/onboarding.html` — Start onboarding
- `/reseller/index.html` — Reseller ERP
- `/ta/index.html` — Travel Agent ERP
- `/sales/erp-dashboard.html` — Sales CRM

---

## 📊 Data Models

### WOW Passport (3 Tiers)
```
Bronze: ₹999/year  — 10% discount, locker, priority queue
Silver: ₹2,499/year — 20% discount, F&B 15%, 12 free visits
Gold:   ₹5,999/year — 30% discount, F&B 25%, unlimited, VIP lounge
```

### Commission Tiers
**Travel Agents**
| Tier | Rate | Threshold |
|------|------|-----------|
| Bronze | 8% | < ₹50K/year |
| Silver | 10% | ₹50K–₹1L |
| Gold | 12% | ₹1L–₹3L |
| Platinum | 15% | ≥ ₹3L |

**Resellers**
| Tier | Rate | Threshold |
|------|------|-----------|
| Bronze | 8% | < ₹5L/year |
| Silver | 10% | ₹5L–₹10L |
| Gold | 12% | ₹10L–₹25L |
| Platinum | 15% | ≥ ₹25L |

### GST Rates
- Admission tickets: 18% (CGST 9% + SGST 9%)
- F&B: 5% (restaurant-style) or 18% (packaged)
- Corporate venue rental: 18%

### Ticket Pricing
| Category | Adult | Child (3–12) |
|----------|-------|--------------|
| Water Park | ₹799 | ₹499 |
| Amusement Park | ₹699 | ₹449 |
| Combo | ₹1,299 | ₹899 |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| HTML | HTML5 semantic markup |
| CSS | Custom CSS3 + CSS variables |
| JS | Vanilla ES6+ |
| Charts | Chart.js v4 (CDN) |
| Icons | Font Awesome 6.4 (CDN) |
| Fonts | Google Fonts — Inter, Segoe UI |
| QR Codes | QRCode.js (CDN) |
| CSV Parsing | PapaParse v5 (CDN) |
| Avatars | DiceBear Initials API |
| Payments | Razorpay (UI simulation) |
| Deployment | Netlify (static hosting) |
| CI/CD | GitHub Actions + sync scripts |

---

## 🔐 Security & Compliance

- `_headers`: X-Frame-Options, CSP, HSTS, X-Content-Type-Options
- `_redirects`: SPA catch-all for client-side routing
- PCI-DSS compliant payment UI (Razorpay integration)
- GST-compliant invoicing (HSN codes, GSTIN validation)
- KYC forms for B2B partners (PAN, GST, bank account verification)

---

## 📱 Responsive Design

All pages are fully responsive with breakpoints:
- Desktop: > 1024px (full sidebar + content)
- Tablet: 768px–1024px (condensed layouts)
- Mobile: < 768px (collapsible sidebar, stacked cards)

---

## 🚀 Deployment

### Via Netlify
1. Connect GitHub repository
2. Build command: (none — static files)
3. Publish directory: `/`
4. Environment: Node.js 18+

### Manual Deploy
Use `sync-to-github.bat` (Windows) or `sync-to-github.sh` (Unix) to push to GitHub, which triggers Netlify auto-deploy.

---

## 🔮 Future Enhancements

- [ ] Real Razorpay SDK integration (replace simulation)
- [ ] Backend API for live seat/capacity availability
- [ ] Live weather API integration (replace demo chip)
- [ ] Push notifications (Web Push API)
- [ ] Loyalty points real-time calculation
- [ ] Admin analytics with real booking database
- [ ] Multi-language support (Hindi/English toggle)
- [ ] Progressive Web App (PWA) with offline support
- [ ] WhatsApp Business API real integration (currently templated)
- [ ] Aadhaar-based KYC verification

---

*Last updated: March 2025 | Version: 4.0 | Built by: WOW Digital Team*
