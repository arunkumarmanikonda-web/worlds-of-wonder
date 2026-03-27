// ============================================================
//  Worlds of Wonder — Ticketing Engine
//  Ticket Categories: Adult · Child · Senior Citizen ·
//                     Armed Forces · Specially Abled
//  Parks: Water Park · Amusement Park · Combo (both)
// ============================================================
'use strict';

// ------------------------------------------------------------
//  PRICING MATRIX
//  All prices are INCLUSIVE of 18% GST
//  Height rules: Child = under 110 cm OR under 12 yrs
//  Child below 90 cm / 3 yrs: FREE (no ticket needed, accompanied)
// ------------------------------------------------------------
const TICKET_CATEGORIES = {
  adult: {
    id:        'adult',
    label:     'Adult',
    sublabel:  'Age 12+ / Height 110 cm+',
    emoji:     '🧑',
    proofRequired: false,
    proofNote: null,
    minAge:    12,
    prices: {
      WATER_DAY:    { base: 1299, label: 'Water Park' },
      AMUSEMENT_DAY:{ base: 1199, label: 'Amusement Park' },
      COMBO_DAY:    { base: 1999, label: 'Both Parks Combo' },
    }
  },
  child: {
    id:        'child',
    label:     'Child',
    sublabel:  'Age 3–11 / Height 90–110 cm',
    emoji:     '🧒',
    proofRequired: false,
    proofNote: 'Children under 90 cm / 3 yrs enter FREE (no ticket needed)',
    minAge:    3,
    prices: {
      WATER_DAY:    { base: 899,  label: 'Water Park' },
      AMUSEMENT_DAY:{ base: 799,  label: 'Amusement Park' },
      COMBO_DAY:    { base: 1399, label: 'Both Parks Combo' },
    }
  },
  senior: {
    id:        'senior',
    label:     'Senior Citizen',
    sublabel:  'Age 60 years and above',
    emoji:     '👴',
    proofRequired: true,
    proofNote: 'Carry valid age-proof ID (Aadhaar / PAN / Passport)',
    discount:  0.25,   // 25% off adult price
    prices: {
      WATER_DAY:    { base: 975,  label: 'Water Park' },
      AMUSEMENT_DAY:{ base: 899,  label: 'Amusement Park' },
      COMBO_DAY:    { base: 1499, label: 'Both Parks Combo' },
    }
  },
  armed: {
    id:        'armed',
    label:     'Armed Forces',
    sublabel:  'Serving / Ex-servicemen & dependants',
    emoji:     '🎖',
    proofRequired: true,
    proofNote: 'Carry valid Defence / ECHS / CSD ID card. One companion at same rate.',
    discount:  0.30,   // 30% off adult price
    prices: {
      WATER_DAY:    { base: 909,  label: 'Water Park' },
      AMUSEMENT_DAY:{ base: 839,  label: 'Amusement Park' },
      COMBO_DAY:    { base: 1399, label: 'Both Parks Combo' },
    }
  },
  differently_abled: {
    id:        'differently_abled',
    label:     'Differently Abled',
    sublabel:  'PwD card holder + one companion FREE',
    emoji:     '♿',
    proofRequired: true,
    proofNote: 'Carry valid UDID / Disability Certificate. One accompanying person gets FREE entry.',
    discount:  0.50,   // 50% off
    prices: {
      WATER_DAY:    { base: 649,  label: 'Water Park' },
      AMUSEMENT_DAY:{ base: 599,  label: 'Amusement Park' },
      COMBO_DAY:    { base: 999,  label: 'Both Parks Combo' },
    }
  }
};

// Park definitions
const PARKS = {
  WATER_DAY: {
    key:      'WATER_DAY',
    label:    'Water Park',
    sublabel: 'Wave Pool · Water Slides · Lazy River · Kids Zone',
    emoji:    '🌊',
    color:    'water',
    adultPrice: 1299,
    // Group discount: 10+ total tickets → ₹75 off per adult ticket
    groupDiscount: { minTotal: 10, savePerAdult: 75 }
  },
  AMUSEMENT_DAY: {
    key:      'AMUSEMENT_DAY',
    label:    'Amusement Park',
    sublabel: 'Roller Coasters · Rides · Live Shows · Themed Zones',
    emoji:    '🎢',
    color:    'amusement',
    adultPrice: 1199,
    groupDiscount: { minTotal: 10, savePerAdult: 50 }
  },
  COMBO_DAY: {
    key:      'COMBO_DAY',
    label:    'Combo — Both Parks',
    sublabel: 'Full Water Park + Full Amusement Park · One QR Code',
    emoji:    '🎟',
    color:    'combo',
    adultPrice: 1999,
    groupDiscount: { minTotal: 10, savePerAdult: 125 }
  }
};

const GST_RATE = 0.18;  // GST already INCLUDED in listed prices
const CATEGORIES_ORDER = ['adult','child','senior','armed','differently_abled'];

// ------------------------------------------------------------
//  STATE: current quantities per category
// ------------------------------------------------------------
let _parkKey = 'WATER_DAY';
const _qty = { adult: 1, child: 0, senior: 0, armed: 0, differently_abled: 0 };

// ------------------------------------------------------------
//  PRICING ENGINE
// ------------------------------------------------------------
function totalTickets() {
  return CATEGORIES_ORDER.reduce((s, k) => s + _qty[k], 0);
}

function computeLineItem(catId, parkKey, qty) {
  if (qty <= 0) return null;
  const cat  = TICKET_CATEGORIES[catId];
  const unit = cat.prices[parkKey].base;
  return { catId, label: cat.label, emoji: cat.emoji, qty, unit, line: unit * qty };
}

function computeOrder(parkKey) {
  const park     = PARKS[parkKey];
  const total    = totalTickets();
  const lines    = [];
  let   subtotal = 0;

  for (const catId of CATEGORIES_ORDER) {
    const item = computeLineItem(catId, parkKey, _qty[catId]);
    if (item) { lines.push(item); subtotal += item.line; }
  }

  // Group discount — applied on adult tickets only when total >= threshold
  let groupDisc = 0;
  if (total >= park.groupDiscount.minTotal && _qty.adult > 0) {
    groupDisc = park.groupDiscount.savePerAdult * _qty.adult;
  }

  const afterDisc = subtotal - groupDisc;
  // GST already included in prices; extract for display
  const gstAmt    = Number((afterDisc - afterDisc / (1 + GST_RATE)).toFixed(2));
  const taxable   = afterDisc - gstAmt;

  return { parkKey, lines, subtotal, groupDisc, afterDisc, gstAmt, taxable, total };
}

// ------------------------------------------------------------
//  FORMATTING HELPERS
// ------------------------------------------------------------
function inr(n) {
  return '₹\u202F' + Number(Math.round(n)).toLocaleString('en-IN');
}

function el(id)   { return document.getElementById(id); }
function txt(id, v)  { const e = el(id); if (e) e.textContent = v; }
function show(id) { const e = el(id); if (e) e.classList.remove('hidden'); }
function hide(id) { const e = el(id); if (e) e.classList.add('hidden'); }
function showEl(e, v) { if (e) e.classList.toggle('hidden', !v); }

// ------------------------------------------------------------
//  RENDER CATEGORY STEPPER ROWS (called once on init)
// ------------------------------------------------------------
function renderCategoryRows(parkKey, accentColor) {
  const container = el('ticket-categories');
  if (!container) return;
  container.innerHTML = '';

  for (const catId of CATEGORIES_ORDER) {
    const cat  = TICKET_CATEGORIES[catId];
    const unit = cat.prices[parkKey].base;

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
  }

  // Wire up buttons
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.step-btn');
    if (!btn) return;
    const cat = btn.dataset.cat;
    if (!cat || !_qty.hasOwnProperty(cat)) return;

    if (btn.classList.contains('step-plus')) {
      _qty[cat] = Math.min(20, _qty[cat] + 1);
    } else {
      _qty[cat] = Math.max(0, _qty[cat] - 1);
      // Ensure at least 1 ticket total
      if (totalTickets() === 0) _qty[cat] = 1;
    }

    txt(`step-val-${cat}`, _qty[cat]);
    refreshSummary(parkKey);
  });
}

// ------------------------------------------------------------
//  REFRESH SUMMARY PANEL
// ------------------------------------------------------------
function refreshSummary(parkKey) {
  const order   = computeOrder(parkKey);
  const park    = PARKS[parkKey];

  // Update line items in summary
  const linesEl = el('summary-lines');
  if (linesEl) {
    linesEl.innerHTML = order.lines.map(item =>
      `<div class="sum-line">
         <span class="sum-line-label">${item.emoji} ${item.label} × ${item.qty}</span>
         <span class="sum-line-val">${inr(item.line)}</span>
       </div>`
    ).join('');
  }

  // Subtotal
  txt('sum-subtotal', inr(order.subtotal));

  // Group discount
  if (order.groupDisc > 0) {
    txt('sum-group-disc', `−${inr(order.groupDisc)}`);
    show('sum-group-disc-row');
    const hint = el('group-hint');
    if (hint) { hint.innerHTML = `🎉 <strong>Group discount applied!</strong> You save ${inr(order.groupDisc)} on adult tickets.`; hint.classList.remove('hidden'); hint.className = 'cat-hint cat-hint-success'; }
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

  // GST & total
  txt('sum-gst', inr(order.gstAmt));
  txt('sum-total', inr(order.afterDisc));

  // Tickets count badge
  txt('total-tickets-count', order.total + ' ticket' + (order.total !== 1 ? 's' : ''));

  // CTA button
  const cta = el('checkout-btn');
  if (cta) {
    if (order.total === 0) {
      cta.textContent = 'Select at least 1 ticket';
      cta.disabled = true;
    } else {
      cta.disabled = false;
      cta.textContent = `Pay ${inr(order.afterDisc)} — Confirm Booking →`;
    }
  }
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
  const mobile = (el('mobile')?.value || '').replace(/\s/g, '');
  const date   = el('visit-date')?.value || '';

  if (!name)                           { showFieldError('full-name', 'Please enter the lead guest name'); return; }
  if (!/^[6-9]\d{9}$/.test(mobile))   { showFieldError('mobile', 'Enter a valid 10-digit mobile number'); return; }
  if (!date)                           { showFieldError('visit-date', 'Please select your visit date'); return; }
  if (totalTickets() === 0)            { alert('Please add at least one ticket.'); return; }

  const order = computeOrder(_parkKey);
  const park  = PARKS[_parkKey];

  // Check if proof-required categories are selected → show reminder
  const proofNeeded = CATEGORIES_ORDER
    .filter(k => _qty[k] > 0 && TICKET_CATEGORIES[k].proofRequired)
    .map(k => TICKET_CATEGORIES[k].label);

  showSuccessModal({ name, mobile, date, order, park, proofNeeded });
}

// ------------------------------------------------------------
//  SUCCESS MODAL
// ------------------------------------------------------------
function showSuccessModal({ name, date, order, park, proofNeeded }) {
  const modal = el('success-modal');
  if (!modal) { alert('Booking confirmed! Total: ' + inr(order.afterDisc)); return; }

  txt('suc-name', name);
  txt('suc-park', park.label);
  txt('suc-date', new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  txt('suc-total', inr(order.afterDisc));

  // Ticket breakdown
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
  }

  // Proof reminder
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

  // Set default visit date = tomorrow
  const dateInput = el('visit-date');
  if (dateInput) {
    const tom = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    dateInput.value = tom;
    dateInput.min   = tom;
  }

  // Render category rows
  renderCategoryRows(parkKey);
  refreshSummary(parkKey);

  // Checkout button
  const cta = el('checkout-btn');
  if (cta) cta.addEventListener('click', validateAndCheckout);

  // Close modal
  const closeBtn = el('modal-close');
  if (closeBtn) closeBtn.addEventListener('click', () => {
    const m = el('success-modal');
    if (m) m.style.display = 'none';
  });
}

// ------------------------------------------------------------
//  PUBLIC API
// ------------------------------------------------------------
window.WOWBooking = { initBookingForm, computeOrder, inr, TICKET_CATEGORIES, PARKS, CATEGORIES_ORDER };
