/**
 * ══════════════════════════════════════════════════════════════════════════════
 * WOW LOYALTY ENGINE v2.0
 * Worlds of Wonder — Loyalty + Payment + Retention + Marketing Operating System
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * MODULES:
 *  1. LoyaltyConfig      — Rules, tiers, multipliers, expiry, OTP settings
 *  2. LoyaltyLedger      — Immutable ledger, lot-based balance, FIFO deduction
 *  3. LoyaltyTierEngine  — Auto upgrade/downgrade, bonus issuance, tier history
 *  4. LoyaltyExpiry      — Expiry scheduling, lot management, notification triggers
 *  5. LoyaltyRedemption  — Redemption rules enforcement, OTP security
 *  6. LoyaltyOTP         — OTP generation, validation, rate limiting, lockout
 *  7. LoyaltyCheckout    — Checkout integration, payment mode switching, sync
 *  8. LoyaltyComms       — WhatsApp/SMS/Email notification stubs
 *  9. LoyaltyAnalytics   — Points economy metrics, CLV, tier distribution
 * 10. WOWLoyalty         — Public API facade (imported by all pages)
 *
 * Storage: localStorage (key-prefixed per user)
 * ══════════════════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────────────
   * 1. LOYALTY CONFIG ENGINE
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyConfig = {
    SK: 'wow_loyalty_config',

    DEFAULTS: {
      earn: {
        baseRate: 100,          // ₹100 = 1 point
        roundingRule: 'floor',  // floor | ceil | round
        categories: {
          WATER_DAY:    { multiplier: 1.0 },
          AMUSEMENT_DAY:{ multiplier: 1.0 },
          COMBO_DAY:    { multiplier: 1.2 },
          PASSPORT:     { multiplier: 1.5 },
          FNB:          { multiplier: 0.5 },
          GROUP:        { multiplier: 1.1 }
        }
      },
      tiers: [
        {
          id: 'BRONZE',   name: 'Bronze',   rank: 1,
          color: '#cd7f32', bgColor: 'rgba(205,127,50,.15)',
          icon: '🥉',
          qualifyPoints: 0,     retainPoints: 0,
          multiplier: 1.0,
          expiryMonths: 12,
          upgradeBonusPoints: 0,
          benefits: ['Base earn rate','Priority booking support']
        },
        {
          id: 'SILVER',   name: 'Silver',   rank: 2,
          color: '#94a3b8', bgColor: 'rgba(148,163,184,.15)',
          icon: '🥈',
          qualifyPoints: 500,   retainPoints: 300,
          multiplier: 1.25,
          expiryMonths: 14,
          upgradeBonusPoints: 50,
          benefits: ['1.25x earn rate','Birthday bonus 50 pts','Early access to offers']
        },
        {
          id: 'GOLD',     name: 'Gold',     rank: 3,
          color: '#f5a800', bgColor: 'rgba(245,168,0,.15)',
          icon: '🥇',
          qualifyPoints: 1500,  retainPoints: 900,
          multiplier: 1.5,
          expiryMonths: 16,
          upgradeBonusPoints: 150,
          benefits: ['1.5x earn rate','Free locker voucher','Complimentary F&B voucher (₹200)','Dedicated CRM support']
        },
        {
          id: 'PLATINUM', name: 'Platinum', rank: 4,
          color: '#06b6d4', bgColor: 'rgba(6,182,212,.15)',
          icon: '💎',
          qualifyPoints: 4000,  retainPoints: 2500,
          multiplier: 2.0,
          expiryMonths: 24,
          upgradeBonusPoints: 500,
          benefits: ['2x earn rate','Annual Passport upgrade voucher','VIP lane access','Guest passes (2/yr)','Dedicated Relationship Manager']
        }
      ],
      redemption: {
        minBalanceToRedeem: 100,
        minPointsPerTxn: 100,
        nonRedeemableBelow: 50,
        ratePerPoint: 1,        // 1 point = ₹1
        allowedFor: ['TICKET','PASSPORT'],
        otpRequired: true,
        maxRedemptionPct: 100   // % of order value coverable via points
      },
      otp: {
        length: 6,
        expirySeconds: 120,
        maxAttempts: 3,
        lockoutMinutes: 15,
        rateLimitPerHour: 5
      },
      expiry: {
        type: 'rolling',        // rolling | fixed | tier
        graceDays: 0,
        notifyDays: [30, 15, 7, 1]
      },
      campaigns: []
    },

    get () {
      try {
        const s = localStorage.getItem(this.SK);
        if (s) return Object.assign({}, this.DEFAULTS, JSON.parse(s));
      } catch (e) {}
      return JSON.parse(JSON.stringify(this.DEFAULTS));
    },

    save (cfg) {
      localStorage.setItem(this.SK, JSON.stringify(cfg));
    },

    getTier (tierId) {
      return this.get().tiers.find(t => t.id === tierId) || this.get().tiers[0];
    },

    getTierByRank (rank) {
      return this.get().tiers.find(t => t.rank === rank);
    },

    getActiveCampaignMultiplier (category, userId) {
      const cfg = this.get();
      const now = Date.now();
      let bonus = 0;
      (cfg.campaigns || []).forEach(c => {
        if (!c.active) return;
        if (c.startTs && now < c.startTs) return;
        if (c.endTs   && now > c.endTs)   return;
        if (c.category && c.category !== category) return;
        bonus = Math.max(bonus, c.bonusMultiplier || 0);
      });
      return bonus;
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 2. LOYALTY LEDGER ENGINE
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyLedger = {
    SK_PREFIX: 'wow_loyalty_ledger_',
    LOT_PREFIX: 'wow_loyalty_lots_',

    _ledgerKey (uid) { return this.SK_PREFIX + uid; },
    _lotKey    (uid) { return this.LOT_PREFIX  + uid; },

    _readLedger (uid) {
      try { return JSON.parse(localStorage.getItem(this._ledgerKey(uid))) || []; }
      catch { return []; }
    },

    _writeLedger (uid, entries) {
      localStorage.setItem(this._ledgerKey(uid), JSON.stringify(entries));
    },

    _readLots (uid) {
      try { return JSON.parse(localStorage.getItem(this._lotKey(uid))) || []; }
      catch { return []; }
    },

    _writeLots (uid, lots) {
      localStorage.setItem(this._lotKey(uid), JSON.stringify(lots));
    },

    _genTxnId () {
      return 'LTX-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    },

    _genLotId () {
      return 'LOT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    },

    /**
     * Earn points — creates a ledger entry + a lot
     */
    earn (uid, { points, source, sourceRef, category, meta }) {
      const cfg  = LoyaltyConfig.get();
      const tier = LoyaltyTierEngine.getCurrentTier(uid);
      const tierCfg = LoyaltyConfig.getTier(tier);
      const expiryMs = tierCfg.expiryMonths * 30 * 24 * 60 * 60 * 1000;
      const now  = Date.now();
      const expiry = now + expiryMs;

      const txn = {
        id: this._genTxnId(),
        uid,
        type: 'EARN',
        source: source || 'TICKET',
        sourceRef: sourceRef || '',
        category: category || '',
        points,
        balance: 0,        // filled after
        ts: now,
        expiry,
        status: 'ACTIVE',
        meta: meta || {}
      };

      const entries = this._readLedger(uid);
      entries.push(txn);
      // Compute running balance
      txn.balance = this._computeBalance(uid, entries);
      this._writeLedger(uid, entries);

      // Create lot
      const lots = this._readLots(uid);
      lots.push({
        id: this._genLotId(),
        txnId: txn.id,
        uid,
        earned: points,
        remaining: points,
        ts: now,
        expiry,
        status: 'ACTIVE'
      });
      this._writeLots(uid, lots);

      return txn;
    },

    /**
     * Issue bonus points
     */
    bonus (uid, { points, reason, expiry, meta }) {
      const cfg = LoyaltyConfig.get();
      const tierCfg = LoyaltyConfig.getTier(LoyaltyTierEngine.getCurrentTier(uid));
      const now = Date.now();
      const expiryTs = expiry || (now + tierCfg.expiryMonths * 30 * 24 * 60 * 60 * 1000);

      const txn = {
        id: this._genTxnId(),
        uid,
        type: 'BONUS',
        source: reason || 'SYSTEM',
        sourceRef: '',
        category: 'BONUS',
        points,
        balance: 0,
        ts: now,
        expiry: expiryTs,
        status: 'ACTIVE',
        meta: meta || {}
      };

      const entries = this._readLedger(uid);
      entries.push(txn);
      txn.balance = this._computeBalance(uid, entries);
      this._writeLedger(uid, entries);

      const lots = this._readLots(uid);
      lots.push({
        id: this._genLotId(),
        txnId: txn.id,
        uid,
        earned: points,
        remaining: points,
        ts: now,
        expiry: expiryTs,
        status: 'ACTIVE'
      });
      this._writeLots(uid, lots);

      return txn;
    },

    /**
     * Redeem points — FIFO deduction from lots
     * Returns { success, txnId, deducted, remainingLots } or { success: false, reason }
     */
    redeem (uid, { points, source, sourceRef, otpToken, meta }) {
      const cfg = LoyaltyConfig.get().redemption;
      const balance = this.getAvailableBalance(uid);

      if (balance < cfg.minBalanceToRedeem) {
        return { success: false, reason: `Minimum balance of ${cfg.minBalanceToRedeem} pts required for first redemption.` };
      }
      if (points < cfg.minPointsPerTxn) {
        return { success: false, reason: `Minimum ${cfg.minPointsPerTxn} pts required per redemption.` };
      }
      if (points < cfg.nonRedeemableBelow) {
        return { success: false, reason: `Points below ${cfg.nonRedeemableBelow} are not redeemable.` };
      }
      if (points > balance) {
        return { success: false, reason: 'Insufficient points balance.' };
      }

      // OTP must have been validated externally before calling this
      // (enforced by LoyaltyOTP.validateAndConsume)

      const now = Date.now();
      const lots = this._readLots(uid);
      // FIFO: sort by expiry ascending (oldest-expiring first)
      const activeLots = lots
        .filter(l => l.status === 'ACTIVE' && l.remaining > 0 && l.expiry > now)
        .sort((a, b) => a.expiry - b.expiry);

      let remaining = points;
      const lotsTouched = [];

      for (const lot of activeLots) {
        if (remaining <= 0) break;
        const use = Math.min(lot.remaining, remaining);
        lot.remaining -= use;
        remaining -= use;
        if (lot.remaining === 0) lot.status = 'USED';
        lotsTouched.push({ lotId: lot.id, used: use });
      }

      if (remaining > 0) {
        // Rollback
        return { success: false, reason: 'Insufficient valid (non-expired) points.' };
      }

      this._writeLots(uid, lots);

      const txn = {
        id: this._genTxnId(),
        uid,
        type: 'REDEEM',
        source: source || 'TICKET',
        sourceRef: sourceRef || '',
        category: source || 'TICKET',
        points: -points,
        balance: 0,
        ts: now,
        expiry: null,
        status: 'ACTIVE',
        meta: Object.assign({ otpToken, lotsTouched }, meta || {})
      };

      const entries = this._readLedger(uid);
      entries.push(txn);
      txn.balance = this._computeBalance(uid, entries);
      this._writeLedger(uid, entries);

      return { success: true, txnId: txn.id, deducted: points, newBalance: txn.balance };
    },

    /**
     * Reverse a redemption (refund scenario)
     */
    reverse (uid, originalTxnId, reason) {
      const entries = this._readLedger(uid);
      const original = entries.find(e => e.id === originalTxnId && e.type === 'REDEEM');
      if (!original || original.status === 'REVERSED') {
        return { success: false, reason: 'Txn not found or already reversed.' };
      }

      const reversalPoints = Math.abs(original.points);
      const now = Date.now();
      // Restore into lots
      const lots = this._readLots(uid);
      const tier = LoyaltyTierEngine.getCurrentTier(uid);
      const tierCfg = LoyaltyConfig.getTier(tier);
      const expiryTs = now + tierCfg.expiryMonths * 30 * 24 * 60 * 60 * 1000;

      lots.push({
        id: this._genLotId(),
        txnId: 'REVERSAL-' + originalTxnId,
        uid,
        earned: reversalPoints,
        remaining: reversalPoints,
        ts: now,
        expiry: expiryTs,
        status: 'ACTIVE'
      });
      this._writeLots(uid, lots);

      const txn = {
        id: this._genTxnId(),
        uid,
        type: 'REVERSE',
        source: 'REFUND',
        sourceRef: originalTxnId,
        category: 'REFUND',
        points: reversalPoints,
        balance: 0,
        ts: now,
        expiry: expiryTs,
        status: 'ACTIVE',
        meta: { reason }
      };
      original.status = 'REVERSED';
      entries.push(txn);
      txn.balance = this._computeBalance(uid, entries);
      this._writeLedger(uid, entries);

      return { success: true, txnId: txn.id, restoredPoints: reversalPoints };
    },

    /**
     * Expire points for a specific lot
     */
    expireLot (uid, lotId) {
      const lots = this._readLots(uid);
      const lot = lots.find(l => l.id === lotId);
      if (!lot || lot.status !== 'ACTIVE' || lot.remaining <= 0) return null;

      const expiredPts = lot.remaining;
      lot.remaining = 0;
      lot.status = 'EXPIRED';
      this._writeLots(uid, lots);

      const txn = {
        id: this._genTxnId(),
        uid,
        type: 'EXPIRE',
        source: 'SYSTEM',
        sourceRef: lotId,
        category: 'EXPIRY',
        points: -expiredPts,
        balance: 0,
        ts: Date.now(),
        expiry: null,
        status: 'ACTIVE',
        meta: {}
      };
      const entries = this._readLedger(uid);
      entries.push(txn);
      txn.balance = this._computeBalance(uid, entries);
      this._writeLedger(uid, entries);

      return { expiredPoints: expiredPts, txnId: txn.id };
    },

    /**
     * Compute available balance from ledger entries
     */
    _computeBalance (uid, entries) {
      // Filter active entries only
      return entries.reduce((sum, e) => {
        if (e.status === 'REVERSED' && e.type !== 'REVERSE') return sum;
        return sum + e.points;
      }, 0);
    },

    /**
     * Live available balance (excluding expired lots)
     */
    getAvailableBalance (uid) {
      const now = Date.now();
      const lots = this._readLots(uid);
      return lots
        .filter(l => l.status === 'ACTIVE' && l.remaining > 0 && l.expiry > now)
        .reduce((s, l) => s + l.remaining, 0);
    },

    /**
     * Balance that is redemption-eligible
     */
    getRedeemableBalance (uid) {
      const bal = this.getAvailableBalance(uid);
      const cfg = LoyaltyConfig.get().redemption;
      if (bal < cfg.minBalanceToRedeem) return 0;
      return bal;
    },

    /**
     * Points value in ₹
     */
    pointsToRupees (points) {
      return points * LoyaltyConfig.get().redemption.ratePerPoint;
    },

    /**
     * Full ledger for display
     */
    getLedger (uid, limit) {
      const entries = this._readLedger(uid);
      const sorted = entries.slice().sort((a, b) => b.ts - a.ts);
      return limit ? sorted.slice(0, limit) : sorted;
    },

    /**
     * Active lots for expiry timeline
     */
    getActiveLots (uid) {
      const now = Date.now();
      return this._readLots(uid)
        .filter(l => l.status === 'ACTIVE' && l.remaining > 0 && l.expiry > now)
        .sort((a, b) => a.expiry - b.expiry);
    },

    /**
     * Total earned (lifetime)
     */
    lifetimeEarned (uid) {
      return this._readLedger(uid)
        .filter(e => e.type === 'EARN' || e.type === 'BONUS')
        .reduce((s, e) => s + e.points, 0);
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 3. TIER ENGINE
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyTierEngine = {
    SK_PREFIX: 'wow_loyalty_tier_',

    _key (uid) { return this.SK_PREFIX + uid; },

    _read (uid) {
      try { return JSON.parse(localStorage.getItem(this._key(uid))); }
      catch { return null; }
    },

    _write (uid, data) {
      localStorage.setItem(this._key(uid), JSON.stringify(data));
    },

    init (uid) {
      if (!this._read(uid)) {
        this._write(uid, {
          current: 'BRONZE',
          qualifyingPoints: 0,
          history: [],
          graceExpiry: null,
          lastEvaluated: Date.now()
        });
      }
    },

    getCurrentTier (uid) {
      const d = this._read(uid);
      return d ? d.current : 'BRONZE';
    },

    getTierData (uid) {
      this.init(uid);
      return this._read(uid);
    },

    /**
     * Re-evaluate tier based on points earned in current period
     * Called after every earn transaction
     */
    evaluate (uid) {
      this.init(uid);
      const data = this._read(uid);
      const cfg  = LoyaltyConfig.get();
      const tiers = [...cfg.tiers].sort((a, b) => b.rank - a.rank);

      // Qualifying points = total lifetime earned (simplified)
      const totalEarned = LoyaltyLedger.lifetimeEarned(uid);
      data.qualifyingPoints = totalEarned;

      const oldTier = data.current;
      let newTierId = 'BRONZE';

      for (const t of tiers) {
        if (totalEarned >= t.qualifyPoints) {
          newTierId = t.id;
          break;
        }
      }

      if (newTierId !== oldTier) {
        const oldCfg = LoyaltyConfig.getTier(oldTier);
        const newCfg = LoyaltyConfig.getTier(newTierId);
        const isUpgrade = newCfg.rank > oldCfg.rank;

        data.history.push({
          from: oldTier,
          to: newTierId,
          type: isUpgrade ? 'UPGRADE' : 'DOWNGRADE',
          ts: Date.now(),
          qualifyingPoints: totalEarned
        });

        data.current = newTierId;
        data.lastEvaluated = Date.now();
        this._write(uid, data);

        // Issue upgrade bonus
        if (isUpgrade && newCfg.upgradeBonusPoints > 0) {
          LoyaltyLedger.bonus(uid, {
            points: newCfg.upgradeBonusPoints,
            reason: `TIER_UPGRADE_${newTierId}`,
            meta: { tierFrom: oldTier, tierTo: newTierId }
          });
        }

        // Trigger comms
        LoyaltyComms.tierChange(uid, { from: oldTier, to: newTierId, isUpgrade, bonusPoints: isUpgrade ? newCfg.upgradeBonusPoints : 0 });

        return { changed: true, from: oldTier, to: newTierId, isUpgrade };
      }

      data.lastEvaluated = Date.now();
      this._write(uid, data);
      return { changed: false, current: newTierId };
    },

    getNextTier (uid) {
      const current = this.getCurrentTier(uid);
      const cfg = LoyaltyConfig.get();
      const sorted = [...cfg.tiers].sort((a, b) => a.rank - b.rank);
      const idx = sorted.findIndex(t => t.id === current);
      return idx < sorted.length - 1 ? sorted[idx + 1] : null;
    },

    getProgressToNextTier (uid) {
      const current = this.getCurrentTier(uid);
      const next    = this.getNextTier(uid);
      if (!next) return { pct: 100, ptNeeded: 0, next: null };
      const earned  = LoyaltyLedger.lifetimeEarned(uid);
      const currentCfg = LoyaltyConfig.getTier(current);
      const base    = currentCfg.qualifyPoints;
      const target  = next.qualifyPoints;
      const pct     = Math.min(100, Math.round(((earned - base) / (target - base)) * 100));
      return { pct, ptNeeded: Math.max(0, target - earned), next };
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 4. EXPIRY ENGINE
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyExpiry = {
    SK_PREFIX: 'wow_loyalty_expiry_',

    /**
     * Run expiry check for a user — call on page load / dashboard open
     */
    runForUser (uid) {
      const now  = Date.now();
      const lots = LoyaltyLedger._readLots(uid);
      const expired = lots.filter(l => l.status === 'ACTIVE' && l.remaining > 0 && l.expiry <= now);

      expired.forEach(lot => {
        const result = LoyaltyLedger.expireLot(uid, lot.id);
        if (result) {
          LoyaltyComms.pointsExpired(uid, { points: result.expiredPoints, lotId: lot.id });
        }
      });

      return expired.length;
    },

    /**
     * Get lots expiring within X days — for proactive notifications
     */
    getExpiringSoon (uid, days) {
      const now    = Date.now();
      const cutoff = now + days * 24 * 60 * 60 * 1000;
      return LoyaltyLedger._readLots(uid)
        .filter(l => l.status === 'ACTIVE' && l.remaining > 0 && l.expiry > now && l.expiry <= cutoff);
    },

    /**
     * Check and fire notification triggers for upcoming expiry
     */
    checkNotifications (uid) {
      const cfg      = LoyaltyConfig.get().expiry;
      const now      = Date.now();
      const notifKey = 'wow_loyalty_expiry_notif_' + uid;
      let sent;
      try { sent = JSON.parse(localStorage.getItem(notifKey)) || {}; }
      catch { sent = {}; }

      cfg.notifyDays.forEach(d => {
        const lots = this.getExpiringSoon(uid, d);
        if (!lots.length) return;
        const totalExpiring = lots.reduce((s, l) => s + l.remaining, 0);
        const key = `${d}d_${Math.floor(now / 86400000)}`;
        if (!sent[key]) {
          LoyaltyComms.expiryWarning(uid, { daysLeft: d, points: totalExpiring });
          sent[key] = true;
        }
      });

      localStorage.setItem(notifKey, JSON.stringify(sent));
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 5. OTP ENGINE
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyOTP = {
    SK_PREFIX: 'wow_loyalty_otp_',
    RATE_SK:   'wow_loyalty_otp_rate_',

    _key (uid)  { return this.SK_PREFIX + uid; },
    _rateKey (uid) { return this.RATE_SK + uid; },

    _read (uid) {
      try { return JSON.parse(localStorage.getItem(this._key(uid))); }
      catch { return null; }
    },

    _write (uid, d) { localStorage.setItem(this._key(uid), JSON.stringify(d)); },

    /**
     * Generate OTP and send via comms
     */
    generate (uid, mobile) {
      const cfg = LoyaltyConfig.get().otp;
      const now = Date.now();

      // Rate limiting
      const rateData = (() => {
        try { return JSON.parse(localStorage.getItem(this._rateKey(uid))) || { count: 0, windowStart: now }; }
        catch { return { count: 0, windowStart: now }; }
      })();

      if (now - rateData.windowStart < 3600000) { // 1 hour window
        if (rateData.count >= cfg.rateLimitPerHour) {
          return { success: false, reason: 'Too many OTP requests. Please try again later.' };
        }
        rateData.count++;
      } else {
        rateData.count = 1;
        rateData.windowStart = now;
      }
      localStorage.setItem(this._rateKey(uid), JSON.stringify(rateData));

      // Check lockout
      const existing = this._read(uid);
      if (existing && existing.lockedUntil && now < existing.lockedUntil) {
        const mins = Math.ceil((existing.lockedUntil - now) / 60000);
        return { success: false, reason: `OTP locked. Try again in ${mins} minute(s).` };
      }

      // Generate OTP
      const code = Array.from({length: cfg.length}, () => Math.floor(Math.random() * 10)).join('');
      const data = {
        code,
        uid,
        mobile,
        attempts: 0,
        expiry: now + cfg.expirySeconds * 1000,
        consumed: false,
        lockedUntil: null,
        generatedAt: now,
        token: 'OTP-' + now + '-' + Math.random().toString(36).substr(2, 8).toUpperCase()
      };

      this._write(uid, data);

      // Send via comms
      LoyaltyComms.sendOTP(uid, { mobile, code, expiry: cfg.expirySeconds });

      // In dev: surface the code on console
      console.info(`[WOW Loyalty OTP] Code for ${uid}: ${code} (expires in ${cfg.expirySeconds}s)`);

      return { success: true, token: data.token, expirySeconds: cfg.expirySeconds, maskedMobile: mobile ? mobile.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2') : '' };
    },

    /**
     * Validate OTP — does NOT consume it
     */
    validate (uid, inputCode) {
      const cfg  = LoyaltyConfig.get().otp;
      const data = this._read(uid);
      const now  = Date.now();

      if (!data || data.consumed) return { valid: false, reason: 'No active OTP. Please request a new one.' };
      if (data.lockedUntil && now < data.lockedUntil) {
        const mins = Math.ceil((data.lockedUntil - now) / 60000);
        return { valid: false, reason: `OTP locked for ${mins} more minute(s).` };
      }
      if (now > data.expiry) return { valid: false, reason: 'OTP expired. Please request a new one.' };
      if (String(inputCode).trim() !== String(data.code)) {
        data.attempts++;
        if (data.attempts >= cfg.maxAttempts) {
          data.lockedUntil = now + cfg.lockoutMinutes * 60000;
          data.consumed = true;
        }
        this._write(uid, data);
        const left = cfg.maxAttempts - data.attempts;
        return { valid: false, reason: left > 0 ? `Incorrect OTP. ${left} attempt(s) remaining.` : 'OTP locked after too many failures.' };
      }

      return { valid: true, token: data.token };
    },

    /**
     * Validate AND consume OTP — call just before executing redemption
     */
    validateAndConsume (uid, inputCode) {
      const result = this.validate(uid, inputCode);
      if (!result.valid) return result;

      const data = this._read(uid);
      data.consumed = true;
      this._write(uid, data);

      return { valid: true, token: data.token };
    },

    isLocked (uid) {
      const data = this._read(uid);
      if (!data) return false;
      return data.lockedUntil && Date.now() < data.lockedUntil;
    },

    /**
     * Expose last OTP code for demo/dev mode only
     */
    _devGetCode (uid) {
      const d = this._read(uid);
      return d ? d.code : null;
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 6. REDEMPTION ENGINE
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyRedemption = {
    /**
     * Pre-validate a redemption request (before OTP)
     */
    preValidate (uid, { points, orderType, orderValue }) {
      const cfg = LoyaltyConfig.get().redemption;

      if (!cfg.allowedFor.includes(orderType)) {
        return { valid: false, reason: `Loyalty points cannot be used for ${orderType}.` };
      }

      const balance   = LoyaltyLedger.getAvailableBalance(uid);
      const redeemable = LoyaltyLedger.getRedeemableBalance(uid);

      if (balance < cfg.minBalanceToRedeem) {
        return { valid: false, reason: `You need at least ${cfg.minBalanceToRedeem} pts to start redeeming.` };
      }
      if (points < cfg.minPointsPerTxn) {
        return { valid: false, reason: `Minimum ${cfg.minPointsPerTxn} pts per transaction.` };
      }
      if (points < cfg.nonRedeemableBelow) {
        return { valid: false, reason: `Points must be ≥ ${cfg.nonRedeemableBelow} to redeem.` };
      }
      if (points > redeemable) {
        return { valid: false, reason: `You can only redeem up to ${redeemable} pts.` };
      }

      const maxByValue  = Math.floor((orderValue * cfg.maxRedemptionPct / 100) * cfg.ratePerPoint);
      const effectivePts = Math.min(points, maxByValue);
      const valueEquiv  = effectivePts * cfg.ratePerPoint;

      return { valid: true, points: effectivePts, valueEquiv, balance, redeemable };
    },

    /**
     * Execute redemption after OTP validated
     */
    execute (uid, { points, orderType, orderRef, otpCode, meta }) {
      // 1. Validate OTP
      const otpResult = LoyaltyOTP.validateAndConsume(uid, otpCode);
      if (!otpResult.valid) {
        return { success: false, reason: otpResult.reason };
      }

      // 2. Re-validate amounts (prevent race conditions)
      const preCheck = this.preValidate(uid, { points, orderType, orderValue: points });
      if (!preCheck.valid) {
        return { success: false, reason: preCheck.reason };
      }

      // 3. Deduct from ledger
      const result = LoyaltyLedger.redeem(uid, {
        points,
        source: orderType,
        sourceRef: orderRef,
        otpToken: otpResult.token,
        meta
      });

      if (!result.success) {
        return result;
      }

      // 4. Re-evaluate tier
      LoyaltyTierEngine.evaluate(uid);

      // 5. Notify
      LoyaltyComms.redemptionConfirmed(uid, { points, orderRef, valueEquiv: points * LoyaltyConfig.get().redemption.ratePerPoint });

      return { success: true, txnId: result.txnId, deducted: points, newBalance: result.newBalance, valueEquiv: points * LoyaltyConfig.get().redemption.ratePerPoint };
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 7. POINTS EARNING ENGINE (Booking Hook)
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyEarningEngine = {
    /**
     * Calculate points for a booking
     * @param {string} uid
     * @param {number} amountPaid  ₹ paid (after discounts, excl. redeemed pts)
     * @param {string} category    e.g. WATER_DAY, PASSPORT
     * @returns {number} points to award
     */
    calculatePoints (uid, amountPaid, category) {
      const cfg     = LoyaltyConfig.get();
      const tier    = LoyaltyTierEngine.getCurrentTier(uid);
      const tierCfg = LoyaltyConfig.getTier(tier);

      const baseRate   = cfg.earn.baseRate;       // ₹ per point
      const catMult    = (cfg.earn.categories[category] || { multiplier: 1.0 }).multiplier;
      const tierMult   = tierCfg.multiplier;
      const campBonus  = LoyaltyConfig.getActiveCampaignMultiplier(category, uid);
      const totalMult  = catMult * tierMult + campBonus;

      let raw = (amountPaid / baseRate) * totalMult;

      switch (cfg.earn.roundingRule) {
        case 'ceil':  return Math.ceil(raw);
        case 'round': return Math.round(raw);
        default:      return Math.floor(raw);
      }
    },

    /**
     * Award points after a successful booking
     */
    awardForBooking (uid, { amountPaid, category, bookingRef, meta }) {
      LoyaltyTierEngine.init(uid);
      LoyaltyExpiry.runForUser(uid);

      const points = this.calculatePoints(uid, amountPaid, category);
      if (points <= 0) return { success: false, reason: 'No points to award.' };

      const txn = LoyaltyLedger.earn(uid, {
        points,
        source: category,
        sourceRef: bookingRef,
        category,
        meta
      });

      // Re-evaluate tier
      const tierResult = LoyaltyTierEngine.evaluate(uid);

      // Check expiry notifications
      LoyaltyExpiry.checkNotifications(uid);

      // Notify earn
      LoyaltyComms.pointsEarned(uid, { points, bookingRef, newBalance: LoyaltyLedger.getAvailableBalance(uid) });

      return { success: true, points, txnId: txn.id, tierResult };
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 8. COMMUNICATIONS ENGINE (Stubs — wire to real SMS/WA/Email gateway)
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyComms = {
    _log (type, uid, data) {
      const key = 'wow_loyalty_comms_' + uid;
      let log;
      try { log = JSON.parse(localStorage.getItem(key)) || []; }
      catch { log = []; }
      log.unshift({ type, uid, data, ts: Date.now() });
      if (log.length > 50) log.length = 50;
      localStorage.setItem(key, JSON.stringify(log));
      console.info('[WOW Loyalty Comms]', type, uid, data);
    },

    getLog (uid) {
      try { return JSON.parse(localStorage.getItem('wow_loyalty_comms_' + uid)) || []; }
      catch { return []; }
    },

    sendOTP (uid, { mobile, code, expiry }) {
      this._log('OTP_SEND', uid, { mobile, message: `Your WOW Loyalty OTP is ${code}. Valid for ${expiry}s. Do not share.` });
      // TODO: call SMS/WhatsApp gateway
    },

    pointsEarned (uid, { points, bookingRef, newBalance }) {
      this._log('EARN', uid, { message: `🎉 You earned ${points} WOW Points on booking ${bookingRef}! Balance: ${newBalance} pts.` });
    },

    redemptionConfirmed (uid, { points, orderRef, valueEquiv }) {
      this._log('REDEEM', uid, { message: `✅ ${points} WOW Points (₹${valueEquiv}) redeemed on order ${orderRef}.` });
    },

    tierChange (uid, { from, to, isUpgrade, bonusPoints }) {
      if (isUpgrade) {
        this._log('TIER_UPGRADE', uid, { message: `🏆 Congratulations! You've been upgraded to ${to} tier! +${bonusPoints} bonus points awarded.` });
      } else {
        this._log('TIER_DOWNGRADE', uid, { message: `Your tier has been updated from ${from} to ${to}.` });
      }
    },

    expiryWarning (uid, { daysLeft, points }) {
      this._log('EXPIRY_WARNING', uid, { message: `⚠️ ${points} WOW Points expiring in ${daysLeft} day(s). Redeem before they expire!` });
    },

    pointsExpired (uid, { points }) {
      this._log('EXPIRED', uid, { message: `❌ ${points} WOW Points have expired.` });
    },

    inactivityNudge (uid) {
      this._log('INACTIVITY', uid, { message: `👋 It's been a while! Visit WOW and earn loyalty points. Your current balance awaits!` });
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 9. CHECKOUT INTEGRATION LAYER
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyCheckout = {
    /**
     * Mount the loyalty payment widget into a container
     * @param {string} containerId   DOM ID to inject widget
     * @param {object} opts          { uid, orderValue, orderType, orderRef, onRedeem, onCancel }
     */
    mountWidget (containerId, opts) {
      const el = document.getElementById(containerId);
      if (!el) return;

      const uid = opts.uid || this._getLoggedInUid();
      const cfg = LoyaltyConfig.get().redemption;

      if (!uid) {
        el.innerHTML = this._renderLoginPrompt(opts);
        return;
      }

      LoyaltyExpiry.runForUser(uid);
      const balance    = LoyaltyLedger.getAvailableBalance(uid);
      const redeemable = LoyaltyLedger.getRedeemableBalance(uid);
      const maxPts     = Math.min(redeemable, Math.floor(opts.orderValue));
      const tier       = LoyaltyTierEngine.getCurrentTier(uid);
      const tierCfg    = LoyaltyConfig.getTier(tier);
      const canRedeem  = redeemable >= cfg.minPointsPerTxn;

      el.innerHTML = this._renderWidget({ uid, balance, redeemable, maxPts, canRedeem, tierCfg, cfg, orderValue: opts.orderValue, orderType: opts.orderType });
      this._attachEvents(containerId, opts, uid, maxPts);
    },

    _getLoggedInUid () {
      try {
        const s = JSON.parse(sessionStorage.getItem('wow_customer_session') || localStorage.getItem('wow_customer_session'));
        return s && s.uid ? s.uid : null;
      } catch { return null; }
    },

    _renderLoginPrompt (opts) {
      return `
      <div class="loy-checkout-box loy-login-prompt">
        <div class="loy-checkout-icon">🏆</div>
        <div class="loy-checkout-title">Pay with WOW Loyalty Points</div>
        <div class="loy-checkout-sub">Sign in to use your points balance</div>
        <button class="loy-btn loy-btn-gold" onclick="WOWLoyalty.checkout.triggerLogin('${opts.orderRef || ''}')">
          <i class="fas fa-sign-in-alt"></i> Sign In to Use Points
        </button>
      </div>`;
    },

    _renderWidget ({ uid, balance, redeemable, maxPts, canRedeem, tierCfg, cfg, orderValue, orderType }) {
      const valueEquiv = maxPts * cfg.ratePerPoint;
      return `
      <div class="loy-checkout-box" id="loy-widget">
        <div class="loy-checkout-header">
          <span class="loy-tier-badge" style="background:${tierCfg.bgColor};color:${tierCfg.color};">
            ${tierCfg.icon} ${tierCfg.name}
          </span>
          <span class="loy-checkout-title">WOW Loyalty Points</span>
        </div>
        <div class="loy-balance-row">
          <div class="loy-bal-item">
            <div class="loy-bal-val">${balance.toLocaleString()}</div>
            <div class="loy-bal-lbl">Available Points</div>
          </div>
          <div class="loy-bal-item">
            <div class="loy-bal-val">${redeemable.toLocaleString()}</div>
            <div class="loy-bal-lbl">Redeemable</div>
          </div>
          <div class="loy-bal-item loy-bal-highlight">
            <div class="loy-bal-val">₹${valueEquiv.toLocaleString()}</div>
            <div class="loy-bal-lbl">Max Value</div>
          </div>
        </div>
        ${canRedeem ? `
        <div class="loy-pts-selector">
          <label class="loy-pts-label">Points to redeem:</label>
          <div class="loy-pts-row">
            <input type="range" id="loy-pts-range" min="${cfg.minPointsPerTxn}" max="${maxPts}" step="${cfg.minPointsPerTxn}" value="${maxPts}" class="loy-range"/>
            <input type="number" id="loy-pts-input" min="${cfg.minPointsPerTxn}" max="${maxPts}" value="${maxPts}" class="loy-pts-num"/>
          </div>
          <div class="loy-pts-value-row">
            You save <strong id="loy-val-display">₹${maxPts * cfg.ratePerPoint}</strong>
          </div>
        </div>
        <div id="loy-otp-section" style="display:none;">
          <div class="loy-otp-header">🔒 OTP Verification Required</div>
          <div class="loy-otp-sub" id="loy-otp-hint"></div>
          <div class="loy-otp-row">
            <input type="text" id="loy-otp-input" maxlength="6" placeholder="Enter 6-digit OTP" class="loy-otp-inp" autocomplete="one-time-code" inputmode="numeric"/>
            <button class="loy-btn loy-btn-sm" id="loy-otp-resend" onclick="WOWLoyalty.checkout._resendOTP(this)">Resend</button>
          </div>
          <div id="loy-otp-msg" class="loy-otp-msg"></div>
          <div style="display:flex;gap:10px;margin-top:12px;">
            <button class="loy-btn loy-btn-gold" onclick="WOWLoyalty.checkout._submitOTP(this)">✅ Confirm Redemption</button>
            <button class="loy-btn loy-btn-outline" onclick="WOWLoyalty.checkout._cancelOTP(this)">Cancel</button>
          </div>
        </div>
        <div id="loy-action-row" class="loy-action-row">
          <button class="loy-btn loy-btn-gold" onclick="WOWLoyalty.checkout._requestOTP(this)">
            🏆 Pay with Points
          </button>
          <div class="loy-skip-link">or <a onclick="WOWLoyalty.checkout._skipLoyalty(this)" href="#">pay via UPI/Card</a></div>
        </div>
        ` : `
        <div class="loy-not-eligible">
          ${balance < cfg.minBalanceToRedeem
            ? `<span>Earn ${cfg.minBalanceToRedeem - balance} more pts to unlock redemption.</span>`
            : `<span>Minimum ${cfg.minPointsPerTxn} pts required per transaction.</span>`
          }
        </div>
        `}
        <div id="loy-success-panel" class="loy-success" style="display:none;"></div>
      </div>`;
    },

    _attachEvents (containerId, opts, uid, maxPts) {
      // Sync range ↔ number input
      setTimeout(() => {
        const range = document.getElementById('loy-pts-range');
        const input = document.getElementById('loy-pts-input');
        const valDisp = document.getElementById('loy-val-display');
        const cfg = LoyaltyConfig.get().redemption;

        if (!range || !input) return;
        const sync = (v) => {
          v = Math.max(cfg.minPointsPerTxn, Math.min(maxPts, parseInt(v) || cfg.minPointsPerTxn));
          range.value = v;
          input.value = v;
          if (valDisp) valDisp.textContent = '₹' + (v * cfg.ratePerPoint).toLocaleString();
        };
        range.addEventListener('input', () => sync(range.value));
        input.addEventListener('input', () => sync(input.value));

        // Store opts on widget for use in event handlers
        const widget = document.getElementById('loy-widget');
        if (widget) {
          widget._loyOpts = opts;
          widget._loyUid  = uid;
        }
      }, 50);
    },

    _getWidget () { return document.getElementById('loy-widget'); },
    _getSelectedPts () {
      const inp = document.getElementById('loy-pts-input');
      return inp ? parseInt(inp.value) || 0 : 0;
    },

    _requestOTP (btn) {
      const widget = this._getWidget();
      if (!widget) return;
      const uid    = widget._loyUid;
      const opts   = widget._loyOpts;
      const points = this._getSelectedPts();

      const pre = LoyaltyRedemption.preValidate(uid, { points, orderType: opts.orderType, orderValue: opts.orderValue });
      if (!pre.valid) {
        this._showMsg('loy-otp-msg', pre.reason, 'err');
        return;
      }

      // Get mobile from session
      let mobile = '';
      try {
        const s = JSON.parse(sessionStorage.getItem('wow_customer_session') || localStorage.getItem('wow_customer_session'));
        mobile = s && s.mobile ? s.mobile : '';
      } catch {}

      const result = LoyaltyOTP.generate(uid, mobile);
      if (!result.success) {
        this._showMsg('loy-otp-msg', result.reason, 'err');
        return;
      }

      // Show OTP section
      const otpSection = document.getElementById('loy-otp-section');
      const actionRow  = document.getElementById('loy-action-row');
      const hint       = document.getElementById('loy-otp-hint');
      if (otpSection) otpSection.style.display = 'block';
      if (actionRow)  actionRow.style.display  = 'none';
      if (hint) hint.textContent = `OTP sent to ${result.maskedMobile || 'your registered mobile'}. Valid for ${result.expirySeconds}s.`;

      // Dev mode: show OTP inline
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.') || window.location.hostname.includes('webcontainer')) {
        const devCode = LoyaltyOTP._devGetCode(uid);
        if (devCode && hint) hint.textContent += ` [DEV: ${devCode}]`;
      }

      widget._loyPtsToRedeem = points;
    },

    _resendOTP (btn) {
      const widget = this._getWidget();
      if (!widget) return;
      const uid = widget._loyUid;
      let mobile = '';
      try {
        const s = JSON.parse(sessionStorage.getItem('wow_customer_session') || localStorage.getItem('wow_customer_session'));
        mobile = s && s.mobile ? s.mobile : '';
      } catch {}
      const result = LoyaltyOTP.generate(uid, mobile);
      const hint = document.getElementById('loy-otp-hint');
      if (!result.success) {
        this._showMsg('loy-otp-msg', result.reason, 'err');
        return;
      }
      if (hint) hint.textContent = `New OTP sent. Valid for ${result.expirySeconds}s.`;
      if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.') || window.location.hostname.includes('webcontainer')) {
        const devCode = LoyaltyOTP._devGetCode(uid);
        if (devCode && hint) hint.textContent += ` [DEV: ${devCode}]`;
      }
    },

    _submitOTP (btn) {
      const widget = this._getWidget();
      if (!widget) return;
      const uid    = widget._loyUid;
      const opts   = widget._loyOpts;
      const points = widget._loyPtsToRedeem || this._getSelectedPts();
      const code   = (document.getElementById('loy-otp-input') || {}).value || '';

      if (!code || code.length !== 6) {
        this._showMsg('loy-otp-msg', 'Please enter the 6-digit OTP.', 'err');
        return;
      }

      const result = LoyaltyRedemption.execute(uid, {
        points,
        orderType: opts.orderType,
        orderRef: opts.orderRef || ('ORD-' + Date.now()),
        otpCode: code,
        meta: { orderValue: opts.orderValue }
      });

      if (!result.success) {
        this._showMsg('loy-otp-msg', result.reason, 'err');
        return;
      }

      // Show success
      document.getElementById('loy-otp-section').style.display  = 'none';
      const successPanel = document.getElementById('loy-success-panel');
      if (successPanel) {
        successPanel.style.display = 'block';
        successPanel.innerHTML = `
          <div class="loy-success-icon">✅</div>
          <div class="loy-success-title">${points.toLocaleString()} Points Redeemed!</div>
          <div class="loy-success-sub">₹${result.valueEquiv.toLocaleString()} applied to your order. New balance: ${result.newBalance.toLocaleString()} pts.</div>
        `;
      }

      // Callback
      if (opts.onRedeem) opts.onRedeem({ points, valueEquiv: result.valueEquiv, txnId: result.txnId, newBalance: result.newBalance });
    },

    _cancelOTP (btn) {
      const otpSection = document.getElementById('loy-otp-section');
      const actionRow  = document.getElementById('loy-action-row');
      const otpMsg     = document.getElementById('loy-otp-msg');
      const otpInput   = document.getElementById('loy-otp-input');
      if (otpSection) otpSection.style.display = 'none';
      if (actionRow)  actionRow.style.display  = 'flex';
      if (otpMsg)     otpMsg.textContent        = '';
      if (otpInput)   otpInput.value            = '';
    },

    _skipLoyalty (el) {
      const widget = this._getWidget();
      if (!widget) return;
      const opts = widget._loyOpts;
      if (opts && opts.onCancel) opts.onCancel();
      const container = widget.closest('[id]');
      if (container) container.style.opacity = '0.4';
    },

    triggerLogin (orderRef) {
      const redirect = encodeURIComponent(window.location.href + (orderRef ? '?loyaltyRef=' + orderRef : ''));
      window.location.href = '../portal/login.html?redirect=' + redirect + '&hint=loyalty';
    },

    _showMsg (id, msg, type) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent  = msg;
      el.className    = 'loy-otp-msg loy-msg-' + (type || 'info');
      el.style.display = 'block';
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 10. FRAUD PREVENTION
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyFraud = {
    /**
     * Check for duplicate redemption within time window
     */
    isDuplicateRedemption (uid, orderRef) {
      const ledger = LoyaltyLedger.getLedger(uid, 20);
      const dupeWindow = 5 * 60 * 1000; // 5 minutes
      const now = Date.now();
      return ledger.some(e => e.type === 'REDEEM' && e.sourceRef === orderRef && (now - e.ts) < dupeWindow);
    },

    /**
     * Validate balance integrity (anti-manipulation)
     */
    verifyBalance (uid) {
      const ledger = LoyaltyLedger._readLedger(uid);
      const computed = ledger.reduce((s, e) => {
        if (e.status === 'REVERSED' && e.type !== 'REVERSE') return s;
        return s + e.points;
      }, 0);
      const reported = LoyaltyLedger.getAvailableBalance(uid);
      // Computed ≥ available is valid (lots can expire independently)
      return { valid: computed >= 0, computed, reported };
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * 11. ANALYTICS ENGINE
   * ───────────────────────────────────────────────────────────────────────── */
  const LoyaltyAnalytics = {
    /**
     * Platform-wide stats (from all keys in localStorage matching prefix)
     */
    getPlatformStats () {
      const allLedgerKeys = Object.keys(localStorage).filter(k => k.startsWith('wow_loyalty_ledger_'));
      let totalEarned = 0, totalRedeemed = 0, totalExpired = 0, totalBonus = 0;
      const tierDist = { BRONZE: 0, SILVER: 0, GOLD: 0, PLATINUM: 0 };
      const userCount = allLedgerKeys.length;

      allLedgerKeys.forEach(key => {
        const uid = key.replace('wow_loyalty_ledger_', '');
        try {
          const entries = JSON.parse(localStorage.getItem(key)) || [];
          entries.forEach(e => {
            if (e.type === 'EARN')   totalEarned   += e.points;
            if (e.type === 'BONUS')  totalBonus    += e.points;
            if (e.type === 'REDEEM') totalRedeemed += Math.abs(e.points);
            if (e.type === 'EXPIRE') totalExpired  += Math.abs(e.points);
          });
          const tier = LoyaltyTierEngine.getCurrentTier(uid);
          if (tierDist[tier] !== undefined) tierDist[tier]++;
        } catch {}
      });

      const redemptionRate = totalEarned > 0 ? ((totalRedeemed / totalEarned) * 100).toFixed(1) : 0;
      const expiryLeakage  = totalEarned > 0 ? ((totalExpired / totalEarned) * 100).toFixed(1) : 0;

      return {
        userCount,
        totalEarned,
        totalBonus,
        totalRedeemed,
        totalExpired,
        netOutstanding: totalEarned + totalBonus - totalRedeemed - totalExpired,
        redemptionRate,
        expiryLeakage,
        tierDist,
        estimatedLiability: (totalEarned + totalBonus - totalRedeemed - totalExpired) * LoyaltyConfig.get().redemption.ratePerPoint
      };
    },

    /**
     * Per-user stats
     */
    getUserStats (uid) {
      const balance     = LoyaltyLedger.getAvailableBalance(uid);
      const redeemable  = LoyaltyLedger.getRedeemableBalance(uid);
      const lifetime    = LoyaltyLedger.lifetimeEarned(uid);
      const ledger      = LoyaltyLedger.getLedger(uid);
      const tier        = LoyaltyTierEngine.getCurrentTier(uid);
      const tierCfg     = LoyaltyConfig.getTier(tier);
      const progress    = LoyaltyTierEngine.getProgressToNextTier(uid);
      const lots        = LoyaltyLedger.getActiveLots(uid);
      const nextExpiring = lots.length ? lots[0] : null;

      const redeemed = ledger.filter(e => e.type === 'REDEEM').reduce((s, e) => s + Math.abs(e.points), 0);
      const expired  = ledger.filter(e => e.type === 'EXPIRE').reduce((s, e) => s + Math.abs(e.points), 0);

      return {
        uid,
        tier,
        tierCfg,
        balance,
        redeemable,
        lifetime,
        redeemed,
        expired,
        progress,
        nextExpiring,
        txnCount: ledger.length,
        valueEquiv: balance * LoyaltyConfig.get().redemption.ratePerPoint
      };
    }
  };

  /* ─────────────────────────────────────────────────────────────────────────
   * CSS Injection — Loyalty Widget Styles
   * ───────────────────────────────────────────────────────────────────────── */
  function injectLoyaltyCSS () {
    if (document.getElementById('wow-loyalty-css')) return;
    const style = document.createElement('style');
    style.id = 'wow-loyalty-css';
    style.textContent = `
      .loy-checkout-box{background:linear-gradient(135deg,#0a1628,#0f2044);border:1.5px solid rgba(245,168,0,.25);border-radius:16px;padding:20px;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;margin:16px 0;}
      .loy-checkout-header{display:flex;align-items:center;gap:10px;margin-bottom:14px;}
      .loy-checkout-title{font-size:15px;font-weight:700;color:#f1f5f9;}
      .loy-checkout-sub{font-size:12px;color:rgba(255,255,255,.5);margin-bottom:14px;}
      .loy-checkout-icon{font-size:28px;margin-bottom:8px;}
      .loy-tier-badge{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
      .loy-balance-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}
      .loy-bal-item{background:rgba(255,255,255,.06);border-radius:10px;padding:10px;text-align:center;}
      .loy-bal-highlight{background:rgba(245,168,0,.12);border:1px solid rgba(245,168,0,.2);}
      .loy-bal-val{font-size:18px;font-weight:800;color:#f1f5f9;}
      .loy-bal-lbl{font-size:10px;color:rgba(255,255,255,.45);margin-top:2px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;}
      .loy-pts-selector{margin-bottom:14px;}
      .loy-pts-label{font-size:12px;font-weight:600;color:rgba(255,255,255,.6);margin-bottom:8px;display:block;}
      .loy-pts-row{display:flex;align-items:center;gap:10px;}
      .loy-range{flex:1;accent-color:#f5a800;}
      .loy-pts-num{width:80px;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);color:#f1f5f9;font-size:13px;font-weight:700;text-align:center;}
      .loy-pts-value-row{font-size:12px;color:rgba(255,255,255,.55);margin-top:6px;}
      .loy-pts-value-row strong{color:#f5a800;}
      .loy-action-row{display:flex;flex-direction:column;gap:8px;}
      .loy-skip-link{font-size:11px;color:rgba(255,255,255,.4);text-align:center;}
      .loy-skip-link a{color:#94a3b8;cursor:pointer;text-decoration:underline;}
      .loy-not-eligible{padding:12px;background:rgba(255,255,255,.04);border-radius:10px;font-size:12px;color:rgba(255,255,255,.5);text-align:center;}
      .loy-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:11px 20px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:all .2s;width:100%;}
      .loy-btn-gold{background:linear-gradient(135deg,#f5a800,#e08f00);color:#0a0f1e;}
      .loy-btn-gold:hover{background:linear-gradient(135deg,#ffc333,#f5a800);}
      .loy-btn-outline{background:transparent;color:#94a3b8;border:1.5px solid rgba(255,255,255,.15);}
      .loy-btn-sm{width:auto;padding:8px 14px;font-size:12px;}
      .loy-otp-header{font-size:13px;font-weight:700;color:#f1f5f9;margin-bottom:4px;}
      .loy-otp-sub{font-size:11px;color:rgba(255,255,255,.45);margin-bottom:10px;}
      .loy-otp-row{display:flex;gap:8px;margin-bottom:8px;}
      .loy-otp-inp{flex:1;padding:10px 14px;border-radius:10px;border:1.5px solid rgba(245,168,0,.4);background:rgba(255,255,255,.07);color:#f1f5f9;font-size:18px;font-weight:700;letter-spacing:4px;text-align:center;}
      .loy-otp-inp:focus{border-color:#f5a800;outline:none;}
      .loy-otp-msg{font-size:12px;padding:6px 10px;border-radius:6px;margin-bottom:8px;}
      .loy-msg-err{background:rgba(239,68,68,.15);color:#f87171;}
      .loy-msg-ok{background:rgba(34,197,94,.15);color:#4ade80;}
      .loy-success{text-align:center;padding:16px;}
      .loy-success-icon{font-size:36px;margin-bottom:8px;}
      .loy-success-title{font-size:16px;font-weight:800;color:#4ade80;margin-bottom:4px;}
      .loy-success-sub{font-size:12px;color:rgba(255,255,255,.55);}
      .loy-login-prompt{text-align:center;padding:24px 16px;}
      @media(max-width:480px){.loy-balance-row{grid-template-columns:1fr 1fr;}.loy-bal-item:last-child{grid-column:1/-1;}}
    `;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────────────────────────────────────
   * PUBLIC API — WOWLoyalty
   * ───────────────────────────────────────────────────────────────────────── */
  const WOWLoyalty = {
    /* Sub-modules */
    config:     LoyaltyConfig,
    ledger:     LoyaltyLedger,
    tier:       LoyaltyTierEngine,
    expiry:     LoyaltyExpiry,
    otp:        LoyaltyOTP,
    redemption: LoyaltyRedemption,
    earning:    LoyaltyEarningEngine,
    comms:      LoyaltyComms,
    checkout:   LoyaltyCheckout,
    fraud:      LoyaltyFraud,
    analytics:  LoyaltyAnalytics,

    /**
     * Init for a user — call on login / page load
     */
    init (uid) {
      if (!uid) return;
      LoyaltyTierEngine.init(uid);
      LoyaltyExpiry.runForUser(uid);
      LoyaltyExpiry.checkNotifications(uid);
      injectLoyaltyCSS();
    },

    /**
     * Quick balance summary for any page
     */
    getSummary (uid) {
      if (!uid) return null;
      return LoyaltyAnalytics.getUserStats(uid);
    },

    /**
     * Award points after booking — called by booking confirmation
     */
    awardBookingPoints (uid, opts) {
      return LoyaltyEarningEngine.awardForBooking(uid, opts);
    },

    /**
     * Mount checkout widget
     */
    mountCheckoutWidget (containerId, opts) {
      injectLoyaltyCSS();
      LoyaltyCheckout.mountWidget(containerId, opts);
    },

    /**
     * Admin: credit/adjust points
     */
    adminCredit (uid, points, reason) {
      return LoyaltyLedger.bonus(uid, { points, reason: reason || 'ADMIN_CREDIT', meta: { adminAction: true } });
    },

    /**
     * Admin: debit/adjustment
     */
    adminDebit (uid, points, reason) {
      // Direct debit without OTP (admin only)
      const lots = LoyaltyLedger._readLots(uid);
      const now = Date.now();
      const activeLots = lots
        .filter(l => l.status === 'ACTIVE' && l.remaining > 0 && l.expiry > now)
        .sort((a, b) => a.expiry - b.expiry);
      let remaining = points;
      for (const lot of activeLots) {
        if (remaining <= 0) break;
        const use = Math.min(lot.remaining, remaining);
        lot.remaining -= use;
        remaining -= use;
        if (lot.remaining === 0) lot.status = 'USED';
      }
      if (remaining > 0) return { success: false, reason: 'Insufficient balance.' };
      LoyaltyLedger._writeLots(uid, lots);
      const txn = {
        id: 'LTX-ADM-' + Date.now(),
        uid, type: 'REDEEM', source: 'ADMIN_DEBIT', sourceRef: '', category: 'ADMIN',
        points: -points, balance: 0, ts: Date.now(), expiry: null, status: 'ACTIVE',
        meta: { reason, adminAction: true }
      };
      const entries = LoyaltyLedger._readLedger(uid);
      entries.push(txn);
      txn.balance = LoyaltyLedger._computeBalance(uid, entries);
      LoyaltyLedger._writeLedger(uid, entries);
      return { success: true, txnId: txn.id };
    },

    /**
     * Format helpers
     */
    fmt: {
      points: (n) => Number(n).toLocaleString() + ' pts',
      rupees: (n) => '₹' + Number(n).toLocaleString(),
      date: (ts) => ts ? new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
      timeAgo: (ts) => {
        const diff = Date.now() - ts;
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return Math.floor(diff / 86400000) + 'd ago';
      }
    },

    /**
     * Inject CSS manually (in case DOMContentLoaded already fired)
     */
    injectCSS: injectLoyaltyCSS,

    VERSION: '2.0.0'
  };

  // Auto-inject CSS on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLoyaltyCSS);
  } else {
    injectLoyaltyCSS();
  }

  // Expose globally
  global.WOWLoyalty = WOWLoyalty;

}(typeof window !== 'undefined' ? window : this));
