'use strict';
// ============================================================
//  WOW Pricing Engine — Server-side port of js/booking.js
//  Keeps server pricing in sync with frontend display prices
//  All prices are GST-INCLUSIVE (as shown to customer)
// ============================================================

const TICKET_CATEGORIES = {
  adult: {
    label: 'Adult', sublabel: 'Age 12+ / Height 110cm+',
    prices: {
      WATER_DAY:    { base: 1299 },
      AMUSEMENT_DAY:{ base: 1199 },
      COMBO_DAY:    { base: 1999 }
    }
  },
  child: {
    label: 'Child', sublabel: 'Age 3–11 / Height 90–110cm',
    prices: {
      WATER_DAY:    { base: 899  },
      AMUSEMENT_DAY:{ base: 799  },
      COMBO_DAY:    { base: 1399 }
    }
  },
  senior: {
    label: 'Senior Citizen', sublabel: 'Age 60+',
    discount: 0.25,
    prices: {
      WATER_DAY:    { base: 975  },
      AMUSEMENT_DAY:{ base: 899  },
      COMBO_DAY:    { base: 1499 }
    }
  },
  armed: {
    label: 'Armed Forces', sublabel: 'Serving / Ex-servicemen',
    discount: 0.30,
    prices: {
      WATER_DAY:    { base: 909  },
      AMUSEMENT_DAY:{ base: 839  },
      COMBO_DAY:    { base: 1399 }
    }
  },
  differently_abled: {
    label: 'Differently Abled', sublabel: 'PwD card holder',
    discount: 0.50,
    prices: {
      WATER_DAY:    { base: 649  },
      AMUSEMENT_DAY:{ base: 599  },
      COMBO_DAY:    { base: 999  }
    }
  }
};

const PARKS = {
  WATER_DAY: {
    label: 'Water Park',
    groupDiscount: { minTotal: 10, savePerAdult: 75 }
  },
  AMUSEMENT_DAY: {
    label: 'Amusement Park',
    groupDiscount: { minTotal: 10, savePerAdult: 50 }
  },
  COMBO_DAY: {
    label: 'Combo — Both Parks',
    groupDiscount: { minTotal: 10, savePerAdult: 125 }
  }
};

const GST_RATE = 0.18;
const CGST_RATE = 0.09;
const SGST_RATE = 0.09;
const HSN_CODE  = '9996';
const SAC_CODE  = '999249';

// Valid offer codes and their discount rates
const OFFER_RATES = {
  BOGO20:   0.20,
  SUMMER25: 0.25,
  COMBO15:  0.15,
  GROUP10:  0.10,
  FLASH30:  0.30,
  FAMILY5:  0.05
};

const CATEGORIES = ['adult','child','senior','armed','differently_abled'];

// ── Max tickets per transaction (mirrors booking.js) ─────────
const MAX_TICKETS = 8;

/**
 * Compute full order breakdown — server-side pricing authority
 * @param {string} parkKey     - 'WATER_DAY' | 'AMUSEMENT_DAY' | 'COMBO_DAY'
 * @param {object} qtys        - { adult, child, senior, armed, differently_abled }
 * @param {string} offerCode   - optional promo code
 * @returns {object}           - full price breakdown
 */
function computeOrder(parkKey, qtys = {}, offerCode = null) {
  if (!PARKS[parkKey]) {
    throw new Error(`Invalid parkKey: "${parkKey}". Must be WATER_DAY | AMUSEMENT_DAY | COMBO_DAY`);
  }

  const totalTix = CATEGORIES.reduce((s, c) => s + (qtys[c] || 0), 0);
  if (totalTix < 1)       throw new Error('At least 1 ticket is required');
  if (totalTix > MAX_TICKETS) throw new Error(`Maximum ${MAX_TICKETS} tickets per transaction`);

  let subtotal = 0;
  const lineItems = [];

  CATEGORIES.forEach(cat => {
    const qty = qtys[cat] || 0;
    if (qty === 0) return;

    const unitIncl = TICKET_CATEGORIES[cat].prices[parkKey].base; // GST-inclusive display price
    // Extract net (pre-GST) amount — mirrors booking.js logic
    const unitNet  = Math.round(unitIncl / (1 + GST_RATE));
    const lineNet  = unitNet * qty;
    subtotal      += lineNet;

    lineItems.push({
      category:  cat,
      label:     TICKET_CATEGORIES[cat].label,
      qty,
      unit_incl: unitIncl,   // ₹ shown to customer
      unit_net:  unitNet,    // net for GST calc
      line_net:  lineNet
    });
  });

  // ── Group discount ─────────────────────────────────────────
  const gd        = PARKS[parkKey].groupDiscount;
  const groupDisc = totalTix >= gd.minTotal ? (qtys.adult || 0) * gd.savePerAdult : 0;

  // ── Offer / promo code discount ────────────────────────────
  const upperCode  = offerCode ? offerCode.toString().toUpperCase().trim() : null;
  const offerRate  = upperCode ? (OFFER_RATES[upperCode] || 0) : 0;
  if (upperCode && offerRate === 0 && upperCode !== '') {
    throw new Error(`Invalid or expired offer code: ${upperCode}`);
  }
  const offerDisc  = upperCode ? Math.round(subtotal * offerRate) : 0;

  // Best discount wins (mirrors booking.js: max of group vs offer)
  const discount   = Math.max(groupDisc, offerDisc);
  const afterDisc  = Math.max(0, subtotal - discount);

  // ── GST ────────────────────────────────────────────────────
  const gst_amount = Math.round(afterDisc * GST_RATE);
  const cgst       = Math.round(afterDisc * CGST_RATE);
  const sgst       = Math.round(afterDisc * SGST_RATE);
  const grand_total = afterDisc + gst_amount;

  return {
    park:         parkKey,
    park_label:   PARKS[parkKey].label,
    line_items:   lineItems,
    ticket_total: totalTix,
    subtotal,           // net pre-discount pre-GST
    group_disc:   groupDisc,
    offer_code:   upperCode || null,
    offer_rate:   offerRate,
    offer_disc:   offerDisc,
    discount,           // the larger of group vs offer
    after_disc:   afterDisc,
    gst_rate:     GST_RATE,
    gst_amount,
    cgst,
    sgst,
    grand_total,        // what customer pays
    base_amount:  subtotal,  // alias used in DB
    hsn_code:     HSN_CODE,
    sac_code:     SAC_CODE
  };
}

/**
 * Validate offer code without computing full order
 */
function validateOfferCode(code) {
  if (!code) return { valid: false, error: 'No code provided' };
  const upper = code.toString().toUpperCase().trim();
  const rate  = OFFER_RATES[upper];
  if (!rate)  return { valid: false, error: `Code "${upper}" is not valid or has expired` };
  return { valid: true, code: upper, rate, discount_pct: Math.round(rate * 100) };
}

module.exports = {
  computeOrder,
  validateOfferCode,
  TICKET_CATEGORIES,
  PARKS,
  OFFER_RATES,
  GST_RATE,
  MAX_TICKETS,
  CATEGORIES
};
