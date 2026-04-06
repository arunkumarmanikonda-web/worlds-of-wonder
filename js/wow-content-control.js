/**
 * WOW Content Control Engine v2.0
 * ─────────────────────────────────────────────────────────────────────────────
 * Central configuration store for all front-end visibility and content.
 * Super Admin toggles are stored in localStorage and read by every page on load.
 *
 * Keys:
 *   wow_content_cfg   – section visibility + inline content overrides
 *   wow_product_cfg   – park / ticket-category / offer / combo / passport on-off
 *
 * Usage (front-end pages):  <script src="../js/wow-content-control.js"></script>
 *   WOWContent.apply();          // call once, hides/shows sections + patches text
 *   WOWContent.getProductCfg()   // returns live product config object
 *
 * Usage (super-admin panel):
 *   WOWContent.saveSectionCfg(obj)
 *   WOWContent.saveProductCfg(obj)
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function(global){
'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   DEFAULT CONFIGS  (used when nothing is saved in localStorage yet)
══════════════════════════════════════════════════════════════════════════ */
const DEFAULT_SECTION_CFG = {
  /* ── index.html sections ─────────────────────────────────────────── */
  hero:           { enabled: true, label: 'Hero Carousel / Banner' },
  quick_book_bar: { enabled: true, label: 'Quick Book Widget' },
  offer_strip:    { enabled: true, label: 'Offer Ticker Strip' },
  explore_parks:  { enabled: true, label: 'Explore Parks Cards' },
  why_wow_strip:  { enabled: true, label: 'Why WOW Feature Strip' },
  attractions:    { enabled: true, label: 'Must-Try Attractions' },
  video_banner:   { enabled: true, label: 'Video Banner (YouTube)' },
  pricing:        { enabled: true, label: 'Transparent Pricing' },
  tickets_cta:    { enabled: true, label: 'Tickets CTA Section' },
  passport:       { enabled: true, label: 'WOW Passport Section' },
  groups_partners:{ enabled: true, label: 'Groups & Partners' },
  plan_your_visit:{ enabled: true, label: 'Plan Your Visit' },
  weather_strip:  { enabled: true, label: 'Weather & Quick Info Strip' },
  testimonials:   { enabled: true, label: 'Testimonials / Reviews' },
  footer:         { enabled: true, label: 'Footer' },

  /* ── booking page sections ───────────────────────────────────────── */
  bk_hero:        { enabled: true, label: 'Booking Page Hero' },
  bk_trust_strip: { enabled: true, label: 'Booking Trust Strip' },
  bk_buffet:      { enabled: true, label: 'Buffet Add-on' },
  bk_promo:       { enabled: true, label: 'Promo / Coupon Code' },
  bk_upsell:      { enabled: true, label: 'Confirmation Upsell Block' },
};

const DEFAULT_PRODUCT_CFG = {
  /* Parks */
  WATER_DAY:       { enabled: true,  label: 'Water Park',          type: 'park',     emoji: '🌊', price: 1299 },
  AMUSEMENT_DAY:   { enabled: true,  label: 'Amusement Park',      type: 'park',     emoji: '🎢', price: 1199 },
  COMBO_DAY:       { enabled: true,  label: 'Combo (Both Parks)',   type: 'combo',    emoji: '🏆', price: 1999 },
  PASSPORT:        { enabled: true,  label: 'WOW Passport',        type: 'passport', emoji: '🪪', price: 4999 },

  /* Ticket Categories */
  cat_adult:       { enabled: true,  label: 'Adult Tickets',             type: 'category', emoji: '👤' },
  cat_child:       { enabled: true,  label: 'Child Tickets',             type: 'category', emoji: '🧒' },
  cat_senior:      { enabled: true,  label: 'Senior Citizen Tickets',    type: 'category', emoji: '👴' },
  cat_armed:       { enabled: true,  label: 'Armed Forces Tickets',      type: 'category', emoji: '🎖' },
  cat_disabled:    { enabled: true,  label: 'Differently Abled Tickets', type: 'category', emoji: '♿' },

  /* Package / Offers */
  pkg_group:       { enabled: true,  label: 'Group Discount (10+)',      type: 'package', emoji: '👥' },
  pkg_bogo:        { enabled: true,  label: 'BOGO Offer',               type: 'package', emoji: '🎁' },
  pkg_flash:       { enabled: true,  label: 'Flash Sale Offers',         type: 'package', emoji: '⚡' },
  pkg_family:      { enabled: true,  label: 'Family Bundle Offers',      type: 'package', emoji: '👨‍👩‍👧‍👦' },
  pkg_corporate:   { enabled: true,  label: 'Corporate Packages',        type: 'package', emoji: '🏢' },
  pkg_birthday:    { enabled: true,  label: 'Birthday Party Packages',   type: 'package', emoji: '🎂' },
  pkg_school:      { enabled: true,  label: 'School / College Trips',    type: 'package', emoji: '🎓' },
  pkg_buffet:      { enabled: true,  label: 'Buffet / F&B Add-on',       type: 'package', emoji: '🍽' },
};

/* ══════════════════════════════════════════════════════════════════════════
   CONTENT OVERRIDES  – editable text per section
   Keys must match section keys above. Each is a flat key:value map of
   element selectors (CSS class or text node description) → new text.
══════════════════════════════════════════════════════════════════════════ */
const DEFAULT_CONTENT_OVERRIDES = {};

/* ══════════════════════════════════════════════════════════════════════════
   SECTION → DOM SELECTOR MAP
   Maps each section key to a CSS selector on the public pages.
══════════════════════════════════════════════════════════════════════════ */
const SECTION_SELECTORS = {
  hero:           '[data-wow-section="hero"], #hero-section',
  quick_book_bar: '[data-wow-section="quick_book_bar"], #quick-book-bar',
  offer_strip:    '[data-wow-section="offer_strip"], .offer-strip',
  explore_parks:  '[data-wow-section="explore_parks"], #explore',
  why_wow_strip:  '[data-wow-section="why_wow_strip"], .feature-strip-wrap',
  attractions:    '[data-wow-section="attractions"]',
  video_banner:   '[data-wow-section="video_banner"], .video-banner-section',
  pricing:        '[data-wow-section="pricing"]',
  tickets_cta:    '[data-wow-section="tickets_cta"], .cta-section',
  passport:       '[data-wow-section="passport"], [data-module="passport_system"]',
  groups_partners:'[data-wow-section="groups_partners"]',
  plan_your_visit:'[data-wow-section="plan_your_visit"]',
  weather_strip:  '[data-wow-section="weather_strip"]',
  testimonials:   '[data-wow-section="testimonials"], #testimonials',
  footer:         '[data-wow-section="footer"], footer, .site-footer',

  bk_hero:        '[data-wow-section="bk_hero"], .bk-hero',
  bk_trust_strip: '[data-wow-section="bk_trust_strip"], .bk-trust-strip',
  bk_buffet:      '[data-wow-section="bk_buffet"], #buffet-wrap, .bk-buffet-wrap',
  bk_promo:       '[data-wow-section="bk_promo"], .promo-wrap, #promo-section',
  bk_upsell:      '[data-wow-section="bk_upsell"], .conf-upsell',
};

/* ══════════════════════════════════════════════════════════════════════════
   PRODUCT → DOM SELECTOR MAP
   Maps each product key to selectors that should be hidden on the front end
   when toggled OFF.
══════════════════════════════════════════════════════════════════════════ */
const PRODUCT_SELECTORS = {
  WATER_DAY:     [
    '[data-wow-product="WATER_DAY"]',
    '.pricing-card--water',
    '.qbb-tab[data-park="WATER_DAY"]',
  ],
  AMUSEMENT_DAY: [
    '[data-wow-product="AMUSEMENT_DAY"]',
    '.pricing-card--amusement',
    '.qbb-tab[data-park="AMUSEMENT_DAY"]',
  ],
  COMBO_DAY:     [
    '[data-wow-product="COMBO_DAY"]',
    '.pricing-card--combo',
    '.qbb-tab[data-park="COMBO_DAY"]',
  ],
  PASSPORT:      [
    '[data-wow-section="passport"]',
    '[data-module="passport_system"]',
    '.qbb-tab[href*="passport"]',
  ],

  cat_adult:    ['[data-cat="adult"]',    '#cat-row-adult'],
  cat_child:    ['[data-cat="child"]',    '#cat-row-child'],
  cat_senior:   ['[data-cat="senior"]',   '#cat-row-senior'],
  cat_armed:    ['[data-cat="armed"]',    '#cat-row-armed', '#cat-row-armed_forces'],
  cat_disabled: ['[data-cat="disabled"]', '#cat-row-differently_abled', '#cat-row-disabled'],

  pkg_group:     ['[data-pkg="group"]',     '[data-wow-product="pkg_group"]'],
  pkg_bogo:      ['[data-pkg="bogo"]',      '[data-wow-product="pkg_bogo"]'],
  pkg_flash:     ['[data-pkg="flash"]',     '[data-wow-product="pkg_flash"]'],
  pkg_family:    ['[data-pkg="family"]',    '[data-wow-product="pkg_family"]'],
  pkg_corporate: ['[data-pkg="corporate"]', 'a[href*="corporate.html"]'],
  pkg_birthday:  ['[data-pkg="birthday"]',  'a[href*="birthdays.html"]'],
  pkg_school:    ['[data-pkg="school"]',    'a[href*="schools.html"]'],
  pkg_buffet:    ['[data-pkg="buffet"]',    '#buffet-wrap', '.bk-buffet-wrap', '#br-buffet'],
};

/* ══════════════════════════════════════════════════════════════════════════
   STORAGE HELPERS
══════════════════════════════════════════════════════════════════════════ */
const SK_SECTION  = 'wow_content_cfg';
const SK_PRODUCT  = 'wow_product_cfg';
const SK_OVERRIDE = 'wow_content_overrides';

function loadSectionCfg()  {
  try { return Object.assign({}, DEFAULT_SECTION_CFG,  JSON.parse(localStorage.getItem(SK_SECTION)  || '{}')); }
  catch(e){ return Object.assign({}, DEFAULT_SECTION_CFG); }
}
function loadProductCfg()  {
  try { return Object.assign({}, DEFAULT_PRODUCT_CFG,  JSON.parse(localStorage.getItem(SK_PRODUCT)  || '{}')); }
  catch(e){ return Object.assign({}, DEFAULT_PRODUCT_CFG); }
}
function loadOverrides()   {
  try { return Object.assign({}, DEFAULT_CONTENT_OVERRIDES, JSON.parse(localStorage.getItem(SK_OVERRIDE) || '{}')); }
  catch(e){ return Object.assign({}, DEFAULT_CONTENT_OVERRIDES); }
}

/* ══════════════════════════════════════════════════════════════════════════
   SAFE QUERY — uses :has() with a fallback for browsers that don't support it
══════════════════════════════════════════════════════════════════════════ */
function safeQueryAll(selector){
  try { return Array.from(document.querySelectorAll(selector)); }
  catch(e){ return []; }
}

/* ══════════════════════════════════════════════════════════════════════════
   APPLY FUNCTION  — called on every public page
══════════════════════════════════════════════════════════════════════════ */
function apply(){
  const sectionCfg  = loadSectionCfg();
  const productCfg  = loadProductCfg();
  const overrides   = loadOverrides();

  /* ── 1. Section visibility ── */
  Object.keys(SECTION_SELECTORS).forEach(key => {
    const cfg = sectionCfg[key];
    if (!cfg) return;
    const enabled = cfg.enabled !== false;

    // Primary: data-wow-section attribute (most reliable, set in HTML)
    safeQueryAll('[data-wow-section="'+key+'"]').forEach(el => {
      el.style.display = enabled ? '' : 'none';
      el.setAttribute('data-wow-visible', enabled ? '1' : '0');
    });

    // Fallback: CSS selectors from map
    const selectors = SECTION_SELECTORS[key].split(',').map(s=>s.trim());
    selectors.forEach(sel => {
      safeQueryAll(sel).forEach(el => {
        if (el.getAttribute('data-wow-section')) return; // already handled above
        el.style.display = enabled ? '' : 'none';
        el.setAttribute('data-wow-section', key);
        el.setAttribute('data-wow-visible', enabled ? '1' : '0');
      });
    });
  });

  /* ── 2. Product visibility ── */
  Object.keys(PRODUCT_SELECTORS).forEach(key => {
    const cfg = productCfg[key];
    if (!cfg) return;
    const enabled = cfg.enabled !== false;
    // data-wow-product attribute first
    safeQueryAll('[data-wow-product="'+key+'"]').forEach(el => {
      el.style.display = enabled ? '' : 'none';
      el.setAttribute('data-wow-visible', enabled ? '1' : '0');
    });
    PRODUCT_SELECTORS[key].forEach(sel => {
      safeQueryAll(sel).forEach(el => {
        el.style.display = enabled ? '' : 'none';
        el.setAttribute('data-wow-visible', enabled ? '1' : '0');
      });
    });
  });

  /* ── 3. Content overrides ── */
  Object.keys(overrides).forEach(selector => {
    safeQueryAll(selector).forEach(el => {
      const val = overrides[selector];
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.value = val;
      } else {
        el.innerHTML = val;
      }
    });
  });

  /* ── 4. Booking page: category row toggle ── */
  applyBookingCatToggles(productCfg);
}

/* ══════════════════════════════════════════════════════════════════════════
   BOOKING PAGE INTEGRATION
   Booking.js creates cat-rows with id like "cat-row-adult".
   We hide/show them based on product config.
══════════════════════════════════════════════════════════════════════════ */
function applyBookingCatToggles(productCfg){
  const catMap = {
    cat_adult:    ['adult'],
    cat_child:    ['child'],
    cat_senior:   ['senior'],
    cat_armed:    ['armed_forces','armed'],
    cat_disabled: ['differently_abled','disabled'],
  };
  Object.keys(catMap).forEach(cfgKey => {
    const cfg = productCfg[cfgKey];
    if (!cfg) return;
    const enabled = cfg.enabled !== false;
    catMap[cfgKey].forEach(catId => {
      // booking.js cat-row IDs
      ['cat-row-'+catId, 'cat_'+catId].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = enabled ? '' : 'none';
      });
      // also data-cat attr
      safeQueryAll('[data-cat="'+catId+'"]').forEach(el => {
        el.style.display = enabled ? '' : 'none';
      });
    });
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   QUICK BOOKING WIDGET: hide park tabs when park is disabled
══════════════════════════════════════════════════════════════════════════ */
function applyQBBToggles(productCfg){
  const qbbWater = document.querySelector('.qbb-tab[data-park="WATER_DAY"]');
  const qbbAmus  = document.querySelector('.qbb-tab[data-park="AMUSEMENT_DAY"]');
  const qbbCombo = document.querySelector('.qbb-tab[data-park="COMBO_DAY"]');
  const qbbPass  = document.querySelector('.qbb-tab[href*="passport"]');

  if (qbbWater) qbbWater.style.display = productCfg.WATER_DAY?.enabled !== false ? '' : 'none';
  if (qbbAmus)  qbbAmus.style.display  = productCfg.AMUSEMENT_DAY?.enabled !== false ? '' : 'none';
  if (qbbCombo) qbbCombo.style.display = productCfg.COMBO_DAY?.enabled !== false ? '' : 'none';
  if (qbbPass)  qbbPass.style.display  = productCfg.PASSPORT?.enabled !== false ? '' : 'none';
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════════════════════════════════════ */
const WOWContent = {
  /* Read configs */
  getSectionCfg:   loadSectionCfg,
  getProductCfg:   loadProductCfg,
  getOverrides:    loadOverrides,
  getDefaults:     () => ({ sections: DEFAULT_SECTION_CFG, products: DEFAULT_PRODUCT_CFG }),

  /* Write configs (from super-admin panel) */
  saveSectionCfg(cfg){
    localStorage.setItem(SK_SECTION,  JSON.stringify(cfg));
  },
  saveProductCfg(cfg){
    localStorage.setItem(SK_PRODUCT,  JSON.stringify(cfg));
  },
  saveOverrides(cfg){
    localStorage.setItem(SK_OVERRIDE, JSON.stringify(cfg));
  },

  /* Reset to defaults */
  resetAll(){
    localStorage.removeItem(SK_SECTION);
    localStorage.removeItem(SK_PRODUCT);
    localStorage.removeItem(SK_OVERRIDE);
  },

  /* Apply on page load */
  apply,
  applyBookingCatToggles,
  applyQBBToggles,

  /* Selectors (for admin UI reference) */
  SECTION_SELECTORS,
  PRODUCT_SELECTORS,
  DEFAULT_SECTION_CFG,
  DEFAULT_PRODUCT_CFG,
};

global.WOWContent = WOWContent;

})(window);
