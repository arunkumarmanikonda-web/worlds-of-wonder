// ============================================================
//  Worlds of Wonder — Ticketing Engine  v2.0
//  Max 8 tickets per transaction · Offer engine integration
//  Buffet add-on · Auto-apply BOGO/B2G1/Flash/Family offers
// ============================================================
'use strict';

// ------------------------------------------------------------
//  PRICING MATRIX  (all prices incl. 18% GST)
// ------------------------------------------------------------
const TICKET_CATEGORIES = {
  adult: {
    id: 'adult', label: 'Adult', sublabel: 'Age 12+ / Height 110 cm+',
    emoji: '🧑', proofRequired: false, proofNote: null, minAge: 12,
    prices: {
      WATER_DAY:    { base: 1299 },
      AMUSEMENT_DAY:{ base: 1199 },
      COMBO_DAY:    { base: 1999 }
    }
  },
  child: {
    id: 'child', label: 'Child', sublabel: 'Age 3–11 / Height 90–110 cm',
    emoji: '🧒', proofRequired: false,
    proofNote: 'Children under 90 cm / 3 yrs enter FREE (no ticket needed)',
    minAge: 3,
    prices: {
      WATER_DAY:    { base: 899 },
      AMUSEMENT_DAY:{ base: 799 },
      COMBO_DAY:    { base: 1399 }
    }
  },
  senior: {
    id: 'senior', label: 'Senior Citizen', sublabel: 'Age 60 years and above',
    emoji: '👴', proofRequired: true,
    proofNote: 'Carry valid age-proof ID (Aadhaar / PAN / Passport)',
    discount: 0.25,
    prices: {
      WATER_DAY:    { base: 975 },
      AMUSEMENT_DAY:{ base: 899 },
      COMBO_DAY:    { base: 1499 }
    }
  },
  armed: {
    id: 'armed', label: 'Armed Forces',
    sublabel: 'Serving / Ex-servicemen & dependants',
    emoji: '🎖', proofRequired: true,
    proofNote: 'Carry valid Defence / ECHS / CSD ID card. One companion at same rate.',
    discount: 0.30,
    prices: {
      WATER_DAY:    { base: 909 },
      AMUSEMENT_DAY:{ base: 839 },
      COMBO_DAY:    { base: 1399 }
    }
  },
  differently_abled: {
    id: 'differently_abled', label: 'Differently Abled',
    sublabel: 'PwD card holder + one companion FREE',
    emoji: '♿', proofRequired: true,
    proofNote: 'Carry valid UDID / Disability Certificate. One accompanying person gets FREE entry.',
    discount: 0.50,
    prices: {
      WATER_DAY:    { base: 649 },
      AMUSEMENT_DAY:{ base: 599 },
      COMBO_DAY:    { base: 999 }
    }
  }
};

const PARKS = {
  WATER_DAY: {
    key: 'WATER_DAY', label: 'Water Park',
    sublabel: 'Wave Pool · Water Slides · Lazy River · Kids Zone',
    emoji: '🌊', color: 'water', adultPrice: 1299,
    groupDiscount: { minTotal: 10, savePerAdult: 75 }
  },
  AMUSEMENT_DAY: {
    key: 'AMUSEMENT_DAY', label: 'Amusement Park',
    sublabel: 'Roller Coasters · Rides · Live Shows · Themed Zones',
    emoji: '🎢', color: 'amusement', adultPrice: 1199,
    groupDiscount: { minTotal: 10, savePerAdult: 50 }
  },
  COMBO_DAY: {
    key: 'COMBO_DAY', label: 'Combo — Both Parks',
    sublabel: 'Full Water Park + Full Amusement Park · One QR Code',
    emoji: '🎟', color: 'combo', adultPrice: 1999,
    groupDiscount: { minTotal: 10, savePerAdult: 125 }
  }
};

const GST_RATE = 0.18;
const CATEGORIES_ORDER = ['adult','child','senior','armed','differently_abled'];

// ------------------------------------------------------------
//  STATE
// ------------------------------------------------------------
let _parkKey  = 'WATER_DAY';
const _qty    = { adult: 1, child: 0, senior: 0, armed: 0, differently_abled: 0 };
let _buffetQty = 0;
let _appliedOffer = null;
let _promoCode    = '';

// ------------------------------------------------------------
//  OPERATIONAL CALENDAR & CATEGORY CONFIG (from Super Admin)
// ------------------------------------------------------------
let _calConfig  = null;  // from wow_calendar_config
let _catConfig  = null;  // from wow_cat_config

function _loadAdminConfig() {
  try { _calConfig = JSON.parse(localStorage.getItem('wow_calendar_config') || 'null'); } catch(e) {}
  try { _catConfig = JSON.parse(localStorage.getItem('wow_cat_config')      || 'null'); } catch(e) {}
  // Merge price overrides into TICKET_CATEGORIES
  if (_catConfig && _catConfig.prices) {
    Object.keys(_catConfig.prices).forEach(parkKey => {
      const overrides = _catConfig.prices[parkKey];
      Object.keys(overrides).forEach(catId => {
        if (TICKET_CATEGORIES[catId] && TICKET_CATEGORIES[catId].prices[parkKey]) {
          TICKET_CATEGORIES[catId].prices[parkKey].base = overrides[catId];
        }
      });
    });
  }
}

/**
 * Returns whether a given date is bookable for the parkKey.
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} parkKey e.g. 'WATER_DAY'
 * @returns {string} 'open' | 'closed' | 'maintenance' | 'limited'
 */
function getDateStatus(dateStr, parkKey) {
  if (!_calConfig) return 'open';
  const excs = _calConfig.exceptions || [];
  for (const exc of excs) {
    if (exc.date === dateStr && (exc.park === parkKey || exc.park === 'ALL' || exc.park === 'COMBO_DAY')) {
      return exc.status;
    }
  }
  return (_calConfig.defaults && _calConfig.defaults[parkKey]) || 'open';
}

/**
 * Returns whether a ticket category is available for a given date and park.
 */
function isCategoryAvailable(catId, dateStr, parkKey) {
  // ── WOWContent product toggle check ──
  if (typeof WOWContent !== 'undefined') {
    const pCfg = WOWContent.getProductCfg();
    const catKeyMap = {
      adult:'cat_adult', child:'cat_child', senior:'cat_senior',
      armed:'cat_armed', armed_forces:'cat_armed',
      differently_abled:'cat_disabled', disabled:'cat_disabled'
    };
    const pKey = catKeyMap[catId];
    if (pKey && pCfg[pKey] && pCfg[pKey].enabled === false) return false;
  }
  if (!_catConfig) return true;
  // global toggle
  if (_catConfig.global && _catConfig.global[catId] === false) return false;
  // date range rules (most specific wins: last matching rule wins)
  const rules = _catConfig.rules || [];
  let result = true;
  for (const rule of rules) {
    if (rule.cat !== catId) continue;
    if (rule.park !== 'ALL' && rule.park !== parkKey) continue;
    if (dateStr >= rule.from && dateStr <= rule.to) {
      result = rule.action === 'enable';
    }
  }
  return result;
}

/**
 * Build disabled dates array for a date input (next 90 days).
 * Returns {disabledDates: string[], maxDate: string}
 */
function getDisabledDates(parkKey) {
  _loadAdminConfig();
  const advanceDays = (_calConfig && _calConfig.hours && _calConfig.hours.advanceDays) || 90;
  const disabled = [];
  const today = new Date();
  const maxDate = new Date(today.getTime() + advanceDays * 86400000).toISOString().slice(0,10);
  for (let i = 1; i <= advanceDays; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const str = d.toISOString().slice(0,10);
    const status = getDateStatus(str, parkKey);
    if (status === 'closed' || status === 'maintenance') {
      disabled.push(str);
    }
  }
  return { disabledDates: disabled, maxDate };
}

// ------------------------------------------------------------
//  HELPERS
// ------------------------------------------------------------
function totalTickets() {
  return CATEGORIES_ORDER.reduce((s,k) => s + _qty[k], 0);
}

function getMaxTix() {
  if (window.WOWOfferEngine) return window.WOWOfferEngine.getMaxTickets();
  return 8;
}

function inr(n) {
  return '₹\u202F' + Number(Math.round(n)).toLocaleString('en-IN');
}

function el(id)      { return document.getElementById(id); }
function txt(id, v)  { const e = el(id); if (e) e.textContent = v; }
function show(id)    { const e = el(id); if (e) e.classList.remove('hidden'); }
function hide(id)    { const e = el(id); if (e) e.classList.add('hidden'); }

// ------------------------------------------------------------
//  BUILD CART OBJECT (for offer engine v4)
// ------------------------------------------------------------
function buildCart(parkKey) {
  const breakdown = {};
  let subtotal = 0;
  CATEGORIES_ORDER.forEach(catId => {
    const qty  = _qty[catId];
    if (qty > 0) {
      const unit = TICKET_CATEGORIES[catId].prices[parkKey].base;
      const line = unit * qty;
      breakdown[catId] = { qty, unit, line };
      subtotal += line;
    }
  });
  return { parkKey, qty: totalTickets(), subtotal, total: subtotal, breakdown };
}

// v4 evaluation result cache
var _lastEvalResult = null;

// ------------------------------------------------------------
//  PRICING ENGINE
// ------------------------------------------------------------
function computeOrder(parkKey) {
  const park     = PARKS[parkKey];
  const total    = totalTickets();
  const lines    = [];
  let   subtotal = 0;

  CATEGORIES_ORDER.forEach(catId => {
    const qty = _qty[catId];
    if (qty <= 0) return;
    const cat  = TICKET_CATEGORIES[catId];
    const unit = cat.prices[parkKey].base;
    const line = unit * qty;
    lines.push({ catId, label: cat.label, emoji: cat.emoji, qty, unit, line });
    subtotal += line;
  });

  // Group discount
  let groupDisc = 0;
  if (total >= park.groupDiscount.minTotal && _qty.adult > 0) {
    groupDisc = park.groupDiscount.savePerAdult * _qty.adult;
  }

  // Buffet add-on
  let buffetPrice = 0;
  if (_buffetQty > 0 && window.WOWOfferEngine) {
    buffetPrice = window.WOWOfferEngine.buffetEffectivePrice() * _buffetQty;
  }

  // Offer discount (from auto-apply)
  let offerDisc = _appliedOffer ? _appliedOffer.discountAmount : 0;

  const afterGroupDisc = subtotal - groupDisc;
  // F&B credit from v4 engine
  let fnbCredit = 0;
  if (_lastEvalResult) fnbCredit = _lastEvalResult.totalFnbCredit || 0;
  // F&B credit reduces buffet price (capped at buffet cost)
  const fnbDiscount = Math.min(fnbCredit, buffetPrice);

  // Offer applied after group disc
  const afterOfferDisc = Math.max(0, afterGroupDisc - offerDisc);
  const finalTotal     = afterOfferDisc + buffetPrice - fnbDiscount;

  const gstAmt  = Number((finalTotal - finalTotal / (1 + GST_RATE)).toFixed(2));
  const taxable = finalTotal - gstAmt;

  return {
    parkKey, lines, subtotal, groupDisc, offerDisc, fnbCredit, fnbDiscount,
    afterGroupDisc, afterOfferDisc, buffetPrice, finalTotal, gstAmt, taxable, total
  };
}

// ------------------------------------------------------------
//  FLASH BANNER
// ------------------------------------------------------------
function showFlashBanner(parkKey) {
  if (!window.WOWOfferEngine) return;
  const visitDate = el('visit-date')?.value || new Date().toISOString().slice(0,10);
  const flashOffers = window.WOWOfferEngine.getFlashOffers(parkKey, visitDate);
  const banner = el('flash-banner');
  if (!banner) return;
  if (flashOffers.length > 0) {
    const fo = flashOffers[0];
    banner.innerHTML = `⚡ <strong>Flash Sale!</strong> ${fo.description} — <em>Limited time offer</em>`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

// ------------------------------------------------------------
//  AUTO-APPLY OFFERS (v4 engine integration)
// ------------------------------------------------------------
function refreshOffers(parkKey) {
  if (!window.WOWOfferEngine) return;
  const eng       = window.WOWOfferEngine;
  const visitDate = el('visit-date') ? el('visit-date').value : '';
  const cart      = buildCart(parkKey);

  // v4 evaluation — full resolution with stacking, conflict, A/B
  const evalResult = eng.evaluateCart(cart, {
    visitDateStr: visitDate || null,
    promoCode   : _promoCode || null,
    channel     : 'web',
    segment     : 'all',
  });
  _lastEvalResult = evalResult;

  // Aggregate totals from v4 result
  const totalDiscount = evalResult.totalTicketDiscount || 0;
  const totalFnb      = evalResult.totalFnbCredit      || 0;
  const appliedOffers = evalResult.applied             || [];

  // Set _appliedOffer as v3-compat shim for computeOrder()
  if (appliedOffers.length > 0) {
    const first = appliedOffers[0];
    _appliedOffer = {
      offerId      : first.offerId,
      offerName    : first.offerName,
      discountAmount: totalDiscount,
      freeTickets  : first.freeTickets || 0,
      freeCategory : first.freeCategory || null,
      description  : (first.messaging && first.messaging.appliedMsg)
        ? first.messaging.appliedMsg.replace('{savings}', inr(totalDiscount))
        : first.offerName,
      fnbCredit    : totalFnb,
    };
  } else {
    _appliedOffer = null;
  }

  // ── Offer Summary Row ──
  const offerRow   = el('sum-offer-row');
  const offerLbl   = el('sum-offer-label');
  const offerVal   = el('sum-offer-val');
  const offerBadge = el('applied-offer-badge');

  if (appliedOffers.length > 0) {
    if (offerRow) offerRow.classList.remove('hidden');
    if (offerLbl) offerLbl.textContent = appliedOffers.map(function(a){return a.offerName;}).join(' + ');
    if (offerVal) offerVal.textContent = '−' + inr(totalDiscount);
    if (offerBadge) {
      var badge = '';
      appliedOffers.forEach(function(a) {
        var savBadge = (a.messaging && a.messaging.savingsBadge) ? a.messaging.savingsBadge : a.offerName;
        badge += '<span style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-size:10px;font-weight:700;padding:3px 9px;border-radius:20px;margin-right:5px;">🎉 ' + savBadge + '</span>';
      });
      if (totalDiscount > 0) badge += '<span style="font-size:12px;color:#059669;font-weight:600;"> You save ' + inr(totalDiscount) + '!</span>';
      offerBadge.innerHTML = badge;
      offerBadge.classList.remove('hidden');
    }
  } else {
    if (offerRow) offerRow.classList.add('hidden');
    if (offerBadge) offerBadge.classList.add('hidden');
  }

  // ── Explainability Ribbon ──
  _renderExplainabilityRibbon(evalResult);

  // ── F&B Credit Badge ──
  if (totalFnb > 0) {
    const fnbEl = el('fnb-credit-badge');
    if (fnbEl) {
      fnbEl.innerHTML = '🍽 <strong>F&B Credit ' + inr(totalFnb) + '</strong> unlocked! Applies to your Buffet add-on.';
      fnbEl.classList.remove('hidden');
    }
  } else {
    const fnbEl = el('fnb-credit-badge');
    if (fnbEl) fnbEl.classList.add('hidden');
  }
}

function _renderExplainabilityRibbon(evalResult) {
  const ribbon = el('offer-explain-ribbon');
  if (!ribbon) return;
  if (!evalResult || !evalResult.considered || !evalResult.considered.length) {
    ribbon.classList.add('hidden'); return;
  }

  // Show qualified + rejected breakdown
  const qualified = evalResult.qualified || [];
  const rejected  = (evalResult.considered || []).filter(function(c){return c.rejected;});
  const applied   = evalResult.applied   || [];

  if (!applied.length) {
    ribbon.innerHTML = '<div style="font-size:10.5px;color:#6b7280;">No offers applicable to current cart. ' +
      (rejected.length ? rejected.slice(0,2).map(function(r){return '<span style="margin-left:6px;">'+r.name+': '+r.reason+'</span>';}).join('') : '') + '</div>';
    ribbon.classList.remove('hidden');
    return;
  }

  var html = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">' +
    '<span style="font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.5px;">Offers evaluated:</span>' +
    applied.map(function(a){
      return '<span style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#4ade80;font-size:10px;font-weight:600;padding:2px 8px;border-radius:12px;">✓ '+a.offerName+'</span>';
    }).join('') +
    (rejected.slice(0,3).map(function(r){
      return '<span style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.15);color:#f87171;font-size:10px;padding:2px 8px;border-radius:12px;">'+r.name+'</span>';
    }).join('')) +
  '</div>';
  ribbon.innerHTML = html;
  ribbon.classList.remove('hidden');
}

// ------------------------------------------------------------
//  BUFFET ADD-ON
// ------------------------------------------------------------
function renderBuffet() {
  const wrap = el('buffet-addon-wrap');
  if (!wrap || !window.WOWOfferEngine) return;

  const cfg      = window.WOWOfferEngine.getBuffetConfig();
  if (!cfg.enabled) { wrap.classList.add('hidden'); return; }

  const soldOut  = window.WOWOfferEngine.buffetIsSoldOut();
  const effPrice = window.WOWOfferEngine.buffetEffectivePrice();
  const maxQ     = window.WOWOfferEngine.buffetMaxQty();

  if (soldOut) {
    wrap.innerHTML = `
      <div class="bk-buffet-card bk-buffet-soldout">
        <div class="bk-buffet-head">🍽 Park Buffet Meal <span class="badge-soldout">SOLD OUT</span></div>
        <p class="bk-buffet-msg">Pre-booked buffet is sold out for today. Try these in-park options:</p>
        <ul class="bk-buffet-alt">
          ${cfg.alternativeFnB.map(f => `<li>🍴 <strong>${f.name}</strong> — ${f.location}</li>`).join('')}
        </ul>
      </div>`;
    return;
  }

  const discNote = cfg.discountType === 'percent'
    ? cfg.discountValue + '% off'
    : '₹' + cfg.discountValue + ' off';

  wrap.innerHTML = `
    <div class="bk-buffet-card">
      <div class="bk-buffet-head">
        🍽 Add Buffet Meal
        <span class="bk-buffet-tag">Pre-book ${discNote}</span>
      </div>
      <div class="bk-buffet-desc">${cfg.description}</div>
      <div class="bk-buffet-price-row">
        <span class="bk-buffet-old">₹${cfg.basePrice}</span>
        <span class="bk-buffet-price">${inr(effPrice)}</span>
        <span class="bk-buffet-save">Save ₹${cfg.basePrice - effPrice}</span>
      </div>
      <div class="bk-buffet-stepper">
        <button class="step-btn step-minus" onclick="changeBuffet(-1)" aria-label="Remove buffet">−</button>
        <span class="step-val" id="buffet-qty-val">${_buffetQty}</span>
        <button class="step-btn step-plus" onclick="changeBuffet(1)" aria-label="Add buffet">+</button>
        <span class="bk-buffet-max">Max ${maxQ} per booking</span>
      </div>
    </div>`;
}

function changeBuffet(delta) {
  const maxQ = window.WOWOfferEngine ? window.WOWOfferEngine.buffetMaxQty() : 8;
  _buffetQty = Math.max(0, Math.min(maxQ, _buffetQty + delta));
  const valEl = el('buffet-qty-val');
  if (valEl) valEl.textContent = _buffetQty;
  refreshSummary(_parkKey);
}

// ------------------------------------------------------------
//  HELPER: Apply datepicker styling for disabled dates
// ------------------------------------------------------------
function _applyDatePickerStyles(inputEl, disabledDates) {
  if (!disabledDates.length) return;
  // On change, validate that the selected date isn't disabled
  const origChange = inputEl.onchange;
  inputEl.addEventListener('input', () => {
    const val = inputEl.value;
    if (disabledDates.includes(val)) {
      inputEl.style.borderColor = '#ef4444';
      inputEl.style.background = 'rgba(239,68,68,.08)';
      const msg = el('date-unavailable-msg');
      if (msg) { msg.textContent = '🔴 This date is unavailable. Please select another.'; msg.style.display='block'; }
    } else {
      inputEl.style.borderColor = '';
      inputEl.style.background = '';
      const msg = el('date-unavailable-msg');
      if (msg) msg.style.display='none';
    }
  });
}

// ------------------------------------------------------------
//  RENDER CATEGORY ROWS
// ------------------------------------------------------------
function renderCategoryRows(parkKey) {
  const container = el('ticket-categories');
  if (!container) return;
  container.innerHTML = '';

  const maxTix = getMaxTix();
  const visitDate = el('visit-date')?.value || new Date(Date.now()+86400000).toISOString().slice(0,10);

  CATEGORIES_ORDER.forEach(catId => {
    const cat  = TICKET_CATEGORIES[catId];
    const unit = cat.prices[parkKey].base;
    const available = isCategoryAvailable(catId, visitDate, parkKey);

    // Hide unavailable categories (reset qty to 0 for hidden cats except adult)
    if (!available) {
      if (catId !== 'adult') _qty[catId] = 0; // reset count for disabled cat
      return; // skip rendering this row
    }

    const row  = document.createElement('div');
    row.className = 'cat-row';
    row.id = `cat-row-${catId}`;

    row.innerHTML = `
      <div class="cat-info">
        <div class="cat-emoji">${cat.emoji}</div>
        <div class="cat-text">
          <div class="cat-label">${cat.label}</div>
          <div class="cat-sub">${cat.sublabel}</div>
          ${cat.proofNote ? `<div class="cat-proof"><span class="proof-icon">📋</span>${cat.proofNote}</div>` : ''}
        </div>
      </div>
      <div class="cat-right">
        <div class="cat-price">${inr(unit)}</div>
        <div class="cat-stepper">
          <button class="step-btn step-minus" data-cat="${catId}" aria-label="Remove ${cat.label}">−</button>
          <span class="step-val" id="step-val-${catId}">${_qty[catId]}</span>
          <button class="step-btn step-plus" data-cat="${catId}" aria-label="Add ${cat.label}">+</button>
        </div>
      </div>`;
    container.appendChild(row);
  });

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.step-btn');
    if (!btn) return;
    const cat = btn.dataset.cat;
    if (!cat || !_qty.hasOwnProperty(cat)) return;

    if (btn.classList.contains('step-plus')) {
      if (totalTickets() >= maxTix) {
        showMaxTicketAlert(maxTix);
        return;
      }
      _qty[cat] = _qty[cat] + 1;
    } else {
      _qty[cat] = Math.max(0, _qty[cat] - 1);
      if (totalTickets() === 0) _qty[cat] = 1; // ensure min 1
    }

    txt(`step-val-${cat}`, _qty[cat]);
    refreshSummary(parkKey);
  });
}

function showMaxTicketAlert(maxTix) {
  const toast = el('max-ticket-toast');
  if (toast) {
    toast.textContent = `⚠️ Maximum ${maxTix} tickets per transaction. Start a new booking for more.`;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3500);
  } else {
    alert(`Maximum ${maxTix} tickets allowed per transaction.`);
  }
}

// ------------------------------------------------------------
//  PROMO CODE (v4 engine integration)
// ------------------------------------------------------------
function applyPromoCode() {
  const inp = el('promo-code-input');
  if (!inp) return;
  const code = inp.value.trim().toUpperCase();
  if (!code) return;

  if (!window.WOWOfferEngine) { alert('Offer engine not loaded.'); return; }

  const eng       = window.WOWOfferEngine;
  const visitDate = el('visit-date') ? el('visit-date').value : '';
  const cart      = buildCart(_parkKey);

  // v4 promo validation
  const res = eng.validatePromoCode(code, cart, { visitDateStr: visitDate || null, channel: 'web' });

  const errEl     = el('promo-err');
  const successEl = el('promo-success');

  if (!res.valid) {
    if (errEl) { errEl.textContent = '❌ ' + res.error; errEl.classList.remove('hidden'); }
    if (successEl) successEl.classList.add('hidden');
    _promoCode = '';
  } else {
    _promoCode = code;
    if (errEl) errEl.classList.add('hidden');
    const discount = res.applied ? res.applied.totalDiscount : 0;
    const savingText = discount > 0 ? ' — saving ' + inr(discount) + '!' : '';
    if (successEl) {
      successEl.innerHTML = '✅ <strong>' + code + '</strong> applied' + savingText;
      successEl.classList.remove('hidden');
    }
    refreshSummary(_parkKey);
  }
}

function clearPromoCode() {
  _promoCode = '';
  _appliedOffer = null;
  const inp = el('promo-code-input');
  if (inp) inp.value = '';
  const errEl     = el('promo-err');
  const successEl = el('promo-success');
  if (errEl)     errEl.classList.add('hidden');
  if (successEl) successEl.classList.add('hidden');
  refreshSummary(_parkKey);
}

// ------------------------------------------------------------
//  REFRESH SUMMARY PANEL
// ------------------------------------------------------------
function refreshSummary(parkKey) {
  refreshOffers(parkKey);
  const order = computeOrder(parkKey);
  const park  = PARKS[parkKey];

  // Line items
  const linesEl = el('summary-lines');
  if (linesEl) {
    linesEl.innerHTML = order.lines.map(item =>
      `<div class="sum-line">
         <span class="sum-line-label">${item.emoji} ${item.label} × ${item.qty}</span>
         <span class="sum-line-val">${inr(item.line)}</span>
       </div>`
    ).join('') + (_buffetQty > 0 && window.WOWOfferEngine
      ? `<div class="sum-line">
           <span class="sum-line-label">🍽 Buffet Meal × ${_buffetQty}</span>
           <span class="sum-line-val">${inr(window.WOWOfferEngine.buffetEffectivePrice() * _buffetQty)}</span>
         </div>` : '');
  }

  txt('sum-subtotal', inr(order.subtotal));

  // Group discount
  if (order.groupDisc > 0) {
    txt('sum-group-disc', `−${inr(order.groupDisc)}`);
    show('sum-group-disc-row');
    const hint = el('group-hint');
    if (hint) {
      hint.innerHTML = `🎉 <strong>Group discount applied!</strong> You save ${inr(order.groupDisc)} on adult tickets.`;
      hint.classList.remove('hidden');
      hint.className = 'cat-hint cat-hint-success';
    }
  } else {
    hide('sum-group-disc-row');
    const remaining = park.groupDiscount.minTotal - order.total;
    const hint = el('group-hint');
    if (hint && remaining > 0 && order.total > 0) {
      hint.innerHTML = `💡 Add <strong>${remaining} more ticket${remaining > 1 ? 's' : ''}</strong> to unlock the group discount!`;
      hint.classList.remove('hidden');
      hint.className = 'cat-hint';
    } else if (hint) { hint.classList.add('hidden'); }
  }

  // Buffet row
  const buffetRow = el('sum-buffet-row');
  if (buffetRow) {
    if (_buffetQty > 0 && window.WOWOfferEngine) {
      txt('sum-buffet-val', inr(order.buffetPrice));
      buffetRow.classList.remove('hidden');
    } else {
      buffetRow.classList.add('hidden');
    }
  }

  // F&B Credit row
  const fnbRow = el('sum-fnb-credit-row');
  if (fnbRow) {
    if (order.fnbDiscount > 0) {
      txt('sum-fnb-credit-val', '−' + inr(order.fnbDiscount));
      fnbRow.classList.remove('hidden');
    } else {
      fnbRow.classList.add('hidden');
    }
  }

  txt('sum-gst', inr(order.gstAmt));
  txt('sum-total', inr(order.finalTotal));
  txt('total-tickets-count', order.total + ' ticket' + (order.total !== 1 ? 's' : ''));

  // Mobile total
  const mobTotal = el('mobile-sum-total');
  if (mobTotal) mobTotal.textContent = inr(order.finalTotal);

  // CTA button
  const cta = el('checkout-btn');
  if (cta) {
    if (order.total === 0) {
      cta.textContent = 'Select at least 1 ticket';
      cta.disabled = true;
    } else {
      cta.disabled = false;
      cta.textContent = `Pay ${inr(order.finalTotal)} — Confirm Booking →`;
    }
  }
  const ctaMob = el('checkout-btn-mobile');
  if (ctaMob) {
    ctaMob.disabled = order.total === 0;
    ctaMob.textContent = `Pay ${inr(order.finalTotal)} →`;
  }

  // Flash banner
  showFlashBanner(parkKey);
}

// ------------------------------------------------------------
//  VALIDATION & CHECKOUT
// ------------------------------------------------------------
function showFieldError(id, msg) {
  const e = el(id);
  if (e) {
    e.style.borderColor = '#ef4444';
    e.focus();
    const err = el(id + '-err');
    if (err) { err.textContent = msg; err.classList.remove('hidden'); }
    setTimeout(() => {
      e.style.borderColor = '';
      if (err) err.classList.add('hidden');
    }, 3500);
  }
}

function validateAndCheckout() {
  const name   = (el('full-name')?.value || '').trim();
  const mobile = (el('mobile')?.value || '').replace(/\s/g,'');
  const email  = (el('email')?.value || '').trim();
  const date   = el('visit-date')?.value || '';

  if (!name)                         { showFieldError('full-name', 'Please enter the lead guest name'); return; }
  if (!/^[6-9]\d{9}$/.test(mobile)) { showFieldError('mobile', 'Enter a valid 10-digit mobile number'); return; }
  if (!date)                         { showFieldError('visit-date', 'Please select your visit date'); return; }
  if (totalTickets() === 0)          { alert('Please add at least one ticket.'); return; }

  // ── Operational Calendar check ──────────────────────────────
  const dateStatus = getDateStatus(date, _parkKey);
  if (dateStatus === 'closed' || dateStatus === 'maintenance') {
    showFieldError('visit-date', dateStatus === 'closed'
      ? '🔴 Park is closed on this date. Please select an available date.'
      : '🟡 Maintenance scheduled on this date. Bookings unavailable.');
    return;
  }

  const maxTix = getMaxTix();
  if (totalTickets() > maxTix) {
    alert(`Maximum ${maxTix} tickets per transaction. Please reduce ticket count.`);
    return;
  }

  const order = computeOrder(_parkKey);
  const park  = PARKS[_parkKey];

  const proofNeeded = CATEGORIES_ORDER
    .filter(k => _qty[k] > 0 && TICKET_CATEGORIES[k].proofRequired)
    .map(k => TICKET_CATEGORIES[k].label);

  // Save to session storage
  const bookingData = {
    park: _parkKey.toLowerCase().replace('_day','').replace('_',''),
    parkKey: _parkKey,
    name, mobile, email: email || '',
    date,
    adults:   _qty.adult,
    children: _qty.child,
    seniors:  _qty.senior,
    armed:    _qty.armed,
    disabled: _qty.differently_abled,
    buffetQty: _buffetQty,
    buffetTotal: order.buffetPrice,
    total: order.finalTotal,
    subtotal: order.subtotal,
    discount: order.groupDisc + order.offerDisc,
    offerName: _appliedOffer?.offerName || null,
    promoCode: _promoCode || null,
    items: order.lines.map(l => ({ name: l.label, qty: l.qty, price: l.unit }))
  };
  sessionStorage.setItem('wow_booking', JSON.stringify(bookingData));
  sessionStorage.setItem('wow_tx_id', 'WOW' + Date.now().toString(36).toUpperCase());

  // ── Redirect to payment page ───────────────────────────────
  // Determine the relative path depth to find book/payment.html
  var _pathname = window.location.pathname;
  var _payUrl;
  if (_pathname.indexOf('/book/') !== -1) {
    _payUrl = 'payment.html';          // already inside /book/
  } else {
    _payUrl = 'book/payment.html';     // root or other level
  }
  window.location.href = _payUrl;
}

// ------------------------------------------------------------
//  SUCCESS MODAL
// ------------------------------------------------------------
function showSuccessModal({ name, mobile, date, order, park, proofNeeded }) {
  const modal = el('success-modal');
  if (!modal) { alert('Booking confirmed! Total: ' + inr(order.finalTotal)); return; }

  txt('suc-name', name);
  txt('suc-park', park.label);
  txt('suc-date', new Date(date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' }));
  txt('suc-total', inr(order.finalTotal));
  txt('suc-mobile', '+91-' + mobile);

  const breakdown = el('suc-breakdown');
  if (breakdown) {
    breakdown.innerHTML = order.lines.map(item =>
      `<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;">
         <span style="color:#666;">${item.emoji} ${item.label} × ${item.qty}</span>
         <strong>${inr(item.line)}</strong>
       </div>`
    ).join('');
    if (order.groupDisc > 0) {
      breakdown.innerHTML += `<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;color:#059669;"><span>Group discount</span><strong>−${inr(order.groupDisc)}</strong></div>`;
    }
    if (order.offerDisc > 0 && _appliedOffer) {
      const offerNames = _lastEvalResult && _lastEvalResult.applied
        ? _lastEvalResult.applied.map(a => a.offerName).join(' + ')
        : (_appliedOffer ? _appliedOffer.offerName : 'Offer');
      breakdown.innerHTML += `<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;color:#7c3aed;"><span>🎉 ${offerNames}</span><strong>−${inr(order.offerDisc)}</strong></div>`;
    }
    if (order.fnbDiscount > 0) {
      breakdown.innerHTML += `<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;color:#f97316;"><span>🍽 F&B Credit</span><strong>−${inr(order.fnbDiscount)}</strong></div>`;
    }
    if (_buffetQty > 0) {
      breakdown.innerHTML += `<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;color:#0055B3;"><span>🍽 Buffet Meal × ${_buffetQty}</span><strong>${inr(order.buffetPrice)}</strong></div>`;
    }
  }

  const proofEl = el('suc-proof-reminder');
  if (proofEl) {
    if (proofNeeded.length > 0) {
      proofEl.innerHTML = `<strong>📋 Carry ID at the gate</strong><br>Required for: ${proofNeeded.join(', ')}`;
      proofEl.classList.remove('hidden');
    } else {
      proofEl.classList.add('hidden');
    }
  }

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

// ------------------------------------------------------------
//  INIT
// ------------------------------------------------------------
function initBookingForm(parkKey) {
  _parkKey = parkKey;
  _loadAdminConfig();

  const dateInput = el('visit-date');
  if (dateInput) {
    const tom = new Date(Date.now() + 86400000).toISOString().slice(0,10);
    const { disabledDates, maxDate } = getDisabledDates(parkKey);

    // Find first available date (skip today, start tomorrow)
    let firstAvail = tom;
    for (let i = 1; i <= 90; i++) {
      const d = new Date(Date.now() + i * 86400000).toISOString().slice(0,10);
      if (!disabledDates.includes(d)) { firstAvail = d; break; }
    }
    dateInput.value = firstAvail;
    dateInput.min   = tom;
    dateInput.max   = maxDate;

    // Attach dynamic validation on change
    dateInput.addEventListener('change', () => {
      const chosen = dateInput.value;
      const status = getDateStatus(chosen, _parkKey);
      const unavailableEl = el('date-unavailable-msg');
      if (status === 'closed' || status === 'maintenance') {
        dateInput.style.borderColor = '#ef4444';
        if (unavailableEl) {
          unavailableEl.textContent = status === 'closed'
            ? '🔴 This date is closed for the park. Please choose another date.'
            : '🟡 This date is a maintenance day. Bookings not available.';
          unavailableEl.style.display = 'block';
        }
      } else {
        dateInput.style.borderColor = '';
        if (unavailableEl) unavailableEl.style.display = 'none';
        if (status === 'limited') {
          if (unavailableEl) {
            unavailableEl.textContent = '🟠 Limited capacity on this date. Book early!';
            unavailableEl.style.display = 'block';
            unavailableEl.style.color = '#f97316';
          }
        }
      }
      // Re-render categories (availability may change per date)
      renderCategoryRows(parkKey);
      refreshSummary(_parkKey);
    });

    // Inline disabled-date feedback via CSS (mark in red via oninput)
    // We wire a custom visual indicator. For browsers that don't support
    // native disabled dates on <input type="date">, we'll validate on submit too.
    _applyDatePickerStyles(dateInput, disabledDates);
  }

  renderCategoryRows(parkKey);
  renderBuffet();
  refreshSummary(parkKey);

  const cta = el('checkout-btn');
  if (cta) cta.addEventListener('click', validateAndCheckout);

  const ctaMob = el('checkout-btn-mobile');
  if (ctaMob) ctaMob.addEventListener('click', validateAndCheckout);

  const closeBtn = el('modal-close');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    const m = el('success-modal');
    if (m) m.style.display = 'none';
  });

  // Go to confirmation on success
  const goConfirmBtn = el('go-confirmation-btn');
  if (goConfirmBtn) goConfirmBtn.addEventListener('click', () => {
    window.location.href = 'confirmation.html';
  });

  // Promo code button
  const promoBtn = el('apply-promo-btn');
  if (promoBtn) promoBtn.addEventListener('click', applyPromoCode);

  const promoInp = el('promo-code-input');
  if (promoInp) promoInp.addEventListener('keydown', e => {
    if (e.key === 'Enter') applyPromoCode();
  });
}

// ------------------------------------------------------------
//  PUBLIC API
// ------------------------------------------------------------
// Commit evaluation on successful checkout (increment usage counts)
function _commitOnCheckout() {
  if (!window.WOWOfferEngine || !_lastEvalResult) return;
  try {
    window.WOWOfferEngine.commitEvaluation(_lastEvalResult, {
      channel     : 'web',
      visitDateStr: el('visit-date') ? el('visit-date').value : null,
    });
  } catch(_) {}
}

// NOTE: showSuccessModal is now only called from payment.html confirmation page
// after payment is processed. Offer usage is committed via commitOnCheckout().
// Expose _commitOnCheckout so payment.html can call it.
window._wowCommitOfferUsage = _commitOnCheckout;

window.WOWBooking = {
  initBookingForm, computeOrder, inr,
  TICKET_CATEGORIES, PARKS, CATEGORIES_ORDER,
  changeBuffet, applyPromoCode, clearPromoCode,
  validateAndCheckout,
};

