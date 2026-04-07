/**
 * WOW Offer Cart Integration Layer v1.0
 * ════════════════════════════════════════════════════════════════════════════
 * Bridges the WOW Offer Engine v4 with the booking/cart front-end.
 * Provides real-time cart evaluation, coupon validation, offer display,
 * savings breakdowns, stacking logic, and failsafe fallback.
 *
 * Dependencies: wow-offer-engine-v4.js (WOWOfferEngine)
 * Used by: book/water-park.html, book/amusement-park.html, book/combo.html
 * ════════════════════════════════════════════════════════════════════════════
 */
'use strict';

const WOWOfferCart = (function () {

  /* ═══════════════════════════════════════════════════════════
     CONSTANTS & CONFIG
  ═══════════════════════════════════════════════════════════ */

  const COUPON_SK      = 'wow_cart_coupon';
  const LAST_EVAL_SK   = 'wow_cart_last_eval';
  const EVAL_DEBOUNCE  = 300; // ms

  let _debounceTimer   = null;
  let _lastCartHash    = '';
  let _appliedCoupon   = null;
  let _lastEvalResult  = null;
  let _widgetContainer = null;
  let _onUpdateCb      = null;

  /* ═══════════════════════════════════════════════════════════
     CART CONTEXT BUILDER
  ═══════════════════════════════════════════════════════════ */

  /**
   * Build a normalized cart context object from the current booking state.
   * Accepts a raw cart object or reads from the booking module's state.
   */
  function buildCartContext(rawCart) {
    try {
      const cart = rawCart || _readBookingCart();
      if (!cart) return null;

      // Normalize line items
      const lineItems = (cart.items || []).map(item => ({
        id          : item.id || item.categoryId || String(Math.random()),
        categoryId  : item.categoryId || item.id,
        categoryName: item.name || item.label || item.categoryName || 'Ticket',
        qty         : parseInt(item.qty || item.quantity || 0, 10),
        unitPrice   : parseFloat(item.price || item.unitPrice || 0),
        lineTotal   : parseFloat(item.total || item.lineTotal || (item.qty * item.price) || 0),
        parkKey     : item.parkKey || cart.parkKey || 'WATER_DAY',
        ageGroup    : item.ageGroup || 'adult',
      })).filter(l => l.qty > 0);

      if (!lineItems.length) return null;

      const cartTotal   = lineItems.reduce((s, l) => s + l.lineTotal, 0);
      const totalQty    = lineItems.reduce((s, l) => s + l.qty, 0);
      const visitDate   = cart.visitDate   || cart.date   || null;
      const bookingDate = cart.bookingDate || new Date().toISOString().slice(0, 10);
      const now         = new Date();

      return {
        cartId       : cart.cartId || 'cart-' + Date.now(),
        lineItems,
        cartTotal,
        totalQty,
        visitDate,
        bookingDate,
        bookingHour  : now.getHours(),
        bookingMinute: now.getMinutes(),
        dayOfWeek    : now.getDay(), // 0=Sun
        channel      : cart.channel      || _detectChannel(),
        segment      : cart.segment      || _detectSegment(),
        couponCode   : _appliedCoupon    || cart.couponCode || null,
        parkKey      : cart.parkKey      || (lineItems[0] && lineItems[0].parkKey) || 'WATER_DAY',
        sessionData  : _getSessionData(),
      };
    } catch (err) {
      console.warn('[WOWOfferCart] buildCartContext error:', err);
      return null;
    }
  }

  function _readBookingCart() {
    // Try to read from the booking module's global state
    if (window.WOWBooking && WOWBooking.getCartState) {
      return WOWBooking.getCartState();
    }
    // Try sessionStorage
    try {
      const raw = sessionStorage.getItem('wow_cart_state');
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  }

  function _detectChannel() {
    const p = window.location.pathname;
    if (p.includes('/book/'))    return 'web_booking';
    if (p.includes('/portal/'))  return 'portal';
    if (p.includes('/partner/')) return 'partner';
    if (p.includes('/reseller/'))return 'reseller';
    if (p.includes('/ta/'))      return 'travel_agent';
    return 'web';
  }

  function _detectSegment() {
    const session = _getSessionData();
    if (!session) return 'guest';
    if (session.isNewUser) return 'new_user';
    return 'returning_user';
  }

  function _getSessionData() {
    try {
      const raw = sessionStorage.getItem('wow_auth_session') ||
                  localStorage.getItem('wow_auth_session');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function _cartHash(ctx) {
    if (!ctx) return '';
    return JSON.stringify({
      items : ctx.lineItems.map(l => `${l.categoryId}:${l.qty}:${l.unitPrice}`),
      coupon: ctx.couponCode,
      date  : ctx.visitDate,
    });
  }

  /* ═══════════════════════════════════════════════════════════
     EVALUATION ORCHESTRATOR
  ═══════════════════════════════════════════════════════════ */

  /**
   * Main entry — debounced re-evaluation on any cart change.
   * Calls the WOWOfferEngine, then updates UI.
   */
  function evaluate(rawCart) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => _doEvaluate(rawCart), EVAL_DEBOUNCE);
  }

  function _doEvaluate(rawCart) {
    try {
      const ctx = buildCartContext(rawCart);
      if (!ctx) {
        _renderEmpty();
        return;
      }

      const hash = _cartHash(ctx);
      if (hash === _lastCartHash && _lastEvalResult) {
        // Cart hasn't changed — skip re-evaluation
        return;
      }
      _lastCartHash = hash;

      // Check if the engine is available
      if (!window.WOWOfferEngine) {
        console.warn('[WOWOfferCart] WOWOfferEngine not loaded — using fallback pricing');
        _renderFallback(ctx);
        return;
      }

      // Evaluate against offer engine
      const result = WOWOfferEngine.evaluateCart(ctx);
      _lastEvalResult = result;

      // Persist for cart page display
      try {
        sessionStorage.setItem(LAST_EVAL_SK, JSON.stringify({
          ts     : Date.now(),
          result,
          cartCtx: ctx,
        }));
      } catch {}

      _renderResult(ctx, result);

      if (typeof _onUpdateCb === 'function') {
        _onUpdateCb(result);
      }
    } catch (err) {
      console.error('[WOWOfferCart] Evaluation error:', err);
      _renderError();
    }
  }

  /* ═══════════════════════════════════════════════════════════
     COUPON MANAGEMENT
  ═══════════════════════════════════════════════════════════ */

  function applyCoupon(code) {
    const cleaned = (code || '').trim().toUpperCase();
    if (!cleaned) return { success: false, message: 'Please enter a coupon code.' };
    _appliedCoupon = cleaned;
    try { sessionStorage.setItem(COUPON_SK, cleaned); } catch {}
    evaluate(); // re-evaluate with coupon
    return { success: true, code: cleaned };
  }

  function removeCoupon() {
    _appliedCoupon = null;
    try { sessionStorage.removeItem(COUPON_SK); } catch {}
    evaluate(); // re-evaluate without coupon
  }

  function _restoreCoupon() {
    try {
      const saved = sessionStorage.getItem(COUPON_SK);
      if (saved) _appliedCoupon = saved;
    } catch {}
  }

  /* ═══════════════════════════════════════════════════════════
     UI RENDERING
  ═══════════════════════════════════════════════════════════ */

  function mountWidget(containerEl, options) {
    _widgetContainer = containerEl;
    if (options && typeof options.onUpdate === 'function') {
      _onUpdateCb = options.onUpdate;
    }
    _restoreCoupon();
    _renderEmpty();
  }

  function _renderEmpty() {
    if (!_widgetContainer) return;
    _widgetContainer.innerHTML = _tpl_couponEntry() + _tpl_noOffers();
  }

  function _renderError() {
    if (!_widgetContainer) return;
    _widgetContainer.innerHTML = `
      <div class="ofw-section">
        <div class="ofw-error">
          <i class="fa-solid fa-triangle-exclamation"></i>
          Offer engine unavailable — full price applies. Your booking is unaffected.
        </div>
      </div>`;
  }

  function _renderFallback(ctx) {
    if (!_widgetContainer) return;
    _widgetContainer.innerHTML = `
      ${_tpl_couponEntry()}
      <div class="ofw-section">
        <div class="ofw-note">Offer engine loading — standard pricing applies.</div>
      </div>`;
  }

  function _renderResult(ctx, result) {
    if (!_widgetContainer) return;

    const applied  = result.appliedOffers || [];
    const eligible = result.eligibleOffers || [];
    const rejected = result.rejectedOffers || [];
    const savings  = result.totalSavings   || 0;
    const finalAmt = result.finalAmount    || ctx.cartTotal;

    let html = '';

    // ── Applied offers section ──────────────────────────────────
    if (applied.length) {
      html += `<div class="ofw-section">
        <div class="ofw-section-title"><i class="fa-solid fa-check-circle" style="color:#22c55e"></i> Applied Offers</div>`;
      applied.forEach(o => {
        html += `
        <div class="ofw-offer-card ofw-applied">
          <div class="ofw-offer-top">
            <div class="ofw-offer-name">${_esc(o.name || 'Offer')}</div>
            <div class="ofw-savings-pill">−${_fmtINR(o.savings || 0)}</div>
          </div>
          ${o.message ? `<div class="ofw-offer-msg">${_esc(o.message)}</div>` : ''}
          ${o.couponCode ? `<div class="ofw-coupon-chip"><i class="fa-solid fa-tag"></i> ${_esc(o.couponCode)}</div>` : ''}
          ${o.terms ? `<div class="ofw-terms">${_esc(o.terms)}</div>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    // ── Coupon entry ────────────────────────────────────────────
    html += _tpl_couponEntry(applied.some(o => o.couponCode));

    // ── Available offers ────────────────────────────────────────
    if (eligible.length) {
      html += `<div class="ofw-section">
        <div class="ofw-section-title"><i class="fa-solid fa-gift" style="color:#f59e0b"></i> Available for You</div>`;
      eligible.forEach(o => {
        html += `
        <div class="ofw-offer-card ofw-eligible">
          <div class="ofw-offer-top">
            <div class="ofw-offer-name">${_esc(o.name || 'Offer')}</div>
            ${o.savings ? `<div class="ofw-savings-pill ofw-eligible-pill">Save ${_fmtINR(o.savings)}</div>` : ''}
          </div>
          ${o.unlockMessage || o.message ? `<div class="ofw-offer-msg">${_esc(o.unlockMessage || o.message)}</div>` : ''}
        </div>`;
      });
      html += '</div>';
    }

    // ── Savings summary ─────────────────────────────────────────
    if (savings > 0) {
      const pct = ctx.cartTotal > 0 ? Math.round((savings / ctx.cartTotal) * 100) : 0;
      html += `
      <div class="ofw-section ofw-summary">
        <div class="ofw-summary-row">
          <span>Cart Total</span>
          <span>${_fmtINR(ctx.cartTotal)}</span>
        </div>
        <div class="ofw-summary-row ofw-savings-row">
          <span><i class="fa-solid fa-tag"></i> Total Savings</span>
          <span>−${_fmtINR(savings)}</span>
        </div>
        <div class="ofw-summary-row ofw-final-row">
          <span>You Pay</span>
          <span class="ofw-final-price">${_fmtINR(finalAmt)}</span>
        </div>
        ${pct > 0 ? `<div class="ofw-savings-badge">🎉 You're saving ${pct}% on this booking!</div>` : ''}
      </div>`;
    }

    // ── Offer explainability trace (dev / debug mode) ───────────
    if (_isDebugMode() && result.trace) {
      html += _renderTrace(result.trace);
    }

    _widgetContainer.innerHTML = html;
    _bindCouponEvents();
  }

  function _tpl_couponEntry(hasActiveCoupon) {
    if (_appliedCoupon && hasActiveCoupon) {
      return `
      <div class="ofw-section">
        <div class="ofw-coupon-applied">
          <i class="fa-solid fa-tag"></i>
          <span>Coupon <strong>${_esc(_appliedCoupon)}</strong> applied</span>
          <button class="ofw-remove-coupon" onclick="WOWOfferCart.removeCoupon()">Remove ×</button>
        </div>
      </div>`;
    }
    return `
    <div class="ofw-section">
      <div class="ofw-coupon-form">
        <input type="text" id="ofw-coupon-input" class="ofw-coupon-input" 
               placeholder="Enter promo / coupon code"
               value="${_appliedCoupon ? _esc(_appliedCoupon) : ''}"
               autocomplete="off" spellcheck="false"
               maxlength="32"/>
        <button class="ofw-coupon-btn" onclick="WOWOfferCart._handleApplyCoupon()">Apply</button>
      </div>
      <div id="ofw-coupon-msg" class="ofw-coupon-msg"></div>
    </div>`;
  }

  function _tpl_noOffers() {
    return `
    <div class="ofw-section">
      <div class="ofw-note">Add tickets to see available offers &amp; discounts.</div>
    </div>`;
  }

  function _renderTrace(trace) {
    if (!trace || !trace.length) return '';
    const rows = trace.map(t => {
      const icon = t.applied ? '✅' : t.skipped ? '⏭' : '❌';
      return `<div class="ofw-trace-row">
        <span class="ofw-trace-icon">${icon}</span>
        <span class="ofw-trace-name">${_esc(t.name || '')}</span>
        <span class="ofw-trace-reason">${_esc(t.reason || '')}</span>
      </div>`;
    }).join('');
    return `
    <details class="ofw-trace-details">
      <summary>🔍 Offer Engine Trace (debug)</summary>
      <div class="ofw-trace-wrap">${rows}</div>
    </details>`;
  }

  function _bindCouponEvents() {
    const inp = document.getElementById('ofw-coupon-input');
    if (!inp) return;
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') _handleApplyCoupon();
    });
  }

  function _handleApplyCoupon() {
    const inp = document.getElementById('ofw-coupon-input');
    const msg = document.getElementById('ofw-coupon-msg');
    if (!inp) return;
    const code = inp.value.trim().toUpperCase();
    if (!code) {
      if (msg) msg.innerHTML = '<span style="color:#f87171">Please enter a code.</span>';
      return;
    }

    // Evaluate coupon validity via engine
    if (window.WOWOfferEngine && WOWOfferEngine.validateCoupon) {
      const ctx = buildCartContext();
      if (ctx) {
        const check = WOWOfferEngine.validateCoupon(code, ctx);
        if (!check.valid) {
          if (msg) msg.innerHTML = `<span style="color:#f87171"><i class="fa-solid fa-xmark"></i> ${_esc(check.reason || 'Invalid code')}</span>`;
          return;
        }
      }
    }

    applyCoupon(code);
    if (msg) msg.innerHTML = `<span style="color:#4ade80"><i class="fa-solid fa-check"></i> Coupon applied!</span>`;
  }

  /* ═══════════════════════════════════════════════════════════
     CSS INJECTION
  ═══════════════════════════════════════════════════════════ */

  function injectStyles() {
    if (document.getElementById('ofw-styles')) return;
    const style = document.createElement('style');
    style.id = 'ofw-styles';
    style.textContent = `
      .ofw-section {
        margin-bottom: 12px;
      }
      .ofw-section-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: #94a3b8;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .ofw-offer-card {
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 8px;
        border: 1px solid;
        transition: box-shadow .15s;
      }
      .ofw-applied {
        background: rgba(34,197,94,.06);
        border-color: rgba(34,197,94,.25);
      }
      .ofw-eligible {
        background: rgba(245,158,11,.05);
        border-color: rgba(245,158,11,.2);
      }
      .ofw-offer-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .ofw-offer-name {
        font-size: 13px;
        font-weight: 600;
        color: #e2e8f0;
        flex: 1;
      }
      .ofw-savings-pill {
        font-size: 12px;
        font-weight: 700;
        color: #4ade80;
        background: rgba(34,197,94,.12);
        border: 1px solid rgba(34,197,94,.25);
        border-radius: 999px;
        padding: 2px 10px;
        white-space: nowrap;
      }
      .ofw-eligible-pill {
        color: #fbbf24;
        background: rgba(245,158,11,.12);
        border-color: rgba(245,158,11,.25);
      }
      .ofw-offer-msg {
        font-size: 11.5px;
        color: #94a3b8;
        margin-top: 5px;
        line-height: 1.5;
      }
      .ofw-coupon-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 600;
        font-family: monospace;
        color: #34d399;
        background: rgba(52,211,153,.1);
        border: 1px solid rgba(52,211,153,.2);
        border-radius: 6px;
        padding: 2px 8px;
        margin-top: 6px;
      }
      .ofw-terms {
        font-size: 10.5px;
        color: #475569;
        margin-top: 5px;
        font-style: italic;
      }
      .ofw-coupon-form {
        display: flex;
        gap: 8px;
      }
      .ofw-coupon-input {
        flex: 1;
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.05);
        color: #e2e8f0;
        font-size: 13px;
        font-family: monospace;
        text-transform: uppercase;
        transition: border-color .15s;
      }
      .ofw-coupon-input:focus {
        outline: none;
        border-color: rgba(201,168,76,.4);
      }
      .ofw-coupon-input::placeholder {
        color: rgba(255,255,255,.25);
        text-transform: none;
      }
      .ofw-coupon-btn {
        padding: 8px 16px;
        border-radius: 8px;
        background: rgba(201,168,76,.15);
        border: 1px solid rgba(201,168,76,.3);
        color: #F0D080;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all .15s;
        white-space: nowrap;
      }
      .ofw-coupon-btn:hover {
        background: rgba(201,168,76,.25);
        border-color: rgba(201,168,76,.5);
      }
      .ofw-coupon-msg {
        font-size: 11.5px;
        margin-top: 5px;
        min-height: 16px;
      }
      .ofw-coupon-applied {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12.5px;
        color: #34d399;
        background: rgba(52,211,153,.08);
        border: 1px solid rgba(52,211,153,.2);
        border-radius: 8px;
        padding: 9px 12px;
      }
      .ofw-remove-coupon {
        margin-left: auto;
        background: none;
        border: none;
        color: #f87171;
        font-size: 11px;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: background .12s;
      }
      .ofw-remove-coupon:hover {
        background: rgba(239,68,68,.1);
      }
      .ofw-coupon-applied > i {
        color: #34d399;
      }
      .ofw-summary {
        background: rgba(255,255,255,.03);
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 10px;
        padding: 12px 14px;
      }
      .ofw-summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12.5px;
        padding: 5px 0;
        border-bottom: 1px solid rgba(255,255,255,.05);
        color: #94a3b8;
      }
      .ofw-summary-row:last-child {
        border-bottom: none;
      }
      .ofw-savings-row {
        color: #4ade80;
        font-weight: 600;
      }
      .ofw-final-row {
        color: #e2e8f0;
        font-weight: 700;
        font-size: 14px;
        padding-top: 8px;
        margin-top: 4px;
        border-top: 1px solid rgba(255,255,255,.1) !important;
      }
      .ofw-final-price {
        color: #F0D080;
        font-size: 16px;
        font-weight: 800;
      }
      .ofw-savings-badge {
        margin-top: 8px;
        text-align: center;
        font-size: 12px;
        font-weight: 600;
        color: #fbbf24;
        padding: 6px;
        background: rgba(251,191,36,.08);
        border-radius: 6px;
      }
      .ofw-note {
        font-size: 12px;
        color: #475569;
        text-align: center;
        padding: 8px;
        font-style: italic;
      }
      .ofw-error {
        font-size: 11.5px;
        color: #fca5a5;
        background: rgba(239,68,68,.06);
        border: 1px solid rgba(239,68,68,.15);
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      /* Trace debug */
      .ofw-trace-details {
        margin-top: 10px;
        font-size: 11px;
        color: #64748b;
      }
      .ofw-trace-details summary {
        cursor: pointer;
        color: #475569;
        padding: 4px 0;
      }
      .ofw-trace-wrap {
        margin-top: 6px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 7px;
        overflow: hidden;
      }
      .ofw-trace-row {
        display: flex;
        gap: 8px;
        padding: 5px 10px;
        border-bottom: 1px solid rgba(255,255,255,.04);
        align-items: center;
      }
      .ofw-trace-icon {
        flex-shrink: 0;
        width: 18px;
      }
      .ofw-trace-name {
        flex: 1;
        font-weight: 500;
      }
      .ofw-trace-reason {
        color: #475569;
        font-style: italic;
        max-width: 200px;
        text-align: right;
      }
    `;
    document.head.appendChild(style);
  }

  /* ═══════════════════════════════════════════════════════════
     UTILITY HELPERS
  ═══════════════════════════════════════════════════════════ */

  function _fmtINR(n) {
    const num = Math.round(Number(n) || 0);
    return '₹' + num.toLocaleString('en-IN');
  }

  function _esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function _isDebugMode() {
    return window.location.search.includes('debug=offers') ||
           localStorage.getItem('wow_offer_debug') === '1';
  }

  /* ═══════════════════════════════════════════════════════════
     SIMULATION API (used by admin)
  ═══════════════════════════════════════════════════════════ */

  /**
   * Simulate an offer against a hypothetical cart.
   * Returns full explanation object for the admin simulator.
   */
  function simulate(cartSpec) {
    if (!window.WOWOfferEngine) {
      return { error: 'Offer engine not loaded' };
    }
    const ctx = buildCartContext(cartSpec);
    if (!ctx) return { error: 'Could not build cart context from spec' };
    return WOWOfferEngine.evaluateCart(ctx);
  }

  /**
   * Get the last saved evaluation result (for checkout page).
   */
  function getLastResult() {
    if (_lastEvalResult) return _lastEvalResult;
    try {
      const raw = sessionStorage.getItem(LAST_EVAL_SK);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Expire after 10 minutes
        if (Date.now() - parsed.ts < 10 * 60 * 1000) {
          return parsed.result;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Clear all cart offer state (call on new booking or logout).
   */
  function reset() {
    _appliedCoupon  = null;
    _lastCartHash   = '';
    _lastEvalResult = null;
    try {
      sessionStorage.removeItem(COUPON_SK);
      sessionStorage.removeItem(LAST_EVAL_SK);
    } catch {}
    if (_widgetContainer) _renderEmpty();
  }

  /* ═══════════════════════════════════════════════════════════
     AUTO-INTEGRATION
  ═══════════════════════════════════════════════════════════ */

  /**
   * Auto-attach to a booking page's cart change events.
   * Call once on DOMContentLoaded.
   */
  function autoAttach(options) {
    const opts = options || {};

    // Mount the widget
    const container = opts.container ||
                      document.getElementById('offer-widget') ||
                      document.getElementById('ofw-container');

    if (container) {
      injectStyles();
      mountWidget(container, opts);
    }

    // Listen for cart update events from booking.js
    document.addEventListener('wow:cartUpdated', (e) => {
      evaluate(e.detail && e.detail.cart);
    });

    // Also trigger when quantity inputs change
    document.addEventListener('change', (e) => {
      if (e.target && (
        e.target.name === 'qty' ||
        e.target.classList.contains('qty-input') ||
        e.target.dataset.cartItem
      )) {
        evaluate();
      }
    });

    // Trigger initial eval if cart already has items
    setTimeout(() => evaluate(), 500);
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════ */

  return {
    // Core
    evaluate,
    buildCartContext,
    mountWidget,
    autoAttach,
    injectStyles,

    // Coupon
    applyCoupon,
    removeCoupon,
    getAppliedCoupon : () => _appliedCoupon,

    // Results
    getLastResult,
    simulate,
    reset,

    // Internal (exposed for inline HTML handlers)
    _handleApplyCoupon,
  };

})();

// Auto-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  WOWOfferCart.autoAttach();
});

