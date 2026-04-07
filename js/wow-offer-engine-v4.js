// =============================================================================
//  WOW OFFER ENGINE v4.0 — Revenue-Optimization / Pricing-Intelligence /
//  Promotion-Orchestration / Cart-Rule Decision Engine
//  Worlds of Wonder — Enterprise Commerce Engine
//  © 2026 Worlds of Wonder, Noida. All rights reserved.
// =============================================================================
'use strict';

const WOWOfferEngine = (function () {

  // ===========================================================================
  // §1  STORAGE KEYS & CONSTANTS
  // ===========================================================================
  const SK = {
    OFFERS     : 'wow_offers_v4',
    AUDIT      : 'wow_offer_audit',
    EXEC_LOG   : 'wow_exec_log',
    AB_ASSIGN  : 'wow_ab_assignments',
    SIM_HISTORY: 'wow_sim_history',
    USAGE      : 'wow_usage_v4',
    BUDGET     : 'wow_budget_v4',
    VERSION    : 'wow_offer_versions',
  };

  const MAX_AUDIT    = 500;
  const MAX_EXEC_LOG = 2000;
  const MAX_SIM_HIST = 100;
  const TZ           = 'Asia/Kolkata';

  // Offer lifecycle states
  const STATUS = {
    DRAFT     : 'draft',
    SCHEDULED : 'scheduled',
    ACTIVE    : 'active',
    PAUSED    : 'paused',
    EXPIRED   : 'expired',
    ARCHIVED  : 'archived',
    FAILED    : 'failed',
    SUPERSEDED: 'superseded',
  };

  // Discount action types
  const ACTION_TYPE = {
    PERCENT        : 'percent',
    FLAT           : 'flat',
    PER_TICKET     : 'per_ticket',
    FREE_TICKETS   : 'free_tickets',
    SLAB_PERCENT   : 'slab_percent',
    SLAB_FLAT      : 'slab_flat',
    CREDIT         : 'credit',
    FNB_CREDIT     : 'fnb_credit',
    FEE_WAIVER     : 'fee_waiver',
    PRICE_OVERRIDE : 'price_override',
    PERCENT_CAP    : 'percent_cap',
    HYBRID         : 'hybrid',
  };

  // Condition field types
  const COND_TYPE = {
    PARK           : 'park',
    CATEGORY       : 'category',
    QTY_TOTAL      : 'qty_total',
    QTY_CATEGORY   : 'qty_category',
    QTY_MIX        : 'qty_mix',
    CART_VALUE     : 'cart_value',
    PROMO_CODE     : 'promo_code',
    DATE_RANGE     : 'date_range',
    DAY_OF_WEEK    : 'day_of_week',
    HOUR_RANGE     : 'hour_range',
    VISIT_DATE     : 'visit_date',
    CHANNEL        : 'channel',
    SEGMENT        : 'segment',
    FIRST_BOOKING  : 'first_booking',
    BOOKING_COUNT  : 'booking_count',
    AB_VARIANT     : 'ab_variant',
    COUPON_CODE    : 'coupon_code',
    INVENTORY      : 'inventory',
    DEMAND_LEVEL   : 'demand_level',
    CROSS_CATEGORY : 'cross_category',
    SPEND_THRESHOLD: 'spend_threshold',
    PRESENCE       : 'presence',
  };

  // Stacking modes
  const STACK = {
    STACKABLE  : 'stackable',
    EXCLUSIVE  : 'exclusive',
    BEST_ONLY  : 'best_only',
    FAMILY_ONLY: 'family_only',
  };

  // Scope of discount application
  const SCOPE = {
    CART      : 'cart',
    LINE_ITEM : 'line_item',
    CATEGORY  : 'category',
    CROSS_CART: 'cross_cart',
  };

  // ===========================================================================
  // §2  DEFAULT OFFER LIBRARY
  // ===========================================================================
  const DEFAULT_OFFERS = [
    {
      id: 'WOE4_SUMMER20', version: 1, status: STATUS.ACTIVE,
      name: 'Summer Splash 20% Off',
      description: '20% off Water Park tickets for Adults & Children. Auto-applied, no code needed.',
      tags: ['seasonal','summer','water'],
      channel: ['web','app','kiosk'],
      segment: ['all'],
      priority: 80,
      stackMode: STACK.STACKABLE,
      stackFamily: 'seasonal',
      autoApply: true, promoCode: null,
      schedule: {
        startDate: '2026-04-01', endDate: '2026-06-30',
        recurringDays: null, hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.PARK,     op: 'in',  value: ['WATER_DAY'] },
            { id: 'c2', type: COND_TYPE.CATEGORY, op: 'any', value: ['adult','child'] },
            { id: 'c3', type: COND_TYPE.QTY_TOTAL,op: 'gte', value: 1 },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.PERCENT, scope: SCOPE.CATEGORY,
          scopeCategories: ['adult','child'], value: 20, cap: null,
          label: '20% Off — Summer Splash',
        }
      ],
      usageLimits: { global: 5000, perUser: null, perDay: null, budget: null },
      usedCount: 842, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : '🌊 Summer Splash! 20% off Water Park — applied automatically!',
        appliedMsg : '✅ Summer Splash 20% Off applied — saving {savings}!',
        expiredMsg : 'Summer Splash offer has ended.',
        savingsBadge: 'Summer Deal',
      },
      terms: 'Valid on Water Park tickets for Adult & Child categories.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
    {
      id: 'WOE4_FAMILY4', version: 1, status: STATUS.ACTIVE,
      name: 'Family of 4 — Rs.1,000 Off',
      description: 'Flat Rs.1,000 off on Combo when cart has at least 2 Adults and 2 Children.',
      tags: ['family','combo','auto'],
      channel: ['web','app','kiosk'],
      segment: ['all'],
      priority: 75,
      stackMode: STACK.BEST_ONLY,
      stackFamily: 'family',
      autoApply: true, promoCode: null,
      schedule: {
        startDate: null, endDate: null,
        recurringDays: null, hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.PARK,         op: 'in',  value: ['COMBO_DAY'] },
            { id: 'c2', type: COND_TYPE.QTY_CATEGORY, op: 'gte', value: 2, meta: { cat: 'adult' } },
            { id: 'c3', type: COND_TYPE.QTY_CATEGORY, op: 'gte', value: 2, meta: { cat: 'child' } },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.FLAT, scope: SCOPE.CART,
          value: 1000, cap: null,
          label: 'Rs.1,000 Off — Family of 4',
        }
      ],
      usageLimits: { global: null, perUser: null, perDay: null, budget: null },
      usedCount: 321, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : 'Family deal unlocked! Rs.1,000 off your Combo booking!',
        appliedMsg : 'Family of 4 Rs.1,000 Off applied!',
        expiredMsg : '',
        savingsBadge: 'Family Deal',
      },
      terms: 'Requires minimum 2 Adults + 2 Children on Combo tickets.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
    {
      id: 'WOE4_BOGO_WATER', version: 1, status: STATUS.ACTIVE,
      name: 'Buy 1 Get 1 — Water Park Adult',
      description: 'Buy 1 Adult Water Park ticket, get 1 Adult ticket FREE.',
      tags: ['bogo','water','coupon'],
      channel: ['web','app'],
      segment: ['all'],
      priority: 90,
      stackMode: STACK.EXCLUSIVE,
      stackFamily: 'bogo',
      autoApply: false, promoCode: 'BOGO1',
      schedule: {
        startDate: null, endDate: null,
        recurringDays: null, hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.PARK,         op: 'in',  value: ['WATER_DAY'] },
            { id: 'c2', type: COND_TYPE.QTY_CATEGORY, op: 'gte', value: 2, meta: { cat: 'adult' } },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.FREE_TICKETS, scope: SCOPE.LINE_ITEM,
          scopeCategories: ['adult'], buyQty: 1, getFreeQty: 1,
          freeFromCheapest: true,
          label: 'Buy 1 Get 1 Free — Adult Water Park',
        }
      ],
      usageLimits: { global: 200, perUser: 1, perDay: null, budget: null },
      usedCount: 47, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : 'BOGO unlocked! 1 FREE Adult ticket — code BOGO1',
        appliedMsg : 'BOGO1 applied — 1 Adult ticket FREE! Saving {savings}.',
        expiredMsg : 'BOGO code has been used up.',
        savingsBadge: 'BOGO Deal',
      },
      terms: 'Code BOGO1. Min 2 Adult Water Park tickets. 1 free ticket per transaction. Limited to 200 uses.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
    {
      id: 'WOE4_BUY4', version: 1, status: STATUS.ACTIVE,
      name: 'Buy 4 Tickets — 10% Off',
      description: 'Any 4+ Adult/Child tickets across any park — 10% off automatically.',
      tags: ['group','auto','quantity'],
      channel: ['web','app','kiosk'],
      segment: ['all'],
      priority: 70,
      stackMode: STACK.STACKABLE,
      stackFamily: 'quantity',
      autoApply: true, promoCode: null,
      schedule: {
        startDate: null, endDate: null,
        recurringDays: null, hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.PARK,     op: 'in',  value: ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'] },
            { id: 'c2', type: COND_TYPE.QTY_TOTAL,op: 'gte', value: 4 },
            { id: 'c3', type: COND_TYPE.CATEGORY, op: 'any', value: ['adult','child'] },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.PERCENT, scope: SCOPE.CATEGORY,
          scopeCategories: ['adult','child'], value: 10, cap: null,
          label: '10% Off — Buy 4+',
        }
      ],
      usageLimits: { global: null, perUser: null, perDay: null, budget: null },
      usedCount: 198, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : 'Group discount! 10% off for 4+ tickets.',
        appliedMsg : 'Buy 4 discount applied — saving {savings}!',
        expiredMsg : '',
        savingsBadge: 'Group Saving',
      },
      terms: 'Auto-applied for 4+ Adult or Child tickets in a single transaction.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
    {
      id: 'WOE4_WKND_FLASH', version: 1, status: STATUS.ACTIVE,
      name: 'Weekend Flash — 15% Off',
      description: '15% off all parks every Friday to Sunday for Adults, Children, Seniors.',
      tags: ['flash','weekend','auto'],
      channel: ['web','app'],
      segment: ['all'],
      priority: 85,
      stackMode: STACK.STACKABLE,
      stackFamily: 'flash',
      autoApply: true, promoCode: null,
      schedule: {
        startDate: '2026-04-04', endDate: '2026-12-31',
        recurringDays: [5,6,0], hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.PARK,       op: 'in', value: ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'] },
            { id: 'c2', type: COND_TYPE.CATEGORY,   op: 'any',value: ['adult','child','senior'] },
            { id: 'c3', type: COND_TYPE.DAY_OF_WEEK,op: 'in', value: [5,6,0] },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.PERCENT, scope: SCOPE.CATEGORY,
          scopeCategories: ['adult','child','senior'], value: 15, cap: null,
          label: '15% Weekend Flash',
        }
      ],
      usageLimits: { global: 500, perUser: null, perDay: null, budget: null },
      usedCount: 88, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : 'Weekend Flash! 15% off — live now!',
        appliedMsg : 'Weekend Flash 15% Off applied — saving {savings}!',
        expiredMsg : 'Weekend Flash has ended.',
        savingsBadge: 'Flash Sale',
      },
      terms: 'Valid Fri to Sun only. Max 500 redemptions total.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
    {
      id: 'WOE4_SLAB_TIER', version: 1, status: STATUS.ACTIVE,
      name: 'Slab Discount — Qty Tiers',
      description: '5% for 2-3 tickets, 10% for 4-7, 15% for 8+. Auto-applied, all categories.',
      tags: ['slab','auto','quantity','tiered'],
      channel: ['web','app','kiosk'],
      segment: ['all'],
      priority: 65,
      stackMode: STACK.BEST_ONLY,
      stackFamily: 'slab',
      autoApply: true, promoCode: null,
      schedule: {
        startDate: null, endDate: null,
        recurringDays: null, hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.QTY_TOTAL, op: 'gte', value: 2 },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.SLAB_PERCENT, scope: SCOPE.CART,
          slabs: [
            { minQty: 2, maxQty: 3,    percent: 5  },
            { minQty: 4, maxQty: 7,    percent: 10 },
            { minQty: 8, maxQty: null, percent: 15 },
          ],
          label: 'Slab Discount',
        }
      ],
      usageLimits: { global: null, perUser: null, perDay: null, budget: null },
      usedCount: 0, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : 'Group discount unlocked! Add more for bigger savings.',
        appliedMsg : 'Slab discount applied — saving {savings}!',
        expiredMsg : '',
        savingsBadge: 'Volume Saving',
      },
      terms: 'Auto-applied based on total ticket count.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
    {
      id: 'WOE4_PARTNER_CORP', version: 1, status: STATUS.ACTIVE,
      name: 'Corporate Partner — 18% Off',
      description: 'Exclusive 18% off for corporate partners using code CORP2026.',
      tags: ['corporate','partner','coupon'],
      channel: ['web','app'],
      segment: ['corporate'],
      priority: 95,
      stackMode: STACK.EXCLUSIVE,
      stackFamily: 'partner',
      autoApply: false, promoCode: 'CORP2026',
      schedule: {
        startDate: '2026-01-01', endDate: '2026-12-31',
        recurringDays: null, hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.PARK,       op: 'in', value: ['WATER_DAY','AMUSEMENT_DAY','COMBO_DAY'] },
            { id: 'c2', type: COND_TYPE.COUPON_CODE, op: 'eq', value: 'CORP2026' },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.PERCENT_CAP, scope: SCOPE.CART,
          value: 18, cap: 5000,
          label: '18% Corporate Discount (max Rs.5,000)',
        }
      ],
      usageLimits: { global: 1000, perUser: 5, perDay: null, budget: 500000 },
      usedCount: 0, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : 'Corporate discount activated — 18% off!',
        appliedMsg : 'CORP2026 applied — 18% corporate discount! Saving {savings}.',
        expiredMsg : 'Corporate code has expired or reached its limit.',
        savingsBadge: 'Corporate Rate',
      },
      terms: 'Code CORP2026. Valid for corporate bookings only. Max Rs.5,000 discount per transaction.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
    {
      id: 'WOE4_FNB_CREDIT', version: 1, status: STATUS.ACTIVE,
      name: 'F&B Credit — Rs.200 on Buffet',
      description: 'Rs.200 F&B credit when cart value exceeds Rs.5,000. Applied to buffet.',
      tags: ['fnb','auto','cart_value'],
      channel: ['web','app','kiosk'],
      segment: ['all'],
      priority: 60,
      stackMode: STACK.STACKABLE,
      stackFamily: 'fnb',
      autoApply: true, promoCode: null,
      schedule: {
        startDate: null, endDate: null,
        recurringDays: null, hourStart: null, hourEnd: null,
        blackoutDates: [], timezone: TZ,
      },
      conditionGroups: [
        {
          id: 'cg1', op: 'AND', conditions: [
            { id: 'c1', type: COND_TYPE.CART_VALUE, op: 'gte', value: 5000 },
          ]
        }
      ],
      actions: [
        {
          id: 'a1', type: ACTION_TYPE.FNB_CREDIT, scope: SCOPE.CART,
          value: 200, cap: null,
          label: 'Rs.200 F&B Credit',
        }
      ],
      usageLimits: { global: null, perUser: null, perDay: null, budget: null },
      usedCount: 0, usedBudget: 0,
      abTest: null,
      messaging: {
        unlockMsg  : 'Rs.200 F&B credit added to your cart!',
        appliedMsg : 'Rs.200 F&B Credit applied!',
        expiredMsg : '',
        savingsBadge: 'F&B Credit',
      },
      terms: 'Auto-applied for cart value Rs.5,000 or above. Applied towards Buffet add-on.',
      createdAt: Date.now(), updatedAt: Date.now(), createdBy: 'system',
    },
  ];

  // ===========================================================================
  // §3  STORAGE HELPERS
  // ===========================================================================
  function _ls(key) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (_) { return null; }
  }
  function _lsSave(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch (_) { return false; }
  }

  // ===========================================================================
  // §3b  V3 → V4 SCHEMA BRIDGE
  //  The admin/offers.html panel saves offers in a legacy v3 shape:
  //   { type, parks, categories, value, status:'live'/'draft', autoApply,
  //     promoCode, startDate, endDate, minTickets, minCartValue, buyQty,
  //     getFreeQty, flashSchedule, autoApplyRule, discountMode, … }
  //  This bridge converts them to the v4 conditionGroups/actions shape so
  //  the evaluation engine can process them alongside built-in v4 offers.
  // ===========================================================================
  function _v3ToV4(o) {
    // Already v4 — has conditionGroups array
    if (o.conditionGroups && Array.isArray(o.conditionGroups)) return o;

    // ── Build conditions ──────────────────────────────────────────────────
    var conditions = [];
    var cIdx = 1;

    // Park condition
    var parks = Array.isArray(o.parks) ? o.parks : [];
    if (parks.length > 0) {
      conditions.push({ id: 'c' + (cIdx++), type: COND_TYPE.PARK, op: 'in', value: parks });
    }

    // Category condition
    var cats = Array.isArray(o.categories) ? o.categories : [];
    if (cats.length > 0) {
      conditions.push({ id: 'c' + (cIdx++), type: COND_TYPE.CATEGORY, op: 'any', value: cats });
    }

    // Min tickets
    var minTix = parseInt(o.minTickets) || 1;
    if (minTix > 1) {
      conditions.push({ id: 'c' + (cIdx++), type: COND_TYPE.QTY_TOTAL, op: 'gte', value: minTix });
    } else {
      conditions.push({ id: 'c' + (cIdx++), type: COND_TYPE.QTY_TOTAL, op: 'gte', value: 1 });
    }

    // Min cart value
    if (o.minCartValue && o.minCartValue > 0) {
      conditions.push({ id: 'c' + (cIdx++), type: COND_TYPE.CART_VALUE, op: 'gte', value: o.minCartValue });
    }

    // Auto-apply family rule (minAdults + minChildren mix)
    if (o.autoApplyRule && (o.autoApplyRule.adults > 0 || o.autoApplyRule.children > 0)) {
      if (o.autoApplyRule.adults > 0) {
        conditions.push({ id: 'c' + (cIdx++), type: COND_TYPE.QTY_CATEGORY, op: 'gte', value: o.autoApplyRule.adults, meta: { cat: 'adult' } });
      }
      if (o.autoApplyRule.children > 0) {
        conditions.push({ id: 'c' + (cIdx++), type: COND_TYPE.QTY_CATEGORY, op: 'gte', value: o.autoApplyRule.children, meta: { cat: 'child' } });
      }
    }

    // Flash sale — weekday schedule condition
    var schedule = {
      startDate: o.startDate || null,
      endDate:   o.endDate   || null,
      recurringDays: null,
      hourStart: null,
      hourEnd:   null,
      blackoutDates: [],
      timezone: TZ,
    };

    if (o.flashSale && o.flashSchedule) {
      var fs = o.flashSchedule;
      if (fs.type === 'weekday' && Array.isArray(fs.days)) {
        schedule.recurringDays = fs.days;
      } else if (fs.type === 'hourly') {
        schedule.hourStart = fs.fromHour || 0;
        schedule.hourEnd   = fs.toHour   || 23;
      } else if (fs.type === 'duration' && fs.startDateTime) {
        var start = new Date(fs.startDateTime);
        var end   = fs.durationMinutes ? new Date(start.getTime() + fs.durationMinutes * 60000) : null;
        if (!isNaN(start.getTime())) schedule.startDate = start.toISOString().slice(0,10);
        if (end && !isNaN(end.getTime())) schedule.endDate = end.toISOString().slice(0,10);
      } else if (fs.type === 'daily') {
        schedule.hourStart = fs.dailyStart ? parseInt(fs.dailyStart.split(':')[0]) : 0;
        schedule.hourEnd   = fs.dailyEnd   ? parseInt(fs.dailyEnd.split(':')[0])   : 23;
      }
    }

    // ── Build actions ──────────────────────────────────────────────────────
    var actions = [];
    var type = o.type || 'percent';
    var val  = parseFloat(o.value) || 0;
    var scopeCats = cats.length > 0 ? cats : null;

    if (type === 'percent' || type === 'flash_sale') {
      actions.push({
        id: 'a1',
        type: ACTION_TYPE.PERCENT,
        scope: scopeCats ? SCOPE.CATEGORY : SCOPE.CART,
        scopeCategories: scopeCats,
        value: val, cap: null,
        label: val + '% Off',
      });
    } else if (type === 'flat') {
      var useFlat = o.discountMode === 'flat' ? ACTION_TYPE.FLAT : ACTION_TYPE.FLAT;
      actions.push({
        id: 'a1',
        type: ACTION_TYPE.FLAT,
        scope: SCOPE.CART,
        value: val, cap: null,
        label: '₹' + val + ' Off',
      });
    } else if (type === 'bogo' || type === 'b2g1') {
      actions.push({
        id: 'a1',
        type: ACTION_TYPE.FREE_TICKETS,
        scope: SCOPE.LINE_ITEM,
        scopeCategories: scopeCats || ['adult'],
        buyQty: parseInt(o.buyQty) || 1,
        getFreeQty: parseInt(o.getFreeQty) || 1,
        freeFromCheapest: true,
        label: 'Buy ' + (o.buyQty||1) + ' Get ' + (o.getFreeQty||1) + ' Free',
      });
    } else if (type === 'buy4_discount') {
      var discMode = o.discountMode === 'flat' ? ACTION_TYPE.FLAT : ACTION_TYPE.PERCENT;
      actions.push({
        id: 'a1',
        type: discMode,
        scope: scopeCats ? SCOPE.CATEGORY : SCOPE.CART,
        scopeCategories: scopeCats,
        value: val, cap: null,
        label: 'Buy 4+ Discount: ' + val + (o.discountMode === 'flat' ? ' ₹' : '%') + ' off',
      });
    } else {
      // Fallback: treat as percent
      actions.push({
        id: 'a1',
        type: ACTION_TYPE.PERCENT,
        scope: SCOPE.CART,
        value: val, cap: null,
        label: val + '% Off',
      });
    }

    // ── Map v3 status to v4 status ────────────────────────────────────────
    var v4status = STATUS.ACTIVE;
    if (o.status === 'draft')     v4status = STATUS.DRAFT;
    if (o.status === 'scheduled') v4status = STATUS.SCHEDULED;
    if (o.status === 'expired')   v4status = STATUS.EXPIRED;
    if (o.status === 'paused')    v4status = STATUS.PAUSED;
    // 'live' → ACTIVE (default above)

    return {
      // Preserve original v3 id and fields so admin panel can still read them
      _v3: true,
      id:           o.id,
      version:      o.version || 1,
      status:       v4status,
      name:         o.name,
      description:  o.description || '',
      tags:         o.tags || [],
      channel:      ['web','app','kiosk'],
      segment:      ['all'],
      priority:     o.priority || 50,
      stackMode:    STACK.STACKABLE,
      stackFamily:  o.type || 'misc',
      autoApply:    !!o.autoApply,
      promoCode:    o.promoCode || null,
      schedule:     schedule,
      conditionGroups: conditions.length > 0
        ? [{ id: 'cg1', op: 'AND', conditions: conditions }]
        : [],
      actions:      actions,
      usageLimits:  {
        global:  o.maxUses   || null,
        perUser: null,
        perDay:  null,
        budget:  null,
      },
      usedCount:    o.usedCount  || 0,
      usedBudget:   0,
      abTest:       null,
      messaging: {
        unlockMsg  : o.name + ' offer applied!',
        appliedMsg : o.name + ' applied — saving {savings}!',
        expiredMsg : o.name + ' offer is no longer available.',
        savingsBadge: o.name,
      },
      terms:       o.terms || '',
      createdAt:   o.createdAt   || Date.now(),
      updatedAt:   o.updatedAt   || Date.now(),
      createdBy:   o.createdBy   || 'admin',
      // Keep v3 raw fields for admin panel round-trip
      _v3raw: o,
    };
  }

  // loadRawOffers: returns the raw stored array (v3 or v4 native, no translation)
  // Used by admin/offers.html to read and edit offers in their original form.
  function loadRawOffers() {
    var saved = _ls(SK.OFFERS);
    if (saved && Array.isArray(saved) && saved.length) return saved;
    var defaults = DEFAULT_OFFERS.map(function(o) { return JSON.parse(JSON.stringify(o)); });
    _lsSave(SK.OFFERS, defaults);
    return defaults;
  }

  // loadOffers: returns v4-evaluated offers (translates v3 on the fly for engine use)
  function loadOffers() {
    return loadRawOffers().map(_v3ToV4);
  }

  function saveOffers(offers) { _lsSave(SK.OFFERS, offers); }
  function loadUsage()  { return _ls(SK.USAGE)  || {}; }
  function saveUsage(u) { _lsSave(SK.USAGE, u); }
  function loadBudget() { return _ls(SK.BUDGET) || {}; }
  function saveBudget(b){ _lsSave(SK.BUDGET, b); }
  function loadVersions(){ return _ls(SK.VERSION) || {}; }
  function saveVersions(v){ _lsSave(SK.VERSION, v); }

  // ===========================================================================
  // §4  AUDIT LOG
  // ===========================================================================
  var AuditLog = (function() {
    function write(action, meta) {
      var logs = _ls(SK.AUDIT) || [];
      logs.unshift({
        id    : 'AL_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        ts    : Date.now(),
        action: action,
        meta  : meta || {},
        user  : _getCurrentUser(),
      });
      if (logs.length > MAX_AUDIT) logs.length = MAX_AUDIT;
      _lsSave(SK.AUDIT, logs);
    }
    function read(filters) {
      var logs = _ls(SK.AUDIT) || [];
      if (filters && filters.offerId) logs = logs.filter(function(l) { return l.meta && l.meta.offerId === filters.offerId; });
      if (filters && filters.action)  logs = logs.filter(function(l) { return l.action === filters.action; });
      if (filters && filters.limit)   logs = logs.slice(0, filters.limit);
      return logs;
    }
    return { write: write, read: read };
  })();

  function _getCurrentUser() {
    try {
      var s = localStorage.getItem('wow_auth_session');
      if (s) { var p = JSON.parse(s); return p.email || 'admin'; }
    } catch (_) {}
    return 'admin';
  }

  function _writeExecLog(entry) {
    var logs = _ls(SK.EXEC_LOG) || [];
    logs.unshift(entry);
    if (logs.length > MAX_EXEC_LOG) logs.length = MAX_EXEC_LOG;
    _lsSave(SK.EXEC_LOG, logs);
  }
  function readExecLog(filters) {
    var logs = _ls(SK.EXEC_LOG) || [];
    if (filters && filters.offerId) logs = logs.filter(function(l) {
      return l.appliedOffers && l.appliedOffers.some(function(a) { return a.offerId === filters.offerId; });
    });
    if (filters && filters.limit)   logs = logs.slice(0, filters.limit);
    return logs;
  }

  // ===========================================================================
  // §5  SCHEDULE CHECKER
  // ===========================================================================
  function _nowIST() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: TZ }));
  }

  function _isScheduleActive(schedule, visitDateStr) {
    if (!schedule) return true;
    var now   = _nowIST();
    var today = now.toISOString().slice(0, 10);
    var check = visitDateStr || today;

    if (schedule.startDate && check < schedule.startDate) return false;
    if (schedule.endDate   && check > schedule.endDate)   return false;
    if (schedule.blackoutDates && schedule.blackoutDates.indexOf(check) !== -1) return false;

    if (schedule.recurringDays && schedule.recurringDays.length) {
      var visitDay = visitDateStr
        ? new Date(visitDateStr + 'T00:00:00').getDay()
        : now.getDay();
      if (schedule.recurringDays.indexOf(visitDay) === -1) return false;
    }

    if (schedule.hourStart !== null && schedule.hourStart !== undefined) {
      var hr   = now.getHours();
      var hEnd = (schedule.hourEnd !== null && schedule.hourEnd !== undefined) ? schedule.hourEnd : 24;
      if (hr < schedule.hourStart || hr >= hEnd) return false;
    }
    return true;
  }

  // ===========================================================================
  // §6  USAGE & BUDGET CHECKER
  // ===========================================================================
  function _checkUsage(offer, userId) {
    var usage  = loadUsage();
    var budget = loadBudget();
    var limits = offer.usageLimits || {};

    if (limits.global !== null && limits.global !== undefined) {
      if ((offer.usedCount || 0) >= limits.global)
        return { ok: false, reason: 'Global usage limit reached' };
    }
    if (limits.perUser !== null && limits.perUser !== undefined && userId) {
      var key = offer.id + '_u_' + userId;
      if ((usage[key] || 0) >= limits.perUser)
        return { ok: false, reason: 'Per-user limit reached' };
    }
    if (limits.perDay !== null && limits.perDay !== undefined) {
      var dayKey = offer.id + '_d_' + _nowIST().toISOString().slice(0, 10);
      if ((usage[dayKey] || 0) >= limits.perDay)
        return { ok: false, reason: 'Daily limit reached' };
    }
    if (limits.budget !== null && limits.budget !== undefined) {
      if ((budget[offer.id] || 0) >= limits.budget)
        return { ok: false, reason: 'Budget cap reached' };
    }
    return { ok: true };
  }

  function _incrementUsage(offer, userId, discountAmount) {
    var usage  = loadUsage();
    var budget = loadBudget();
    if (userId) {
      var key = offer.id + '_u_' + userId;
      usage[key] = (usage[key] || 0) + 1;
    }
    var dayKey = offer.id + '_d_' + _nowIST().toISOString().slice(0, 10);
    usage[dayKey] = (usage[dayKey] || 0) + 1;
    saveUsage(usage);
    budget[offer.id] = (budget[offer.id] || 0) + discountAmount;
    saveBudget(budget);
  }

  // ===========================================================================
  // §7  CONDITION EVALUATOR
  // ===========================================================================
  function _opCheck(actual, op, expected) {
    switch (op) {
      case 'eq'     : return actual === expected;
      case 'neq'    : return actual !== expected;
      case 'gt'     : return actual >   expected;
      case 'gte'    : return actual >=  expected;
      case 'lt'     : return actual <   expected;
      case 'lte'    : return actual <=  expected;
      case 'in'     : return Array.isArray(expected) ? expected.indexOf(actual) !== -1 : actual === expected;
      case 'nin'    : return Array.isArray(expected) ? expected.indexOf(actual) === -1 : actual !== expected;
      case 'between': return actual >= expected[0] && actual <= expected[1];
      default       : return false;
    }
  }

  function _evalCondition(cond, ctx) {
    var cart        = ctx.cart;
    var visitDateStr= ctx.visitDateStr;
    var promoCode   = ctx.promoCode;
    var channel     = ctx.channel;
    var segment     = ctx.segment;
    var userId      = ctx.userId;
    var now         = ctx.now;
    var type        = cond.type;
    var op          = cond.op;
    var value       = cond.value;
    var meta        = cond.meta || {};
    var bd          = cart.breakdown || {};

    switch (type) {
      case COND_TYPE.PARK:
        return _opCheck(cart.parkKey, op, value);

      case COND_TYPE.CATEGORY: {
        var cats = Object.keys(bd).filter(function(k) { return (bd[k] || {}).qty > 0; });
        if (op === 'any')   return value.some(function(v) { return cats.indexOf(v) !== -1; });
        if (op === 'all')   return value.every(function(v) { return cats.indexOf(v) !== -1; });
        if (op === 'none')  return !value.some(function(v) { return cats.indexOf(v) !== -1; });
        if (op === 'exact') return value.length === cats.length && value.every(function(v) { return cats.indexOf(v) !== -1; });
        return false;
      }

      case COND_TYPE.QTY_TOTAL:
        return _opCheck(cart.qty, op, value);

      case COND_TYPE.QTY_CATEGORY: {
        var qCat = meta.cat;
        var qQty = qCat ? ((bd[qCat] || {}).qty || 0) : 0;
        return _opCheck(qQty, op, value);
      }

      case COND_TYPE.QTY_MIX: {
        if (!Array.isArray(value)) return false;
        return value.every(function(rule) {
          var q = ((bd[rule.cat] || {}).qty || 0);
          return _opCheck(q, rule.op, rule.qty);
        });
      }

      case COND_TYPE.CART_VALUE:
        return _opCheck(cart.subtotal, op, value);

      case COND_TYPE.SPEND_THRESHOLD: {
        var spCat   = meta.cat;
        var spTotal = spCat ? ((bd[spCat] || {}).line || 0) : cart.subtotal;
        return _opCheck(spTotal, op, value);
      }

      case COND_TYPE.PROMO_CODE:
      case COND_TYPE.COUPON_CODE:
        if (!promoCode) return false;
        if (op === 'eq') return promoCode.toUpperCase() === String(value).toUpperCase();
        if (op === 'in') {
          var codes = Array.isArray(value) ? value : [value];
          return codes.map(function(v) { return v.toUpperCase(); }).indexOf(promoCode.toUpperCase()) !== -1;
        }
        return false;

      case COND_TYPE.DATE_RANGE:
        return visitDateStr ? (visitDateStr >= value[0] && visitDateStr <= value[1]) : true;

      case COND_TYPE.VISIT_DATE:
        return visitDateStr ? _opCheck(visitDateStr, op, value) : false;

      case COND_TYPE.DAY_OF_WEEK: {
        var day = visitDateStr
          ? new Date(visitDateStr + 'T00:00:00').getDay()
          : (now || new Date()).getDay();
        var days = Array.isArray(value) ? value : [value];
        if (op === 'in') return days.indexOf(day) !== -1;
        if (op === 'eq') return day === value;
        return false;
      }

      case COND_TYPE.HOUR_RANGE: {
        var hr = (now || new Date()).getHours();
        return hr >= value[0] && hr < value[1];
      }

      case COND_TYPE.CHANNEL:
        if (!channel) return true;
        if (op === 'in') {
          var chs = Array.isArray(value) ? value : [value];
          return chs.indexOf(channel) !== -1;
        }
        return channel === value;

      case COND_TYPE.SEGMENT:
        if (!segment) return true;
        if (op === 'in') {
          var segs = Array.isArray(value) ? value : [value];
          var userSegs = Array.isArray(segment) ? segment : [segment];
          return segs.some(function(s) { return userSegs.indexOf(s) !== -1; });
        }
        if (op === 'any') {
          var segs2 = Array.isArray(value) ? value : [value];
          var userSegs2 = Array.isArray(segment) ? segment : [segment];
          return segs2.some(function(s) { return userSegs2.indexOf(s) !== -1; });
        }
        return segment === value;

      case COND_TYPE.FIRST_BOOKING:
        if (!userId) return false;
        return readExecLog({ limit: 9999 }).every(function(l) { return l.userId !== userId; });

      case COND_TYPE.BOOKING_COUNT: {
        var count = readExecLog({ limit: 9999 }).filter(function(l) { return l.userId === userId; }).length;
        return _opCheck(count, op, value);
      }

      case COND_TYPE.AB_VARIANT: {
        var assignments = _ls(SK.AB_ASSIGN) || {};
        var variantId   = assignments[userId + '_' + (meta.testId || '')];
        return variantId === value;
      }

      case COND_TYPE.PRESENCE: {
        var pCat = meta.cat;
        var pQty = pCat ? ((bd[pCat] || {}).qty || 0) : 0;
        return op === 'present' ? pQty > 0 : pQty === 0;
      }

      case COND_TYPE.CROSS_CATEGORY: {
        var c1 = ((bd[value.cat1] || {}).qty || 0);
        var c2 = ((bd[value.cat2] || {}).qty || 0);
        return c1 > 0 && c2 > 0;
      }

      default:
        return true;
    }
  }

  function _evalGroup(group, ctx) {
    var op = group.op;
    var conditions = group.conditions || [];
    var negated    = group.negated || false;
    var result;
    if (op === 'AND')     result = conditions.every(function(c) { return _evalCondition(c, ctx); });
    else if (op === 'OR') result = conditions.some(function(c)  { return _evalCondition(c, ctx); });
    else if (op === 'NOT')result = !conditions.every(function(c){ return _evalCondition(c, ctx); });
    else result = true;
    return negated ? !result : result;
  }

  function _offerQualifies(offer, ctx) {
    if (!offer.conditionGroups || !offer.conditionGroups.length) return true;
    return offer.conditionGroups.every(function(group) { return _evalGroup(group, ctx); });
  }

  // ===========================================================================
  // §8  ACTION EXECUTOR
  // ===========================================================================
  function _executeAction(action, offer, cart) {
    var type            = action.type;
    var scope           = action.scope;
    var scopeCategories = action.scopeCategories;
    var value           = action.value;
    var cap             = action.cap;
    var slabs           = action.slabs;
    var bd              = cart.breakdown || {};

    var eligibleCats = (scope === SCOPE.CATEGORY && scopeCategories)
      ? scopeCategories.filter(function(c) { return bd[c] && bd[c].qty > 0; })
      : Object.keys(bd).filter(function(c) { return bd[c] && bd[c].qty > 0; });

    var eligibleSubtotal = eligibleCats.reduce(function(s, c) { return s + (bd[c] ? bd[c].line : 0); }, 0);
    var cartSubtotal     = cart.subtotal;

    var discount = 0, freeTickets = 0, freeCategory = null;
    var creditAmount = 0, fnbCredit = 0, feeWaiver = false;
    var lineBreakdown = {};

    switch (type) {
      case ACTION_TYPE.PERCENT: {
        var base = scope === SCOPE.CART ? cartSubtotal : eligibleSubtotal;
        discount = Math.round(base * value / 100);
        if (cap) discount = Math.min(discount, cap);
        eligibleCats.forEach(function(c) {
          if (!bd[c]) return;
          var share = eligibleSubtotal > 0 ? bd[c].line / eligibleSubtotal : 0;
          lineBreakdown[c] = Math.round(discount * share);
        });
        break;
      }
      case ACTION_TYPE.FLAT: {
        discount = Math.min(value, scope === SCOPE.CART ? cartSubtotal : eligibleSubtotal);
        break;
      }
      case ACTION_TYPE.PER_TICKET: {
        var tixCount = eligibleCats.reduce(function(s, c) { return s + (bd[c] ? bd[c].qty : 0); }, 0);
        discount = value * tixCount;
        if (cap) discount = Math.min(discount, cap);
        break;
      }
      case ACTION_TYPE.FREE_TICKETS: {
        var buyQ  = action.buyQty    || 1;
        var getQ  = action.getFreeQty || 1;
        var targCats = (scopeCategories || eligibleCats)
          .filter(function(c) { return bd[c] && bd[c].qty > 0; });
        if (!targCats.length) break;
        var sorted   = targCats.slice().sort(function(a, b) {
          return (bd[a] ? bd[a].unit : 0) - (bd[b] ? bd[b].unit : 0);
        });
        var mainCat  = action.freeFromCheapest ? sorted[0] : sorted[sorted.length - 1];
        var totalElig= targCats.reduce(function(s, c) { return s + (bd[c] ? bd[c].qty : 0); }, 0);
        var sets     = Math.floor(totalElig / (buyQ + getQ));
        var freeQty  = Math.min(sets * getQ, bd[mainCat] ? bd[mainCat].qty : 0);
        freeTickets  = freeQty;
        freeCategory = mainCat;
        discount     = freeQty * (bd[mainCat] ? bd[mainCat].unit : 0);
        break;
      }
      case ACTION_TYPE.SLAB_PERCENT: {
        var qty = cart.qty;
        var matched = (slabs || [])
          .filter(function(s) { return qty >= s.minQty && (s.maxQty === null || qty <= s.maxQty); })
          .sort(function(a, b) { return b.minQty - a.minQty; })[0];
        if (matched) {
          var slabBase = scope === SCOPE.CART ? cartSubtotal : eligibleSubtotal;
          discount = Math.round(slabBase * matched.percent / 100);
        }
        break;
      }
      case ACTION_TYPE.SLAB_FLAT: {
        var qty2 = cart.qty;
        var matched2 = (slabs || [])
          .filter(function(s) { return qty2 >= s.minQty && (s.maxQty === null || qty2 <= s.maxQty); })
          .sort(function(a, b) { return b.minQty - a.minQty; })[0];
        if (matched2) discount = Math.min(matched2.flat, cartSubtotal);
        break;
      }
      case ACTION_TYPE.CREDIT:    creditAmount = value; break;
      case ACTION_TYPE.FNB_CREDIT:fnbCredit    = value; break;
      case ACTION_TYPE.FEE_WAIVER:feeWaiver    = true;  break;
      case ACTION_TYPE.PRICE_OVERRIDE: {
        var origSub = eligibleSubtotal;
        var newSub  = eligibleCats.reduce(function(s, c) {
          return s + (bd[c] ? bd[c].qty * value : 0);
        }, 0);
        discount = Math.max(0, origSub - newSub);
        break;
      }
      case ACTION_TYPE.PERCENT_CAP: {
        var pcBase = scope === SCOPE.CART ? cartSubtotal : eligibleSubtotal;
        discount = Math.min(Math.round(pcBase * value / 100), cap || Infinity);
        break;
      }
      case ACTION_TYPE.HYBRID: {
        var hybridTotal = 0;
        (action.steps || []).forEach(function(step) {
          var tempAction = {};
          Object.keys(action).forEach(function(k) { tempAction[k] = action[k]; });
          Object.keys(step).forEach(function(k) { tempAction[k] = step[k]; });
          var res = _executeAction(tempAction, offer, cart);
          hybridTotal += (res.discount || 0);
        });
        discount = hybridTotal;
        break;
      }
    }

    return { discount: discount, freeTickets: freeTickets, freeCategory: freeCategory,
             creditAmount: creditAmount, fnbCredit: fnbCredit, feeWaiver: feeWaiver,
             lineBreakdown: lineBreakdown };
  }

  // ===========================================================================
  // §9  CONFLICT RESOLUTION & STACKING ENGINE
  // ===========================================================================
  function _resolveStack(results, cart) {
    if (!results.length) return [];
    var maxDiscount = cart.subtotal;

    var exclusive = results.filter(function(r) { return r.stackMode === STACK.EXCLUSIVE; });
    var stackable = results.filter(function(r) { return r.stackMode === STACK.STACKABLE; });
    var bestOnly  = results.filter(function(r) { return r.stackMode === STACK.BEST_ONLY; });

    if (exclusive.length) {
      var best = exclusive.sort(function(a, b) { return b.totalDiscount - a.totalDiscount; })[0];
      return [best];
    }

    // Family-based best selection
    var familyBest = {};
    bestOnly.forEach(function(r) {
      var fam = r.stackFamily || r.offerId;
      if (!familyBest[fam] || r.totalDiscount > familyBest[fam].totalDiscount) {
        familyBest[fam] = r;
      }
    });

    var combined = stackable.concat(Object.keys(familyBest).map(function(k) { return familyBest[k]; }))
      .sort(function(a, b) { return b.priority - a.priority; });

    var cumulative = 0;
    var final = [];
    combined.forEach(function(r) {
      var remaining = Math.max(0, maxDiscount - cumulative);
      if (remaining <= 0) return;
      var effectiveDiscount = Math.min(r.totalDiscount, remaining);
      if (effectiveDiscount > 0) {
        var copy = {};
        Object.keys(r).forEach(function(k) { copy[k] = r[k]; });
        copy.totalDiscount = effectiveDiscount;
        final.push(copy);
        cumulative += effectiveDiscount;
      }
    });

    return final;
  }

  // ===========================================================================
  // §10  OFFER STATUS LIFECYCLE
  // ===========================================================================
  function _computeStatus(offer) {
    // Normalise v3 status strings → v4
    if (offer.status === 'paused'   ) return STATUS.PAUSED;
    if (offer.status === 'archived' ) return STATUS.ARCHIVED;
    if (offer.status === 'draft'    ) return STATUS.DRAFT;
    if (offer.status === 'expired'  ) return STATUS.EXPIRED;
    if (offer.status === 'live'     ) {
      // 'live' is v3 active — still check schedule/usage before confirming active
      // fall through to schedule/usage checks below
    } else {
      if (offer.status === STATUS.PAUSED  ) return STATUS.PAUSED;
      if (offer.status === STATUS.ARCHIVED) return STATUS.ARCHIVED;
      if (offer.status === STATUS.DRAFT   ) return STATUS.DRAFT;
    }

    var now = _nowIST().toISOString().slice(0, 10);
    var sch = offer.schedule || {};

    if (sch.startDate && now < sch.startDate) return STATUS.SCHEDULED;
    if (sch.endDate   && now > sch.endDate)   return STATUS.EXPIRED;

    if (offer.usageLimits && offer.usageLimits.global !== null && offer.usageLimits.global !== undefined) {
      if ((offer.usedCount || 0) >= offer.usageLimits.global) return STATUS.EXPIRED;
    }

    return STATUS.ACTIVE;
  }

  // ===========================================================================
  // §11  MAIN EVALUATION ENGINE
  // ===========================================================================
  function evaluateCart(cart, opts) {
    opts = opts || {};
    var ctx = {
      cart        : cart,
      visitDateStr: opts.visitDateStr || null,
      promoCode   : opts.promoCode    || null,
      channel     : opts.channel      || 'web',
      segment     : opts.segment      || 'all',
      userId      : opts.userId       || null,
      now         : _nowIST(),
    };

    var allOffers  = loadOffers();
    var considered = [];
    var qualified  = [];

    allOffers.forEach(function(offer) {
      var effectiveStatus = _computeStatus(offer);

      if (effectiveStatus !== STATUS.ACTIVE && !(opts.simulate && effectiveStatus === STATUS.SCHEDULED)) {
        considered.push({ offerId: offer.id, name: offer.name, status: effectiveStatus, rejected: true, reason: 'Status: ' + effectiveStatus });
        return;
      }

      if (!_isScheduleActive(offer.schedule, opts.visitDateStr)) {
        considered.push({ offerId: offer.id, name: offer.name, rejected: true, reason: 'Outside schedule window' });
        return;
      }

      var isAutoApply  = offer.autoApply;
      var isPromoMatch = opts.promoCode && offer.promoCode &&
        offer.promoCode.toUpperCase() === opts.promoCode.toUpperCase();

      if (!isAutoApply && !isPromoMatch) {
        considered.push({ offerId: offer.id, name: offer.name, rejected: true, reason: 'Requires promo code' });
        return;
      }

      if (!_offerQualifies(offer, ctx)) {
        considered.push({ offerId: offer.id, name: offer.name, rejected: true, reason: 'Conditions not met' });
        return;
      }

      if (!opts.simulate) {
        var usageCheck = _checkUsage(offer, opts.userId);
        if (!usageCheck.ok) {
          considered.push({ offerId: offer.id, name: offer.name, rejected: true, reason: usageCheck.reason });
          return;
        }
      }

      var totalDiscount  = 0, totalFreeQty = 0, totalFreecat = null;
      var totalCredit    = 0, totalFnbCredit = 0, hasFeeWaiver = false;
      var actionResults  = [];

      (offer.actions || []).forEach(function(action) {
        var res = _executeAction(action, offer, cart);
        totalDiscount  += res.discount  || 0;
        totalFreeQty   += res.freeTickets || 0;
        if (res.freeCategory) totalFreecat = res.freeCategory;
        totalCredit    += res.creditAmount || 0;
        totalFnbCredit += res.fnbCredit    || 0;
        if (res.feeWaiver) hasFeeWaiver = true;
        actionResults.push({ actionId: action.id, actionType: action.type, label: action.label,
          discount: res.discount, freeTickets: res.freeTickets, freeCategory: res.freeCategory,
          creditAmount: res.creditAmount, fnbCredit: res.fnbCredit });
      });

      if (totalDiscount <= 0 && totalFreeQty <= 0 && totalCredit <= 0 && totalFnbCredit <= 0 && !hasFeeWaiver) {
        considered.push({ offerId: offer.id, name: offer.name, rejected: true, reason: 'Zero discount computed' });
        return;
      }

      var result = {
        offerId      : offer.id,
        offerName    : offer.name,
        offerVersion : offer.version || 1,
        priority     : offer.priority || 50,
        stackMode    : offer.stackMode || STACK.STACKABLE,
        stackFamily  : offer.stackFamily || offer.id,
        totalDiscount: totalDiscount,
        freeTickets  : totalFreeQty,
        freeCategory : totalFreecat,
        creditAmount : totalCredit,
        fnbCredit    : totalFnbCredit,
        feeWaiver    : hasFeeWaiver,
        actionResults: actionResults,
        messaging    : offer.messaging || {},
        tags         : offer.tags || [],
        isPromoCode  : !!offer.promoCode,
        promoCode    : offer.promoCode,
      };

      qualified.push(result);
      considered.push({ offerId: offer.id, name: offer.name, qualified: true, totalDiscount: totalDiscount });
    });

    var applied = _resolveStack(qualified, cart);

    var totalTicketDiscount = applied.reduce(function(s, r) { return s + r.totalDiscount; }, 0);
    var totalCredit2        = applied.reduce(function(s, r) { return s + r.creditAmount; }, 0);
    var totalFnbCredit2     = applied.reduce(function(s, r) { return s + r.fnbCredit; }, 0);
    var hasFeeWaiver2       = applied.some(function(r) { return r.feeWaiver; });

    var subtotal   = cart.subtotal;
    var gstRate    = 0.18;
    var netPayable = Math.max(0, subtotal - totalTicketDiscount);
    var gstAmount  = Math.round(netPayable * gstRate / (1 + gstRate));
    var baseAmount = netPayable - gstAmount;

    return {
      cart                : cart,
      considered          : considered,
      qualified           : qualified.map(function(q) { return { offerId: q.offerId, name: q.offerName, discount: q.totalDiscount }; }),
      rejected            : considered.filter(function(c) { return c.rejected; }),
      applied             : applied,
      subtotal            : subtotal,
      totalTicketDiscount : totalTicketDiscount,
      totalCredit         : totalCredit2,
      totalFnbCredit      : totalFnbCredit2,
      hasFeeWaiver        : hasFeeWaiver2,
      netPayable          : netPayable,
      gstAmount           : gstAmount,
      baseAmount          : baseAmount,
      savings             : totalTicketDiscount + totalFnbCredit2,
      savingsPercent      : subtotal > 0 ? Math.round((totalTicketDiscount / subtotal) * 100) : 0,
      rulePath            : applied.map(function(r) {
        return { offerId: r.offerId, name: r.offerName, discount: r.totalDiscount,
          actions: (r.actionResults || []).map(function(a) { return a.label || a.actionType; }) };
      }),
      ts                  : Date.now(),
    };
  }

  // ===========================================================================
  // §12  PROMO CODE VALIDATOR
  // ===========================================================================
  function validatePromoCode(code, cart, opts) {
    if (!code || !code.trim()) return { valid: false, error: 'No code entered.' };
    var c     = code.trim().toUpperCase();
    var offer = null;
    var offers = loadOffers();
    for (var i = 0; i < offers.length; i++) {
      if (offers[i].promoCode && offers[i].promoCode.toUpperCase() === c) { offer = offers[i]; break; }
    }
    if (!offer) return { valid: false, error: 'Invalid promo code.' };

    var effStatus = _computeStatus(offer);
    if (effStatus !== STATUS.ACTIVE) return { valid: false, error: 'This code is ' + effStatus + '.' };

    var result  = evaluateCart(cart, Object.assign({}, opts, { promoCode: c }));
    var applied = result.applied.filter(function(a) { return a.promoCode && a.promoCode.toUpperCase() === c; })[0];
    if (!applied) return { valid: false, error: 'Code is not applicable to your current cart.', result: result };

    return { valid: true, applied: applied, result: result, offer: offer };
  }

  // ===========================================================================
  // §13  COMMIT (increment usage, write exec log)
  // ===========================================================================
  function commitEvaluation(evalResult, opts) {
    if (!evalResult || !evalResult.applied || !evalResult.applied.length) return;
    opts = opts || {};
    var offers = loadOffers();

    evalResult.applied.forEach(function(appliedOffer) {
      var idx = -1;
      for (var i = 0; i < offers.length; i++) {
        if (offers[i].id === appliedOffer.offerId) { idx = i; break; }
      }
      if (idx >= 0) {
        offers[idx].usedCount  = (offers[idx].usedCount  || 0) + 1;
        offers[idx].usedBudget = (offers[idx].usedBudget || 0) + appliedOffer.totalDiscount;
      }
      _incrementUsage({ id: appliedOffer.offerId, usageLimits: {} }, opts.userId, appliedOffer.totalDiscount);
    });

    saveOffers(offers);

    var logEntry = {
      id           : 'EX_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      ts           : Date.now(),
      userId       : opts.userId    || null,
      sessionId    : opts.sessionId || null,
      parkKey      : evalResult.cart.parkKey,
      subtotal     : evalResult.subtotal,
      netPayable   : evalResult.netPayable,
      savings      : evalResult.savings,
      appliedOffers: evalResult.applied.map(function(a) {
        return { offerId: a.offerId, name: a.offerName, discount: a.totalDiscount };
      }),
      channel      : opts.channel  || 'web',
      visitDate    : opts.visitDateStr || null,
    };
    _writeExecLog(logEntry);

    AuditLog.write('offer_committed', {
      offerId: evalResult.applied.map(function(a) { return a.offerId; }).join(','),
      savings: evalResult.savings,
      park   : evalResult.cart.parkKey,
    });
  }

  // ===========================================================================
  // §14  SIMULATION SANDBOX
  // ===========================================================================
  function simulate(cart, opts) {
    var result = evaluateCart(cart, Object.assign({}, opts, { simulate: true }));
    var hist = _ls(SK.SIM_HISTORY) || [];
    hist.unshift({ ts: Date.now(), cart: cart, opts: opts, result: result });
    if (hist.length > MAX_SIM_HIST) hist.length = MAX_SIM_HIST;
    _lsSave(SK.SIM_HISTORY, hist);
    return result;
  }
  function loadSimHistory() { return _ls(SK.SIM_HISTORY) || []; }

  // ===========================================================================
  // §15  ADMIN CRUD
  // ===========================================================================
  function adminListOffers() {
    return loadOffers().map(function(o) {
      var copy = {};
      Object.keys(o).forEach(function(k) { copy[k] = o[k]; });
      copy.effectiveStatus = _computeStatus(o);
      return copy;
    });
  }
  function adminGetOffer(id) {
    var found = null;
    loadOffers().forEach(function(o) { if (o.id === id) found = o; });
    return found;
  }

  function adminSaveOffer(data) {
    // Work directly on the raw storage to avoid v3↔v4 round-trip issues
    var raw    = _ls(SK.OFFERS) || [];
    var idx    = -1;
    var now    = Date.now();
    for (var i = 0; i < raw.length; i++) { if (raw[i].id === data.id) { idx = i; break; } }

    if (idx >= 0) {
      var versions = loadVersions();
      if (!versions[data.id]) versions[data.id] = [];
      versions[data.id].unshift({ version: raw[idx].version || 1, snapshot: JSON.parse(JSON.stringify(raw[idx])), ts: now });
      if (versions[data.id].length > 20) versions[data.id].length = 20;
      saveVersions(versions);

      var merged = {};
      Object.keys(raw[idx]).forEach(function(k) { merged[k] = raw[idx][k]; });
      Object.keys(data).forEach(function(k) { merged[k] = data[k]; });
      merged.version   = (raw[idx].version || 1) + 1;
      merged.updatedAt = now;
      raw[idx] = merged;
      AuditLog.write('offer_updated', { offerId: data.id });
    } else {
      var newOffer = { usedCount: 0, usedBudget: 0, version: 1, createdAt: now, updatedAt: now, createdBy: _getCurrentUser() };
      Object.keys(data).forEach(function(k) { newOffer[k] = data[k]; });
      raw.push(newOffer);
      AuditLog.write('offer_created', { offerId: data.id });
    }
    _lsSave(SK.OFFERS, raw);       // save raw (v3 or v4 native)
    return loadOffers();           // return translated for in-memory use
  }

  function adminDeleteOffer(id) {
    var raw = _ls(SK.OFFERS) || [];
    for (var i = 0; i < raw.length; i++) {
      if (raw[i].id === id) {
        // v3 uses 'status', v4 same — just mark as archived/expired
        raw[i].status    = 'archived';
        raw[i].updatedAt = Date.now();
        break;
      }
    }
    AuditLog.write('offer_archived', { offerId: id });
    _lsSave(SK.OFFERS, raw);
    return loadOffers();
  }

  function adminCloneOffer(id) {
    var src = adminGetOffer(id);
    if (!src) return null;
    var cloned      = JSON.parse(JSON.stringify(src));
    cloned.id       = 'WOE4_' + Date.now().toString(36).toUpperCase();
    cloned.name     = 'Copy of ' + src.name;
    cloned.status   = STATUS.DRAFT;
    cloned.usedCount= 0; cloned.usedBudget = 0;
    cloned.version  = 1; cloned.createdAt = Date.now(); cloned.updatedAt = Date.now();
    cloned.createdBy= _getCurrentUser();
    adminSaveOffer(cloned);
    AuditLog.write('offer_cloned', { sourceId: id, newId: cloned.id });
    return cloned;
  }

  function adminActivateOffer(id) {
    var raw = _ls(SK.OFFERS) || [];
    for (var i = 0; i < raw.length; i++) {
      if (raw[i].id === id) { raw[i].status = 'live'; raw[i].updatedAt = Date.now(); break; }
      // 'live' is the v3 active status; v4 native offers will have their status set too
    }
    AuditLog.write('offer_activated', { offerId: id });
    _lsSave(SK.OFFERS, raw);
  }

  function adminPauseOffer(id) {
    var raw = _ls(SK.OFFERS) || [];
    for (var i = 0; i < raw.length; i++) {
      if (raw[i].id === id) { raw[i].status = 'paused'; raw[i].updatedAt = Date.now(); break; }
    }
    AuditLog.write('offer_paused', { offerId: id });
    _lsSave(SK.OFFERS, raw);
  }

  function adminRollback(id, version) {
    var versions = loadVersions();
    var hist     = (versions[id] || []).filter(function(v) { return v.version === version; })[0];
    if (!hist) return false;
    var restored = {};
    Object.keys(hist.snapshot).forEach(function(k) { restored[k] = hist.snapshot[k]; });
    restored.status = STATUS.PAUSED;
    adminSaveOffer(restored);
    AuditLog.write('offer_rollback', { offerId: id, toVersion: version });
    return true;
  }

  function adminGetVersionHistory(id) {
    return (loadVersions()[id] || []);
  }

  // Risk checker
  function checkRisks(offer) {
    var alerts = [];
    var lim = offer.usageLimits || {};
    if (!lim.global && !lim.perUser && !lim.perDay && !lim.budget) {
      alerts.push({ level: 'warn', msg: 'No usage caps set — unlimited redemption possible.' });
    }
    if (offer.actions && offer.actions.some(function(a) { return a.value >= 50 && a.type === ACTION_TYPE.PERCENT; })) {
      alerts.push({ level: 'danger', msg: 'Discount value >= 50% — review for pricing risk.' });
    }
    if (offer.stackMode === STACK.STACKABLE && (!offer.actions || offer.actions.every(function(a) { return !a.cap; }))) {
      alerts.push({ level: 'warn', msg: 'Stackable offer with no per-action cap.' });
    }
    if (!offer.schedule || (!offer.schedule.startDate && !offer.schedule.endDate)) {
      alerts.push({ level: 'info', msg: 'No date range set — offer is always active.' });
    }
    return alerts;
  }

  // ===========================================================================
  // §16  A/B TESTING
  // ===========================================================================
  var ABEngine = (function() {
    function assignVariant(userId, testId, variants) {
      var assignments = _ls(SK.AB_ASSIGN) || {};
      var key = userId + '_' + testId;
      if (assignments[key]) return assignments[key];
      var hash = 0;
      for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
      var bucket = hash % 100;
      var cumulative = 0;
      var assigned = variants[0].id;
      for (var j = 0; j < variants.length; j++) {
        cumulative += variants[j].weight;
        if (bucket < cumulative) { assigned = variants[j].id; break; }
      }
      assignments[key] = assigned;
      _lsSave(SK.AB_ASSIGN, assignments);
      return assigned;
    }
    function getVariant(userId, testId) {
      var assignments = _ls(SK.AB_ASSIGN) || {};
      return assignments[userId + '_' + testId] || null;
    }
    return { assignVariant: assignVariant, getVariant: getVariant };
  })();

  // ===========================================================================
  // §17  ANALYTICS
  // ===========================================================================
  var Analytics = (function() {
    function _getExecLogs(days) {
      var logs   = _ls(SK.EXEC_LOG) || [];
      var cutoff = Date.now() - (days || 30) * 86400000;
      return logs.filter(function(l) { return l.ts >= cutoff; });
    }

    function summary(days) {
      var logs       = _getExecLogs(days || 30);
      var offers     = adminListOffers();
      var totalTxn   = logs.length;
      var grossSales = logs.reduce(function(s, l) { return s + (l.subtotal   || 0); }, 0);
      var netSales   = logs.reduce(function(s, l) { return s + (l.netPayable || 0); }, 0);
      var savings    = logs.reduce(function(s, l) { return s + (l.savings    || 0); }, 0);
      var activeOffers = offers.filter(function(o) { return o.effectiveStatus === STATUS.ACTIVE; }).length;

      var perOffer = {};
      logs.forEach(function(l) {
        (l.appliedOffers || []).forEach(function(ao) {
          if (!perOffer[ao.offerId]) perOffer[ao.offerId] = { uses: 0, discount: 0, name: ao.name };
          perOffer[ao.offerId].uses++;
          perOffer[ao.offerId].discount += ao.discount || 0;
        });
      });

      var dailyMap = {};
      logs.forEach(function(l) {
        var day = new Date(l.ts).toISOString().slice(0, 10);
        if (!dailyMap[day]) dailyMap[day] = { txn: 0, savings: 0, gross: 0 };
        dailyMap[day].txn++;
        dailyMap[day].savings += l.savings   || 0;
        dailyMap[day].gross   += l.subtotal  || 0;
      });

      return {
        totalTxn    : totalTxn,
        grossSales  : grossSales,
        netSales    : netSales,
        savings     : savings,
        discountRate: grossSales > 0 ? Math.round(savings / grossSales * 100) : 0,
        activeOffers: activeOffers,
        perOffer    : perOffer,
        dailyTrend  : dailyMap,
        aovBefore   : totalTxn > 0 ? Math.round(grossSales / totalTxn) : 0,
        aovAfter    : totalTxn > 0 ? Math.round(netSales   / totalTxn) : 0,
      };
    }

    function offerDetail(offerId, days) {
      var logs = _getExecLogs(days || 90).filter(function(l) {
        return (l.appliedOffers || []).some(function(a) { return a.offerId === offerId; });
      });
      return {
        offerId : offerId,
        uses    : logs.length,
        discount: logs.reduce(function(s, l) {
          var ao = (l.appliedOffers || []).filter(function(a) { return a.offerId === offerId; })[0];
          return s + (ao ? ao.discount : 0);
        }, 0),
        parks   : [...new Set(logs.map(function(l) { return l.parkKey; }))],
        channels: [...new Set(logs.map(function(l) { return l.channel; }))],
      };
    }

    return { summary: summary, offerDetail: offerDetail };
  })();

  // ===========================================================================
  // §18  BACKWARD COMPATIBILITY (v3 API shim)
  // ===========================================================================
  function _buildCart(parkKey, breakdown) {
    var subtotal = Object.keys(breakdown).reduce(function(s, k) { return s + (breakdown[k] ? breakdown[k].line || 0 : 0); }, 0);
    var qty      = Object.keys(breakdown).reduce(function(s, k) { return s + (breakdown[k] ? breakdown[k].qty  || 0 : 0); }, 0);
    return { parkKey: parkKey, breakdown: breakdown, subtotal: subtotal, qty: qty };
  }

  function computeBestOffer(v3cart, visitDate, promoCode) {
    var cart   = _buildCart(v3cart.parkKey, v3cart.breakdown || {});
    var result = evaluateCart(cart, { visitDateStr: visitDate, promoCode: promoCode, channel: 'web' });
    if (!result.applied.length) return null;
    var best = result.applied[0];
    var msgT = best.messaging && best.messaging.appliedMsg
      ? best.messaging.appliedMsg.replace('{savings}', 'Rs.' + best.totalDiscount)
      : best.offerName;
    return {
      offerId       : best.offerId,
      offerName     : best.offerName,
      discountAmount: best.totalDiscount,
      freeTickets   : best.freeTickets   || 0,
      freeCategory  : best.freeCategory  || null,
      description   : msgT,
      flashSale     : (best.tags || []).indexOf('flash') !== -1,
    };
  }

  function applyPromoCode(code, v3cart, visitDate) {
    var cart = _buildCart(v3cart.parkKey, v3cart.breakdown || {});
    var res  = validatePromoCode(code, cart, { visitDateStr: visitDate });
    if (!res.valid) return { error: res.error };
    var best = res.applied;
    var msgT = best.messaging && best.messaging.appliedMsg
      ? best.messaging.appliedMsg.replace('{savings}', 'Rs.' + best.totalDiscount)
      : best.offerName;
    return {
      offerId       : best.offerId,
      offerName     : best.offerName,
      discountAmount: best.totalDiscount,
      freeTickets   : best.freeTickets   || 0,
      freeCategory  : best.freeCategory  || null,
      description   : msgT,
    };
  }

  // Buffet config passthrough (kept for v3 compatibility)
  var WOW_BUFFET_CONFIG = {
    enabled: true, name: 'Park Buffet Meal',
    description: 'All-you-can-eat buffet: Starters + Main Course + Dessert + Soft Drink',
    basePrice: 599, discountType: 'flat', discountValue: 100,
    maxQtyPerTransaction: 8, totalInventory: 200, soldCount: 0, soldOutThreshold: 200,
  };
  function loadBuffetConfig() {
    try { var s = localStorage.getItem('wow_buffet_cfg'); if (s) return Object.assign({}, WOW_BUFFET_CONFIG, JSON.parse(s)); }
    catch(_) {}
    return Object.assign({}, WOW_BUFFET_CONFIG);
  }
  function buffetEffectivePrice() {
    var cfg = loadBuffetConfig();
    if (cfg.discountType === 'percent') return Math.round(cfg.basePrice * (1 - cfg.discountValue / 100));
    return Math.max(0, cfg.basePrice - cfg.discountValue);
  }
  function buffetIsSoldOut() { var cfg = loadBuffetConfig(); return cfg.soldCount >= cfg.soldOutThreshold; }
  function buffetMaxQty()    { return Math.min(8, loadBuffetConfig().maxQtyPerTransaction); }
  function getMaxTickets()   {
    try { var v = localStorage.getItem('wow_max_tickets'); if (v) return parseInt(v, 10) || 8; } catch(_) {}
    return 8;
  }
  function adminSaveBuffet(cfg) {
    var merged = Object.assign({}, loadBuffetConfig(), cfg);
    try { localStorage.setItem('wow_buffet_cfg', JSON.stringify(merged)); } catch(_) {}
    return merged;
  }
  function adminSetMaxTickets(n) { try { localStorage.setItem('wow_max_tickets', String(n)); } catch(_) {} }
  function getFlashOffers(parkKey, visitDate) {
    return loadOffers().filter(function(o) {
      return (o.tags || []).indexOf('flash') !== -1 && _computeStatus(o) === STATUS.ACTIVE &&
        ((o.conditionGroups || []).some(function(g) {
          return (g.conditions || []).some(function(c) {
            return c.type === COND_TYPE.PARK && (c.value || []).indexOf(parkKey) !== -1;
          });
        }) || true);
    });
  }
  function isOfferActive(offer, visitDate) {
    return _computeStatus(offer) === STATUS.ACTIVE && _isScheduleActive(offer.schedule, visitDate);
  }
  function applyOffer(offer, v3cart) {
    var cart   = _buildCart(v3cart.parkKey, v3cart.breakdown || {});
    var opts   = { visitDateStr: null, promoCode: offer.promoCode || null };
    var result = evaluateCart(cart, opts);
    var found  = result.applied.filter(function(a) { return a.offerId === offer.id; })[0];
    if (!found) return null;
    return {
      offerId: found.offerId, offerName: found.offerName,
      discountAmount: found.totalDiscount, freeTickets: found.freeTickets || 0,
      freeCategory: found.freeCategory || null, description: found.offerName,
      flashSale: (found.tags || []).indexOf('flash') !== -1,
    };
  }

  // ===========================================================================
  // §19  DEMAND-BASED PRICING ENGINE
  // ===========================================================================
  var DemandEngine = (function() {
    var SK_DEMAND = 'wow_demand_config';

    function loadConfig() {
      try { var s=localStorage.getItem(SK_DEMAND); if(s) return JSON.parse(s); } catch(_){}
      return {
        enabled: true,
        rules: [
          { id:'DD_PEAK_WKND', name:'Weekend Peak Surcharge', type:'surge_percent', value:10,
            trigger:'booking_velocity', threshold:50, parkKeys:['WATER_DAY','COMBO_DAY'],
            description:'10% surge applied when >50 bookings in last hour on weekends' },
          { id:'DD_OFF_PEAK',  name:'Off-Peak Incentive',   type:'discount_percent', value:8,
            trigger:'low_demand', threshold:10, parkKeys:['AMUSEMENT_DAY'],
            description:'8% off when <10 bookings in last hour on weekdays' },
        ],
        inventoryThresholds: {
          highDemand: 80,  // % capacity = surge triggers
          lowDemand: 20,   // % capacity = discount triggers
        },
      };
    }

    function saveConfig(cfg) { try{localStorage.setItem(SK_DEMAND,JSON.stringify(cfg));}catch(_){} }

    function getCurrentDemandLevel(parkKey) {
      var logs    = readExecLog({ limit: 100 });
      var hourAgo = Date.now() - 3600000;
      var recentBookings = logs.filter(function(l){ return l.ts>=hourAgo && l.parkKey===parkKey; }).length;
      if (recentBookings > 50) return 'high';
      if (recentBookings > 20) return 'medium';
      return 'low';
    }

    function getSuggestedSurgePercent(parkKey) {
      var cfg   = loadConfig();
      if (!cfg.enabled) return 0;
      var level = getCurrentDemandLevel(parkKey);
      var now   = _nowIST();
      var dayOfWeek = now.getDay();
      var isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
      var surgeRules = cfg.rules.filter(function(r){
        return r.type==='surge_percent' && r.parkKeys.indexOf(parkKey)!==-1;
      });
      for (var i=0;i<surgeRules.length;i++) {
        var rule = surgeRules[i];
        if (rule.trigger==='booking_velocity' && level==='high' && isWeekend) return rule.value;
      }
      return 0;
    }

    return { loadConfig:loadConfig, saveConfig:saveConfig, getCurrentDemandLevel:getCurrentDemandLevel, getSuggestedSurgePercent:getSuggestedSurgePercent };
  })();

  // ===========================================================================
  // §20  MAKER-CHECKER WORKFLOW
  // ===========================================================================
  var MakerChecker = (function() {
    var SK_PENDING = 'wow_offer_pending_approvals';
    var ROLES = { MAKER:'maker', CHECKER:'checker', SUPERADMIN:'superadmin' };

    function loadPending() { try{var s=localStorage.getItem(SK_PENDING);if(s)return JSON.parse(s);}catch(_){}return []; }
    function savePending(p){ try{localStorage.setItem(SK_PENDING,JSON.stringify(p));}catch(_){} }

    function submit(offerData, action, submittedBy) {
      var pending = loadPending();
      var request = {
        id          : 'MCR_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),
        action      : action,   // 'create'|'update'|'activate'|'archive'|'rollback'
        offerId     : offerData.id,
        offerData   : JSON.parse(JSON.stringify(offerData)),
        submittedBy : submittedBy || _getCurrentUser(),
        submittedAt : Date.now(),
        status      : 'pending',   // 'pending'|'approved'|'rejected'
        approvedBy  : null,
        approvedAt  : null,
        rejectedBy  : null,
        rejectedAt  : null,
        comments    : null,
      };
      pending.push(request);
      savePending(pending);
      AuditLog.write('maker_submitted', { requestId:request.id, action:action, offerId:offerData.id });
      return request;
    }

    function approve(requestId, approvedBy, comments) {
      var pending = loadPending();
      var req = null;
      for(var i=0;i<pending.length;i++){if(pending[i].id===requestId){req=pending[i];break;}}
      if (!req || req.status!=='pending') return { ok:false, error:'Request not found or already processed.' };

      req.status     = 'approved';
      req.approvedBy = approvedBy || _getCurrentUser();
      req.approvedAt = Date.now();
      req.comments   = comments || null;
      savePending(pending);

      // Execute the action
      if (req.action==='create' || req.action==='update') adminSaveOffer(req.offerData);
      else if (req.action==='activate') adminActivateOffer(req.offerId);
      else if (req.action==='archive')  adminDeleteOffer(req.offerId);

      AuditLog.write('checker_approved', { requestId:requestId, offerId:req.offerId, approvedBy:req.approvedBy });
      return { ok:true, request:req };
    }

    function reject(requestId, rejectedBy, comments) {
      var pending = loadPending();
      for(var i=0;i<pending.length;i++){
        if(pending[i].id===requestId){
          pending[i].status     = 'rejected';
          pending[i].rejectedBy = rejectedBy || _getCurrentUser();
          pending[i].rejectedAt = Date.now();
          pending[i].comments   = comments || null;
          break;
        }
      }
      savePending(pending);
      AuditLog.write('checker_rejected', { requestId:requestId, rejectedBy:rejectedBy });
      return { ok:true };
    }

    function getPending() { return loadPending().filter(function(r){return r.status==='pending';}); }
    function getHistory(offerId) {
      var p = loadPending();
      if (offerId) p = p.filter(function(r){return r.offerId===offerId;});
      return p.sort(function(a,b){return b.submittedAt-a.submittedAt;});
    }

    return { submit:submit, approve:approve, reject:reject, getPending:getPending, getHistory:getHistory, ROLES:ROLES };
  })();

  // ===========================================================================
  // §21  PUBLIC API
  // ===========================================================================
  return {
    // Core engine
    evaluateCart       : evaluateCart,
    validatePromoCode  : validatePromoCode,
    commitEvaluation   : commitEvaluation,
    simulate           : simulate,
    loadSimHistory     : loadSimHistory,
    computeStatus      : _computeStatus,

    // Admin CRUD
    adminListOffers    : adminListOffers,
    adminGetOffer      : adminGetOffer,
    adminSaveOffer     : adminSaveOffer,
    adminDeleteOffer   : adminDeleteOffer,
    adminCloneOffer    : adminCloneOffer,
    adminActivateOffer : adminActivateOffer,
    adminPauseOffer    : adminPauseOffer,
    adminRollback      : adminRollback,
    adminGetVersionHistory: adminGetVersionHistory,
    checkRisks         : checkRisks,

    // Audit & logs
    AuditLog           : AuditLog,
    readExecLog        : readExecLog,

    // Analytics
    Analytics          : Analytics,

    // A/B
    ABEngine           : ABEngine,

    // Demand-based pricing
    DemandEngine       : DemandEngine,

    // Maker-Checker
    MakerChecker       : MakerChecker,

    // Backwards compat (v3 API)
    loadOffers         : loadOffers,
    loadRawOffers      : loadRawOffers,   // returns raw v3/v4 data — for admin panels
    saveOffers         : saveOffers,
    computeBestOffer   : computeBestOffer,
    applyPromoCode     : applyPromoCode,
    isOfferActive      : isOfferActive,
    applyOffer         : applyOffer,
    getFlashOffers     : getFlashOffers,
    getBuffetConfig    : loadBuffetConfig,
    buffetEffectivePrice: buffetEffectivePrice,
    buffetIsSoldOut    : buffetIsSoldOut,
    buffetMaxQty       : buffetMaxQty,
    getMaxTickets      : getMaxTickets,
    adminSaveBuffet    : adminSaveBuffet,
    adminSetMaxTickets : adminSetMaxTickets,
    adminSaveOfferLegacy: adminSaveOffer,
    adminDeleteOfferLegacy: adminDeleteOffer,
    WOW_MAX_TICKETS_DEFAULT: 8,

    // Constants
    STATUS     : STATUS,
    ACTION_TYPE: ACTION_TYPE,
    COND_TYPE  : COND_TYPE,
    STACK      : STACK,
    SCOPE      : SCOPE,
    TZ         : TZ,
    DEFAULT_OFFERS: DEFAULT_OFFERS,
  };
})();

window.WOWOfferEngine = WOWOfferEngine;
window.WOE4 = WOWOfferEngine;

