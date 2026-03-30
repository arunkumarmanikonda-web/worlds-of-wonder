// Worlds of Wonder — Shared Navigation Shell  v4.0
// Mega-nav with dropdowns · Live weather chip · Cheeky comms ticker
'use strict';

const BASE = (function () {
  const p = window.location.pathname;
  return p.includes('/book/') ||
         p.includes('/admin/') ||
         p.includes('/groups/') ||
         p.includes('/sales/') ||
         p.includes('/portal/') ||
         p.includes('/partner/') ||
         p.includes('/internal/') ||
         p.includes('/reseller/') ||
         p.includes('/ta/') ||
         p.includes('/passport/') ? '../' : '';
})();

// Flat nav items (no dropdowns) — used for active-state detection
const NAV_FLAT = [
  'water-park.html','amusement-park.html','combo.html',
  'passport.html','offers.html','contact.html',
];

/* ─── Dropdown Mega-Nav definition ──────────────────────────── */
const NAV_ITEMS = [
  {
    label: 'Parks',
    children: [
      { label: '🌊 Water Park',      href: 'water-park.html',    desc: 'Slides, Wave Pool, Lazy River' },
      { label: '🎢 Amusement Park',  href: 'amusement-park.html',desc: 'Roller Coasters, Giant Wheel' },
      { label: '🎉 Combo Deal',       href: 'combo.html',         desc: 'Both parks, one epic day' },
      { label: '🎡 Rides & Attractions', href: 'rides-attractions.html', desc: 'Full ride catalogue' },
    ]
  },
  {
    label: 'Tickets',
    children: [
      { label: '🎟 Book Water Park',  href: 'book/water-park.html',    desc: 'From ₹1,299 · Instant QR' },
      { label: '🎟 Book Amusement',   href: 'book/amusement-park.html',desc: 'From ₹1,199 · Instant QR', module: 'amusement_ticketing' },
      { label: '🎉 Book Combo',       href: 'book/combo.html',         desc: 'From ₹1,999 · Best value', module: 'combo_ticketing' },
      { label: '🪪 Annual Passport',  href: 'passport.html',           desc: '₹4,999 — unlimited visits', module: 'passport_system' },
    ]
  },
  {
    label: 'Groups',
    children: [
      { label: '🏢 Corporate Events',  href: 'groups/corporate.html',desc: 'Team outings & MICE' },
      { label: '🏫 Schools & Colleges',href: 'groups/schools.html',  desc: 'Educational day trips' },
      { label: '🎂 Birthday Events',   href: 'groups/birthdays.html',desc: 'Private celebrations' },
      { label: '📋 Get a Quote',       href: 'sales/quote-builder.html', desc: 'Custom B2B pricing' },
    ]
  },
  { label: 'Offers',  href: 'offers.html' },
  {
    label: 'Visit',
    children: [
      { label: '🗺 Plan Your Visit',   href: 'plan-your-visit.html', desc: 'Maps, tips & timings' },
      { label: '🛡 Safety Guidelines', href: 'safety-guidelines.html',desc: 'Rules & health info' },
      { label: '📞 Contact Us',        href: 'contact.html',          desc: 'Get in touch' },
    ]
  },
  {
    label: 'Partners',
    children: [
      { label: '✈️ Travel Agent Onboarding', href: 'partner/onboarding.html',  desc: 'Apply as a travel agent partner' },
      { label: '🏪 Reseller Onboarding',      href: 'reseller/onboarding.html', desc: 'Apply as a reseller partner' },
      { label: '🏢 Corporate Sales',          href: 'groups/corporate.html',    desc: 'Bulk & B2B bookings' },
      { label: '🤝 Travel Agent Login',       href: 'partner/login.html',       desc: 'Sign in to partner portal' },
      { label: '🏬 Reseller Login',           href: 'reseller/login.html',      desc: 'Sign in to reseller ERP' },
    ]
  },
];

/* ─── Cheeky communications ticker messages ─────────────── */
const TICKER_MSGS = [
  { icon: '☀️', text: 'Perfect park weather today — sunscreen? Optional. Smiles? Mandatory.' },
  { icon: '🎟', text: 'Book online and walk straight past the queue. Don\'t be that person standing in line for 45 mins.' },
  { icon: '🌊', text: 'Wave Pool update: waves are extra splashy today. You\'ve been warned (and invited).' },
  { icon: '🎢', text: 'Rockin Roller is open! Your stomach called — it wants a rematch.' },
  { icon: '💰', text: 'Groups of 4+? Save ₹75–₹125 per ticket. More friends = more savings = more rides. Maths, basically.' },
  { icon: '🪪', text: 'Annual Passport ₹4,999 — pay once, show up whenever your heart desires. Wild concept, we know.' },
  { icon: '⚡', text: 'Instant e-tickets: Book now → QR code in your inbox → park gates in minutes. No printer needed. You\'re welcome.' },
  { icon: '🎉', text: 'Combo tickets from ₹1,999 — Water Park + Amusement Park. Two parks, one legendary day out.' },
  { icon: '👨‍👩‍👧‍👦', text: 'Kids under 90 cm enter FREE. Children may be small. Their joy is not.' },
  { icon: '🌡️', text: 'Hot day? Cool off in our Wave Pool. Cold day? Our roller coasters will warm you right up.' },
];

/* ─── Weather chip ────────────────────────────────────────── */
// Fetches real-time weather for Noida (Open-Meteo, no key required)
const WEATHER_STATE = { temp: null, icon: '🌤', label: 'Noida' };

async function fetchWeather() {
  try {
    const r = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=28.5355&longitude=77.3910&current_weather=true&timezone=Asia/Kolkata',
      { cache: 'no-store' }
    );
    const d = await r.json();
    const wc = d.current_weather.weathercode;
    const t  = Math.round(d.current_weather.temperature);

    // WMO weather code → emoji
    const WMO = {
      0:'☀️', 1:'🌤', 2:'⛅', 3:'☁️',
      45:'🌫', 48:'🌫', 51:'🌦', 53:'🌦', 55:'🌧',
      61:'🌧', 63:'🌧', 65:'⛈', 71:'🌨', 73:'🌨', 75:'❄️',
      80:'🌦', 81:'🌧', 82:'⛈', 95:'⛈', 96:'⛈', 99:'⛈'
    };
    // Closest match
    let icon = WMO[wc] || '🌤';

    WEATHER_STATE.temp  = t;
    WEATHER_STATE.icon  = icon;

    // Update chip if already rendered
    const chip = document.getElementById('weather-chip');
    if (chip) {
      chip.innerHTML = `<span class="weather-icon">${icon}</span>
        <span class="weather-temp">${t}°C</span>
        <span class="weather-label">Noida</span>`;
    }

    // Update ticker with real temp
    const tickerEl = document.getElementById('ticker-weather-msg');
    if (tickerEl) {
      const feel = t >= 38 ? 'scorching' : t >= 32 ? 'hot' : t >= 26 ? 'warm' : t >= 20 ? 'lovely' : 'a bit chilly';
      tickerEl.textContent = `${icon} It's ${t}°C in Noida right now — ${feel} outside, perfectly ${t >= 28 ? 'splashy' : 'thrilling'} inside WOW.`;
    }
  } catch {
    // Silently fail — fallback static content already shown
  }
}

/* ─── Build comms ticker ──────────────────────────────────── */
function buildTicker() {
  // Double the messages for seamless looping
  const all = [...TICKER_MSGS, ...TICKER_MSGS];
  const items = all.map((m, i) => {
    const id = (i === 0 || i === TICKER_MSGS.length) ? 'ticker-weather-msg' : '';
    return `<span class="comms-item"${id ? ` id="${id}"` : ''}>${m.icon} ${m.text}</span>`;
  }).join('');
  return `
<div class="comms-ticker" id="comms-ticker">
  <div class="comms-track">${items}</div>
</div>`;
}

/* ─── Top utility bar ──────────────────────────────────────── */
function buildTopbar() {
  const weatherHtml = `
    <div class="weather-chip" id="weather-chip" title="Current weather in Noida">
      <span class="weather-icon">🌤</span>
      <span class="weather-temp" style="color:var(--yellow)">--°C</span>
      <span class="weather-label" style="color:rgba(255,255,255,.5);font-size:11px;">Noida</span>
    </div>`;

  return `
<div class="topbar" id="site-topbar">
  <div class="topbar-inner">
    <div class="topbar-left">
      ${weatherHtml}
      <span class="topbar-sep">·</span>
      <span>📍 A-2, Sector 38A, Noida</span>
      <span class="topbar-sep">·</span>
      <span>🕙 10 AM – 6 PM Daily</span>
      <span class="topbar-sep">·</span>
      <span>📞 <a href="tel:08069090000" style="color:inherit;">080-6909-0000</a></span>
    </div>
    <div class="topbar-right">
      <span class="topbar-badge">🟢 Booking Open</span>
      <a href="${BASE}admin/banners.html" style="color:rgba(255,255,255,.3);font-size:11px;margin-left:10px;">⚙ Admin</a>
    </div>
  </div>
</div>`;
}

/* ─── Main navbar ──────────────────────────────────────────── */
function buildNav() {
  const cur = window.location.pathname.split('/').pop() || 'index.html';

  const links = NAV_ITEMS.map(item => {
    if (item.href) {
      // Simple link
      const active = cur === item.href ? ' class="active"' : '';
      return `<a href="${BASE}${item.href}"${active}>${item.label}</a>`;
    } else {
      // Dropdown
      const isActive = item.children && item.children.some(c => cur === c.href);
      return `<div class="nav-dropdown${isActive?' active':''}">
        <button class="nav-dropdown-btn" aria-expanded="false">
          ${item.label}
          <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" class="dropdown-chevron"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="nav-dropdown-menu">
          ${item.children.map(c => `
            <a href="${BASE}${c.href}" class="nav-dropdown-item${cur===c.href?' nav-dropdown-item--active':''}"${c.module ? ` data-module="${c.module}"` : ''}>
              <div class="nav-dropdown-item-label">${c.label}</div>
              ${c.desc ? `<div class="nav-dropdown-item-desc">${c.desc}</div>` : ''}
            </a>`).join('')}
        </div>
      </div>`;
    }
  }).join('');

  return `
<header class="site-header transparent" id="site-header">
  <div class="nav-inner">

    <!-- LEFT: hamburger (mobile) + nav links -->
    <button class="hamburger" id="hamburger" aria-label="Open menu" style="order:0;">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="26" height="26">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
              d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <nav class="nav-links" id="nav-links">${links}</nav>

    <!-- CENTER: Customer Login (before logo) + Book CTA -->
    <div class="nav-cta-wrap">
      <div class="nav-login-group">
        <a href="${BASE}portal/login.html" class="btn btn-nav-signin" id="nav-signin-btn" aria-label="Sign In — Individual Customer">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" style="vertical-align:-2px;margin-right:4px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Sign In
        </a>
        <a href="${BASE}portal/login.html?type=business" class="btn btn-nav-business" aria-label="Business Sign In">
          🏢 Business
        </a>
      </div>
      <a href="${BASE}book/water-park.html" class="btn btn-nav-book">🎟 Book Now</a>
    </div>

    <!-- RIGHT: WOW Logo — HARD ADOPTED — real logo.png — NO FILTERS, NO ALTERATIONS, NO CHANGES -->
    <a href="${BASE}index.html" class="nav-logo" aria-label="Worlds of Wonder — Home">
      <img src="${BASE}images/logo.png"
           alt="Worlds of Wonder"
           class="nav-logo-img"
           width="auto" height="56"
           style="display:block!important;height:56px!important;width:auto!important;object-fit:contain;visibility:visible!important;opacity:1!important;filter:none!important;" />
    </a>

  </div>
</header>`;
}

/* ─── Footer ───────────────────────────────────────────────── */
function buildFooter() {
  return `
<footer class="footer">
  <div class="footer-logo-strip">
    <div class="container" style="display:flex;align-items:center;justify-content:center;padding:36px 28px 0;">
      <a href="${BASE}index.html" class="footer-logo-link" aria-label="Worlds of Wonder — Home">
        <!-- HARD ADOPTED: real WOW logo.png — NO filter, NO alterations, NO changes ever -->
        <img src="${BASE}images/logo.png"
             alt="Worlds of Wonder"
             class="footer-logo-img"
             width="auto" height="100"
             style="filter:none!important;max-width:280px;" />
      </a>
    </div>
  </div>
  <div class="container">
    <div class="footer-grid">
      <div>
        <p class="footer-desc">Delhi NCR's premier dual-park destination at Sector 38A, Noida. Exhilarating water rides, world-class amusement attractions, and unforgettable experiences for every age — from toddlers to grandparents.</p>
        <div style="margin-bottom:16px;">
          <div style="font-size:12px;color:rgba(255,255,255,.35);font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Find us on</div>
          <div class="footer-social">
            <a href="https://www.facebook.com/worldsofwondernoida" target="_blank" rel="noopener" class="social-btn" aria-label="Facebook">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="https://www.instagram.com/worldsofwonder_wow/" target="_blank" rel="noopener" class="social-btn" aria-label="Instagram">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://www.youtube.com/@WorldsofWonderNoida" target="_blank" rel="noopener" class="social-btn" aria-label="YouTube">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/></svg>
            </a>
            <a href="https://twitter.com/WOWNoida" target="_blank" rel="noopener" class="social-btn" aria-label="Twitter/X">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
          </div>
        </div>
        <div style="font-size:12.5px;color:rgba(255,255,255,.38);line-height:1.8;">
          📞 <a href="tel:08069090000" style="color:rgba(255,255,255,.5);">080-6909-0000</a><br>
          ✉️ <a href="mailto:support@worldsofwonder.in" style="color:rgba(255,255,255,.5);">support@worldsofwonder.in</a><br>
          🕙 Open daily 10:00 AM – 6:00 PM
        </div>
      </div>
      <div class="footer-col">
        <h4>Parks &amp; Tickets</h4>
        <a href="${BASE}water-park.html">Water Park</a>
        <a href="${BASE}amusement-park.html">Amusement Park</a>
        <a href="${BASE}combo.html">Combo Tickets</a>
        <a href="${BASE}passport.html" data-module="passport_system">Annual Passport</a>
        <a href="${BASE}rides-attractions.html">Rides &amp; Attractions</a>
      </div>
      <div class="footer-col">
        <h4>Groups &amp; B2B</h4>
        <a href="${BASE}groups/corporate.html">Corporate Events</a>
        <a href="${BASE}groups/schools.html">School Trips</a>
        <a href="${BASE}groups/birthdays.html">Birthday Events</a>
        <a href="${BASE}sales/quote-builder.html">Get a Quote</a>
        <a href="${BASE}partner/onboarding.html">Travel Agent Onboarding</a>
        <a href="${BASE}partner/login.html">Travel Agent / Partner Login</a>
        <div style="margin-top:16px;border-top:1px solid rgba(255,255,255,.07);padding-top:14px;">
          <div style="font-size:10px;color:rgba(255,255,255,.28);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Resellers</div>
          <a href="${BASE}reseller/onboarding.html">Reseller Onboarding</a>
          <a href="${BASE}reseller/login.html">Reseller Portal Login</a>
        </div>
      </div>
      <div class="footer-col">
        <h4>Visit &amp; Help</h4>
        <a href="${BASE}offers.html">Offers &amp; Deals</a>
        <a href="${BASE}plan-your-visit.html">Plan Your Visit</a>
        <a href="${BASE}safety-guidelines.html">Safety Guidelines</a>
        <a href="${BASE}faq.html">FAQs</a>
        <a href="${BASE}contact.html">Contact Us</a>
        <div style="margin-top:16px;border-top:1px solid rgba(255,255,255,.07);padding-top:14px;">
          <div style="font-size:10px;color:rgba(255,255,255,.28);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">My Account</div>
          <a href="${BASE}portal/login.html">👤 Sign In / Register</a>
          <a href="${BASE}portal/login.html?type=business">🏢 Business Sign In</a>
          <a href="${BASE}portal/my-bookings.html">My Bookings</a>
          <a href="${BASE}portal/loyalty.html" data-module="loyalty_program">My Rewards</a>
        </div>
      </div>
      <!-- STAFF & PARTNER PORTALS COL -->
      <div class="footer-col">
        <h4>Staff &amp; Partner Portals</h4>
        <a href="${BASE}internal/index.html" style="color:var(--yellow);font-weight:700;">&#128274; Internal Staff Gateway</a>
        <a href="${BASE}admin/super-admin.html" style="color:rgba(168,85,247,.8);">&#128737; Super Admin Panel</a>
        <a href="${BASE}admin/index.html">&#9881; Admin &amp; Ops ERP</a>
        <a href="${BASE}sales/erp-dashboard.html">&#128200; Sales ERP</a>
        <a href="${BASE}sales/passport-login.html">&#128220; Passport Sales Portal</a>
        <a href="${BASE}admin/call-center.html">&#127911; Call Centre CRM</a>
        <div style="margin-top:12px;border-top:1px solid rgba(255,255,255,.06);padding-top:10px;">
          <div style="font-size:10px;color:rgba(255,255,255,.25);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;">Partner Portals</div>
          <a href="${BASE}reseller/index.html">&#128722; Reseller ERP</a>
          <a href="${BASE}ta/index.html">&#9992;&#65039; Travel Agent Portal</a>
          <a href="${BASE}partner/onboarding.html">Reseller / TA Onboarding</a>

        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© ${new Date().getFullYear()} Worlds of Wonder. All rights reserved. A-2, Sector 38A, Noida — 201301, Uttar Pradesh, India.<br>
      <span style="font-size:11px;color:rgba(255,255,255,.18);">Part of Entertainment City Ltd. CIN: U92410DL1994PTC057935</span></div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span>🗺 <a href="https://maps.google.com/?q=Worlds+of+Wonder+Noida" target="_blank" style="color:rgba(255,255,255,.4);">Get Directions</a></span>
        <span style="opacity:.25">·</span>
        <a href="tel:08069090000" style="color:rgba(255,255,255,.4);">📞 080-6909-0000</a>
      </div>
    </div>
  </div>
</footer>`;
}

/* ─── Read customer session (CUSTOMER role only) ────────────── */
function getCustomerSession() {
  try {
    const raw = sessionStorage.getItem('wow_auth_session') ||
                localStorage.getItem('wow_auth_session') ||
                sessionStorage.getItem('wow_portal_session') ||
                localStorage.getItem('wow_portal_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    return (s && s.role === 'CUSTOMER') ? s : null;
  } catch(e) { return null; }
}

/* ─── Shell init ───────────────────────────────────────────── */
function initShell() {
  const app = document.getElementById('app');
  if (!app) return;
  const content = app.innerHTML;
  app.innerHTML = buildTopbar() + buildTicker() + buildNav() +
    `<div id="page-content">${content}</div>` +
    buildFooter();

  /* Scroll effect — hide topbar + ticker on scroll */
  const header  = document.getElementById('site-header');
  const topbar  = document.getElementById('site-topbar');
  const ticker  = document.getElementById('comms-ticker');

  function onScroll() {
    const scrolled = window.scrollY > 60;
    header.classList.toggle('transparent', !scrolled);
    header.classList.toggle('scrolled',    scrolled);
    if (topbar)  topbar.classList.toggle('topbar--hidden',  scrolled);
    if (ticker)  ticker.classList.toggle('comms-ticker--hidden', scrolled);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav toggle */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', e => {
      e.stopPropagation();
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    document.addEventListener('click', e => {
      if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-q')?.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* Dropdown nav */
  document.querySelectorAll('.nav-dropdown-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const parent = btn.closest('.nav-dropdown');
      const isOpen = parent.classList.contains('open');
      // Close all
      document.querySelectorAll('.nav-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.querySelector('.nav-dropdown-btn')?.setAttribute('aria-expanded','false');
      });
      if (!isOpen) {
        parent.classList.add('open');
        btn.setAttribute('aria-expanded','true');
      }
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => {
      d.classList.remove('open');
      d.querySelector('.nav-dropdown-btn')?.setAttribute('aria-expanded','false');
    });
  });

  /* Kick off weather fetch */
  fetchWeather();

  /* Apply module gates to freshly-built DOM */
  if (window.WOWModules) {
    window.WOWModules._applyDOMGates(window.WOWModules.getState());
  }

  /* ── Session-aware nav: swap Sign-In → My Account if logged in ── */
  const sess = getCustomerSession();
  const signinBtn = document.getElementById('nav-signin-btn');
  if (signinBtn && sess) {
    // Logged-in: replace Sign In with a greeting / My Account link
    const firstName = (sess.name || 'Account').split(' ')[0];
    signinBtn.href = BASE + 'portal/dashboard.html';
    signinBtn.setAttribute('aria-label', 'My Account — ' + (sess.name || ''));
    signinBtn.innerHTML = `
      <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24" style="vertical-align:-2px;margin-right:4px;"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Hi, ${firstName}`;
    signinBtn.style.background = 'rgba(201,168,76,.15)';
    signinBtn.style.borderColor = 'rgba(201,168,76,.5)';
    signinBtn.style.color = '#F0D080';
  }
}

document.addEventListener('DOMContentLoaded', initShell);
