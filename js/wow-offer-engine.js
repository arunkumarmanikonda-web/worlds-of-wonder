// ============================================================
//  Worlds of Wonder — Offer Engine  v3.0
//  Fully functional: BOGO, B2G1, Buy4Discount, Flash, Family,
//  Percentage, Flat, Auto-apply, Category-specific, Buffet
// ============================================================
'use strict';

/* ─── OFFER STORE (loaded from admin panel / localStorage) ─── */
const WOW_DEFAULT_OFFERS = [
  {
    id: 'SUMMER20',
    name: 'Summer Splash 20% Off',
    type: 'percent',
    value: 20,
    parks: ['WATER_DAY'],
    categories: ['adult','child'],
    status: 'live',
    autoApply: true,
    promoCode: null,
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    flashSale: false,
    maxUses: 5000,
    usedCount: 842,
    minTickets: 1,
    minCartValue: 0,
    description: '20% off Water Park tickets for Adult & Child. No code needed.'
  },
  {
    id: 'FAMILY1000',
    name: 'Family of 4 — ₹1,000 Off',
    type: 'flat',
    value: 1000,
    parks: ['COMBO_DAY'],
    categories: ['adult','child'],
    status: 'live',
    autoApply: true,
    promoCode: null,
    autoApplyRule: { adults: 2, children: 2 },
    startDate: null,
    endDate: null,
    flashSale: false,
    maxUses: null,
    usedCount: 321,
    minTickets: 4,
    minCartValue: 0,
    description: 'Flat ₹1,000 off on Combo booking for exactly 2 Adults + 2 Children.'
  },
  {
    id: 'BOGO_WATER',
    name: 'Buy 1 Get 1 — Water Park',
    type: 'bogo',
    value: 1,
    parks: ['WATER_DAY'],
    categories: ['adult'],
    status: 'live',
    autoApply: false,
    promoCode: 'BOGO1',
    startDate: null,
    endDate: null,
    flashSale: false,
    maxUses: 200,
    usedCount: 47,
    minTickets: 2,
    minCartValue: 0,
    buyQty: 1,
    getFreeQty: 1,
    description: 'Buy 1 Adult Water Park ticket, get 1 Adult ticket FREE.'
  },
  {
    id: 'B2G1_COMBO',
    name: 'Buy 2 Get 1 — Combo',
    type: 'b2g1',
    value: 1,
    parks: ['COMBO_DAY'],
    categories: ['adult'],
    status: 'live',
    autoApply: false,
    promoCode: 'B2G1COMBO',
    startDate: null,
    endDate: null,
    flashSale: false,
    maxUses: 100,
    usedCount: 12,
    minTickets: 3,
    minCartValue: 0,
    buyQty: 2,
    getFreeQty: 1,
    description: 'Buy 2 Adult Combo tickets, get 1 Adult Combo ticket FREE.'
  },
  {
    id: 'BUY4SAVE',
    name: 'Buy 4 Tickets — 10% Off',
    type: 'buy4_discount',
    value: 10,
    discountMode: 'percent',
    parks: ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'],
    categories: ['adult','child'],
    status: 'live',
    autoApply: true,
    promoCode: null,
    startDate: null,
    endDate: null,
    flashSale: false,
    maxUses: null,
    usedCount: 198,
    minTickets: 4,
    minCartValue: 0,
    description: 'Buy any 4 tickets (Adult/Child) and get 10% off.'
  },
  {
    id: 'WKND15',
    name: 'Weekend Flash — 15% Off',
    type: 'percent',
    value: 15,
    parks: ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'],
    categories: ['adult','child','senior'],
    status: 'live',
    autoApply: true,
    promoCode: null,
    startDate: '2026-04-04',
    endDate: '2026-12-31',
    flashSale: true,
    flashSchedule: { type: 'weekday', days: [5,6,0] },
    maxUses: 500,
    usedCount: 88,
    minTickets: 1,
    minCartValue: 0,
    description: '15% off all parks every Friday-Sunday. Flash sale countdown displayed.'
  }
];

/* ─── BUFFET CONFIG ─── */
const WOW_BUFFET_CONFIG = {
  enabled: true,
  name: 'Park Buffet Meal',
  description: 'All-you-can-eat buffet: Starters + Main Course + Dessert + Soft Drink',
  basePrice: 599,
  discountType: 'flat',
  discountValue: 100,
  maxQtyPerTransaction: 8,
  totalInventory: 200,
  soldCount: 0,
  soldOutThreshold: 200,
  alternativeFnB: [
    { name: 'Food Court — a la carte', location: 'Zone A, Near Water Slides' },
    { name: 'Cafe WOW', location: 'Zone B, Near Roller Coaster' },
    { name: 'Snack Corner', location: 'Main Entrance Plaza' }
  ]
};

/* ─── MAX TICKETS PER TRANSACTION ─── */
const WOW_MAX_TICKETS_DEFAULT = 8;

/* ─── ENGINE ─── */
const WOWOfferEngine = (function() {

  function loadOffers() {
    try {
      var saved = localStorage.getItem('wow_offers_v3');
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return WOW_DEFAULT_OFFERS.map(function(o) { return Object.assign({}, o); });
  }

  function saveOffers(offers) {
    try { localStorage.setItem('wow_offers_v3', JSON.stringify(offers)); } catch(e) {}
  }

  function saveBuffetConfig(cfg) {
    try { localStorage.setItem('wow_buffet_cfg', JSON.stringify(cfg)); } catch(e) {}
  }

  function loadBuffetConfig() {
    try {
      var saved = localStorage.getItem('wow_buffet_cfg');
      if (saved) return Object.assign({}, WOW_BUFFET_CONFIG, JSON.parse(saved));
    } catch(e) {}
    return Object.assign({}, WOW_BUFFET_CONFIG);
  }

  function loadMaxTickets() {
    try {
      var v = localStorage.getItem('wow_max_tickets');
      if (v) return parseInt(v, 10) || WOW_MAX_TICKETS_DEFAULT;
    } catch(e) {}
    return WOW_MAX_TICKETS_DEFAULT;
  }

  function isOfferActive(offer, visitDate) {
    if (offer.status !== 'live') return false;
    var now = new Date();
    var visit = visitDate ? new Date(visitDate) : now;

    if (offer.startDate && new Date(offer.startDate) > now) return false;
    if (offer.endDate   && new Date(offer.endDate + 'T23:59:59') < now) return false;

    if (offer.flashSale && offer.flashSchedule) {
      var sched = offer.flashSchedule;
      if (sched.type === 'weekday') {
        var day = visit.getDay();
        if (sched.days.indexOf(day) === -1) return false;
      }
      if (sched.type === 'hourly') {
        var hr = now.getHours();
        if (hr < sched.fromHour || hr >= sched.toHour) return false;
      }
      if (sched.type === 'duration') {
        var startTs = new Date(sched.startDateTime).getTime();
        var endTs   = startTs + (sched.durationMinutes || 60) * 60000;
        if (Date.now() < startTs || Date.now() > endTs) return false;
      }
    }

    if (offer.maxUses !== null && offer.maxUses !== undefined && offer.usedCount >= offer.maxUses) return false;
    return true;
  }

  function applyOffer(offer, cart) {
    var parkKey    = cart.parkKey;
    var breakdown  = cart.breakdown; // {adult:{qty,unit,line}, child:{...}, ...}

    if (offer.parks.indexOf(parkKey) === -1) return null;

    var eligCats  = offer.categories;
    var eligLines = Object.keys(breakdown)
      .filter(function(cat) { return eligCats.indexOf(cat) !== -1 && breakdown[cat].qty > 0; })
      .map(function(cat) { return [cat, breakdown[cat]]; });

    if (eligLines.length === 0) return null;

    var eligQty = eligLines.reduce(function(s, pair) { return s + pair[1].qty; }, 0);
    if (eligQty < (offer.minTickets || 1)) return null;

    var eligTotal = eligLines.reduce(function(s, pair) { return s + pair[1].line; }, 0);
    if (eligTotal < (offer.minCartValue || 0)) return null;

    var discountAmount = 0;
    var freeTickets    = 0;
    var freeCategory   = null;
    var description    = '';

    if (offer.type === 'percent') {
      discountAmount = Math.round(eligTotal * offer.value / 100);
      description    = offer.value + '% off (' + offer.name + ')';

    } else if (offer.type === 'flat') {
      if (offer.autoApplyRule) {
        var r = offer.autoApplyRule;
        var adultQ = (breakdown.adult  && breakdown.adult.qty)  || 0;
        var childQ = (breakdown.child  && breakdown.child.qty)  || 0;
        if (r.adults   && adultQ < r.adults)   return null;
        if (r.children && childQ < r.children) return null;
      }
      discountAmount = Math.min(offer.value, eligTotal);
      description    = 'Rs.' + offer.value + ' flat off (' + offer.name + ')';

    } else if (offer.type === 'bogo' || offer.type === 'b2g1') {
      var sortedLines = eligLines.slice().sort(function(a,b) { return a[1].unit - b[1].unit; });
      var cheapCat  = sortedLines[0][0];
      var cheapLine = sortedLines[0][1];
      var buyQ  = offer.buyQty   || (offer.type === 'b2g1' ? 2 : 1);
      var getQ  = offer.getFreeQty || 1;
      if (eligQty < buyQ + getQ) return null;
      var freeSets  = Math.floor(eligQty / (buyQ + getQ));
      freeTickets   = Math.min(freeSets * getQ, cheapLine.qty);
      freeCategory  = cheapCat;
      discountAmount = freeTickets * cheapLine.unit;
      description    = 'Buy ' + buyQ + ' Get ' + getQ + ' Free - ' + freeTickets + 'x ticket(s) free (' + offer.name + ')';

    } else if (offer.type === 'buy4_discount') {
      if (eligQty < 4) return null;
      var mode = offer.discountMode || 'percent';
      if (mode === 'percent') {
        discountAmount = Math.round(eligTotal * offer.value / 100);
      } else {
        discountAmount = Math.min(offer.value, eligTotal);
      }
      description = 'Buy 4+ tickets - ' + (mode === 'percent' ? offer.value + '%' : 'Rs.' + offer.value) + ' off (' + offer.name + ')';
    }

    if (discountAmount <= 0) return null;

    return {
      offerId:       offer.id,
      offerName:     offer.name,
      discountAmount: discountAmount,
      freeTickets:   freeTickets,
      freeCategory:  freeCategory,
      description:   description,
      flashSale:     offer.flashSale || false
    };
  }

  function computeBestOffer(cart, visitDate, promoCode) {
    var offers = loadOffers().filter(function(o) { return isOfferActive(o, visitDate); });
    var best   = null;

    offers.forEach(function(offer) {
      var eligible = offer.autoApply || (promoCode && offer.promoCode === promoCode.toUpperCase());
      if (!eligible) return;
      var result = applyOffer(offer, cart);
      if (result && (!best || result.discountAmount > best.discountAmount)) {
        best = result;
      }
    });
    return best;
  }

  function applyPromoCode(promoCode, cart, visitDate) {
    var offers = loadOffers();
    var offer  = null;
    for (var i = 0; i < offers.length; i++) {
      if (offers[i].promoCode === promoCode.toUpperCase() && isOfferActive(offers[i], visitDate)) {
        offer = offers[i];
        break;
      }
    }
    if (!offer) return { error: 'Invalid or expired promo code.' };
    var result = applyOffer(offer, cart);
    if (!result) return { error: 'This promo code is not applicable to your current cart.' };
    return result;
  }

  function getFlashOffers(parkKey, visitDate) {
    return loadOffers().filter(function(o) {
      return o.flashSale && isOfferActive(o, visitDate) &&
        (o.parks.indexOf(parkKey) !== -1 || o.parks.length === 0);
    });
  }

  function getBuffetConfig()        { return loadBuffetConfig(); }

  function buffetEffectivePrice() {
    var cfg = loadBuffetConfig();
    if (cfg.discountType === 'percent') {
      return Math.round(cfg.basePrice * (1 - cfg.discountValue / 100));
    }
    return Math.max(0, cfg.basePrice - cfg.discountValue);
  }

  function buffetIsSoldOut() {
    var cfg = loadBuffetConfig();
    return cfg.soldCount >= cfg.soldOutThreshold;
  }

  function buffetMaxQty() {
    return Math.min(loadMaxTickets(), loadBuffetConfig().maxQtyPerTransaction);
  }

  function getMaxTickets() { return loadMaxTickets(); }

  function adminSaveOffer(offerData) {
    var offers = loadOffers();
    var idx = -1;
    for (var i = 0; i < offers.length; i++) {
      if (offers[i].id === offerData.id) { idx = i; break; }
    }
    if (idx >= 0) {
      offers[idx] = Object.assign({}, offers[idx], offerData);
    } else {
      offers.push(Object.assign({}, offerData, { usedCount: 0 }));
    }
    saveOffers(offers);
    return offers;
  }

  function adminDeleteOffer(id) {
    var offers = loadOffers().filter(function(o) { return o.id !== id; });
    saveOffers(offers);
    return offers;
  }

  function adminSaveBuffet(cfg) {
    var merged = Object.assign({}, loadBuffetConfig(), cfg);
    saveBuffetConfig(merged);
    return merged;
  }

  function adminSetMaxTickets(n) {
    localStorage.setItem('wow_max_tickets', String(n));
  }

  return {
    loadOffers:          loadOffers,
    saveOffers:          saveOffers,
    isOfferActive:       isOfferActive,
    applyOffer:          applyOffer,
    computeBestOffer:    computeBestOffer,
    applyPromoCode:      applyPromoCode,
    getFlashOffers:      getFlashOffers,
    getBuffetConfig:     getBuffetConfig,
    buffetEffectivePrice:buffetEffectivePrice,
    buffetIsSoldOut:     buffetIsSoldOut,
    buffetMaxQty:        buffetMaxQty,
    getMaxTickets:       getMaxTickets,
    adminSaveOffer:      adminSaveOffer,
    adminDeleteOffer:    adminDeleteOffer,
    adminSaveBuffet:     adminSaveBuffet,
    adminSetMaxTickets:  adminSetMaxTickets,
    WOW_MAX_TICKETS_DEFAULT: WOW_MAX_TICKETS_DEFAULT
  };
})();

window.WOWOfferEngine = WOWOfferEngine;
