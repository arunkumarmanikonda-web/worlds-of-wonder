// ============================================================
//  Worlds of Wonder — AuthGate Engine  v1.0
//  Central authentication & authorisation layer for all portals
//  Super Admin bypass token: extreme-right top-bar button
// ============================================================

(function(window) {
'use strict';

// ── ROLE DEFINITIONS ────────────────────────────────────────────────────────
// IMPORTANT: SUPER_ADMIN portal access is restricted to INTERNAL STAFF portals only.
// Super Admin can NEVER access partner, reseller, ta, or customer portals.
// Those portals use separate session stores and separate login pages.
const WOW_ROLES = {
  SUPER_ADMIN:  { id:'SUPER_ADMIN',  label:'Super Admin',    color:'#ef4444', icon:'fa-user-shield',   portals:['admin','sales','internal'] },
  ADMIN:        { id:'ADMIN',        label:'Admin',          color:'#f97316', icon:'fa-user-cog',      portals:['admin'] },
  FINANCE:      { id:'FINANCE',      label:'Finance',        color:'#22c55e', icon:'fa-coins',         portals:['admin'] },
  OPS:          { id:'OPS',          label:'Operations',     color:'#3b82f6', icon:'fa-wrench',        portals:['admin'] },
  CRM_AGENT:    { id:'CRM_AGENT',    label:'CRM Agent',      color:'#a855f7', icon:'fa-headset',       portals:['admin'] },
  GATE_AGENT:   { id:'GATE_AGENT',   label:'Gate Agent',     color:'#14b8a6', icon:'fa-qrcode',        portals:['admin'] },
  SALES_AGENT:  { id:'SALES_AGENT',  label:'Sales Agent',    color:'#fbbf24', icon:'fa-badge-dollar',  portals:['sales'] },
  PARTNER:      { id:'PARTNER',      label:'Partner',        color:'#60a5fa', icon:'fa-handshake',     portals:['partner'] },
  RESELLER:     { id:'RESELLER',     label:'Reseller',       color:'#f472b6', icon:'fa-store',         portals:['reseller'] },
  TA:           { id:'TA',           label:'Travel Agent',   color:'#fb923c', icon:'fa-plane',         portals:['ta'] },
  CUSTOMER:     { id:'CUSTOMER',     label:'Customer',       color:'#4ade80', icon:'fa-user',          portals:['portal'] },
};

// ── PORTAL → LOGIN PAGE MAPPING ────────────────────────────────────────────
// Each portal has its OWN dedicated login page.
// Reseller, Partner, TA, and Customer portals do NOT go through the same
// auth flow as Admin/Super Admin. They use separate session stores.
const PORTAL_LOGIN = {
  admin:    '/admin/admin-login.html',
  sales:    '/sales/passport-login.html',
  partner:  '/partner/login.html',
  reseller: '/reseller/login.html',   // ← dedicated reseller login (NOT index.html)
  ta:       '/internal/index.html',  // TA portal uses the internal gateway for login
  portal:   '/portal/login.html',
  internal: '/internal/index.html',
};

// ── DEMO USERS (stored in localStorage by AuthGate Manager) ────────────────
const DEFAULT_USERS = [
  { id:'USR-001', name:'Arun Kumar M.',   email:'akm@indiagully.com',    role:'SUPER_ADMIN', pin:'1234', active:true },
  { id:'USR-002', name:'Rajesh Sharma',   email:'rajesh@wow.in',         role:'ADMIN',       pin:'2345', active:true },
  { id:'USR-003', name:'Priya Finance',   email:'priya.fin@wow.in',      role:'FINANCE',     pin:'3456', active:true },
  { id:'USR-004', name:'Vikram Ops',      email:'vikram.ops@wow.in',     role:'OPS',         pin:'4567', active:true },
  { id:'USR-005', name:'Sneha CRM',       email:'sneha.crm@wow.in',      role:'CRM_AGENT',   pin:'5678', active:true },
  { id:'USR-006', name:'Ravi Gate',       email:'ravi.gate@wow.in',      role:'GATE_AGENT',  pin:'6789', active:true },
  { id:'USR-007', name:'Sanjay Sales',    email:'sanjay@wow.in',         role:'SALES_AGENT', pin:'7890', active:true },
  { id:'USR-008', name:'MakeMyTrip',      email:'partner@mmt.in',        role:'PARTNER',     pin:'8901', active:true },
  { id:'USR-009', name:'WOW Resellers',   email:'resell@wow.in',         role:'RESELLER',    pin:'9012', active:true },
  { id:'USR-010', name:'TravelEasy TA',   email:'ta@travelease.in',      role:'TA',          pin:'0123', active:true },
];

// ── SESSION KEY ────────────────────────────────────────────────────────────
const SESSION_KEY   = 'wow_auth_session';
const USERS_KEY     = 'wow_auth_users';
const AG_CONFIG_KEY = 'wow_authgate_config';

// ── AUTHGATE CONFIG DEFAULTS ───────────────────────────────────────────────
// STRICT ROLE SEPARATION:
// • Super Admin can ONLY access: admin, sales, internal portals
// • Super Admin bypass button is ONLY shown on admin/sales/internal portals
// • partner, reseller, ta, portal (customer) use their own auth flows
const DEFAULT_CONFIG = {
  enabled: true,           // global kill-switch
  sessionTTL: 480,         // minutes (8 hours)
  superAdminBypass: true,  // extreme-top-right bypass button (STAFF portals only)
  // Portals where SA bypass button is shown (staff-only portals)
  superAdminBypassPortals: ['admin', 'sales', 'internal'],
  portals: {
    admin:    { enabled:true,  allowedRoles:['SUPER_ADMIN','ADMIN','FINANCE','OPS','CRM_AGENT','GATE_AGENT'] },
    sales:    { enabled:true,  allowedRoles:['SUPER_ADMIN','SALES_AGENT'] },
    // Partner, reseller, TA and customer portals have their OWN auth guards
    // wow-auth.js guard() is NOT used for these — they self-guard with separate sessions
    partner:  { enabled:false, allowedRoles:['PARTNER'] },
    reseller: { enabled:false, allowedRoles:['RESELLER'] },
    ta:       { enabled:false, allowedRoles:['TA'] },
    portal:   { enabled:false, allowedRoles:['CUSTOMER'] },
    internal: { enabled:false, allowedRoles:['SUPER_ADMIN','ADMIN','OPS','GATE_AGENT','SALES_AGENT'] },
  }
};

// ────────────────────────────────────────────────────────────────────────────
//  CORE API
// ────────────────────────────────────────────────────────────────────────────

function getConfig() {
  try { return JSON.parse(localStorage.getItem(AG_CONFIG_KEY)) || DEFAULT_CONFIG; }
  catch(e) { return DEFAULT_CONFIG; }
}
function saveConfig(cfg) { localStorage.setItem(AG_CONFIG_KEY, JSON.stringify(cfg)); }

function getUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY));
    return (stored && stored.length) ? stored : DEFAULT_USERS;
  } catch(e) { return DEFAULT_USERS; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function getSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (!s) return null;
    const cfg = getConfig();
    const ageMin = (Date.now() - s.loginAt) / 60000;
    if (ageMin > cfg.sessionTTL) { clearSession(); return null; }
    return s;
  } catch(e) { return null; }
}
function setSession(user) {
  const s = { ...user, loginAt: Date.now() };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

// Detect which portal we're in based on pathname
function detectPortal(path) {
  path = path || window.location.pathname;
  if (path.includes('/admin/'))    return 'admin';
  if (path.includes('/sales/'))    return 'sales';
  if (path.includes('/partner/'))  return 'partner';
  if (path.includes('/reseller/')) return 'reseller';
  if (path.includes('/ta/'))       return 'ta';
  if (path.includes('/portal/'))   return 'portal';
  if (path.includes('/internal/')) return 'internal';
  return null;
}

// Login with email + PIN
function login(email, pin, portal) {
  const users = getUsers();
  const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pin === String(pin) && u.active);
  if (!user) return { ok:false, error:'Invalid credentials or account inactive.' };

  // ── STRICT ROLE-PORTAL ENFORCEMENT ──────────────────────────────────────
  // Super Admin can ONLY log in via admin, sales, or internal portals.
  // Attempting SA login on partner/reseller/ta/portal is REJECTED.
  const staffOnlyPortals   = ['admin', 'sales', 'internal'];
  const externalPortals    = ['partner', 'reseller', 'ta', 'portal'];
  const saOrStaffRoles     = ['SUPER_ADMIN','ADMIN','FINANCE','OPS','CRM_AGENT','GATE_AGENT','SALES_AGENT'];
  const externalRoles      = ['PARTNER','RESELLER','TA','CUSTOMER'];

  if (saOrStaffRoles.includes(user.role) && externalPortals.includes(portal)) {
    return { ok:false, error:'Staff credentials cannot be used on external partner portals. Please use the correct login page.' };
  }
  if (externalRoles.includes(user.role) && staffOnlyPortals.includes(portal)) {
    return { ok:false, error:'Partner/Reseller credentials cannot be used on staff portals. Please use your dedicated portal login.' };
  }

  const cfg  = getConfig();
  const pcfg = cfg.portals[portal] || {};
  if (pcfg.enabled && !pcfg.allowedRoles.includes(user.role)) {
    return { ok:false, error:'Access denied. Your role is not authorised for this portal.' };
  }
  setSession(user);
  return { ok:true, user };
}

// Quick Super-Admin bypass (no password — shows a pin prompt with the bypass PIN)
function superAdminBypass(bypassPin) {
  const users   = getUsers();
  const sa      = users.find(u => u.role === 'SUPER_ADMIN' && u.active);
  if (!sa) return { ok:false, error:'No Super Admin account configured.' };
  if (String(bypassPin) !== String(sa.pin)) return { ok:false, error:'Incorrect Super Admin PIN.' };
  setSession(sa);
  return { ok:true, user:sa };
}

function logout(redirectTo) {
  clearSession();
  const portal = detectPortal();
  const dest   = redirectTo || PORTAL_LOGIN[portal] || '/portal/login.html';
  window.location.href = dest;
}

function isLoggedIn()    { return !!getSession(); }
function currentUser()   { return getSession(); }
function currentRole()   { const s = getSession(); return s ? s.role : null; }
function isSuperAdmin()  { return currentRole() === 'SUPER_ADMIN'; }

// ────────────────────────────────────────────────────────────────────────────
//  AUTHGATE GUARD — inject this on every STAFF portal page only
//  (admin, sales, internal)
//  Partner / Reseller / TA / Customer portals use their own self-contained auth
// ────────────────────────────────────────────────────────────────────────────
function guard(portalOverride) {
  const cfg    = getConfig();
  if (!cfg.enabled) return;               // global bypass

  const portal  = portalOverride || detectPortal();
  if (!portal) return;                    // not a protected path

  // External portals manage their own auth — do not intercept
  const externalPortals = ['partner','reseller','ta','portal'];
  if (externalPortals.includes(portal)) return;

  const pcfg    = (cfg.portals[portal] || {});
  if (!pcfg.enabled) return;             // portal auth disabled

  const session = getSession();

  // Not logged in -> redirect to login
  if (!session) {
    const loginUrl = PORTAL_LOGIN[portal] || '/admin/admin-login.html';
    window.location.replace(loginUrl + '?redirect=' + encodeURIComponent(window.location.pathname));
    return;
  }

  // Super Admin trying to access an external portal through guard() — reject
  if (externalPortals.includes(portal) && session.role === 'SUPER_ADMIN') {
    clearSession();
    window.location.replace('/admin/admin-login.html?error=wrong_portal');
    return;
  }

  // Logged in but wrong role
  if (!pcfg.allowedRoles.includes(session.role)) {
    clearSession();
    const loginUrl = PORTAL_LOGIN[portal] || '/admin/admin-login.html';
    window.location.replace(loginUrl + '?error=access_denied&redirect=' + encodeURIComponent(window.location.pathname));
    return;
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  TOPBAR WIDGET — renders the user chip + logout + super-admin bypass button
// ────────────────────────────────────────────────────────────────────────────
function renderTopbarWidget(containerId, opts) {
  opts = opts || {};
  const container = document.getElementById(containerId);

  // ── Always ensure the bypass modal is injected, even with no container ──
  if (!document.getElementById('wow-bypass-modal')) {
    // Defer if body isn't ready yet
    if (document.body) {
      _injectBypassModal();
    } else {
      document.addEventListener('DOMContentLoaded', function() {
        if (!document.getElementById('wow-bypass-modal')) _injectBypassModal();
      });
    }
  }

  if (!container) return;

  const cfg     = getConfig();
  const session = getSession();

  // Super-Admin bypass button (always visible even when logged out, extreme right)
  const bypassHtml = (cfg.superAdminBypass) ? `
    <button id="wow-sa-bypass-btn" onclick="WOWAuth.openBypassModal()"
      title="Super Admin Bypass — Enter without standard login"
      style="
        background:linear-gradient(135deg,#7f1d1d,#991b1b);
        border:1px solid rgba(239,68,68,.4);
        color:#fca5a5;font-size:10.5px;font-weight:800;
        padding:5px 11px;border-radius:7px;cursor:pointer;
        display:flex;align-items:center;gap:5px;
        letter-spacing:.5px;text-transform:uppercase;
        box-shadow:0 0 12px rgba(239,68,68,.2);
        transition:all .2s;
        font-family:'Inter',sans-serif;
      "
      onmouseover="this.style.boxShadow='0 0 20px rgba(239,68,68,.4)'"
      onmouseout="this.style.boxShadow='0 0 12px rgba(239,68,68,.2)'"
    >
      <i class="fas fa-user-shield"></i> SA
    </button>` : '';

  let userChip = '';
  if (session) {
    const role    = WOW_ROLES[session.role] || {};
    const initial = session.name ? session.name[0].toUpperCase() : '?';
    userChip = `
      <div style="display:flex;align-items:center;gap:8px;">
        <div style="
          width:28px;height:28px;border-radius:50%;
          background:${role.color||'#3b82f6'};
          display:flex;align-items:center;justify-content:center;
          font-size:12px;font-weight:800;color:#fff;flex-shrink:0;
        ">${initial}</div>
        <div style="line-height:1.2;">
          <div style="font-size:12px;font-weight:700;color:#fff;">${session.name||session.email}</div>
          <div style="font-size:9.5px;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:.8px;">${role.label||session.role}</div>
        </div>
        <button onclick="WOWAuth.logout()"
          style="
            background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.2);
            color:#ef4444;padding:5px 11px;border-radius:7px;
            font-size:10.5px;font-weight:700;cursor:pointer;
            font-family:'Inter',sans-serif;margin-left:4px;
          "
        ><i class="fas fa-sign-out-alt"></i> Logout</button>
      </div>`;
  }

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;">
      ${userChip}
      ${bypassHtml}
    </div>`;

  // Inject bypass modal into body if not present
  if (!document.getElementById('wow-bypass-modal')) {
    _injectBypassModal();
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  BYPASS MODAL — Super Admin PIN entry
// ────────────────────────────────────────────────────────────────────────────
function _injectBypassModal() {
  const modal = document.createElement('div');
  modal.id = 'wow-bypass-modal';
  modal.innerHTML = `
    <div id="wow-bypass-overlay" onclick="WOWAuth.closeBypassModal()" style="
      position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:99998;
      display:none;align-items:center;justify-content:center;
      backdrop-filter:blur(4px);
    "></div>
    <div id="wow-bypass-card" style="
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      z-index:99999;display:none;
      background:linear-gradient(145deg,#0e1117,#131720);
      border:1px solid rgba(239,68,68,.3);
      border-radius:18px;padding:32px 28px;width:340px;
      box-shadow:0 20px 60px rgba(0,0,0,.8),0 0 40px rgba(239,68,68,.1);
      font-family:'Inter',sans-serif;
    ">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:36px;margin-bottom:10px;">🛡️</div>
        <div style="font-size:17px;font-weight:800;color:#fff;margin-bottom:4px;">Super Admin Bypass</div>
        <div style="font-size:12px;color:rgba(255,255,255,.45);line-height:1.5;">Enter your Super Admin PIN to access this portal without standard login flow.</div>
      </div>

      <div id="wow-bypass-error" style="
        display:none;padding:8px 12px;border-radius:8px;
        background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);
        color:#f87171;font-size:12px;margin-bottom:12px;text-align:center;
      "></div>

      <!-- PIN boxes -->
      <div style="display:flex;gap:8px;margin-bottom:16px;justify-content:center;">
        <input type="password" id="bp1" maxlength="1" oninput="WOWAuth._bpNext(this,'bp2')" onkeydown="WOWAuth._bpKey(event,this,null,'bp2')"
          style="width:52px;height:52px;text-align:center;font-size:22px;font-weight:800;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Courier New',monospace;"/>
        <input type="password" id="bp2" maxlength="1" oninput="WOWAuth._bpNext(this,'bp3')" onkeydown="WOWAuth._bpKey(event,this,'bp1','bp3')"
          style="width:52px;height:52px;text-align:center;font-size:22px;font-weight:800;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Courier New',monospace;"/>
        <input type="password" id="bp3" maxlength="1" oninput="WOWAuth._bpNext(this,'bp4')" onkeydown="WOWAuth._bpKey(event,this,'bp2','bp4')"
          style="width:52px;height:52px;text-align:center;font-size:22px;font-weight:800;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Courier New',monospace;"/>
        <input type="password" id="bp4" maxlength="1" oninput="WOWAuth._bpNext(this,null)"   onkeydown="WOWAuth._bpKey(event,this,'bp3',null)"
          style="width:52px;height:52px;text-align:center;font-size:22px;font-weight:800;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.15);border-radius:10px;color:#fff;font-family:'Courier New',monospace;"/>
      </div>

      <div style="font-size:10.5px;color:rgba(255,255,255,.3);text-align:center;margin-bottom:16px;">
        Default PIN: <strong style="color:rgba(255,255,255,.5);">1234</strong>  &nbsp;|&nbsp; Change in AuthGate Manager
      </div>

      <button onclick="WOWAuth.submitBypass()"
        style="width:100%;padding:13px;background:linear-gradient(135deg,#7f1d1d,#dc2626);
          color:#fff;font-size:14px;font-weight:800;border:none;border-radius:10px;
          cursor:pointer;font-family:'Inter',sans-serif;margin-bottom:10px;
          box-shadow:0 4px 16px rgba(220,38,38,.3);
          transition:all .2s;
        "
        onmouseover="this.style.boxShadow='0 6px 24px rgba(220,38,38,.5)'"
        onmouseout="this.style.boxShadow='0 4px 16px rgba(220,38,38,.3)'"
      ><i class="fas fa-unlock"></i> Bypass &amp; Enter</button>
      <button onclick="WOWAuth.closeBypassModal()"
        style="width:100%;padding:10px;background:transparent;
          color:rgba(255,255,255,.4);font-size:12px;font-weight:600;
          border:1px solid rgba(255,255,255,.1);border-radius:9px;cursor:pointer;
          font-family:'Inter',sans-serif;
        "
      >Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function openBypassModal() {
  if (!document.getElementById('wow-bypass-modal')) _injectBypassModal();
  setTimeout(function() {
    const overlay = document.getElementById('wow-bypass-overlay');
    const card    = document.getElementById('wow-bypass-card');
    if (overlay) overlay.style.display = 'flex';
    if (card)    card.style.display    = 'block';
    ['bp1','bp2','bp3','bp4'].forEach(function(id) { var el=document.getElementById(id); if(el) el.value=''; });
    const err = document.getElementById('wow-bypass-error');
    if (err) err.style.display = 'none';
    const first = document.getElementById('bp1');
    if (first) setTimeout(function(){first.focus();}, 80);
  }, 30);
}

function closeBypassModal() {
  const overlay = document.getElementById('wow-bypass-overlay');
  const card    = document.getElementById('wow-bypass-card');
  if (overlay) overlay.style.display = 'none';
  if (card)    card.style.display    = 'none';
}

function _bpNext(el, nextId) {
  if (el.value.length === 1 && nextId) {
    const next = document.getElementById(nextId);
    if (next) next.focus();
  }
  if (el.id === 'bp4' && el.value.length === 1) {
    setTimeout(submitBypass, 100);
  }
}
function _bpKey(event, el, prevId, nextId) {
  if (event.key === 'Backspace' && el.value === '' && prevId) {
    const prev = document.getElementById(prevId);
    if (prev) { prev.value = ''; prev.focus(); }
  }
  if (event.key === 'Enter') submitBypass();
}

function submitBypass() {
  const pin = ['bp1','bp2','bp3','bp4'].map(function(id) {
    const el = document.getElementById(id); return el ? el.value : '';
  }).join('');
  if (pin.length < 4) {
    _bypassError('Please enter your 4-digit PIN.'); return;
  }
  const result = superAdminBypass(pin);
  if (result.ok) {
    closeBypassModal();
    _bypassToast('Super Admin session started \u2713');
    // Refresh page to reload protected content
    setTimeout(function() { location.reload(); }, 600);
  } else {
    _bypassError(result.error || 'Invalid PIN');
    ['bp1','bp2','bp3','bp4'].forEach(function(id) { var el=document.getElementById(id); if(el) el.value=''; });
    const first = document.getElementById('bp1');
    if (first) first.focus();
  }
}

function _bypassError(msg) {
  const err = document.getElementById('wow-bypass-error');
  if (err) { err.textContent = msg; err.style.display = 'block'; }
}

function _bypassToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = [
    'position:fixed;top:16px;right:16px;z-index:100000;',
    'background:#16a34a;color:#fff;padding:10px 18px;border-radius:10px;',
    'font-size:13px;font-weight:700;font-family:Inter,sans-serif;',
    'box-shadow:0 4px 20px rgba(0,0,0,.5);',
  ].join('');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { t.remove(); }, 2500);
}

// ────────────────────────────────────────────────────────────────────────────
//  FULL-PAGE LOGIN OVERLAY  — shown when guard finds user not logged in
// ────────────────────────────────────────────────────────────────────────────
function showLoginOverlay(portal, onSuccess) {
  if (document.getElementById('wow-auth-overlay')) return;
  const cfg   = getConfig();
  const pcfg  = cfg.portals[portal] || {};
  const roles = (pcfg.allowedRoles || []).map(function(r){ return WOW_ROLES[r]; }).filter(Boolean);
  const rolesHtml = roles.map(function(r){
    return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:10px;font-weight:700;color:#e4e8f0;margin:2px;"><i class="fas ' + (r.icon||'fa-user') + '" style="color:'+r.color+';font-size:9px;"></i> ' + r.label + '</span>';
  }).join('');

  const overlay = document.createElement('div');
  overlay.id = 'wow-auth-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:90000;background:linear-gradient(145deg,#080a0f 0%,#0e1117 100%);display:flex;align-items:center;justify-content:center;font-family:Inter,sans-serif;';
  overlay.innerHTML = `
    <div style="width:100%;max-width:420px;padding:20px;">
      <div style="text-align:center;margin-bottom:24px;">
        <img src="/images/logo.png" alt="WOW" style="height:54px;width:auto;object-fit:contain;"
          onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='block';"
        /><div style="display:none;font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:#C9A84C;letter-spacing:3px;">WOW</div>
        <div style="font-size:9px;letter-spacing:3px;color:rgba(239,68,68,.7);text-transform:uppercase;margin-top:6px;font-weight:700;">Restricted Portal</div>
      </div>
      <div style="background:#131720;border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:28px 24px;">
        <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:4px;">
          <i class="fas fa-lock" style="color:#C9A84C;margin-right:6px;"></i>Sign In Required
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:18px;line-height:1.5;">
          This portal requires authentication. Allowed roles:
          <div style="margin-top:6px;">${rolesHtml}</div>
        </div>
        <div id="wow-alo-error" style="display:none;padding:8px 12px;border-radius:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);color:#f87171;font-size:12px;margin-bottom:12px;"></div>
        <div style="margin-bottom:12px;">
          <label style="font-size:10.5px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px;">Email</label>
          <input type="email" id="wow-alo-email" placeholder="you@example.com"
            style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:9px;color:#fff;padding:11px 13px;font-size:13px;font-family:Inter,sans-serif;"
          />
        </div>
        <div style="margin-bottom:18px;">
          <label style="font-size:10.5px;font-weight:700;color:rgba(255,255,255,.45);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:5px;">PIN</label>
          <input type="password" id="wow-alo-pin" placeholder="4-digit PIN" maxlength="4"
            style="width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:9px;color:#fff;padding:11px 13px;font-size:20px;letter-spacing:6px;text-align:center;font-family:Courier New,monospace;"
          />
        </div>
        <button id="wow-alo-btn" onclick="WOWAuth._aloSubmit('${portal}')"
          style="width:100%;padding:13px;background:linear-gradient(135deg,#065C38,#0A9B5F);color:#fff;font-size:14px;font-weight:800;border:none;border-radius:10px;cursor:pointer;font-family:Inter,sans-serif;margin-bottom:10px;"
        ><i class="fas fa-sign-in-alt"></i> Sign In</button>
        <div style="text-align:center;font-size:11.5px;color:rgba(255,255,255,.3);">
          Default PIN: 1234 (demo) &nbsp;|&nbsp; <a href="/index.html" style="color:#C9A84C;text-decoration:none;">Back to Home</a>
        </div>
      </div>
      ${['admin','sales','internal'].includes(portal) ? `
      <div style="text-align:center;margin-top:14px;">
        <button onclick="WOWAuth.openBypassModal()" style="background:transparent;border:1px solid rgba(239,68,68,.2);color:rgba(239,68,68,.6);padding:7px 16px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;"><i class="fas fa-user-shield"></i> Super Admin Bypass</button>
      </div>` : '<!-- SA bypass not available on external portals -->'}
    </div>
  `;
  document.body.appendChild(overlay);
  if (!document.getElementById('wow-bypass-modal')) _injectBypassModal();
  window._wowAuthOverlayCallback = onSuccess;
}

function _aloSubmit(portal) {
  const email = (document.getElementById('wow-alo-email') || {}).value || '';
  const pin   = (document.getElementById('wow-alo-pin')   || {}).value || '';
  if (!email || !pin) {
    const err = document.getElementById('wow-alo-error');
    if (err) { err.textContent = 'Please enter your email and PIN.'; err.style.display='block'; }
    return;
  }
  const result = login(email, pin, portal);
  if (result.ok) {
    const ov = document.getElementById('wow-auth-overlay');
    if (ov) ov.remove();
    if (typeof window._wowAuthOverlayCallback === 'function') window._wowAuthOverlayCallback(result.user);
    else location.reload();
  } else {
    const err = document.getElementById('wow-alo-error');
    if (err) { err.textContent = result.error; err.style.display='block'; }
  }
}

// ────────────────────────────────────────────────────────────────────────────
//  SMART GUARD — auto-detects portal, shows overlay or redirects
// ────────────────────────────────────────────────────────────────────────────
function smartGuard(portalOverride, onAuthed) {
  const cfg    = getConfig();
  if (!cfg.enabled) { if(onAuthed) onAuthed(getSession()); return; }

  const portal  = portalOverride || detectPortal();
  if (!portal)  { if(onAuthed) onAuthed(getSession()); return; }

  // External portals manage their own auth — smartGuard does not intercept them
  const externalPortals = ['partner','reseller','ta','portal'];
  if (externalPortals.includes(portal)) {
    if(onAuthed) onAuthed(getSession()); return;
  }

  const pcfg    = cfg.portals[portal] || {};
  if (!pcfg.enabled) { if(onAuthed) onAuthed(getSession()); return; }

  const session = getSession();

  // For staff portals: SUPER_ADMIN or matching role is allowed
  const staffOnlyPortals = ['admin','sales','internal'];
  if (session) {
    const isSA         = session.role === 'SUPER_ADMIN' && staffOnlyPortals.includes(portal);
    const hasRole      = (pcfg.allowedRoles||[]).includes(session.role);
    if (isSA || hasRole) { if(onAuthed) onAuthed(session); return; }
  }

  showLoginOverlay(portal, function(user) {
    if(onAuthed) onAuthed(user);
  });
}

// ────────────────────────────────────────────────────────────────────────────
//  ADMIN FUNCTIONS (used by AuthGate Manager)
// ────────────────────────────────────────────────────────────────────────────
function adminGetAllUsers()  { return getUsers(); }
function adminSaveUser(user) {
  const users = getUsers();
  const idx   = users.findIndex(function(u){ return u.id === user.id; });
  if (idx >= 0) users[idx] = user; else users.push(user);
  saveUsers(users);
}
function adminDeleteUser(id) {
  saveUsers(getUsers().filter(function(u){ return u.id !== id; }));
}
function adminGetConfig()        { return getConfig(); }
function adminSaveConfig(cfg)    { saveConfig(cfg); }

// ────────────────────────────────────────────────────────────────────────────
//  CSS ANIMATION
// ────────────────────────────────────────────────────────────────────────────
(function injectCSS() {
  const style = document.createElement('style');
  style.textContent = '@keyframes wow_fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}#wow-bypass-card{animation:wow_fadeIn .25s ease}#wow-auth-overlay{animation:wow_fadeIn .3s ease}#wow-sa-float-btn{transition:transform .2s,box-shadow .2s;}#wow-sa-float-btn:hover{transform:scale(1.05) !important;box-shadow:0 0 24px rgba(239,68,68,.55) !important;}';
  document.head.appendChild(style);
})();

// ────────────────────────────────────────────────────────────────────────────
//  AUTO-INJECT FLOATING SUPER-ADMIN BYPASS BUTTON
//  ONLY shown on staff portals: admin, sales, internal
//  NEVER shown on: partner, reseller, ta, portal (customer)
// ────────────────────────────────────────────────────────────────────────────
(function autoInjectSAButton() {
  function _doInject() {
    const cfg = getConfig();
    if (!cfg.superAdminBypass) return;              // disabled in AuthGate settings
    if (document.getElementById('wow-sa-float-btn')) return; // already injected

    // Only inject on staff portals — NEVER on external portals
    const path = window.location.pathname;
    const staffPaths = ['/admin/', '/sales/', '/internal/'];
    const isStaffPortal = staffPaths.some(function(p){ return path.includes(p); });
    if (!isStaffPortal) return;  // ← Hard stop: no SA button on partner/reseller/ta/customer pages

    // Inject bypass modal if not yet present
    if (!document.getElementById('wow-bypass-modal')) _injectBypassModal();

    const btn = document.createElement('button');
    btn.id = 'wow-sa-float-btn';
    btn.title = 'Super Admin Bypass — Click to enter PIN';
    btn.setAttribute('aria-label', 'Super Admin Bypass');
    btn.innerHTML = '<i class="fas fa-user-shield" style="font-size:11px;"></i><span style="font-size:10px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;"> SA</span>';
    btn.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:14px',
      'z-index:99997',
      'background:linear-gradient(135deg,#7f1d1d,#991b1b)',
      'border:1.5px solid rgba(239,68,68,.5)',
      'color:#fca5a5',
      'padding:6px 13px',
      'border-radius:8px',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'gap:5px',
      'box-shadow:0 0 14px rgba(239,68,68,.25)',
      'font-family:Inter,system-ui,sans-serif',
      'outline:none',
      'user-select:none',
    ].join(';');

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      openBypassModal();
    });

    document.body.appendChild(btn);
  }

  // Run after DOM is ready (catches both synchronous and async script loads)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _doInject);
  } else {
    // DOM already ready — inject immediately but yield one tick so body exists
    setTimeout(_doInject, 0);
  }
})();

// ────────────────────────────────────────────────────────────────────────────
//  PUBLIC API
// ────────────────────────────────────────────────────────────────────────────
window.WOWAuth = {
  login, logout, isLoggedIn, currentUser, currentRole, isSuperAdmin,
  getSession, setSession, clearSession,
  guard, smartGuard,
  renderTopbarWidget,
  openBypassModal, closeBypassModal, submitBypass,
  showLoginOverlay,
  _bpNext, _bpKey, _aloSubmit,
  adminGetAllUsers, adminSaveUser, adminDeleteUser,
  adminGetConfig, adminSaveConfig,
  superAdminBypass,
  WOW_ROLES, PORTAL_LOGIN,
};

})(window);
