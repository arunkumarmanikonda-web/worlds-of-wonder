/**
 * WOW Session Pre-fill
 * ──────────────────────────────────────────────────────────────────
 * When a logged-in customer navigates to any booking page from the
 * portal (Quick Book, Book Now, etc.) their details are automatically
 * pre-filled so they don't have to re-enter name / mobile / email.
 *
 * Works with: book/combo.html, book/water-park.html,
 *             book/amusement-park.html, book/passport.html
 * ──────────────────────────────────────────────────────────────────
 */
(function () {
  'use strict';

  /* ── 1. Read session ── */
  function getCustomerSession() {
    try {
      const raw =
        sessionStorage.getItem('wow_auth_session') ||
        localStorage.getItem('wow_auth_session') ||
        sessionStorage.getItem('wow_portal_session') ||
        localStorage.getItem('wow_portal_session');
      if (!raw) return null;
      const sess = JSON.parse(raw);
      // Only auto-fill for CUSTOMER role (not agents / admins)
      if (sess && sess.role === 'CUSTOMER') return sess;
      return null;
    } catch (e) {
      return null;
    }
  }

  /* ── 2. Helpers ── */
  function stripCountryCode(mobile) {
    if (!mobile) return '';
    // Remove +91, 0091, leading 0 etc.
    return String(mobile).replace(/^\+?91|^0091|^0/, '').replace(/\D/g, '').slice(-10);
  }

  /* ── 3. Show "Logged in as…" banner on booking pages ── */
  function showSessionBanner(sess) {
    // Only inject once
    if (document.getElementById('wow-session-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'wow-session-banner';
    banner.style.cssText = [
      'background:#f0fdf4',
      'border-bottom:1.5px solid #86efac',
      'padding:10px 20px',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'font-size:13px',
      'font-weight:600',
      'color:#166534',
      'position:sticky',
      'top:0',
      'z-index:1000',
      'flex-wrap:wrap'
    ].join(';');

    banner.innerHTML = `
      <span style="font-size:18px;">👤</span>
      <span>Booking as <strong>${sess.name || 'WOW Member'}</strong>
        ${sess.mobile ? '· +91 ' + stripCountryCode(sess.mobile) : ''}
        ${sess.email ? '· ' + sess.email : ''}
      </span>
      <span style="margin-left:auto;display:flex;gap:10px;">
        <a href="../portal/dashboard.html"
           style="color:#166534;text-decoration:underline;font-size:12px;">
          ← Back to Dashboard
        </a>
        <span id="wow-session-banner-done" style="display:none;color:#166534;font-size:12px;">
          ✓ Details pre-filled
        </span>
      </span>`;

    document.body.insertBefore(banner, document.body.firstChild);
  }

  /* ── 4. Pre-fill contact fields ── */
  function prefillFields(sess) {
    const mobile    = stripCountryCode(sess.mobile || sess.phone || '');
    const name      = sess.name || '';
    const email     = sess.email || '';
    const firstName = name.split(' ')[0] || name;
    const lastName  = name.split(' ').slice(1).join(' ');

    let filled = false;

    // ── Standard booking pages: combo / water / amusement ──────
    if (setValTruthy('full-name', name))     filled = true;
    if (setValTruthy('mobile', mobile))      filled = true;
    if (setValTruthy('email', email))        filled = true;

    // ── Passport booking: stable IDs if any ────────────────────
    if (setValTruthy('cust-name', name))     filled = true;
    if (setValTruthy('cust-mobile', mobile)) filled = true;
    if (setValTruthy('cust-email', email))   filled = true;

    // ── Passport booking: dynamically-generated holder fields ───
    // The first adult holder renders inputs without IDs; we target
    // them by their position within .holder-card:first-child
    var holderCard = document.querySelector('.holder-card');
    if (holderCard) {
      var inputs = holderCard.querySelectorAll('input[type=text],input[type=tel],input[type=email]');
      inputs.forEach(function (inp) {
        var ph = (inp.placeholder || '').toLowerCase();
        if (ph.includes('first') && !inp.value)      { inp.value = firstName; markFilled(inp); filled = true; }
        if (ph.includes('last') && !inp.value)       { inp.value = lastName;  markFilled(inp); filled = true; }
        if (ph.includes('10-digit') && !inp.value)   { inp.value = mobile;    markFilled(inp); filled = true; }
        if (ph.includes('email') && !inp.value)      { inp.value = email;     markFilled(inp); filled = true; }
      });
    }

    if (filled) {
      const note = document.getElementById('wow-session-banner-done');
      if (note) note.style.display = 'inline';
    }
  }

  function markFilled(el) {
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.style.transition = 'background .4s';
    el.style.background = '#f0fdf4';
    setTimeout(function () { el.style.background = ''; }, 2000);
  }

  function setValTruthy(id, val) {
    const el = document.getElementById(id);
    if (el && val && !el.value) {
      el.value = val;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      // Visual highlight so user notices pre-fill
      el.style.transition = 'background .4s';
      el.style.background = '#f0fdf4';
      setTimeout(() => { el.style.background = ''; }, 2000);
      return true;
    }
    return false;
  }

  /* ── 5. Run on DOM ready ── */
  function run() {
    const sess = getCustomerSession();
    if (!sess) return; // Not logged in — do nothing, normal guest booking flow

    showSessionBanner(sess);

    // Give WOWBooking.initBookingForm a chance to reset fields first
    setTimeout(() => prefillFields(sess), 350);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

})();
