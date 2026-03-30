/**
 * Worlds of Wonder — main.js
 * ──────────────────────────────────────────────────────────────────
 * Central entry-point / bootstrapper for the WOW static web platform.
 * This file is intentionally lightweight — it delegates to the more
 * specific engines (shell.js, booking.js, wow-auth.js, etc.).
 *
 * Responsibilities:
 *   1. Global utility helpers accessible everywhere
 *   2. Document-ready initialisation sequence
 *   3. Analytics / event tracking stubs (extend as needed)
 *   4. Service-worker registration (optional, no-op if SW not present)
 * ──────────────────────────────────────────────────────────────────
 * Version : 1.0.0
 * Updated : 2026-03-30
 */

'use strict';

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — GLOBAL NAMESPACE
   ══════════════════════════════════════════════════════════════════ */
window.WOW = window.WOW || {};

WOW.version = '1.0.0';
WOW.env     = 'production';

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — UTILITY HELPERS
   ══════════════════════════════════════════════════════════════════ */

/**
 * Format a number as Indian Rupees.
 * e.g. 4999 → "₹4,999"
 */
WOW.formatINR = function (amount) {
  if (isNaN(amount)) return '—';
  return '₹' + Number(amount).toLocaleString('en-IN');
};

/**
 * Format a date string in a human-friendly way.
 * e.g. "2026-04-05" → "5 Apr 2026"
 */
WOW.formatDate = function (iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  } catch (e) { return iso; }
};

/**
 * Pad a string/number to a given length with a fill character.
 */
WOW.pad = function (v, len, fill) {
  return String(v || '').padStart(len, fill || '0');
};

/**
 * Debounce a function (returns a debounced version).
 */
WOW.debounce = function (fn, ms) {
  let t;
  return function () {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, arguments), ms || 300);
  };
};

/**
 * Safely parse JSON — returns fallback on failure.
 */
WOW.safeJSON = function (str, fallback) {
  try { return JSON.parse(str); }
  catch (e) { return fallback !== undefined ? fallback : null; }
};

/**
 * Get the current customer session (CUSTOMER role only).
 */
WOW.getCustomerSession = function () {
  var raw = sessionStorage.getItem('wow_auth_session') ||
            localStorage.getItem('wow_auth_session');
  var sess = WOW.safeJSON(raw);
  if (sess && sess.role === 'CUSTOMER') return sess;
  return null;
};

/**
 * Simple toast notification (works on any page that has a #toast element
 * or creates one dynamically).
 */
WOW.toast = function (msg, durationMs) {
  var el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = [
      'position:fixed', 'bottom:20px', 'right:20px',
      'background:#1e293b', 'border:1px solid #C9A84C',
      'color:#fff', 'padding:10px 18px', 'border-radius:10px',
      'font-size:13px', 'font-weight:600', 'z-index:9999',
      'display:none', 'max-width:320px', 'box-shadow:0 4px 20px rgba(0,0,0,.3)'
    ].join(';');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  el.style.opacity = '1';
  clearTimeout(el._toastTimer);
  el._toastTimer = setTimeout(function () {
    el.style.transition = 'opacity .4s';
    el.style.opacity = '0';
    setTimeout(function () { el.style.display = 'none'; el.style.transition = ''; }, 420);
  }, durationMs || 3200);
};

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — PERFORMANCE MARKS
   ══════════════════════════════════════════════════════════════════ */
WOW._perfStart = Date.now();

WOW.perf = function (label) {
  if (window.performance && window.performance.mark) {
    window.performance.mark('wow:' + label);
  }
};

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — ANALYTICS STUBS
   (Replace with real GA4 / Mixpanel calls as needed)
   ══════════════════════════════════════════════════════════════════ */
WOW.track = function (event, props) {
  // console.debug('[WOW.track]', event, props);
  // gtag('event', event, props);  // Uncomment to enable GA4
};

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — DOCUMENT READY BOOTSTRAP
   ══════════════════════════════════════════════════════════════════ */
(function bootstrap() {
  function onReady() {
    WOW.perf('dom-ready');

    // ── 5.1 Mark active nav links ──────────────────────────────
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
      var page = href.split('/').pop();
      if (page && page === currentPage) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });

    // ── 5.2 Smooth scroll for anchor links ─────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // ── 5.3 Lazy-load images ────────────────────────────────────
    if ('IntersectionObserver' in window) {
      var imgObs = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            obs.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });
      document.querySelectorAll('img[data-src]').forEach(function (img) {
        imgObs.observe(img);
      });
    }

    // ── 5.4 Session-aware greeting (if greeting element exists) ─
    var sessGreet = document.getElementById('session-greeting');
    if (sessGreet) {
      var sess = WOW.getCustomerSession();
      if (sess && sess.name) {
        sessGreet.textContent = 'Welcome back, ' + sess.name.split(' ')[0] + '! 👋';
        sessGreet.style.display = 'block';
      }
    }

    // ── 5.5 Perf done ───────────────────────────────────────────
    WOW.perf('init-done');
    WOW.track('page_view', {
      page: currentPage,
      load_ms: Date.now() - WOW._perfStart
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — SERVICE WORKER (optional)
   ══════════════════════════════════════════════════════════════════ */
if ('serviceWorker' in navigator && WOW.env === 'production') {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {
      // SW not available — silently ignore
    });
  });
}
