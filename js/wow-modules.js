// ============================================================
//  Worlds of Wonder — Module Gate System  v2.0
//  Reads module states saved by admin/module-control.html
//  and shows/hides sections, redirects disabled routes,
//  and updates nav links in real time.
// ============================================================
'use strict';

/* ── Default module states (mirrors admin/module-control.html) ── */
const MODULE_DEFAULTS = {
  // Core
  water_ticketing:      true,
  amusement_ticketing:  true,
  combo_ticketing:      true,
  payment_gateway:      true,
  gst_engine:           true,
  booking_confirmation: true,
  // Customer
  passport_system:      true,
  loyalty_program:      false,
  guest_booking:        true,
  social_login:         true,
  reschedule_cancel:    true,
  whatsapp_ticket:      true,
  flash_offers:         true,
  weather_widget:       true,
  // Ops
  gate_scanner:         true,
  capacity_mgmt:        true,
  dual_park_config:     true,
  group_booking:        true,
  fnb_packages:         false,
  crm_module:           true,
  partner_portal:       true,
  // Integrations
  razorpay:             true,
  twilio_whatsapp:      true,
  msg91_sms:            true,
  sendgrid_email:       true,
  google_analytics:     true,
  salesforce_sync:      false,
  digi_locker:          false,
  // Marketing
  push_notifications:   false,
  email_campaigns:      true,
  sms_campaigns:        true,
  whatsapp_campaigns:   false,
  promo_codes:          true,
  referral_program:     false,
};

/* ── Load merged state (defaults overridden by saved admin settings) ── */
function loadModuleState() {
  const state = { ...MODULE_DEFAULTS };
  try {
    const saved = localStorage.getItem('wow_module_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
    }
  } catch (e) {
    console.warn('[WOW Modules] Could not parse saved module state:', e);
  }
  return state;
}

/* ── Public accessor ── */
const WOWModules = {
  _state: null,

  getState() {
    if (!this._state) this._state = loadModuleState();
    return this._state;
  },

  isEnabled(moduleId) {
    return !!this.getState()[moduleId];
  },

  /* Apply gate rules to the current page */
  applyGates() {
    const s = this.getState();
    const page = window.location.pathname;

    // ── ROUTE GATES: block landing on disabled module pages ──
    const routeGates = [
      { module: 'passport_system',    patterns: ['/passport.html', '/book/passport.html', '/portal/passport.html'] },
      { module: 'amusement_ticketing',patterns: ['/amusement-park.html', '/book/amusement-park.html'] },
      { module: 'combo_ticketing',    patterns: ['/combo.html', '/book/combo.html'] },
      { module: 'loyalty_program',    patterns: ['/portal/loyalty.html'] },
      { module: 'group_booking',      patterns: ['/groups/', '/book/group.html'] },
      { module: 'partner_portal',     patterns: ['/partner/', '/travel-agent.html', '/reseller.html'] },
    ];

    for (const gate of routeGates) {
      if (!s[gate.module]) {
        const blocked = gate.patterns.some(p => page.includes(p));
        if (blocked) {
          document.addEventListener('DOMContentLoaded', () => {
            showModuleDisabledBanner(gate.module);
          });
          break;
        }
      }
    }

    // ── data-module-page attribute gate ──
    document.addEventListener('DOMContentLoaded', () => {
      const pageEl = document.querySelector('[data-module-page]');
      if (pageEl) {
        const mod = pageEl.getAttribute('data-module-page');
        if (mod && !s[mod]) {
          showModuleDisabledBanner(mod);
        }
      }
    });

    // ── DOM GATES: hide elements when module is off ──
    document.addEventListener('DOMContentLoaded', () => {
      this._applyDOMGates(s);
    });
  },

  _applyDOMGates(s) {
    // Passport nav links + sections
    if (!s.passport_system) {
      this._hideByAttr('data-module', 'passport_system');
      this._hideLinksByHref(['passport.html', 'book/passport.html', 'portal/passport.html']);
    }

    // Amusement park
    if (!s.amusement_ticketing) {
      this._hideByAttr('data-module', 'amusement_ticketing');
      this._hideLinksByHref(['amusement-park.html', 'book/amusement-park.html']);
    }

    // Combo ticketing
    if (!s.combo_ticketing) {
      this._hideByAttr('data-module', 'combo_ticketing');
      this._hideLinksByHref(['combo.html', 'book/combo.html']);
    }

    // Loyalty
    if (!s.loyalty_program) {
      this._hideByAttr('data-module', 'loyalty_program');
      this._hideLinksByHref(['portal/loyalty.html', 'portal/loyalty']);
    }

    // Flash offers / banners
    if (!s.flash_offers) {
      this._hideByAttr('data-module', 'flash_offers');
      document.querySelectorAll('.flash-offer-banner, .countdown-timer-wrap').forEach(el => {
        el.style.display = 'none';
      });
    }

    // Weather widget
    if (!s.weather_widget) {
      this._hideByAttr('data-module', 'weather_widget');
      document.querySelectorAll('.weather-chip, #weather-chip, .weather-widget').forEach(el => {
        el.style.visibility = 'hidden';
        el.style.width = '0';
        el.style.overflow = 'hidden';
      });
    }

    // Social login buttons
    if (!s.social_login) {
      document.querySelectorAll('.portal-google-btn, .portal-instagram-btn, [data-module="social_login"]').forEach(el => {
        el.style.display = 'none';
      });
      document.querySelectorAll('.portal-divider').forEach(el => el.style.display = 'none');
    }

    // Group booking
    if (!s.group_booking) {
      this._hideByAttr('data-module', 'group_booking');
      this._hideLinksByHref(['groups/', 'book/group.html', 'groups/corporate.html', 'groups/schools.html', 'groups/birthdays.html']);
    }

    // Partner portal
    if (!s.partner_portal) {
      this._hideByAttr('data-module', 'partner_portal');
      this._hideLinksByHref(['partner/', 'travel-agent.html', 'reseller.html', 'corporate.html']);
    }

    // Promo codes
    if (!s.promo_codes) {
      document.querySelectorAll('.promo-code-wrap, .promo-input-row, [data-module="promo_codes"]').forEach(el => {
        el.style.display = 'none';
      });
    }

    // F&B packages
    if (!s.fnb_packages) {
      this._hideByAttr('data-module', 'fnb_packages');
    }

    // Guest booking (no-login checkout)
    if (!s.guest_booking) {
      document.querySelectorAll('[data-module="guest_booking"], .guest-checkout-option').forEach(el => {
        el.style.display = 'none';
      });
    }

    // Referral program
    if (!s.referral_program) {
      this._hideByAttr('data-module', 'referral_program');
    }

    // WhatsApp campaigns opt-in
    if (!s.whatsapp_campaigns) {
      this._hideByAttr('data-module', 'whatsapp_campaigns');
    }
  },

  _hideByAttr(attr, val) {
    document.querySelectorAll(`[${attr}="${val}"]`).forEach(el => {
      el.style.display = 'none';
    });
  },

  _hideLinksByHref(hrefs) {
    hrefs.forEach(href => {
      document.querySelectorAll(`a[href*="${href}"]`).forEach(a => {
        // Hide the closest nav item wrapper if possible, otherwise hide the link
        const navItem = a.closest('.nav-dropdown-item, .nav-dropdown, .footer-col a, li') || a;
        navItem.style.display = 'none';
      });
    });
  },
};

/* ── Module Disabled Banner ── */
function showModuleDisabledBanner(moduleId) {
  const names = {
    passport_system:    'Annual Passport',
    amusement_ticketing:'Amusement Park Ticketing',
    combo_ticketing:    'Combo Tickets',
    loyalty_program:    'Loyalty Programme',
    group_booking:      'Group Bookings',
    partner_portal:     'Partner Portal',
  };
  const name = names[moduleId] || moduleId;

  // Disable entire page content
  const app = document.getElementById('app') || document.body;
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:fixed;inset:0;z-index:9999;
    background:linear-gradient(135deg,#0a0f1e,#1a2035);
    display:flex;align-items:center;justify-content:center;
    font-family:'Nunito',sans-serif;color:#fff;text-align:center;padding:24px;
  `;
  banner.innerHTML = `
    <div style="max-width:480px;">
      <div style="font-size:64px;margin-bottom:24px;">🚧</div>
      <h1 style="font-size:28px;font-weight:900;margin-bottom:12px;">${name}</h1>
      <p style="font-size:16px;color:rgba(255,255,255,.7);line-height:1.6;margin-bottom:28px;">
        This module is currently disabled by the site administrator.
        Please check back shortly or contact our team.
      </p>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
        <a href="../index.html" style="padding:12px 24px;background:linear-gradient(135deg,#003D82,#0055B3);color:#fff;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;">
          Go to Homepage
        </a>
        <a href="tel:08069090000" style="padding:12px 24px;background:rgba(255,255,255,.1);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid rgba(255,255,255,.2);">
          📞 Call Us
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
}

/* ── Auto-apply on load ── */
WOWModules.applyGates();

/* ── Export global ── */
window.WOWModules = WOWModules;
