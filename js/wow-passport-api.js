/**
 * WOW Passport Sales Portal — Shared Table API Utility
 * Provides helpers for all CRUD operations across:
 *   wow_agents, wow_kyc, wow_passports, wow_payments, wow_redemptions
 */

const WOW_API = (() => {
  const BASE = 'tables';

  // ── Generic REST helpers ────────────────────────────────────────────────────
  async function list(table, { page = 1, limit = 100, search = '', sort = '' } = {}) {
    let url = `${BASE}/${table}?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (sort)   url += `&sort=${encodeURIComponent(sort)}`;
    const r = await fetch(url);
    return r.json();
  }

  async function get(table, id) {
    const r = await fetch(`${BASE}/${table}/${id}`);
    return r.json();
  }

  async function create(table, data) {
    const r = await fetch(`${BASE}/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  }

  async function update(table, id, data) {
    const r = await fetch(`${BASE}/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  }

  async function patch(table, id, data) {
    const r = await fetch(`${BASE}/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return r.json();
  }

  async function remove(table, id) {
    await fetch(`${BASE}/${table}/${id}`, { method: 'DELETE' });
  }

  // ── ID Generators ────────────────────────────────────────────────────────────
  function genPassportId() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const rnd = String(Math.floor(Math.random() * 9000) + 1000);
    return `WOW-PAX-${yy}${mm}${rnd}`;
  }

  function genKycId() {
    const ts = Date.now().toString(36).toUpperCase();
    return `KYC-${ts}`;
  }

  function genTxnId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let rnd = '';
    for (let i = 0; i < 8; i++) rnd += chars[Math.floor(Math.random() * chars.length)];
    return `WOW-TXN-${rnd}`;
  }

  function genAgentId(role = 'agent') {
    const prefix = role === 'manager' ? 'WOW-SM' : 'WOW-SA';
    const n = String(Math.floor(2400 + Math.random() * 600)).padStart(4, '0');
    return `${prefix}-${n}`;
  }

  function genRedId() {
    const ts = Date.now().toString(36).toUpperCase();
    return `RED-${ts}`;
  }

  function genTempPassword(fname, dob, mobile) {
    const dobYear = (dob || '').split('-')[0] || '2000';
    return `${(fname || 'User').charAt(0).toUpperCase()}${(fname || 'user').slice(1)}@${dobYear}`;
  }

  function genMRZ(passport) {
    const name = (passport.holder_name || 'UNKNOWN').toUpperCase().replace(/\s+/g, '<');
    const pid  = (passport.id || 'WOWPAX000').replace(/[^A-Z0-9]/g, '');
    const exp  = (passport.expiry_date || '2027-01-01').replace(/-/g, '').slice(2);
    const dob  = (passport.dob || '900101');
    return {
      line1: `P<IND${name.padEnd(26, '<').slice(0, 26)}`,
      line2: `${pid.padEnd(9, '<').slice(0, 9)}0IND${dob}0M${exp}0<<<<<<<<<<<<<<0`
    };
  }

  function genQR(passport) {
    return `${passport.id}|${passport.holder_name}|${passport.plan}|${passport.expiry_date}|${passport.mobile}`;
  }

  // ── Plan definitions ─────────────────────────────────────────────────────────
  const PLANS = {
    'Water Park Passport':  { price: 4999,  entriesW: 12, entriesA: 0,  color: '#3b82f6', icon: '🌊' },
    'Amusement Passport':   { price: 5999,  entriesW: 0,  entriesA: 12, color: '#a855f7', icon: '🎢' },
    'Combo Passport':       { price: 7999,  entriesW: 12, entriesA: 12, color: '#C9A84C', icon: '🎉' },
    'Family Passport (4)':  { price: 14999, entriesW: 20, entriesA: 20, color: '#ef4444', icon: '👨‍👩‍👧‍👦' },
  };

  // ── Agent helpers ────────────────────────────────────────────────────────────
  async function getAgents(opts) { return list('wow_agents', opts); }
  async function getAgent(id)    { return get('wow_agents', id); }
  async function createAgent(data) {
    data.id = genAgentId(data.role);
    return create('wow_agents', data);
  }
  async function updateAgentStatus(rowId, status) {
    return patch('wow_agents', rowId, { status });
  }

  // ── KYC helpers ──────────────────────────────────────────────────────────────
  async function getKYCList(opts) { return list('wow_kyc', opts); }
  async function getKYC(id)       { return get('wow_kyc', id); }

  async function saveKYC(data) {
    const paxId = data.passport_id || genPassportId();
    const kycId = data.id          || genKycId();
    data.id          = kycId;
    data.passport_id = paxId;
    data.login_id    = data.mobile;
    data.login_email = data.email;
    data.temp_password = genTempPassword(data.fname, data.dob, data.mobile);
    data.kyc_status     = data.kyc_status     || 'pending';
    data.payment_status = data.payment_status || 'pending';
    const rec = await create('wow_kyc', data);
    // Store for next page
    sessionStorage.setItem('wow_kyc_id', rec.id || kycId);
    sessionStorage.setItem('wow_pax_id', paxId);
    sessionStorage.setItem('wow_kyc',    JSON.stringify(rec));
    return rec;
  }

  async function approveKYC(rowId) {
    return patch('wow_kyc', rowId, { kyc_status: 'approved' });
  }

  async function rejectKYC(rowId, reason) {
    return patch('wow_kyc', rowId, { kyc_status: 'rejected', notes: reason });
  }

  // ── Payment helpers ──────────────────────────────────────────────────────────
  async function getPayments(opts) { return list('wow_payments', opts); }

  async function savePayment(kycData, payData) {
    const plan = PLANS[kycData.plan] || { price: 0 };
    const base  = plan.price;
    const cgst  = Math.round(base * 0.09);
    const sgst  = Math.round(base * 0.09);
    const total = base + cgst + sgst;
    const comm  = Math.round(total * 0.03);
    const txnId = genTxnId();

    const payRecord = {
      id: txnId,
      passport_id:       kycData.passport_id || genPassportId(),
      kyc_id:            kycData.id,
      holder_name:       `${kycData.fname} ${kycData.lname}`,
      plan:              kycData.plan,
      base_amount:       base,
      cgst, sgst,
      total_amount:      total,
      payment_mode:      payData.mode,
      upi_ref:           payData.upi_ref    || '',
      card_last4:        payData.card_last4 || '',
      cash_received:     payData.cash_received || 0,
      cash_change:       payData.cash_change   || 0,
      agent_id:          kycData.agent_id,
      agent_name:        kycData.agent_name,
      agent_commission:  comm,
      location:          kycData.location,
      status:            'Confirmed',
      ...payData
    };

    const rec = await create('wow_payments', payRecord);
    // Update KYC payment_status
    await patch('wow_kyc', kycData.id, { payment_status: 'completed' });
    sessionStorage.setItem('wow_txn_id', txnId);
    sessionStorage.setItem('wow_txn', JSON.stringify(rec));
    return rec;
  }

  // ── Passport helpers ─────────────────────────────────────────────────────────
  async function getPassports(opts) { return list('wow_passports', opts); }
  async function getPassport(id)    { return get('wow_passports', id); }

  async function issuePassport(kycData, txnData) {
    const plan   = PLANS[kycData.plan] || { price: 0, entriesW: 0, entriesA: 0 };
    const today  = new Date().toISOString().split('T')[0];
    const expiry = new Date(Date.now() + 365 * 864e5).toISOString().split('T')[0];
    const paxId  = kycData.passport_id || sessionStorage.getItem('wow_pax_id') || genPassportId();
    const mrz    = genMRZ({ ...kycData, id: paxId, expiry_date: expiry, dob: kycData.dob });

    const paxRecord = {
      id:               paxId,
      kyc_id:           kycData.id,
      holder_name:      `${kycData.fname} ${kycData.lname}`,
      mobile:           kycData.mobile,
      email:            kycData.email,
      plan:             kycData.plan,
      plan_price:       plan.price,
      gst_amount:       Math.round(plan.price * 0.18),
      total_paid:       txnData?.total_amount || (plan.price + Math.round(plan.price * 0.18)),
      payment_mode:     txnData?.payment_mode || 'Cash',
      txn_id:           txnData?.id || genTxnId(),
      issued_date:      today,
      expiry_date:      expiry,
      valid_days:       365,
      status:           'Active',
      entries_water:    plan.entriesW,
      entries_amuse:    plan.entriesA,
      entries_used_water: 0,
      entries_used_amuse: 0,
      agent_id:         kycData.agent_id,
      agent_name:       kycData.agent_name,
      agent_commission: Math.round((plan.price + Math.round(plan.price * 0.18)) * 0.03),
      location:         kycData.location,
      qr_code:          genQR({ id: paxId, holder_name: `${kycData.fname} ${kycData.lname}`, plan: kycData.plan, expiry_date: expiry, mobile: kycData.mobile }),
      mrz_line1:        mrz.line1,
      mrz_line2:        mrz.line2,
      photo_url:        kycData.photo_data || ''
    };

    const rec = await create('wow_passports', paxRecord);
    sessionStorage.setItem('wow_passport', JSON.stringify(rec));
    return rec;
  }

  async function suspendPassport(rowId) {
    return patch('wow_passports', rowId, { status: 'Suspended' });
  }

  async function activatePassport(rowId) {
    return patch('wow_passports', rowId, { status: 'Active' });
  }

  // ── Redemption helpers ────────────────────────────────────────────────────────
  async function getRedemptions(opts) { return list('wow_redemptions', opts); }

  async function scanPassport(passportId, { zone, gateId, operatorName }) {
    // Fetch passport details
    let pax = null;
    try {
      const allPax = await list('wow_passports', { search: passportId, limit: 1 });
      pax = (allPax.data || []).find(p => p.id === passportId || p.qr_code?.startsWith(passportId));
    } catch(e) {}

    if (!pax) return { result: 'not_found', message: 'Passport not found in system' };

    const today = new Date().toISOString().split('T')[0];
    if (pax.status === 'Suspended') return { result: 'suspended', passport: pax, message: 'Passport is suspended' };
    if (pax.expiry_date < today)    return { result: 'expired',   passport: pax, message: 'Passport has expired' };

    const isWater = zone === 'Water Park';
    const usedField = isWater ? 'entries_used_water' : 'entries_used_amuse';
    const totalField = isWater ? 'entries_water' : 'entries_amuse';
    const used  = pax[usedField] || 0;
    const total = pax[totalField] || 0;
    const remaining = total - used;

    if (remaining <= 0) {
      const redId = genRedId();
      await create('wow_redemptions', {
        id: redId, passport_id: passportId,
        holder_name: pax.holder_name, mobile: pax.mobile, plan: pax.plan,
        park_zone: zone, gate_id: gateId, scan_result: 'denied',
        entries_remaining: 0, scanned_by: operatorName,
        notes: 'No entries remaining for this zone'
      });
      return { result: 'denied', passport: pax, message: 'No entries remaining for ' + zone };
    }

    // Deduct entry
    await patch('wow_passports', pax.id, { [usedField]: used + 1 });
    const redId = genRedId();
    await create('wow_redemptions', {
      id: redId, passport_id: passportId,
      holder_name: pax.holder_name, mobile: pax.mobile, plan: pax.plan,
      park_zone: zone, gate_id: gateId, scan_result: 'allowed',
      entries_remaining: remaining - 1, scanned_by: operatorName
    });

    return { result: 'allowed', passport: pax, remaining: remaining - 1, message: 'Access granted! ' + (remaining - 1) + ' entries left for ' + zone };
  }

  // ── Bulk issuance ─────────────────────────────────────────────────────────────
  async function bulkIssue(records) {
    const results = [];
    for (const rec of records) {
      try {
        const kyc = await saveKYC(rec.kyc);
        const txn = await savePayment(kyc, rec.payment);
        const pax = await issuePassport(kyc, txn);
        results.push({ success: true, kycId: kyc.id, passportId: pax.id, txnId: txn.id });
      } catch (e) {
        results.push({ success: false, error: e.message, record: rec });
      }
    }
    return results;
  }

  // ── Session helpers ───────────────────────────────────────────────────────────
  function getAgent()       { try { return JSON.parse(sessionStorage.getItem('wow_agent'));   } catch(e) { return null; } }
  function getCurrentKYC()  { try { return JSON.parse(sessionStorage.getItem('wow_kyc'));     } catch(e) { return null; } }
  function getCurrentTxn()  { try { return JSON.parse(sessionStorage.getItem('wow_txn'));     } catch(e) { return null; } }
  function getCurrentPax()  { try { return JSON.parse(sessionStorage.getItem('wow_passport')); } catch(e) { return null; } }

  function formatCurrency(n) { return '₹' + Number(n || 0).toLocaleString('en-IN'); }
  function formatDate(d)     { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }

  // ── Public API ────────────────────────────────────────────────────────────────
  return {
    // Core
    list, get, create, update, patch, remove,
    // IDs
    genPassportId, genKycId, genTxnId, genAgentId, genRedId, genTempPassword, genMRZ, genQR,
    // Plans
    PLANS,
    // Agents
    getAgents, getAgent: getAgent, createAgent, updateAgentStatus,
    // KYC
    getKYCList, getKYC, saveKYC, approveKYC, rejectKYC,
    // Payments
    getPayments, savePayment,
    // Passports
    getPassports, getPassport, issuePassport, suspendPassport, activatePassport,
    // Redemptions
    getRedemptions, scanPassport,
    // Bulk
    bulkIssue,
    // Session
    getLoggedInAgent: getAgent,
    getCurrentKYC, getCurrentTxn, getCurrentPax,
    // Formatters
    formatCurrency, formatDate
  };
})();

