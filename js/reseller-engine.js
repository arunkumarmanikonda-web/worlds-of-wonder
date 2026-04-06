// =============================================================================
//  WOW RESELLER IDENTITY & COMMERCE ENGINE  v1.0
//  Worlds of Wonder — Enterprise Reseller Management System
//  Requirements §55–§65: Unique Identity Architecture for every reseller,
//  batch, salesperson, sub-allocation, issuance, redemption, and report.
// =============================================================================
'use strict';

const ResellerEngine = (function () {

  // ===========================================================================
  // §1  STORAGE KEYS
  // ===========================================================================
  const SK = {
    CONFIG        : 'wow_re_config',       // global engine config & coding rules
    RESELLERS     : 'wow_re_resellers',    // reseller master records
    EMPLOYEES     : 'wow_re_employees',    // all salesperson/employee records
    BATCHES       : 'wow_re_batches',      // bulk ticket batch records (identity-coded)
    ALLOCATIONS   : 'wow_re_allocations',  // sub-allocation records (batch → employee)
    TICKETS       : 'wow_re_tickets',      // issued customer ticket records
    REDEMPTIONS   : 'wow_re_redemptions',  // redemption log
    DELIVERIES    : 'wow_re_deliveries',   // delivery/dispatch log
    AUDIT         : 'wow_re_audit',        // immutable audit trail
    ID_REGISTRY   : 'wow_re_id_registry',  // all assigned codes — prevents duplicates
    USAGE_COUNTERS: 'wow_re_counters',     // monotonic counters per reseller for IDs
  };

  const MAX_AUDIT = 5000;

  // ===========================================================================
  // §2  DEFAULT ENGINE CONFIGURATION (§64 — Configurable coding rules)
  // ===========================================================================
  const DEFAULT_CONFIG = {
    version: '1.0',

    // ── Reseller ID Pattern ─────────────────────────────────────────────────
    // Tokens: {PREFIX} {YEAR} {SEQ4}  e.g. RS-2026-0001
    resellerCodePattern : 'RS-{YEAR}-{SEQ4}',
    resellerCodePrefix  : 'RS',       // overridable per reseller
    resellerCodeSeqPad  : 4,          // zero-pad length for sequential number

    // ── Employee / Salesperson ID Pattern ───────────────────────────────────
    // Tokens: {RCODE} {SEQ3}  e.g. RS-2026-0001-SP001
    employeeCodePattern : '{RCODE}-SP{SEQ3}',
    employeeCodeSeqPad  : 3,

    // ── Batch ID Pattern ────────────────────────────────────────────────────
    // Tokens: {RCODE} {SEASON} {BSEQ3}  e.g. RS-2026-0001-FY26-B001
    batchCodePattern    : '{RCODE}-{SEASON}-B{BSEQ3}',
    batchCodeSeqPad     : 3,

    // ── Sub-Allocation ID Pattern ────────────────────────────────────────────
    // e.g. RS-2026-0001-SP001-A001
    allocationCodePattern : '{ECODE}-A{ASEQ3}',
    allocationCodeSeqPad  : 3,

    // ── Customer Ticket ID Pattern ────────────────────────────────────────────
    // e.g. RS-2026-0001-SP001-TKT-00001
    ticketCodePattern   : '{RCODE}-{ECODE_SHORT}-TKT-{TSEQ5}',
    ticketCodeSeqPad    : 5,

    // ── Season string (configurable) ─────────────────────────────────────────
    currentSeason       : 'FY26',

    // ── Tiers & commission slabs ─────────────────────────────────────────────
    tiers: [
      { id:'bronze',   name:'Bronze',   minQty:1,    maxQty:499,   commission:8,  color:'#cd7f32' },
      { id:'silver',   name:'Silver',   minQty:500,  maxQty:1999,  commission:10, color:'#adb5bd' },
      { id:'gold',     name:'Gold',     minQty:2000, maxQty:4999,  commission:12, color:'#ffc107' },
      { id:'platinum', name:'Platinum', minQty:5000, maxQty:null,  commission:15, color:'#7c3aed' },
    ],

    // ── Ticket product catalog (simple reference) ─────────────────────────────
    products: [
      { id:'WP_ADULT',  name:'Water Park — Adult',   parkKey:'WATER_DAY',    category:'adult',  basePrice:1299 },
      { id:'WP_CHILD',  name:'Water Park — Child',   parkKey:'WATER_DAY',    category:'child',  basePrice:899  },
      { id:'AP_ADULT',  name:'Amusement Park — Adult',parkKey:'AMUSEMENT_DAY',category:'adult', basePrice:1199 },
      { id:'AP_CHILD',  name:'Amusement Park — Child',parkKey:'AMUSEMENT_DAY',category:'child', basePrice:799  },
      { id:'CB_ADULT',  name:'Combo — Adult',        parkKey:'COMBO_DAY',    category:'adult',  basePrice:1999 },
      { id:'CB_CHILD',  name:'Combo — Child',        parkKey:'COMBO_DAY',    category:'child',  basePrice:1399 },
    ],

    // Immutability flag: once set, codes cannot be changed (§64)
    codeImmutableOnActivation: true,
    requireApprovalForBatch: false,
    maxEmployeesPerReseller : 50,
    maxBatchQtyPerRequest   : 10000,
    ticketValidityDays      : 365,
    updatedAt               : Date.now(),
  };

  // ===========================================================================
  // §3  STORAGE HELPERS
  // ===========================================================================
  function _ls(key) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch (_) { return null; }
  }
  function _save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); return true; }
    catch (_) { return false; }
  }

  function loadConfig()   { return Object.assign({}, DEFAULT_CONFIG, _ls(SK.CONFIG) || {}); }
  function saveConfig(c)  { _save(SK.CONFIG, c); }

  function loadResellers()   { return _ls(SK.RESELLERS)   || []; }
  function loadEmployees()   { return _ls(SK.EMPLOYEES)   || []; }
  function loadBatches()     { return _ls(SK.BATCHES)     || []; }
  function loadAllocations() { return _ls(SK.ALLOCATIONS) || []; }
  function loadTickets()     { return _ls(SK.TICKETS)     || []; }
  function loadRedemptions() { return _ls(SK.REDEMPTIONS) || []; }
  function loadDeliveries()  { return _ls(SK.DELIVERIES)  || []; }
  function loadRegistry()    { return _ls(SK.ID_REGISTRY) || {}; }
  function loadCounters()    { return _ls(SK.USAGE_COUNTERS) || {}; }

  // ===========================================================================
  // §4  AUDIT LOG  (§63 — identity flows through all objects)
  // ===========================================================================
  function _audit(action, meta) {
    var logs = _ls(SK.AUDIT) || [];
    logs.unshift({
      id      : 'RAL_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6).toUpperCase(),
      ts      : Date.now(),
      action  : action,
      // identity markers always present in audit
      resellerId   : (meta && meta.resellerId)   || null,
      resellerCode : (meta && meta.resellerCode) || null,
      employeeCode : (meta && meta.employeeCode) || null,
      batchCode    : (meta && meta.batchCode)    || null,
      ticketCode   : (meta && meta.ticketCode)   || null,
      meta    : meta || {},
    });
    if (logs.length > MAX_AUDIT) logs.length = MAX_AUDIT;
    _save(SK.AUDIT, logs);
  }

  function readAudit(filters) {
    var logs = _ls(SK.AUDIT) || [];
    if (!filters) return logs;
    if (filters.resellerId)   logs = logs.filter(function(l){ return l.resellerId   === filters.resellerId; });
    if (filters.resellerCode) logs = logs.filter(function(l){ return l.resellerCode === filters.resellerCode; });
    if (filters.employeeCode) logs = logs.filter(function(l){ return l.employeeCode === filters.employeeCode; });
    if (filters.batchCode)    logs = logs.filter(function(l){ return l.batchCode    === filters.batchCode; });
    if (filters.action)       logs = logs.filter(function(l){ return l.action       === filters.action; });
    if (filters.limit)        logs = logs.slice(0, filters.limit);
    return logs;
  }

  // ===========================================================================
  // §5  MONOTONIC COUNTER HELPERS  (ensures unique sequential IDs)
  // ===========================================================================
  function _nextCounter(namespace) {
    var ctrs = loadCounters();
    ctrs[namespace] = (ctrs[namespace] || 0) + 1;
    _save(SK.USAGE_COUNTERS, ctrs);
    return ctrs[namespace];
  }

  function _pad(n, len) {
    return String(n).padStart(len, '0');
  }

  function _currentYear() {
    return new Date().getFullYear().toString();
  }

  // ===========================================================================
  // §6  IDENTITY CODE GENERATORS  (§55, §56, §57, §58)
  // ===========================================================================

  // §55 — Generate unique reseller identity code
  function _generateResellerCode(customCode) {
    var cfg      = loadConfig();
    var registry = loadRegistry();

    if (customCode) {
      var clean = customCode.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
      if (registry['R:' + clean]) {
        throw new Error('Reseller code "' + clean + '" is already assigned. Codes are immutable once assigned.');
      }
      return clean;
    }

    // Auto-generate from pattern
    var pattern = cfg.resellerCodePattern || 'RS-{YEAR}-{SEQ4}';
    var seq      = _nextCounter('reseller_global');
    var code     = pattern
      .replace('{PREFIX}', cfg.resellerCodePrefix || 'RS')
      .replace('{YEAR}',   _currentYear())
      .replace('{SEQ4}',   _pad(seq, cfg.resellerCodeSeqPad || 4))
      .replace('{SEQ}',    _pad(seq, cfg.resellerCodeSeqPad || 4));

    // Collision guard
    var attempts = 0;
    while (registry['R:' + code] && attempts < 20) {
      seq  = _nextCounter('reseller_global');
      code = pattern
        .replace('{PREFIX}', cfg.resellerCodePrefix || 'RS')
        .replace('{YEAR}',   _currentYear())
        .replace('{SEQ4}',   _pad(seq, cfg.resellerCodeSeqPad || 4))
        .replace('{SEQ}',    _pad(seq, cfg.resellerCodeSeqPad || 4));
      attempts++;
    }
    return code;
  }

  // §58 — Generate employee/salesperson identity code, tied to reseller
  function _generateEmployeeCode(resellerCode) {
    var cfg      = loadConfig();
    var seq      = _nextCounter('emp_' + resellerCode);
    var pattern  = cfg.employeeCodePattern || '{RCODE}-SP{SEQ3}';
    var code     = pattern
      .replace('{RCODE}', resellerCode)
      .replace('{SEQ3}',  _pad(seq, cfg.employeeCodeSeqPad || 3))
      .replace('{SEQ}',   _pad(seq, cfg.employeeCodeSeqPad || 3));
    return code;
  }

  // §56 — Generate reseller-coded batch identity
  function _generateBatchCode(resellerCode) {
    var cfg     = loadConfig();
    var seq     = _nextCounter('batch_' + resellerCode);
    var pattern = cfg.batchCodePattern || '{RCODE}-{SEASON}-B{BSEQ3}';
    var code    = pattern
      .replace('{RCODE}',  resellerCode)
      .replace('{SEASON}', cfg.currentSeason || 'FY26')
      .replace('{BSEQ3}',  _pad(seq, cfg.batchCodeSeqPad || 3))
      .replace('{SEQ}',    _pad(seq, cfg.batchCodeSeqPad || 3));
    return code;
  }

  // §59 — Generate sub-allocation code
  function _generateAllocationCode(employeeCode) {
    var cfg     = loadConfig();
    var seq     = _nextCounter('alloc_' + employeeCode);
    var pattern = cfg.allocationCodePattern || '{ECODE}-A{ASEQ3}';
    var code    = pattern
      .replace('{ECODE}', employeeCode)
      .replace('{ASEQ3}', _pad(seq, cfg.allocationCodeSeqPad || 3))
      .replace('{SEQ}',   _pad(seq, cfg.allocationCodeSeqPad || 3));
    return code;
  }

  // §57 — Generate customer-issued ticket code, traceable to reseller + employee + batch
  function _generateTicketCode(resellerCode, employeeCode) {
    var cfg       = loadConfig();
    var seq       = _nextCounter('ticket_' + resellerCode);
    // Employee short code: last segment after final '-' in employeeCode
    var empParts  = employeeCode ? employeeCode.split('-') : [];
    var empShort  = empParts[empParts.length - 1] || 'SP';
    var pattern   = cfg.ticketCodePattern || '{RCODE}-{ECODE_SHORT}-TKT-{TSEQ5}';
    var code      = pattern
      .replace('{RCODE}',       resellerCode)
      .replace('{ECODE_SHORT}', empShort)
      .replace('{ECODE}',       employeeCode || '')
      .replace('{TSEQ5}',       _pad(seq, cfg.ticketCodeSeqPad || 5))
      .replace('{SEQ}',         _pad(seq, cfg.ticketCodeSeqPad || 5));
    return code;
  }

  // Register a code as used in the global registry (immutability guard)
  function _registerCode(type, code, ownerId) {
    var registry     = loadRegistry();
    registry[type + ':' + code] = { assignedTo: ownerId, assignedAt: Date.now() };
    _save(SK.ID_REGISTRY, registry);
  }

  // ===========================================================================
  // §7  RESELLER MASTER CRUD  (§55 — Reseller Identity)
  // ===========================================================================

  // Reseller lifecycle states
  const R_STATUS = {
    DRAFT    : 'draft',
    PENDING  : 'pending_approval',
    ACTIVE   : 'active',
    PAUSED   : 'paused',
    SUSPENDED: 'suspended',
    EXPIRED  : 'expired',
    ARCHIVED : 'archived',
  };

  function createReseller(data) {
    var cfg    = loadConfig();
    var list   = loadResellers();
    var now    = Date.now();

    // §55 — Generate or validate unique reseller code
    var code   = _generateResellerCode(data.customCode || null);
    _registerCode('R', code, code);

    var reseller = {
      // §55 — Immutable identity fields
      id          : 'RE_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2,6).toUpperCase(),
      resellerCode: code,               // IMMUTABLE ONCE ASSIGNED
      codeAssignedAt: now,
      codeLockedAt  : null,             // set when activated

      // Business profile
      name          : data.name          || '',
      tradeName     : data.tradeName     || data.name || '',
      type          : data.type          || 'company', // company | individual | agency | platform
      category      : data.category      || 'travel_agent',
      tier          : data.tier          || 'bronze',
      status        : R_STATUS.DRAFT,

      // Contact
      contactPerson : data.contactPerson || '',
      email         : data.email         || '',
      mobile        : data.mobile        || '',
      city          : data.city          || '',
      state         : data.state         || '',
      pincode       : data.pincode       || '',
      address       : data.address       || '',

      // Commercial
      gstNumber     : data.gstNumber     || '',
      panNumber     : data.panNumber     || '',
      bankAccount   : data.bankAccount   || '',
      bankIfsc      : data.bankIfsc      || '',
      bankName      : data.bankName      || '',
      commissionRate: data.commissionRate || cfg.tiers.find(function(t){ return t.id === (data.tier||'bronze'); }).commission,

      // Agreement
      agreementDate : data.agreementDate || null,
      agreementRef  : data.agreementRef  || null,
      creditLimit   : data.creditLimit   || 0,
      paymentTerms  : data.paymentTerms  || 'advance', // advance | credit_7 | credit_15 | credit_30

      // Operational
      allowedProducts    : data.allowedProducts || [],   // product IDs from catalog
      maxBatchSize       : data.maxBatchSize     || 1000,
      autoApproveOrders  : data.autoApproveOrders  !== undefined ? data.autoApproveOrders  : false,
      whatsappNotify     : data.whatsappNotify     !== undefined ? data.whatsappNotify     : true,
      emailNotify        : data.emailNotify        !== undefined ? data.emailNotify        : true,

      // Notes
      internalNotes : data.internalNotes || '',
      tags          : data.tags          || [],

      // Lifecycle
      createdAt     : now,
      updatedAt     : now,
      activatedAt   : null,
      createdBy     : data.createdBy || 'admin',

      // Analytics (live, computed from batch/ticket data)
      _analytics: {
        totalBatches     : 0,
        totalAllocated   : 0,
        totalIssued      : 0,
        totalRedeemed    : 0,
        totalExpired     : 0,
        totalRevenue     : 0,
        totalCommission  : 0,
        lastBatchDate    : null,
        lastIssuanceDate : null,
      },
    };

    list.push(reseller);
    _save(SK.RESELLERS, list);
    _audit('reseller_created', { resellerId: reseller.id, resellerCode: code, name: reseller.name });
    return reseller;
  }

  function updateReseller(resellerId, updates) {
    var list = loadResellers();
    var idx  = list.findIndex(function(r){ return r.id === resellerId; });
    if (idx < 0) throw new Error('Reseller not found: ' + resellerId);

    var r = list[idx];
    var cfg = loadConfig();

    // §64 — resellerCode is IMMUTABLE once activated
    if (updates.resellerCode && updates.resellerCode !== r.resellerCode) {
      if (cfg.codeImmutableOnActivation && r.codeLockedAt) {
        throw new Error('Reseller code is immutable after activation. Code cannot be changed.');
      }
    }

    // Merge allowed fields
    var protected_fields = ['id','resellerCode','codeAssignedAt','createdAt','createdBy'];
    Object.keys(updates).forEach(function(k) {
      if (protected_fields.indexOf(k) === -1) r[k] = updates[k];
    });
    r.updatedAt = Date.now();
    list[idx] = r;
    _save(SK.RESELLERS, list);
    _audit('reseller_updated', { resellerId: resellerId, resellerCode: r.resellerCode, fields: Object.keys(updates) });
    return r;
  }

  function activateReseller(resellerId) {
    var list = loadResellers();
    var r    = list.find(function(r){ return r.id === resellerId; });
    if (!r) throw new Error('Reseller not found');
    r.status      = R_STATUS.ACTIVE;
    r.activatedAt = Date.now();
    r.codeLockedAt = Date.now();   // §64 — lock code on activation
    r.updatedAt   = Date.now();
    _save(SK.RESELLERS, list);
    _audit('reseller_activated', { resellerId: resellerId, resellerCode: r.resellerCode });
    return r;
  }

  function setResellerStatus(resellerId, newStatus) {
    var list = loadResellers();
    var r    = list.find(function(r){ return r.id === resellerId; });
    if (!r) throw new Error('Reseller not found');
    r.status    = newStatus;
    r.updatedAt = Date.now();
    _save(SK.RESELLERS, list);
    _audit('reseller_status_changed', { resellerId: resellerId, resellerCode: r.resellerCode, newStatus: newStatus });
    return r;
  }

  function getReseller(resellerId) {
    return loadResellers().find(function(r){ return r.id === resellerId; }) || null;
  }

  function getResellerByCode(code) {
    return loadResellers().find(function(r){ return r.resellerCode === code; }) || null;
  }

  // ===========================================================================
  // §8  EMPLOYEE / SALESPERSON CRUD  (§58 — Unique Salesperson Identity)
  // ===========================================================================

  const E_STATUS = {
    ACTIVE   : 'active',
    INACTIVE : 'inactive',
    SUSPENDED: 'suspended',
    REMOVED  : 'removed',
  };

  function createEmployee(resellerId, data) {
    var reseller = getReseller(resellerId);
    if (!reseller) throw new Error('Reseller not found: ' + resellerId);
    if (reseller.status !== R_STATUS.ACTIVE) throw new Error('Cannot add employees to a non-active reseller.');

    var empList = loadEmployees();
    var existingCount = empList.filter(function(e){ return e.resellerId === resellerId && e.status !== E_STATUS.REMOVED; }).length;
    var cfg = loadConfig();
    if (existingCount >= cfg.maxEmployeesPerReseller) {
      throw new Error('Maximum employees per reseller (' + cfg.maxEmployeesPerReseller + ') reached.');
    }

    // §58 — Generate employee code tied to reseller code
    var empCode = _generateEmployeeCode(reseller.resellerCode);
    _registerCode('E', empCode, resellerId);

    var employee = {
      id            : 'EMP_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2,5).toUpperCase(),
      employeeCode  : empCode,          // e.g. RS-2026-0001-SP001 — IMMUTABLE
      resellerCode  : reseller.resellerCode,  // parent identity link
      resellerId    : resellerId,

      name          : data.name        || '',
      mobile        : data.mobile      || '',
      email         : data.email       || '',
      role          : data.role        || 'salesperson', // salesperson | manager | admin
      designation   : data.designation || 'Sales Executive',
      status        : E_STATUS.ACTIVE,
      channel       : data.channel     || 'all', // all | counter | online | field | hotel

      // Identity security
      loginPin      : data.loginPin    || null,   // 4-6 digit PIN for salesperson app login
      biometricId   : null,

      // Commission
      personalCommissionRate: data.personalCommissionRate || null, // override reseller rate if set

      // Lifecycle
      createdAt     : Date.now(),
      updatedAt     : Date.now(),
      createdBy     : data.createdBy || 'reseller_admin',
      lastActiveAt  : null,

      // Analytics (live)
      _analytics: {
        totalAllocated: 0,
        totalIssued   : 0,
        totalRedeemed : 0,
        totalBalance  : 0,
        totalRevenue  : 0,
        lastIssuance  : null,
      },
    };

    empList.push(employee);
    _save(SK.EMPLOYEES, empList);
    _audit('employee_created', {
      resellerId  : resellerId,
      resellerCode: reseller.resellerCode,
      employeeCode: empCode,
      name        : employee.name,
    });
    return employee;
  }

  function updateEmployee(employeeId, updates) {
    var list = loadEmployees();
    var idx  = list.findIndex(function(e){ return e.id === employeeId; });
    if (idx < 0) throw new Error('Employee not found');
    var e = list[idx];
    // employeeCode is immutable — §58
    var immutable = ['id','employeeCode','resellerCode','resellerId','createdAt','createdBy'];
    Object.keys(updates).forEach(function(k){ if (immutable.indexOf(k) === -1) e[k] = updates[k]; });
    e.updatedAt = Date.now();
    list[idx] = e;
    _save(SK.EMPLOYEES, list);
    _audit('employee_updated', { resellerId: e.resellerId, resellerCode: e.resellerCode, employeeCode: e.employeeCode });
    return e;
  }

  function getEmployeesByReseller(resellerId) {
    return loadEmployees().filter(function(e){ return e.resellerId === resellerId && e.status !== E_STATUS.REMOVED; });
  }

  function getEmployee(employeeId) {
    return loadEmployees().find(function(e){ return e.id === employeeId; }) || null;
  }

  // ===========================================================================
  // §9  BULK BATCH MANAGEMENT  (§56 — Reseller-Coded Bulk Batch Identity)
  // ===========================================================================

  const B_STATUS = {
    DRAFT    : 'draft',
    PENDING  : 'pending_approval',
    APPROVED : 'approved',
    ACTIVE   : 'active',
    DEPLETED : 'depleted',
    EXPIRED  : 'expired',
    RECALLED : 'recalled',
    ARCHIVED : 'archived',
  };

  function createBatch(resellerId, data) {
    var reseller = getReseller(resellerId);
    if (!reseller) throw new Error('Reseller not found');
    if (reseller.status !== R_STATUS.ACTIVE) throw new Error('Reseller must be active to receive batches.');

    var cfg = loadConfig();
    var qty = parseInt(data.quantity) || 0;
    if (qty <= 0)     throw new Error('Batch quantity must be > 0.');
    if (qty > cfg.maxBatchQtyPerRequest) throw new Error('Batch quantity exceeds maximum (' + cfg.maxBatchQtyPerRequest + ').');

    // §56 — Batch code carries reseller identity
    var batchCode = _generateBatchCode(reseller.resellerCode);

    var batch = {
      id           : 'BAT_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2,5).toUpperCase(),
      batchCode    : batchCode,           // e.g. RS-2026-0001-FY26-B001 — IMMUTABLE
      resellerCode : reseller.resellerCode,  // §56 — explicit reseller identity
      resellerId   : resellerId,

      // Product
      productId    : data.productId    || '',
      productName  : data.productName  || '',
      parkKey      : data.parkKey      || '',
      category     : data.category     || 'adult',
      visitDate    : data.visitDate    || null,   // null = open-dated
      validityDays : data.validityDays || cfg.ticketValidityDays,
      validFrom    : data.validFrom    || new Date().toISOString().slice(0,10),
      validTo      : data.validTo      || null,

      // Quantity
      quantity     : qty,
      allocated    : 0,     // qty sub-allocated to employees
      issued       : 0,     // qty issued to customers
      redeemed     : 0,     // qty redeemed at gate
      recalled     : 0,     // qty recalled by admin
      expired      : 0,     // qty that expired unused
      balance      : qty,   // live: quantity - allocated - recalled

      // Commercial
      purchaseRate : data.purchaseRate || 0,    // reseller's net rate
      faceValue    : data.faceValue    || 0,    // customer face value
      totalCost    : qty * (data.purchaseRate || 0),
      paymentRef   : data.paymentRef   || null,
      paymentStatus: data.paymentStatus || 'unpaid',  // unpaid | partial | paid
      invoiceRef   : data.invoiceRef   || null,

      // Status
      status       : cfg.requireApprovalForBatch ? B_STATUS.PENDING : B_STATUS.ACTIVE,
      approvedBy   : cfg.requireApprovalForBatch ? null : 'auto',
      approvedAt   : cfg.requireApprovalForBatch ? null : Date.now(),

      // Delivery
      deliveryMethod: data.deliveryMethod || 'digital', // digital | csv_export | api | printed
      deliveredAt  : null,
      deliveryNotes: data.deliveryNotes || '',

      // Notes
      internalNotes: data.internalNotes || '',
      tags         : data.tags          || [],
      season       : cfg.currentSeason,

      // Lifecycle
      createdAt    : Date.now(),
      updatedAt    : Date.now(),
      createdBy    : data.createdBy || 'admin',
      expiresAt    : data.validTo
        ? new Date(data.validTo).getTime()
        : Date.now() + (data.validityDays || cfg.ticketValidityDays) * 86400000,
    };

    var batches = loadBatches();
    batches.push(batch);
    _save(SK.BATCHES, batches);

    // Update reseller analytics
    _updateResellerAnalytics(resellerId, { totalBatches: 1, totalAllocated: qty, lastBatchDate: new Date().toISOString().slice(0,10) });

    _audit('batch_created', {
      resellerId  : resellerId,
      resellerCode: reseller.resellerCode,
      batchCode   : batchCode,
      quantity    : qty,
      productId   : data.productId,
    });
    return batch;
  }

  function approveBatch(batchId, approvedBy) {
    var batches = loadBatches();
    var b = batches.find(function(b){ return b.id === batchId; });
    if (!b) throw new Error('Batch not found');
    b.status     = B_STATUS.ACTIVE;
    b.approvedBy = approvedBy || 'admin';
    b.approvedAt = Date.now();
    b.updatedAt  = Date.now();
    _save(SK.BATCHES, batches);
    _audit('batch_approved', { resellerId: b.resellerId, resellerCode: b.resellerCode, batchCode: b.batchCode });
    return b;
  }

  function getBatchesByReseller(resellerId) {
    return loadBatches().filter(function(b){ return b.resellerId === resellerId; });
  }

  function getBatch(batchId) {
    return loadBatches().find(function(b){ return b.id === batchId; }) || null;
  }

  // ===========================================================================
  // §10  SUB-ALLOCATION  (§59 — Traceability by Salesperson)
  // ===========================================================================

  function allocateToEmployee(resellerId, employeeId, batchId, quantity, notes) {
    var reseller = getReseller(resellerId);
    var emp      = getEmployee(employeeId);
    var batch    = getBatch(batchId);

    if (!reseller) throw new Error('Reseller not found');
    if (!emp)      throw new Error('Employee not found');
    if (!batch)    throw new Error('Batch not found');
    if (emp.resellerId !== resellerId) throw new Error('Employee does not belong to this reseller.');
    if (batch.resellerId !== resellerId) throw new Error('Batch does not belong to this reseller.');
    if (batch.status !== B_STATUS.ACTIVE) throw new Error('Batch is not active.');

    var qty = parseInt(quantity) || 0;
    if (qty <= 0) throw new Error('Allocation quantity must be > 0.');

    var currentBatchBalance = batch.quantity - batch.allocated - batch.recalled;
    if (qty > currentBatchBalance) throw new Error('Insufficient batch balance. Available: ' + currentBatchBalance);

    // §59 — Allocation code tied to both employee and batch identity
    var allocCode = _generateAllocationCode(emp.employeeCode);

    var allocation = {
      id             : 'ALC_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2,5).toUpperCase(),
      allocationCode : allocCode,          // e.g. RS-2026-0001-SP001-A001 — IMMUTABLE

      // §59 — Full identity chain (reseller → batch → employee)
      resellerCode   : reseller.resellerCode,
      resellerId     : resellerId,
      batchCode      : batch.batchCode,
      batchId        : batchId,
      employeeCode   : emp.employeeCode,
      employeeId     : employeeId,
      employeeName   : emp.name,
      productId      : batch.productId,
      productName    : batch.productName,
      parkKey        : batch.parkKey,
      category       : batch.category,

      // Quantities (§59 — full traceability)
      quantity       : qty,
      issued         : 0,
      redeemed       : 0,
      recalled       : 0,
      balance        : qty,

      // Validity
      validFrom      : batch.validFrom,
      validTo        : batch.validTo,

      // Status
      status         : 'active', // active | depleted | recalled | expired

      // Metadata
      notes          : notes || '',
      allocatedAt    : Date.now(),
      allocatedBy    : 'reseller_admin',
      updatedAt      : Date.now(),
    };

    // Update batch quantities
    var batches = loadBatches();
    var bIdx    = batches.findIndex(function(b){ return b.id === batchId; });
    batches[bIdx].allocated += qty;
    batches[bIdx].balance   = batches[bIdx].quantity - batches[bIdx].allocated - batches[bIdx].recalled;
    batches[bIdx].updatedAt = Date.now();
    if (batches[bIdx].balance === 0) batches[bIdx].status = B_STATUS.DEPLETED;
    _save(SK.BATCHES, batches);

    // Update employee analytics
    _updateEmployeeAnalytics(employeeId, { totalAllocated: qty, totalBalance: qty });

    var allocs = loadAllocations();
    allocs.push(allocation);
    _save(SK.ALLOCATIONS, allocs);

    _audit('allocation_created', {
      resellerId  : resellerId,
      resellerCode: reseller.resellerCode,
      batchCode   : batch.batchCode,
      employeeCode: emp.employeeCode,
      quantity    : qty,
    });
    return allocation;
  }

  function recallAllocation(allocationId, recallQty, reason) {
    var allocs  = loadAllocations();
    var aIdx    = allocs.findIndex(function(a){ return a.id === allocationId; });
    if (aIdx < 0) throw new Error('Allocation not found');
    var a   = allocs[aIdx];
    var qty = parseInt(recallQty) || a.balance;
    if (qty > a.balance) throw new Error('Recall qty exceeds available balance (' + a.balance + ').');

    a.recalled   += qty;
    a.balance    -= qty;
    a.updatedAt   = Date.now();
    if (a.balance === 0) a.status = 'recalled';
    allocs[aIdx]  = a;
    _save(SK.ALLOCATIONS, allocs);

    // Return qty to batch
    var batches = loadBatches();
    var b = batches.find(function(b){ return b.id === a.batchId; });
    if (b) {
      b.recalled  += qty;
      b.allocated -= qty;
      b.balance    = b.quantity - b.allocated - b.recalled;
      b.updatedAt  = Date.now();
      _save(SK.BATCHES, batches);
    }

    _updateEmployeeAnalytics(a.employeeId, { totalAllocated: -qty, totalBalance: -qty });
    _audit('allocation_recalled', { resellerId: a.resellerId, resellerCode: a.resellerCode, batchCode: a.batchCode, employeeCode: a.employeeCode, qty: qty, reason: reason });
    return a;
  }

  function getAllocationsByEmployee(employeeId) {
    return loadAllocations().filter(function(a){ return a.employeeId === employeeId; });
  }

  function getAllocationsByBatch(batchId) {
    return loadAllocations().filter(function(a){ return a.batchId === batchId; });
  }

  function getAllocationsByReseller(resellerId) {
    return loadAllocations().filter(function(a){ return a.resellerId === resellerId; });
  }

  // ===========================================================================
  // §11  CUSTOMER TICKET ISSUANCE  (§57 — Traceable issued tickets)
  // ===========================================================================

  function issueTicket(allocationId, customerData) {
    var allocs  = loadAllocations();
    var aIdx    = allocs.findIndex(function(a){ return a.id === allocationId; });
    if (aIdx < 0) throw new Error('Allocation not found');
    var a = allocs[aIdx];
    if (a.status !== 'active') throw new Error('Allocation is not active.');
    if (a.balance < 1) throw new Error('No balance remaining in this allocation.');

    var reseller = getReseller(a.resellerId);
    var emp      = loadEmployees().find(function(e){ return e.id === a.employeeId; });

    // §57 — Ticket code traces reseller + employee + batch
    var ticketCode = _generateTicketCode(a.resellerCode, a.employeeCode);

    // QR payload — carries full identity chain
    var qrPayload = {
      ticketCode   : ticketCode,
      resellerCode : a.resellerCode,
      batchCode    : a.batchCode,
      employeeCode : a.employeeCode,
      allocationId : allocationId,
      productId    : a.productId,
      parkKey      : a.parkKey,
      category     : a.category,
      visitDate    : customerData.visitDate || a.validFrom,
      issuedAt     : Date.now(),
      nonce        : Math.random().toString(36).slice(2,10).toUpperCase(),
    };

    var ticket = {
      id              : 'TKT_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).slice(2,5).toUpperCase(),
      ticketCode      : ticketCode,          // e.g. RS-2026-0001-SP001-TKT-00001
      qrToken         : btoa(JSON.stringify(qrPayload)),

      // §57 — Full identity chain embedded in every ticket
      resellerCode    : a.resellerCode,
      resellerId      : a.resellerId,
      batchCode       : a.batchCode,
      batchId         : a.batchId,
      employeeCode    : a.employeeCode,
      employeeId      : a.employeeId,
      allocationCode  : a.allocationCode,
      allocationId    : allocationId,

      // Product
      productId       : a.productId,
      productName     : a.productName,
      parkKey         : a.parkKey,
      category        : a.category,

      // Customer
      customerName    : customerData.name    || '',
      customerMobile  : customerData.mobile  || '',
      customerEmail   : customerData.email   || '',
      visitDate       : customerData.visitDate || a.validFrom,
      guestCount      : customerData.guestCount || 1,

      // Validity
      validFrom       : a.validFrom,
      validTo         : a.validTo,
      issuedAt        : Date.now(),

      // Status
      status          : 'issued', // issued | redeemed | cancelled | expired | partial
      redeemedAt      : null,
      redeemedBy      : null,
      cancellationRef : null,

      // Commercial
      salePrice       : customerData.salePrice   || 0,
      resellerId_name : reseller ? reseller.tradeName : '',
      employeeName    : emp ? emp.name : '',
    };

    // Update allocation balance
    allocs[aIdx].issued  += 1;
    allocs[aIdx].balance -= 1;
    allocs[aIdx].updatedAt = Date.now();
    if (allocs[aIdx].balance === 0) allocs[aIdx].status = 'depleted';
    _save(SK.ALLOCATIONS, allocs);

    // Update batch issued count
    var batches = loadBatches();
    var b = batches.find(function(b){ return b.id === a.batchId; });
    if (b) { b.issued++; b.updatedAt = Date.now(); _save(SK.BATCHES, batches); }

    // Update employee analytics
    _updateEmployeeAnalytics(a.employeeId, { totalIssued: 1, totalBalance: -1, lastIssuance: new Date().toISOString().slice(0,10) });

    // Update reseller analytics
    _updateResellerAnalytics(a.resellerId, { totalIssued: 1, totalRevenue: ticket.salePrice, lastIssuanceDate: new Date().toISOString().slice(0,10) });

    var tickets = loadTickets();
    tickets.push(ticket);
    _save(SK.TICKETS, tickets);

    _audit('ticket_issued', {
      resellerId  : a.resellerId,
      resellerCode: a.resellerCode,
      batchCode   : a.batchCode,
      employeeCode: a.employeeCode,
      ticketCode  : ticketCode,
      customerName: customerData.name,
    });

    return ticket;
  }

  // Bulk issuance (multiple tickets at once from one allocation)
  function bulkIssueTickets(allocationId, customersArray) {
    var results = [];
    for (var i = 0; i < customersArray.length; i++) {
      try {
        results.push({ ok: true, ticket: issueTicket(allocationId, customersArray[i]) });
      } catch (e) {
        results.push({ ok: false, error: e.message, index: i });
      }
    }
    return results;
  }

  // ===========================================================================
  // §12  REDEMPTION ENGINE  (§57, §63 — identity flows through redemption)
  // ===========================================================================

  function redeemTicket(ticketCodeOrQR, gateInfo) {
    var tickets = loadTickets();
    var ticket  = null;

    // Try QR token decode first
    try {
      var qp = JSON.parse(atob(ticketCodeOrQR));
      ticket = tickets.find(function(t){ return t.ticketCode === qp.ticketCode; });
    } catch(_) {}

    // Fallback: match by ticketCode directly
    if (!ticket) ticket = tickets.find(function(t){ return t.ticketCode === ticketCodeOrQR; });
    if (!ticket) return { ok: false, reason: 'Ticket not found', code: 'NOT_FOUND' };

    if (ticket.status === 'redeemed') return { ok: false, reason: 'Ticket already redeemed', code: 'ALREADY_REDEEMED', redeemedAt: ticket.redeemedAt };
    if (ticket.status === 'cancelled') return { ok: false, reason: 'Ticket has been cancelled', code: 'CANCELLED' };
    if (ticket.status === 'expired')   return { ok: false, reason: 'Ticket has expired', code: 'EXPIRED' };

    // Date validity check
    var today = new Date().toISOString().slice(0,10);
    if (ticket.visitDate && ticket.visitDate !== today) {
      return { ok: false, reason: 'Ticket is not valid for today. Valid for: ' + ticket.visitDate, code: 'DATE_MISMATCH' };
    }
    if (ticket.validTo && today > ticket.validTo) {
      // Auto-expire
      var tList = loadTickets();
      var tIdx  = tList.findIndex(function(t){ return t.id === ticket.id; });
      tList[tIdx].status = 'expired'; _save(SK.TICKETS, tList);
      return { ok: false, reason: 'Ticket validity has expired', code: 'EXPIRED' };
    }

    // REDEEM
    var now = Date.now();
    var tList = loadTickets();
    var tIdx  = tList.findIndex(function(t){ return t.id === ticket.id; });
    tList[tIdx].status     = 'redeemed';
    tList[tIdx].redeemedAt = now;
    tList[tIdx].redeemedBy = (gateInfo && gateInfo.gateId) || 'gate';
    _save(SK.TICKETS, tList);

    // Update allocation redeemed count
    var allocs = loadAllocations();
    var a      = allocs.find(function(a){ return a.id === ticket.allocationId; });
    if (a) { a.redeemed++; a.updatedAt = now; _save(SK.ALLOCATIONS, allocs); }

    // Update batch redeemed count
    var batches = loadBatches();
    var b       = batches.find(function(b){ return b.id === ticket.batchId; });
    if (b) { b.redeemed++; b.updatedAt = now; _save(SK.BATCHES, batches); }

    // Update employee analytics
    _updateEmployeeAnalytics(ticket.employeeId, { totalRedeemed: 1 });

    // Update reseller analytics
    _updateResellerAnalytics(ticket.resellerId, { totalRedeemed: 1 });

    // Log redemption with full identity chain
    var redEntry = {
      id           : 'RED_' + now.toString(36).toUpperCase(),
      ticketCode   : ticket.ticketCode,
      resellerCode : ticket.resellerCode,
      batchCode    : ticket.batchCode,
      employeeCode : ticket.employeeCode,
      productId    : ticket.productId,
      parkKey      : ticket.parkKey,
      category     : ticket.category,
      customerName : ticket.customerName,
      gateId       : (gateInfo && gateInfo.gateId)   || '',
      agentId      : (gateInfo && gateInfo.agentId)  || '',
      redeemedAt   : now,
    };
    var reds = loadRedemptions();
    reds.unshift(redEntry);
    if (reds.length > 50000) reds.length = 50000;
    _save(SK.REDEMPTIONS, reds);

    _audit('ticket_redeemed', {
      resellerId  : ticket.resellerId,
      resellerCode: ticket.resellerCode,
      batchCode   : ticket.batchCode,
      employeeCode: ticket.employeeCode,
      ticketCode  : ticket.ticketCode,
    });

    return {
      ok          : true,
      ticket      : tList[tIdx],
      redemption  : redEntry,
      message     : 'Entry granted. Welcome to ' + ticket.productName + '!',
    };
  }

  // ===========================================================================
  // §13  ANALYTICS HELPERS
  // ===========================================================================

  function _updateResellerAnalytics(resellerId, delta) {
    var list = loadResellers();
    var r    = list.find(function(r){ return r.id === resellerId; });
    if (!r) return;
    var a    = r._analytics || {};
    Object.keys(delta).forEach(function(k) {
      if (typeof delta[k] === 'number') a[k] = (a[k] || 0) + delta[k];
      else a[k] = delta[k];
    });
    r._analytics = a;
    _save(SK.RESELLERS, list);
  }

  function _updateEmployeeAnalytics(employeeId, delta) {
    var list = loadEmployees();
    var e    = list.find(function(e){ return e.id === employeeId; });
    if (!e) return;
    var a    = e._analytics || {};
    Object.keys(delta).forEach(function(k) {
      if (typeof delta[k] === 'number') a[k] = (a[k] || 0) + delta[k];
      else a[k] = delta[k];
    });
    e._analytics = a;
    _save(SK.EMPLOYEES, list);
  }

  // ===========================================================================
  // §14  REPORTING ENGINE  (§61, §62 — Full traceability reports)
  // ===========================================================================

  // §62 — Central report: by reseller code
  function reportByReseller(filters) {
    filters = filters || {};
    var resellers = loadResellers();
    var batches   = loadBatches();
    var tickets   = loadTickets();
    var allocs    = loadAllocations();

    if (filters.resellerId)   resellers = resellers.filter(function(r){ return r.id   === filters.resellerId; });
    if (filters.resellerCode) resellers = resellers.filter(function(r){ return r.resellerCode === filters.resellerCode; });
    if (filters.status)       resellers = resellers.filter(function(r){ return r.status === filters.status; });

    return resellers.map(function(r) {
      var rBatches = batches.filter(function(b){ return b.resellerId === r.id; });
      var rAllocs  = allocs.filter(function(a){ return a.resellerId === r.id; });
      var rTickets = tickets.filter(function(t){ return t.resellerId === r.id; });

      // Date range filter
      if (filters.fromDate || filters.toDate) {
        var fd = filters.fromDate ? new Date(filters.fromDate).getTime() : 0;
        var td = filters.toDate   ? new Date(filters.toDate).getTime()   : Date.now();
        rTickets = rTickets.filter(function(t){ return t.issuedAt >= fd && t.issuedAt <= td; });
      }

      var issued   = rTickets.length;
      var redeemed = rTickets.filter(function(t){ return t.status === 'redeemed'; }).length;
      var expired  = rTickets.filter(function(t){ return t.status === 'expired';  }).length;
      var revenue  = rTickets.reduce(function(s,t){ return s + (t.salePrice||0); }, 0);
      var totalQty = rBatches.reduce(function(s,b){ return s + b.quantity; }, 0);
      var remaining = rAllocs.reduce(function(s,a){ return s + a.balance; }, 0);

      return {
        resellerId  : r.id,
        resellerCode: r.resellerCode,
        resellerName: r.tradeName || r.name,
        tier        : r.tier,
        status      : r.status,
        commissionRate: r.commissionRate,
        totalBatches: rBatches.length,
        totalQty    : totalQty,
        issued      : issued,
        redeemed    : redeemed,
        expired     : expired,
        remaining   : remaining,
        revenue     : revenue,
        commission  : Math.round(revenue * r.commissionRate / 100),
        redemptionRate: issued > 0 ? Math.round(redeemed / issued * 100) : 0,
      };
    });
  }

  // §62 — Central report: by batch code
  function reportByBatch(filters) {
    filters = filters || {};
    var batches   = loadBatches();
    var allocs    = loadAllocations();
    var tickets   = loadTickets();

    if (filters.resellerId)   batches = batches.filter(function(b){ return b.resellerId   === filters.resellerId; });
    if (filters.resellerCode) batches = batches.filter(function(b){ return b.resellerCode === filters.resellerCode; });
    if (filters.batchCode)    batches = batches.filter(function(b){ return b.batchCode    === filters.batchCode; });
    if (filters.status)       batches = batches.filter(function(b){ return b.status       === filters.status; });
    if (filters.productId)    batches = batches.filter(function(b){ return b.productId    === filters.productId; });

    return batches.map(function(b) {
      var bAllocs  = allocs.filter(function(a){ return a.batchId  === b.id; });
      var bTickets = tickets.filter(function(t){ return t.batchId === b.id; });
      var redeemed = bTickets.filter(function(t){ return t.status === 'redeemed'; }).length;
      var expired  = bTickets.filter(function(t){ return t.status === 'expired';  }).length;
      var empBreak = {};
      bAllocs.forEach(function(a) {
        empBreak[a.employeeCode] = {
          employeeCode: a.employeeCode,
          employeeName: a.employeeName,
          allocated   : (empBreak[a.employeeCode]||{allocated:0}).allocated + a.quantity,
          issued      : (empBreak[a.employeeCode]||{issued:0}).issued       + a.issued,
          balance     : (empBreak[a.employeeCode]||{balance:0}).balance     + a.balance,
        };
      });

      return {
        batchId     : b.id,
        batchCode   : b.batchCode,
        resellerCode: b.resellerCode,
        productId   : b.productId,
        productName : b.productName,
        parkKey     : b.parkKey,
        category    : b.category,
        status      : b.status,
        quantity    : b.quantity,
        allocated   : b.allocated,
        issued      : b.issued,
        redeemed    : redeemed,
        expired     : expired,
        balance     : b.balance,
        validFrom   : b.validFrom,
        validTo     : b.validTo,
        paymentStatus: b.paymentStatus,
        employeeBreakdown: Object.values(empBreak),
        createdAt   : b.createdAt,
      };
    });
  }

  // §61 — Salesperson / Employee performance report
  function reportByEmployee(filters) {
    filters = filters || {};
    var employees = loadEmployees();
    var allocs    = loadAllocations();
    var tickets   = loadTickets();

    if (filters.resellerId)   employees = employees.filter(function(e){ return e.resellerId   === filters.resellerId; });
    if (filters.resellerCode) employees = employees.filter(function(e){ return e.resellerCode === filters.resellerCode; });
    if (filters.employeeCode) employees = employees.filter(function(e){ return e.employeeCode === filters.employeeCode; });
    if (filters.status)       employees = employees.filter(function(e){ return e.status       === filters.status; });

    var fd = filters.fromDate ? new Date(filters.fromDate).getTime() : 0;
    var td = filters.toDate   ? new Date(filters.toDate).getTime()   : Date.now();

    return employees.map(function(e) {
      var eAllocs  = allocs.filter(function(a){ return a.employeeId === e.id; });
      var eTickets = tickets.filter(function(t){ return t.employeeId === e.id; });

      // Apply date filter to tickets
      if (filters.fromDate || filters.toDate) {
        eTickets = eTickets.filter(function(t){ return t.issuedAt >= fd && t.issuedAt <= td; });
      }

      var redeemed = eTickets.filter(function(t){ return t.status === 'redeemed'; }).length;
      var expired  = eTickets.filter(function(t){ return t.status === 'expired';  }).length;
      var revenue  = eTickets.reduce(function(s,t){ return s + (t.salePrice||0); }, 0);
      var balance  = eAllocs.reduce(function(s,a){ return s + a.balance; }, 0);
      var allocated= eAllocs.reduce(function(s,a){ return s + a.quantity; }, 0);

      // Batch breakdown
      var batchBreak = {};
      eAllocs.forEach(function(a) {
        if (!batchBreak[a.batchCode]) {
          batchBreak[a.batchCode] = { batchCode: a.batchCode, allocated: 0, issued: 0, balance: 0 };
        }
        batchBreak[a.batchCode].allocated += a.quantity;
        batchBreak[a.batchCode].issued    += a.issued;
        batchBreak[a.batchCode].balance   += a.balance;
      });

      return {
        employeeId   : e.id,
        employeeCode : e.employeeCode,
        employeeName : e.name,
        resellerCode : e.resellerCode,
        role         : e.role,
        channel      : e.channel,
        status       : e.status,
        allocated    : allocated,
        issued       : eTickets.length,
        redeemed     : redeemed,
        expired      : expired,
        balance      : balance,
        revenue      : revenue,
        redemptionRate: eTickets.length > 0 ? Math.round(redeemed / eTickets.length * 100) : 0,
        utilizationRate: allocated > 0 ? Math.round(eTickets.length / allocated * 100) : 0,
        lastIssuance : e._analytics ? e._analytics.lastIssuance : null,
        batchBreakdown: Object.values(batchBreak),
      };
    }).sort(function(a,b){ return b.issued - a.issued; }); // §61 — ranked by sales
  }

  // §62 — Central report: ticket provenance (full chain per ticket)
  function reportTicketProvenance(filters) {
    filters = filters || {};
    var tickets = loadTickets();
    if (filters.resellerId)   tickets = tickets.filter(function(t){ return t.resellerId   === filters.resellerId; });
    if (filters.resellerCode) tickets = tickets.filter(function(t){ return t.resellerCode === filters.resellerCode; });
    if (filters.batchCode)    tickets = tickets.filter(function(t){ return t.batchCode    === filters.batchCode; });
    if (filters.employeeCode) tickets = tickets.filter(function(t){ return t.employeeCode === filters.employeeCode; });
    if (filters.status)       tickets = tickets.filter(function(t){ return t.status       === filters.status; });
    if (filters.fromDate || filters.toDate) {
      var fd = filters.fromDate ? new Date(filters.fromDate).getTime() : 0;
      var td = filters.toDate   ? new Date(filters.toDate).getTime()   : Date.now();
      tickets = tickets.filter(function(t){ return t.issuedAt >= fd && t.issuedAt <= td; });
    }
    if (filters.limit) tickets = tickets.slice(0, filters.limit);
    return tickets;
  }

  // Quick summary for dashboard cards
  function dashboardSummary(resellerId) {
    var batches = loadBatches().filter(function(b){ return !resellerId || b.resellerId === resellerId; });
    var allocs  = loadAllocations().filter(function(a){ return !resellerId || a.resellerId === resellerId; });
    var tickets = loadTickets().filter(function(t){ return !resellerId || t.resellerId === resellerId; });
    var today   = new Date().toISOString().slice(0,10);
    return {
      totalBatches    : batches.length,
      activeBatches   : batches.filter(function(b){ return b.status === 'active'; }).length,
      totalAllocated  : allocs.reduce(function(s,a){ return s + a.quantity; }, 0),
      totalBalance    : allocs.reduce(function(s,a){ return s + a.balance;  }, 0),
      totalIssued     : tickets.length,
      totalRedeemed   : tickets.filter(function(t){ return t.status === 'redeemed'; }).length,
      totalExpired    : tickets.filter(function(t){ return t.status === 'expired';  }).length,
      issuedToday     : tickets.filter(function(t){ return new Date(t.issuedAt).toISOString().slice(0,10) === today; }).length,
      redeemedToday   : tickets.filter(function(t){ return t.status === 'redeemed' && t.redeemedAt && new Date(t.redeemedAt).toISOString().slice(0,10) === today; }).length,
      totalRevenue    : tickets.reduce(function(s,t){ return s + (t.salePrice||0); }, 0),
    };
  }

  // ===========================================================================
  // §15  SEED DEMO DATA  (for development/demo only)
  // ===========================================================================
  function seedDemoData() {
    if (loadResellers().length > 0) return; // already seeded

    try {
      // Create 3 demo resellers
      var r1 = createReseller({
        customCode: 'TM-INDIA', name: 'TravelMart India Pvt Ltd', tradeName: 'TravelMart India',
        type: 'company', category: 'travel_agent', tier: 'platinum',
        contactPerson: 'Rajesh Khanna', email: 'rajesh@travelmart.in', mobile: '9876543210',
        city: 'Delhi', state: 'Delhi', gstNumber: '07AABCT1234Z1ZG',
        commissionRate: 15, paymentTerms: 'credit_30', creditLimit: 500000,
        allowedProducts: ['WP_ADULT','WP_CHILD','AP_ADULT','AP_CHILD','CB_ADULT','CB_CHILD'],
        maxBatchSize: 5000,
      });
      activateReseller(r1.id);

      var r2 = createReseller({
        customCode: 'MMT-NCR', name: 'MakeMyTrip NCR', tradeName: 'MakeMyTrip',
        type: 'platform', category: 'ota', tier: 'gold',
        contactPerson: 'Priya Sharma', email: 'priya@mmt.in', mobile: '9876500001',
        city: 'Gurugram', state: 'Haryana', gstNumber: '06AAACM1234C1Z5',
        commissionRate: 12, paymentTerms: 'credit_15', creditLimit: 200000,
        allowedProducts: ['WP_ADULT','WP_CHILD','CB_ADULT','CB_CHILD'],
        maxBatchSize: 2000,
      });
      activateReseller(r2.id);

      var r3 = createReseller({
        name: 'Sunrise Tours & Travels', tradeName: 'Sunrise Tours',
        type: 'agency', category: 'tour_operator', tier: 'silver',
        contactPerson: 'Amit Verma', email: 'amit@sunrisetours.co.in', mobile: '9845600002',
        city: 'Noida', state: 'Uttar Pradesh', gstNumber: '09AACTS1234Z1ZD',
        commissionRate: 10, paymentTerms: 'advance', creditLimit: 50000,
        allowedProducts: ['WP_ADULT','WP_CHILD','AP_ADULT','AP_CHILD'],
        maxBatchSize: 500,
      });
      activateReseller(r3.id);

      // Create employees for r1
      var sp1 = createEmployee(r1.id, { name: 'Suresh Kumar',   mobile: '9811111111', email: 'suresh@travelmart.in',   role: 'salesperson', channel: 'counter', loginPin: '1234' });
      var sp2 = createEmployee(r1.id, { name: 'Meena Gupta',    mobile: '9822222222', email: 'meena@travelmart.in',    role: 'salesperson', channel: 'online',  loginPin: '2345' });
      var sp3 = createEmployee(r1.id, { name: 'Arjun Patel',    mobile: '9833333333', email: 'arjun@travelmart.in',    role: 'manager',     channel: 'all',     loginPin: '3456' });
      var sp4 = createEmployee(r1.id, { name: 'Kavitha Rao',    mobile: '9844444444', email: 'kavitha@travelmart.in',  role: 'salesperson', channel: 'field',   loginPin: '4567' });

      // Employees for r2
      var sp5 = createEmployee(r2.id, { name: 'Rohan Das',      mobile: '9855555555', email: 'rohan@mmt.in',          role: 'salesperson', channel: 'online',  loginPin: '5678' });
      var sp6 = createEmployee(r2.id, { name: 'Nisha Singh',    mobile: '9866666666', email: 'nisha@mmt.in',          role: 'salesperson', channel: 'online',  loginPin: '6789' });

      // Employees for r3
      var sp7 = createEmployee(r3.id, { name: 'Deepak Tiwari',  mobile: '9877777777', email: 'deepak@sunrise.in',     role: 'salesperson', channel: 'counter', loginPin: '7890' });

      // Create batches for r1
      var today = new Date();
      var validTo = new Date(today.getTime() + 180 * 86400000).toISOString().slice(0,10);
      var b1 = createBatch(r1.id, { productId: 'WP_ADULT', productName: 'Water Park — Adult', parkKey: 'WATER_DAY', category: 'adult', quantity: 500, purchaseRate: 1150, faceValue: 1299, validFrom: today.toISOString().slice(0,10), validTo: validTo, paymentRef: 'PAY-001', paymentStatus: 'paid', deliveryMethod: 'digital', internalNotes: 'Summer season batch' });
      var b2 = createBatch(r1.id, { productId: 'WP_CHILD', productName: 'Water Park — Child', parkKey: 'WATER_DAY', category: 'child', quantity: 300, purchaseRate: 799, faceValue: 899, validFrom: today.toISOString().slice(0,10), validTo: validTo, paymentRef: 'PAY-001', paymentStatus: 'paid', deliveryMethod: 'digital' });
      var b3 = createBatch(r1.id, { productId: 'CB_ADULT',  productName: 'Combo — Adult',      parkKey: 'COMBO_DAY', category: 'adult', quantity: 200, purchaseRate: 1799, faceValue: 1999, validFrom: today.toISOString().slice(0,10), validTo: validTo, paymentRef: 'PAY-002', paymentStatus: 'paid', deliveryMethod: 'digital' });

      // Batch for r2
      var b4 = createBatch(r2.id, { productId: 'WP_ADULT', productName: 'Water Park — Adult', parkKey: 'WATER_DAY', category: 'adult', quantity: 300, purchaseRate: 1169, faceValue: 1299, validFrom: today.toISOString().slice(0,10), validTo: validTo, paymentStatus: 'paid' });

      // Batch for r3
      var b5 = createBatch(r3.id, { productId: 'AP_ADULT', productName: 'Amusement Park — Adult', parkKey: 'AMUSEMENT_DAY', category: 'adult', quantity: 150, purchaseRate: 1079, faceValue: 1199, validFrom: today.toISOString().slice(0,10), validTo: validTo, paymentStatus: 'paid' });

      // Sub-allocations for r1 batch b1
      var a1 = allocateToEmployee(r1.id, sp1.id, b1.id, 150, 'Counter sales allocation');
      var a2 = allocateToEmployee(r1.id, sp2.id, b1.id, 100, 'Online platform allocation');
      var a3 = allocateToEmployee(r1.id, sp4.id, b1.id,  80, 'Field team allocation');
      // Sub-allocations for r1 batch b2
      var a4 = allocateToEmployee(r1.id, sp1.id, b2.id,  80, 'Counter child tickets');
      var a5 = allocateToEmployee(r1.id, sp2.id, b2.id,  60, 'Online child tickets');
      // r2 allocations
      var a6 = allocateToEmployee(r2.id, sp5.id, b4.id, 150, 'OTA primary allocation');
      var a7 = allocateToEmployee(r2.id, sp6.id, b4.id,  80, 'OTA secondary allocation');

      // Issue some sample tickets for sp1
      var customers = [
        { name: 'Ravi Shankar', mobile: '9700000001', email: 'ravi@mail.com', visitDate: today.toISOString().slice(0,10), salePrice: 1299 },
        { name: 'Sunita Joshi', mobile: '9700000002', email: '', visitDate: today.toISOString().slice(0,10), salePrice: 1299 },
        { name: 'Mohan Lal',    mobile: '9700000003', email: '', visitDate: today.toISOString().slice(0,10), salePrice: 1299 },
        { name: 'Preethi K',    mobile: '9700000004', email: '', visitDate: today.toISOString().slice(0,10), salePrice: 1299 },
        { name: 'Ashok Mehta',  mobile: '9700000005', email: '', visitDate: today.toISOString().slice(0,10), salePrice: 1299 },
      ];
      var tkts = bulkIssueTickets(a1.id, customers);

      // Issue from sp2
      var tkt2 = issueTicket(a2.id, { name: 'Kavya Nair', mobile: '9700000010', visitDate: today.toISOString().slice(0,10), salePrice: 1299 });
      var tkt3 = issueTicket(a2.id, { name: 'Vivek Iyer', mobile: '9700000011', visitDate: today.toISOString().slice(0,10), salePrice: 1299 });

      // Redeem 3 of the sp1 tickets
      if (tkts[0].ok) redeemTicket(tkts[0].ticket.ticketCode, { gateId: 'GATE-W1', agentId: 'GATE_AGT_01' });
      if (tkts[1].ok) redeemTicket(tkts[1].ticket.ticketCode, { gateId: 'GATE-W1', agentId: 'GATE_AGT_01' });
      if (tkts[2].ok) redeemTicket(tkts[2].ticket.ticketCode, { gateId: 'GATE-W2', agentId: 'GATE_AGT_02' });

    } catch(e) {
      console.warn('ResellerEngine seed error:', e.message);
    }
  }

  // ===========================================================================
  // §16  PUBLIC API
  // ===========================================================================
  return {
    // Config
    loadConfig   : loadConfig,
    saveConfig   : saveConfig,

    // Reseller CRUD (§55)
    createReseller    : createReseller,
    updateReseller    : updateReseller,
    activateReseller  : activateReseller,
    setResellerStatus : setResellerStatus,
    getReseller       : getReseller,
    getResellerByCode : getResellerByCode,
    loadResellers     : loadResellers,

    // Employee CRUD (§58)
    createEmployee        : createEmployee,
    updateEmployee        : updateEmployee,
    getEmployee           : getEmployee,
    getEmployeesByReseller: getEmployeesByReseller,
    loadEmployees         : loadEmployees,

    // Batch (§56)
    createBatch       : createBatch,
    approveBatch      : approveBatch,
    getBatch          : getBatch,
    getBatchesByReseller: getBatchesByReseller,
    loadBatches       : loadBatches,

    // Allocation (§59)
    allocateToEmployee    : allocateToEmployee,
    recallAllocation      : recallAllocation,
    getAllocationsByEmployee: getAllocationsByEmployee,
    getAllocationsByBatch  : getAllocationsByBatch,
    getAllocationsByReseller: getAllocationsByReseller,
    loadAllocations       : loadAllocations,

    // Issuance (§57)
    issueTicket       : issueTicket,
    bulkIssueTickets  : bulkIssueTickets,
    loadTickets       : loadTickets,

    // Redemption (§63)
    redeemTicket      : redeemTicket,
    loadRedemptions   : loadRedemptions,

    // Reporting (§61, §62)
    reportByReseller     : reportByReseller,
    reportByBatch        : reportByBatch,
    reportByEmployee     : reportByEmployee,
    reportTicketProvenance: reportTicketProvenance,
    dashboardSummary     : dashboardSummary,

    // Audit (§63)
    readAudit        : readAudit,

    // Demo
    seedDemoData     : seedDemoData,

    // Constants
    R_STATUS  : R_STATUS,
    E_STATUS  : E_STATUS,
    B_STATUS  : B_STATUS,
    SK        : SK,
  };
})();

window.ResellerEngine = ResellerEngine;

// Auto-seed demo data on first load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ ResellerEngine.seedDemoData(); });
} else {
  setTimeout(function(){ ResellerEngine.seedDemoData(); }, 0);
}
