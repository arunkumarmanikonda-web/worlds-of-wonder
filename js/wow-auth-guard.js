// ============================================================
//  WOW AuthGate Guard — auto-inject snippet
//  Include AFTER wow-auth.js on any protected portal page.
//  Usage: <script src="../js/wow-auth.js"></script>
//         <script src="../js/wow-auth-guard.js" data-portal="admin"></script>
//
//  The script will:
//  1. Run WOWAuth.smartGuard() for the portal
//  2. Inject the SA bypass button into the topbar (id="topbar-auth-widget")
//     OR create a floating SA button at the extreme top-right if no widget container exists
// ============================================================

(function() {
  function init() {
    if (typeof WOWAuth === 'undefined') {
      setTimeout(init, 50); return;
    }

    // Detect portal from script tag attribute or pathname
    const scriptEl  = document.currentScript ||
      Array.from(document.querySelectorAll('script[src*="wow-auth-guard"]')).pop();
    const portal    = (scriptEl && scriptEl.getAttribute('data-portal')) || WOWAuth.detectPortal
      ? (typeof WOWAuth.detectPortal === 'function' ? WOWAuth.detectPortal() : null)
      : null;

    // Inject SA bypass button immediately (before guard check so it's always visible)
    injectSAButton();

    // Run smart guard
    WOWAuth.smartGuard(portal, function(user) {
      // After auth, render the topbar widget if container exists
      const container = document.getElementById('topbar-auth-widget');
      if (container) {
        WOWAuth.renderTopbarWidget('topbar-auth-widget');
      }
    });
  }

  function injectSAButton() {
    // If topbar-auth-widget container exists, use it
    const container = document.getElementById('topbar-auth-widget');
    if (container) {
      WOWAuth.renderTopbarWidget('topbar-auth-widget');
      return;
    }

    // Otherwise inject a floating SA button at extreme top-right
    if (document.getElementById('wow-floating-sa-btn')) return;
    const cfg = WOWAuth.adminGetConfig ? WOWAuth.adminGetConfig() : {superAdminBypass:true};
    if (!cfg.superAdminBypass) return;

    const btn = document.createElement('div');
    btn.id = 'wow-floating-sa-btn';
    btn.style.cssText = 'position:fixed;top:10px;right:14px;z-index:89999;';
    btn.innerHTML = `
      <button onclick="WOWAuth.openBypassModal()"
        title="Super Admin Bypass"
        style="
          background:linear-gradient(135deg,#7f1d1d,#991b1b);
          border:1px solid rgba(239,68,68,.4);
          color:#fca5a5;font-size:10px;font-weight:800;
          padding:5px 11px;border-radius:7px;cursor:pointer;
          display:flex;align-items:center;gap:5px;
          letter-spacing:.5px;text-transform:uppercase;
          box-shadow:0 0 12px rgba(239,68,68,.2);
          font-family:'Inter',sans-serif;
          transition:all .2s;
        "
        onmouseover="this.style.boxShadow='0 0 20px rgba(239,68,68,.4)'"
        onmouseout="this.style.boxShadow='0 0 12px rgba(239,68,68,.2)'"
      ><i class="fas fa-user-shield"></i> SA</button>`;
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

