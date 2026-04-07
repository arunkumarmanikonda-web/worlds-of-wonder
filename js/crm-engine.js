/**
 * WOW Call Center CRM Engine v1.0
 * Core workflow, assignment, escalation, SLA, timeline, booking-lookup logic
 * Worlds of Wonder — Enterprise Call Center Operations Platform
 */

window.WOWCRM = (function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
     CONSTANTS & CONFIGURATION
  ═══════════════════════════════════════════════════════════ */

  const VERSION = '1.0.0';
  const STORAGE_KEY = 'wow_crm_session';
  const CASES_TABLE = 'crm_cases';
  const TIMELINE_TABLE = 'crm_timeline';
  const USERS_TABLE = 'crm_users';
  const BOOKINGS_TABLE = 'crm_bookings_cache';
  const ESCALATION_TABLE = 'crm_escalation_rules';

  // Case counter stored in localStorage
  const CASE_COUNTER_KEY = 'wow_crm_case_counter';

  const STATUS_CONFIG = {
    NEW:               { label: 'New',               color: '#64748b', bg: 'rgba(100,116,139,.12)', icon: '🆕' },
    RECORDED:          { label: 'Recorded',           color: '#6366f1', bg: 'rgba(99,102,241,.12)',  icon: '📋' },
    PENDING_ASSIGNMENT:{ label: 'Pending Assignment', color: '#f59e0b', bg: 'rgba(245,158,11,.12)',  icon: '⏳' },
    ASSIGNED:          { label: 'Assigned',           color: '#3b82f6', bg: 'rgba(59,130,246,.12)',  icon: '👤' },
    IN_PROGRESS:       { label: 'In Progress',        color: '#8b5cf6', bg: 'rgba(139,92,246,.12)',  icon: '🔄' },
    AWAITING_INTERNAL: { label: 'Awaiting Internal',  color: '#f97316', bg: 'rgba(249,115,22,.12)',  icon: '🏢' },
    AWAITING_CUSTOMER: { label: 'Awaiting Customer',  color: '#06b6d4', bg: 'rgba(6,182,212,.12)',   icon: '📞' },
    RESOLVED:          { label: 'Resolved',           color: '#10b981', bg: 'rgba(16,185,129,.12)',  icon: '✅' },
    CLOSED:            { label: 'Closed',             color: '#22c55e', bg: 'rgba(34,197,94,.1)',    icon: '🔒' },
    REOPENED:          { label: 'Reopened',           color: '#ef4444', bg: 'rgba(239,68,68,.12)',   icon: '🔓' },
    ESCALATED:         { label: 'Escalated',          color: '#dc2626', bg: 'rgba(220,38,38,.12)',   icon: '🚨' },
    CANCELLED:         { label: 'Cancelled',          color: '#6b7280', bg: 'rgba(107,114,128,.1)',  icon: '❌' },
  };

  const PRIORITY_CONFIG = {
    LOW:      { label: 'Low',      color: '#6b7280', bg: 'rgba(107,114,128,.1)', icon: '🔵', slaHours: 72 },
    NORMAL:   { label: 'Normal',   color: '#3b82f6', bg: 'rgba(59,130,246,.1)',  icon: '⚪', slaHours: 24 },
    HIGH:     { label: 'High',     color: '#f59e0b', bg: 'rgba(245,158,11,.1)',  icon: '🟡', slaHours: 8  },
    URGENT:   { label: 'Urgent',   color: '#f97316', bg: 'rgba(249,115,22,.1)',  icon: '🟠', slaHours: 4  },
    CRITICAL: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,.1)',   icon: '🔴', slaHours: 2  },
  };

  const ISSUE_CATEGORIES = [
    { id: 'BOOKING_SUPPORT',        label: '🎟 Booking Support',          dept: 'CALL_CENTER',         segment: 'INDIVIDUAL' },
    { id: 'RESCHEDULING',           label: '📅 Rescheduling Request',      dept: 'OPERATIONS',          segment: 'INDIVIDUAL' },
    { id: 'REFUND',                 label: '💰 Refund Request',            dept: 'FINANCE',             segment: 'INDIVIDUAL' },
    { id: 'MODIFICATION',           label: '✏️ Booking Modification',      dept: 'OPERATIONS',          segment: 'INDIVIDUAL' },
    { id: 'PAYMENT_ISSUE',          label: '💳 Payment Issue',             dept: 'FINANCE',             segment: 'INDIVIDUAL' },
    { id: 'QR_ENTRY_ISSUE',         label: '📱 QR / Entry Issue',          dept: 'OPERATIONS',          segment: 'INDIVIDUAL' },
    { id: 'OFFER_ISSUE',            label: '🏷 Offer / Promo Issue',       dept: 'DIGITAL_MARKETING',   segment: 'INDIVIDUAL' },
    { id: 'GENERAL_INFO',           label: 'ℹ️ General Inquiry',           dept: 'CALL_CENTER',         segment: 'GENERAL'   },
    { id: 'COMPLAINT',              label: '⚠️ Complaint',                 dept: 'CALL_CENTER',         segment: 'GENERAL'   },
    { id: 'FOLLOW_UP',              label: '🔁 Follow-Up Call',            dept: 'CALL_CENTER',         segment: 'GENERAL'   },
    { id: 'GROUP_INQUIRY',          label: '👥 Group Inquiry',             dept: 'GROUP_SALES',         segment: 'BULK'      },
    { id: 'CORPORATE_LEAD',         label: '🏢 Corporate Lead',            dept: 'CORPORATE_SALES',     segment: 'CORPORATE' },
    { id: 'SCHOOL_INQUIRY',         label: '🏫 School Inquiry',            dept: 'INSTITUTIONAL_SALES', segment: 'SCHOOL'    },
    { id: 'BIRTHDAY_INQUIRY',       label: '🎂 Birthday / Social Event',   dept: 'INSTITUTIONAL_SALES', segment: 'BIRTHDAY'  },
    { id: 'TRAVEL_AGENT_INQUIRY',   label: '✈️ Travel Agent Inquiry',      dept: 'SALES',               segment: 'TRAVEL_AGENT' },
    { id: 'EVENT_INQUIRY',          label: '🎪 Event Inquiry',             dept: 'EVENTS',              segment: 'EVENT'     },
    { id: 'VENUE_RENTAL',           label: '🏟 Venue / Lawn Rental',       dept: 'EVENTS',              segment: 'VENUE'     },
    { id: 'BULK_TICKET',            label: '📦 Bulk Ticket Purchase',      dept: 'GROUP_SALES',         segment: 'BULK'      },
    { id: 'OTHER',                  label: '❓ Other',                     dept: 'CALL_CENTER',         segment: 'GENERAL'   },
  ];

  const CALLER_TYPES = [
    { id: 'INDIVIDUAL',    label: '👤 Individual Customer',   form: 'individual' },
    { id: 'CORPORATE',     label: '🏢 Corporate / Company',   form: 'business'   },
    { id: 'SCHOOL',        label: '🏫 School',                form: 'business'   },
    { id: 'COLLEGE',       label: '🎓 College / University',  form: 'business'   },
    { id: 'INSTITUTION',   label: '🏛 Institution / NGO',     form: 'business'   },
    { id: 'BIRTHDAY',      label: '🎂 Birthday / Social',     form: 'event'      },
    { id: 'TRAVEL_AGENT',  label: '✈️ Travel Agent',          form: 'business'   },
    { id: 'BULK',          label: '📦 Bulk / Group Buyer',    form: 'business'   },
    { id: 'EVENT',         label: '🎪 Event Organiser',       form: 'event'      },
    { id: 'VENUE',         label: '🏟 Venue Inquiry',         form: 'event'      },
    { id: 'OTHER',         label: '❓ Other',                 form: 'individual' },
  ];

  const DEPARTMENTS = [
    { id: 'CALL_CENTER',         label: '📞 Call Center' },
    { id: 'SALES',               label: '📈 Sales' },
    { id: 'GROUP_SALES',         label: '👥 Group Sales' },
    { id: 'CORPORATE_SALES',     label: '🏢 Corporate Sales' },
    { id: 'INSTITUTIONAL_SALES', label: '🏫 Institutional Sales' },
    { id: 'EVENTS',              label: '🎪 Events' },
    { id: 'FINANCE',             label: '💰 Finance' },
    { id: 'DIGITAL_MARKETING',   label: '📣 Digital Marketing' },
    { id: 'OPERATIONS',          label: '⚙️ Operations' },
    { id: 'MANAGEMENT',          label: '👔 Management' },
  ];

  const PACKAGES = [
    { id: 'COMBO_TICKET',          label: '🎟 Combo Ticket (Water + Amusement)' },
    { id: 'WATER_TICKET',          label: '🌊 Water Park Only' },
    { id: 'AMUSEMENT_TICKET',      label: '🎢 Amusement Park Only' },
    { id: 'LUNCH_PACKAGE',         label: '🍱 Lunch Package' },
    { id: 'VENUE_LAWN_RENTAL',     label: '🏟 Venue / Lawn Rental' },
    { id: 'BIRTHDAY_PACKAGE',      label: '🎂 Birthday Package' },
    { id: 'SCHOOL_OUTING_PACKAGE', label: '🏫 School Outing Package' },
    { id: 'CORPORATE_PACKAGE',     label: '🏢 Corporate Offsite Package' },
    { id: 'DECORATION',            label: '🎈 Decoration & Setup' },
    { id: 'TRANSPORT',             label: '🚌 Transport Arrangement' },
    { id: 'CUSTOM',                label: '✏️ Custom / Other' },
  ];

  const ROLE_HIERARCHY = {
    CRM_AGENT:           { label: 'CRM Agent',           level: 1, canView: ['own', 'team_active'],  canEdit: ['own'],            depts: ['CALL_CENTER'] },
    CRM_SUPERVISOR:      { label: 'CRM Supervisor',       level: 2, canView: ['team', 'escalated'],   canEdit: ['team'],           depts: ['CALL_CENTER'] },
    SALES_EXEC:          { label: 'Sales Executive',      level: 1, canView: ['assigned_to_me'],      canEdit: ['assigned_to_me'], depts: ['SALES'] },
    GROUP_SALES:         { label: 'Group Sales',          level: 1, canView: ['assigned_to_me'],      canEdit: ['assigned_to_me'], depts: ['GROUP_SALES'] },
    CORPORATE_SALES:     { label: 'Corporate Sales',      level: 1, canView: ['assigned_to_me'],      canEdit: ['assigned_to_me'], depts: ['CORPORATE_SALES'] },
    INSTITUTIONAL_SALES: { label: 'Institutional Sales',  level: 1, canView: ['assigned_to_me'],      canEdit: ['assigned_to_me'], depts: ['INSTITUTIONAL_SALES'] },
    EVENTS_SALES:        { label: 'Events Sales',         level: 1, canView: ['assigned_to_me'],      canEdit: ['assigned_to_me'], depts: ['EVENTS'] },
    FINANCE:             { label: 'Finance',              level: 2, canView: ['dept'],                canEdit: ['dept'],           depts: ['FINANCE'] },
    DIGITAL_MARKETING:   { label: 'Digital Marketing',    level: 1, canView: ['assigned_to_me'],      canEdit: ['assigned_to_me'], depts: ['DIGITAL_MARKETING'] },
    OPERATIONS:          { label: 'Operations',           level: 2, canView: ['dept'],                canEdit: ['dept'],           depts: ['OPERATIONS'] },
    SALES_MANAGER:       { label: 'Sales Manager',        level: 3, canView: ['dept', 'escalated'],   canEdit: ['dept'],           depts: ['SALES', 'GROUP_SALES', 'CORPORATE_SALES', 'INSTITUTIONAL_SALES'] },
    MANAGEMENT:          { label: 'Management',           level: 4, canView: ['all'],                 canEdit: ['all'],            depts: ['ALL'] },
    SUPER_ADMIN:         { label: 'Super Admin',          level: 5, canView: ['all'],                 canEdit: ['all'],            depts: ['ALL'] },
  };

  /* ═══════════════════════════════════════════════════════════
     SESSION MANAGEMENT
  ═══════════════════════════════════════════════════════════ */

  let _session = null;

  function getSession() {
    if (_session) return _session;
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    if (raw) { try { _session = JSON.parse(raw); } catch (e) {} }
    return _session;
  }

  function setSession(s) {
    _session = s;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function clearSession() {
    _session = null;
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  }

  function isLoggedIn() { return !!getSession(); }
  function currentUser() { return getSession(); }
  function currentRole() { const s = getSession(); return s ? s.role : null; }
  function isSuperAdmin() { return currentRole() === 'SUPER_ADMIN' || currentRole() === 'MANAGEMENT'; }
  function isSupervisor() { const r = currentRole(); return ['CRM_SUPERVISOR', 'SALES_MANAGER', 'MANAGEMENT', 'SUPER_ADMIN'].includes(r); }

  /* ═══════════════════════════════════════════════════════════
     API HELPERS
  ═══════════════════════════════════════════════════════════ */

  async function apiGet(table, params = {}) {
    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    const url = `../tables/${table}${qs ? '?' + qs : ''}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`GET ${table} failed: ${r.status}`);
    return r.json();
  }

  async function apiGetOne(table, id) {
    const r = await fetch(`../tables/${table}/${id}`);
    if (!r.ok) throw new Error(`GET ${table}/${id} failed: ${r.status}`);
    return r.json();
  }

  async function apiPost(table, data) {
    const r = await fetch(`../tables/${table}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(`POST ${table} failed: ${r.status}`);
    return r.json();
  }

  async function apiPatch(table, id, data) {
    const r = await fetch(`../tables/${table}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error(`PATCH ${table}/${id} failed: ${r.status}`);
    return r.json();
  }

  async function apiDelete(table, id) {
    const r = await fetch(`../tables/${table}/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`DELETE ${table}/${id} failed: ${r.status}`);
  }

  /* ═══════════════════════════════════════════════════════════
     CASE ID GENERATOR
  ═══════════════════════════════════════════════════════════ */

  function generateCaseId() {
    let counter = parseInt(localStorage.getItem(CASE_COUNTER_KEY) || '8', 10);
    counter++;
    localStorage.setItem(CASE_COUNTER_KEY, String(counter));
    const year = new Date().getFullYear();
    return `CRM-${year}-${String(counter).padStart(6, '0')}`;
  }

  function generateTimelineId() {
    return `TL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  /* ═══════════════════════════════════════════════════════════
     BOOKING LOOKUP ENGINE
  ═══════════════════════════════════════════════════════════ */

  async function lookupBookingsByMobile(mobile) {
    try {
      const cleaned = mobile.replace(/\D/g, '').slice(-10);
      const res = await apiGet(BOOKINGS_TABLE, { limit: 50 });
      const all = res.data || [];
      return all.filter(b => {
        const bm = (b.customer_mobile || '').replace(/\D/g, '').slice(-10);
        return bm === cleaned;
      });
    } catch (e) {
      console.warn('Booking lookup failed:', e);
      return [];
    }
  }

  async function lookupBookingById(bookingId) {
    try {
      const res = await apiGet(BOOKINGS_TABLE, { limit: 100 });
      const all = res.data || [];
      return all.find(b => b.booking_id === bookingId.trim()) || null;
    } catch (e) {
      return null;
    }
  }

  /* ═══════════════════════════════════════════════════════════
     USERS / ASSIGNEE ENGINE
  ═══════════════════════════════════════════════════════════ */

  let _usersCache = null;

  async function getAllUsers(forceRefresh = false) {
    if (_usersCache && !forceRefresh) return _usersCache;
    try {
      const res = await apiGet(USERS_TABLE, { limit: 100 });
      _usersCache = (res.data || []).filter(u => u.is_active);
      return _usersCache;
    } catch (e) {
      return DEMO_USERS_FALLBACK;
    }
  }

  async function getAssignableUsers(issueCategory) {
    const users = await getAllUsers();
    const cat = ISSUE_CATEGORIES.find(c => c.id === issueCategory);
    const targetDept = cat ? cat.dept : null;

    return users.filter(u => {
      if (!u.can_receive_assignments) return false;
      if (u.assignment_categories && u.assignment_categories.includes('ALL')) return true;
      if (u.assignment_categories && u.assignment_categories.includes(issueCategory)) return true;
      if (targetDept && u.department === targetDept) return true;
      return false;
    });
  }

  /* ═══════════════════════════════════════════════════════════
     CASE CRUD OPERATIONS
  ═══════════════════════════════════════════════════════════ */

  async function createCase(formData) {
    const user = currentUser();
    const caseId = generateCaseId();
    const now = new Date().toISOString();

    const caseRecord = {
      id: caseId,
      case_number: caseId,
      ...formData,
      status: formData.current_owner_id ? 'ASSIGNED' : 'RECORDED',
      created_by_id: user.id,
      created_by_name: user.name,
      last_updated_by: user.name,
      last_activity_at: now,
      call_date: formData.call_date || now,
      escalation_level: 0,
      reopen_count: 0,
      sla_breach: false,
    };

    // Set SLA hours from priority
    const pConfig = PRIORITY_CONFIG[formData.priority || 'NORMAL'];
    caseRecord.sla_hours = pConfig.slaHours;

    const saved = await apiPost(CASES_TABLE, caseRecord);

    // Create initial timeline entry
    await addTimelineEntry(caseId, {
      event_type: 'CASE_CREATED',
      event_description: `Case created by ${user.name} during call`,
      performed_by_id: user.id,
      performed_by_name: user.name,
      performed_by_role: user.role,
      is_internal: false,
    });

    if (formData.linked_booking_id) {
      await addTimelineEntry(caseId, {
        event_type: 'BOOKING_LINKED',
        event_description: `Booking ${formData.linked_booking_id} linked to case`,
        performed_by_id: user.id,
        performed_by_name: user.name,
        performed_by_role: user.role,
        is_internal: false,
      });
    }

    if (formData.current_owner_id && formData.current_owner_id !== user.id) {
      await addTimelineEntry(caseId, {
        event_type: 'ASSIGNED',
        event_description: `Case assigned to ${formData.current_owner_name} (${formData.current_owner_dept})`,
        performed_by_id: user.id,
        performed_by_name: user.name,
        performed_by_role: user.role,
        is_internal: false,
      });
    }

    return saved;
  }

  async function getCases(filters = {}) {
    const params = { limit: 200, sort: 'created_at' };
    if (filters.search) params.search = filters.search;
    const res = await apiGet(CASES_TABLE, params);
    let cases = res.data || [];

    // Client-side filtering
    if (filters.status) cases = cases.filter(c => c.status === filters.status);
    if (filters.priority) cases = cases.filter(c => c.priority === filters.priority);
    if (filters.department) cases = cases.filter(c => c.department === filters.department);
    if (filters.segment) cases = cases.filter(c => c.segment === filters.segment);
    if (filters.assigned_to) cases = cases.filter(c => c.current_owner_id === filters.assigned_to);
    if (filters.created_by) cases = cases.filter(c => c.created_by_id === filters.created_by);
    if (filters.sla_breach) cases = cases.filter(c => c.sla_breach === true);
    if (filters.escalated) cases = cases.filter(c => c.escalation_level > 0);

    // Role-based filtering
    const user = currentUser();
    if (user && !isSuperAdmin() && !isSupervisor()) {
      const role = user.role;
      if (['CRM_AGENT'].includes(role)) {
        // Agents see only cases they created or are assigned to them
        cases = cases.filter(c => c.created_by_id === user.id || c.current_owner_id === user.id);
      } else {
        // Others see only what's assigned to them or their dept
        cases = cases.filter(c => c.current_owner_id === user.id || c.department === user.department);
      }
    }

    return cases;
  }

  async function getCaseById(caseId) {
    try {
      const res = await apiGet(CASES_TABLE, { limit: 200 });
      const all = res.data || [];
      return all.find(c => c.id === caseId || c.case_number === caseId) || null;
    } catch (e) {
      return null;
    }
  }

  async function updateCase(caseId, updates, timelineNote = null) {
    const user = currentUser();
    const now = new Date().toISOString();
    updates.last_updated_by = user.name;
    updates.last_activity_at = now;

    const updated = await apiPatch(CASES_TABLE, caseId, updates);

    if (timelineNote) {
      await addTimelineEntry(caseId, {
        event_type: timelineNote.event_type || 'NOTE_ADDED',
        event_description: timelineNote.description,
        note_content: timelineNote.content,
        performed_by_id: user.id,
        performed_by_name: user.name,
        performed_by_role: user.role,
        is_internal: timelineNote.is_internal || false,
      });
    }

    return updated;
  }

  /* ═══════════════════════════════════════════════════════════
     STATUS WORKFLOW ENGINE
  ═══════════════════════════════════════════════════════════ */

  const STATUS_TRANSITIONS = {
    NEW:                ['RECORDED', 'PENDING_ASSIGNMENT', 'CANCELLED'],
    RECORDED:           ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_PROGRESS', 'CANCELLED'],
    PENDING_ASSIGNMENT: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED:           ['IN_PROGRESS', 'AWAITING_INTERNAL', 'AWAITING_CUSTOMER', 'RESOLVED', 'ESCALATED', 'CANCELLED'],
    IN_PROGRESS:        ['AWAITING_INTERNAL', 'AWAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'ESCALATED'],
    AWAITING_INTERNAL:  ['IN_PROGRESS', 'RESOLVED', 'ESCALATED'],
    AWAITING_CUSTOMER:  ['IN_PROGRESS', 'CLOSED', 'CANCELLED'],
    RESOLVED:           ['CLOSED', 'REOPENED'],
    CLOSED:             ['REOPENED'],
    REOPENED:           ['IN_PROGRESS', 'ASSIGNED', 'ESCALATED'],
    ESCALATED:          ['IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    CANCELLED:          [],
  };

  function getAllowedTransitions(currentStatus) {
    return STATUS_TRANSITIONS[currentStatus] || [];
  }

  async function changeStatus(caseId, newStatus, notes = '', resolutionNotes = '') {
    const user = currentUser();
    const caseObj = await getCaseById(caseId);
    if (!caseObj) throw new Error('Case not found');

    const allowed = getAllowedTransitions(caseObj.status);
    if (!allowed.includes(newStatus) && !isSuperAdmin()) {
      throw new Error(`Transition from ${caseObj.status} to ${newStatus} is not allowed`);
    }

    const updates = {
      status: newStatus,
      last_activity_at: new Date().toISOString(),
    };

    if (newStatus === 'CLOSED' || newStatus === 'RESOLVED') {
      updates.closed_by_id = user.id;
      updates.closed_at = new Date().toISOString();
      if (resolutionNotes) updates.resolution_notes = resolutionNotes;
    }

    if (newStatus === 'REOPENED') {
      updates.reopen_count = (caseObj.reopen_count || 0) + 1;
      updates.closed_at = null;
    }

    await updateCase(caseId, updates, {
      event_type: 'STATUS_CHANGED',
      description: `Status changed from ${caseObj.status} to ${newStatus}${notes ? ': ' + notes : ''}`,
      content: notes || resolutionNotes,
      is_internal: false,
    });

    return updates;
  }

  /* ═══════════════════════════════════════════════════════════
     ASSIGNMENT ENGINE
  ═══════════════════════════════════════════════════════════ */

  async function assignCase(caseId, toUserId, toUserName, toDept, notes = '') {
    const user = currentUser();
    const now = new Date().toISOString();

    const updates = {
      current_owner_id: toUserId,
      current_owner_name: toUserName,
      current_owner_dept: toDept,
      assigned_by_id: user.id,
      assigned_at: now,
      department: toDept,
      status: 'ASSIGNED',
    };

    await updateCase(caseId, updates, {
      event_type: 'ASSIGNED',
      description: `Case assigned to ${toUserName} (${toDept}) by ${user.name}${notes ? '. Note: ' + notes : ''}`,
      content: notes,
      is_internal: false,
    });
  }

  async function reassignCase(caseId, toUserId, toUserName, toDept, notes = '') {
    const user = currentUser();
    const now = new Date().toISOString();

    const updates = {
      current_owner_id: toUserId,
      current_owner_name: toUserName,
      current_owner_dept: toDept,
      assigned_by_id: user.id,
      assigned_at: now,
    };

    await updateCase(caseId, updates, {
      event_type: 'REASSIGNED',
      description: `Case reassigned to ${toUserName} (${toDept}) by ${user.name}`,
      content: notes,
      is_internal: false,
    });
  }

  /* ═══════════════════════════════════════════════════════════
     ESCALATION ENGINE
  ═══════════════════════════════════════════════════════════ */

  async function escalateCase(caseId, toUserId, toUserName, reason = '') {
    const user = currentUser();
    const now = new Date().toISOString();
    const caseObj = await getCaseById(caseId);

    const newLevel = (caseObj.escalation_level || 0) + 1;

    const updates = {
      status: 'ESCALATED',
      escalation_level: newLevel,
      escalated_to_id: toUserId,
      escalated_to_name: toUserName,
      escalated_at: now,
      sla_breach: true,
      sla_breached_at: caseObj.sla_breached_at || now,
    };

    await updateCase(caseId, updates, {
      event_type: 'ESCALATED',
      description: `Case escalated to Level ${newLevel} — ${toUserName}. Reason: ${reason || 'SLA breach / policy trigger'}`,
      content: reason,
      is_internal: false,
    });
  }

  async function runEscalationCheck() {
    // Run SLA and escalation checks on all open cases
    const cases = await getCases({});
    const now = Date.now();
    const openStatuses = ['ASSIGNED', 'IN_PROGRESS', 'AWAITING_INTERNAL', 'PENDING_ASSIGNMENT'];
    const users = await getAllUsers();

    for (const c of cases) {
      if (!openStatuses.includes(c.status)) continue;
      if (c.sla_breach) continue; // already breached

      const slaHours = c.sla_hours || PRIORITY_CONFIG[c.priority || 'NORMAL'].slaHours;
      const createdAt = new Date(c.call_date || c.created_at).getTime();
      const lastActivity = new Date(c.last_activity_at || c.created_at).getTime();
      const ageHours = (now - createdAt) / 3600000;
      const idleHours = (now - lastActivity) / 3600000;

      if (ageHours > slaHours) {
        // Find supervisor to escalate to
        let escalateTo = users.find(u => u.role === 'CRM_SUPERVISOR' || u.role === 'SALES_MANAGER');
        if (!escalateTo) escalateTo = users.find(u => u.role === 'MANAGEMENT');

        if (escalateTo) {
          await escalateCase(c.id, escalateTo.id, escalateTo.name, `Auto-escalation: SLA of ${slaHours}h exceeded. Case age: ${Math.round(ageHours)}h`);
        }
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════
     TIMELINE ENGINE
  ═══════════════════════════════════════════════════════════ */

  async function addTimelineEntry(caseId, data) {
    const entry = {
      id: generateTimelineId(),
      case_id: caseId,
      event_at: new Date().toISOString(),
      ...data,
    };
    return apiPost(TIMELINE_TABLE, entry);
  }

  async function getCaseTimeline(caseId) {
    try {
      const res = await apiGet(TIMELINE_TABLE, { limit: 200 });
      const all = res.data || [];
      return all
        .filter(t => t.case_id === caseId)
        .sort((a, b) => new Date(a.event_at) - new Date(b.event_at));
    } catch (e) {
      return [];
    }
  }

  async function addNote(caseId, noteContent, isInternal = false) {
    const user = currentUser();
    await addTimelineEntry(caseId, {
      event_type: isInternal ? 'INTERNAL_NOTE' : 'NOTE_ADDED',
      event_description: isInternal ? 'Internal note added' : 'Note added',
      note_content: noteContent,
      performed_by_id: user.id,
      performed_by_name: user.name,
      performed_by_role: user.role,
      is_internal: isInternal,
    });
    await updateCase(caseId, {}, null);
  }

  /* ═══════════════════════════════════════════════════════════
     FOLLOW-UP ENGINE
  ═══════════════════════════════════════════════════════════ */

  async function scheduleFollowUp(caseId, followUpDate, notes = '') {
    const user = currentUser();
    await updateCase(caseId, {
      follow_up_date: followUpDate,
      follow_up_notes: notes,
    }, {
      event_type: 'FOLLOW_UP_SET',
      description: `Follow-up scheduled for ${formatDate(followUpDate)} by ${user.name}`,
      content: notes,
      is_internal: false,
    });
  }

  /* ═══════════════════════════════════════════════════════════
     DASHBOARD STATS ENGINE
  ═══════════════════════════════════════════════════════════ */

  async function getDashboardStats(userId = null, role = null) {
    const allCases = await getCases({});
    const user = currentUser();
    const uId = userId || (user ? user.id : null);
    const now = Date.now();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const myCases = allCases.filter(c => c.created_by_id === uId);
    const assignedToMe = allCases.filter(c => c.current_owner_id === uId);
    const openCases = allCases.filter(c => !['CLOSED', 'CANCELLED', 'RESOLVED'].includes(c.status));
    const escalated = allCases.filter(c => c.escalation_level > 0 || c.status === 'ESCALATED');
    const slaBreach = allCases.filter(c => c.sla_breach);
    const closedToday = allCases.filter(c => c.closed_at && new Date(c.closed_at) >= today);

    const followUpDue = allCases.filter(c => {
      if (!c.follow_up_date) return false;
      const fd = new Date(c.follow_up_date);
      return fd <= new Date(today.getTime() + 86400000) && !['CLOSED', 'CANCELLED'].includes(c.status);
    });

    return {
      totalCases: allCases.length,
      myCases: myCases.length,
      assignedToMe: assignedToMe.length,
      openCases: openCases.length,
      escalated: escalated.length,
      slaBreach: slaBreach.length,
      closedToday: closedToday.length,
      followUpDue: followUpDue.length,
      byStatus: groupBy(allCases, 'status'),
      byPriority: groupBy(allCases, 'priority'),
      bySegment: groupBy(allCases, 'segment'),
      byDept: groupBy(allCases, 'department'),
    };
  }

  async function getAgentProductivity(agentId) {
    const all = await getCases({});
    const mine = all.filter(c => c.created_by_id === agentId);
    return {
      total: mine.length,
      resolved: mine.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length,
      open: mine.filter(c => !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(c.status)).length,
      escalated: mine.filter(c => c.escalation_level > 0).length,
      directlyClosed: mine.filter(c => c.closed_by_id === agentId).length,
      avgSlaCompliance: calcSlaCompliance(mine),
    };
  }

  function calcSlaCompliance(cases) {
    if (!cases.length) return 100;
    const breached = cases.filter(c => c.sla_breach).length;
    return Math.round(((cases.length - breached) / cases.length) * 100);
  }

  /* ═══════════════════════════════════════════════════════════
     REPORTING ENGINE
  ═══════════════════════════════════════════════════════════ */

  async function getReport(filters = {}) {
    let cases = await getCases({});

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      cases = cases.filter(c => new Date(c.call_date || c.created_at) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      cases = cases.filter(c => new Date(c.call_date || c.created_at) <= to);
    }
    if (filters.segment) cases = cases.filter(c => c.segment === filters.segment);
    if (filters.department) cases = cases.filter(c => c.department === filters.department);
    if (filters.status) cases = cases.filter(c => c.status === filters.status);
    if (filters.priority) cases = cases.filter(c => c.priority === filters.priority);
    if (filters.agentId) cases = cases.filter(c => c.created_by_id === filters.agentId);
    if (filters.ownerId) cases = cases.filter(c => c.current_owner_id === filters.ownerId);
    if (filters.slaBreachOnly) cases = cases.filter(c => c.sla_breach);
    if (filters.escalatedOnly) cases = cases.filter(c => c.escalation_level > 0);

    return {
      total: cases.length,
      cases,
      byAgent: groupBy(cases, 'created_by_name'),
      byOwner: groupBy(cases, 'current_owner_name'),
      byStatus: groupBy(cases, 'status'),
      bySegment: groupBy(cases, 'segment'),
      byPriority: groupBy(cases, 'priority'),
      byDept: groupBy(cases, 'department'),
      byIssueCategory: groupBy(cases, 'issue_category'),
      slaBreaches: cases.filter(c => c.sla_breach).length,
      escalated: cases.filter(c => c.escalation_level > 0).length,
      closed: cases.filter(c => c.status === 'CLOSED').length,
      open: cases.filter(c => !['CLOSED', 'CANCELLED'].includes(c.status)).length,
    };
  }

  /* ═══════════════════════════════════════════════════════════
     UTILITY HELPERS
  ═══════════════════════════════════════════════════════════ */

  function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      const k = item[key] || 'Unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
  }

  function formatDate(d, withTime = false) {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    if (isNaN(dt)) return '—';
    const opts = withTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' };
    return dt.toLocaleDateString('en-IN', opts);
  }

  function timeAgo(d) {
    if (!d) return '—';
    const dt = typeof d === 'string' ? new Date(d) : d;
    const diff = Date.now() - dt.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return formatDate(dt);
  }

  function getAgeHours(d) {
    if (!d) return 0;
    const dt = typeof d === 'string' ? new Date(d) : d;
    return (Date.now() - dt.getTime()) / 3600000;
  }

  function getAgeBadge(caseObj) {
    const hours = getAgeHours(caseObj.call_date || caseObj.created_at);
    const sla = caseObj.sla_hours || 24;
    const pct = (hours / sla) * 100;
    if (caseObj.sla_breach || pct >= 100) return { label: `${Math.round(hours)}h`, color: '#ef4444', urgent: true };
    if (pct >= 75) return { label: `${Math.round(hours)}h`, color: '#f59e0b', urgent: false };
    return { label: `${Math.round(hours)}h`, color: '#10b981', urgent: false };
  }

  function maskMobile(m) {
    if (!m) return '—';
    return m.slice(0, 2) + '******' + m.slice(-2);
  }

  function toast(msg, type = 'info') {
    let el = document.getElementById('crm-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'crm-toast';
      el.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(el);
    }
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const t = document.createElement('div');
    t.style.cssText = `background:#1e293b;border:1px solid ${colors[type]};color:#f1f5f9;padding:12px 18px;border-radius:10px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:8px;min-width:280px;box-shadow:0 4px 20px rgba(0,0,0,.4);animation:fadeSlideIn .25s ease;`;
    t.innerHTML = `<span style="font-size:16px">${icons[type]}</span><span>${msg}</span>`;
    el.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(20px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3500);
  }

  /* ═══════════════════════════════════════════════════════════
     DEMO USERS FALLBACK (offline mode)
  ═══════════════════════════════════════════════════════════ */

  const DEMO_USERS_FALLBACK = [
    { id: 'USR-CC-001',      name: 'Priya Sharma',   role: 'CRM_AGENT',      department: 'CALL_CENTER',         can_receive_assignments: true, is_active: true, assignment_categories: ['BOOKING_SUPPORT', 'GENERAL_INFO'] },
    { id: 'USR-CC-002',      name: 'Amit Verma',     role: 'CRM_AGENT',      department: 'CALL_CENTER',         can_receive_assignments: true, is_active: true, assignment_categories: ['BOOKING_SUPPORT', 'REFUND'] },
    { id: 'USR-CC-SUP-001',  name: 'Kavita Nair',    role: 'CRM_SUPERVISOR', department: 'CALL_CENTER',         can_receive_assignments: true, is_active: true, assignment_categories: ['BOOKING_SUPPORT', 'COMPLAINT'] },
    { id: 'USR-SALES-001',   name: 'Deepak Gupta',   role: 'SALES_EXEC',     department: 'SALES',               can_receive_assignments: true, is_active: true, assignment_categories: ['TRAVEL_AGENT_INQUIRY', 'GROUP_INQUIRY'] },
    { id: 'USR-SALES-002',   name: 'Neha Joshi',     role: 'GROUP_SALES',    department: 'GROUP_SALES',         can_receive_assignments: true, is_active: true, assignment_categories: ['SCHOOL_INQUIRY', 'BULK_TICKET'] },
    { id: 'USR-SALES-003',   name: 'Vijay Chopra',   role: 'CORPORATE_SALES',department: 'CORPORATE_SALES',     can_receive_assignments: true, is_active: true, assignment_categories: ['CORPORATE_LEAD', 'EVENT_INQUIRY'] },
    { id: 'USR-SALES-004',   name: 'Ananya Singh',   role: 'INSTITUTIONAL_SALES', department: 'INSTITUTIONAL_SALES', can_receive_assignments: true, is_active: true, assignment_categories: ['SCHOOL_INQUIRY', 'BIRTHDAY_INQUIRY'] },
    { id: 'USR-FIN-001',     name: 'Meera Pillai',   role: 'FINANCE',        department: 'FINANCE',             can_receive_assignments: true, is_active: true, assignment_categories: ['REFUND', 'PAYMENT_ISSUE'] },
    { id: 'USR-DM-001',      name: 'Arjun Kapoor',   role: 'DIGITAL_MARKETING', department: 'DIGITAL_MARKETING',can_receive_assignments: true, is_active: true, assignment_categories: ['GENERAL_INFO', 'OFFER_ISSUE'] },
    { id: 'USR-OPS-001',     name: 'Ravi Sharma',    role: 'OPERATIONS',     department: 'OPERATIONS',          can_receive_assignments: true, is_active: true, assignment_categories: ['QR_ENTRY_ISSUE', 'RESCHEDULING'] },
    { id: 'USR-SALES-MGR-001',name:'Suresh Kumar',   role: 'SALES_MANAGER',  department: 'SALES',               can_receive_assignments: true, is_active: true, assignment_categories: ['CORPORATE_LEAD', 'ESCALATED'] },
    { id: 'USR-MGR-001',     name: 'Alok Tiwari',    role: 'MANAGEMENT',     department: 'MANAGEMENT',          can_receive_assignments: true, is_active: true, assignment_categories: ['ALL'] },
  ];

  /* ═══════════════════════════════════════════════════════════
     LOGIN SESSION PRESETS (Demo)
  ═══════════════════════════════════════════════════════════ */

  const DEMO_LOGIN_USERS = [
    { id: 'USR-CC-001',       name: 'Priya Sharma',  role: 'CRM_AGENT',      department: 'CALL_CENTER',    avatar: 'PS', pin: '1111' },
    { id: 'USR-CC-002',       name: 'Amit Verma',    role: 'CRM_AGENT',      department: 'CALL_CENTER',    avatar: 'AV', pin: '2222' },
    { id: 'USR-CC-SUP-001',   name: 'Kavita Nair',   role: 'CRM_SUPERVISOR', department: 'CALL_CENTER',    avatar: 'KN', pin: '3333' },
    { id: 'USR-SALES-003',    name: 'Vijay Chopra',  role: 'CORPORATE_SALES',department: 'CORPORATE_SALES',avatar: 'VC', pin: '4444' },
    { id: 'USR-SALES-MGR-001',name: 'Suresh Kumar',  role: 'SALES_MANAGER',  department: 'SALES',          avatar: 'SK', pin: '5555' },
    { id: 'USR-FIN-001',      name: 'Meera Pillai',  role: 'FINANCE',        department: 'FINANCE',        avatar: 'MP', pin: '6666' },
    { id: 'USR-SA-001',       name: 'Super Admin',   role: 'SUPER_ADMIN',    department: 'MANAGEMENT',     avatar: 'SA', pin: '0000' },
  ];

  function loginDemo(userId) {
    const u = DEMO_LOGIN_USERS.find(x => x.id === userId);
    if (!u) return false;
    setSession({ ...u, loginAt: Date.now() });
    return true;
  }

  /* ═══════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════ */

  return {
    VERSION,
    // Session
    getSession, setSession, clearSession, isLoggedIn, currentUser, currentRole,
    isSuperAdmin, isSupervisor, loginDemo, DEMO_LOGIN_USERS,
    // Config / Constants
    STATUS_CONFIG, PRIORITY_CONFIG, ISSUE_CATEGORIES, CALLER_TYPES,
    DEPARTMENTS, PACKAGES, ROLE_HIERARCHY,
    // Booking Lookup
    lookupBookingsByMobile, lookupBookingById,
    // Users
    getAllUsers, getAssignableUsers, DEMO_USERS_FALLBACK,
    // Case CRUD
    createCase, getCases, getCaseById, updateCase,
    // Status Workflow
    getAllowedTransitions, changeStatus,
    // Assignment
    assignCase, reassignCase,
    // Escalation
    escalateCase, runEscalationCheck,
    // Timeline
    addTimelineEntry, getCaseTimeline, addNote,
    // Follow-up
    scheduleFollowUp,
    // Dashboard / Reporting
    getDashboardStats, getAgentProductivity, getReport,
    // Utils
    formatDate, timeAgo, getAgeHours, getAgeBadge, maskMobile,
    toast, groupBy, generateCaseId, generateTimelineId,
    getAllowedTransitions,
  };

})();

