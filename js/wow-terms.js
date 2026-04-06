/* ============================================================
   WOW TERMS & CONDITIONS ENGINE  v1.0
   Shared across all booking pages:
     water-park · amusement-park · combo · group · passport
   ============================================================ */

(function (global) {
  'use strict';

  // ── FULL T&C CONTENT ─────────────────────────────────────────
  const TERMS = {
    lastUpdated: '30 March 2026',
    sections: [
      {
        icon: '🎟',
        title: 'Ticket Validity & Usage',
        points: [
          'Tickets are valid only for the date selected at the time of purchase. Date changes or rescheduling are not permitted.',
          'Each ticket is valid for a single entry per person. Re-entry is not allowed once you exit the park.',
          'Tickets are non-transferable. The QR code linked to this booking may only be used by the registered guest.',
          'Worlds of Wonder reserves the right to verify identity at the gate. Misuse of concession tickets (Senior Citizen, Armed Forces, Differently Abled) may result in denial of entry without refund.',
          'Children under 90 cm in height or under 3 years of age enter free and do not require a ticket. They must be accompanied by a ticketed adult at all times.',
        ]
      },
      {
        icon: '💰',
        title: 'Payments, Refunds & Cancellations',
        points: [
          'All ticket prices are inclusive of applicable GST (18%). A GST invoice will be sent to your registered email.',
          'Tickets are non-refundable once purchased. No cancellations or exchanges will be entertained under any circumstances.',
          'In the rare event that the park is closed due to an emergency, natural disaster, or government order on your booked date, a full credit note or rescheduling option will be provided.',
          'Partial or split payments are not applicable for online ticketing. Full payment is required at checkout.',
          'In case of a payment failure or duplicate charge, please contact support within 48 hours with your transaction reference.',
        ]
      },
      {
        icon: '🏃',
        title: 'Park Rules & Safety',
        points: [
          'All guests must comply with the park\'s safety guidelines, staff instructions, and ride height/weight restrictions at all times.',
          'Minimum height and health requirements apply on certain rides and attractions. Guests with heart conditions, back problems, pregnancy, or epilepsy are advised to avoid high-thrill rides.',
          'Outside food, beverages, and alcohol are strictly prohibited inside the park.',
          'Glass items, sharp objects, selfie sticks, and drones are not permitted inside the park premises.',
          'Worlds of Wonder is not liable for loss or theft of personal belongings. Paid lockers are available inside the park.',
          'Swimwear or park-issued costumes are mandatory for all water rides. Guests in regular clothing will not be permitted on water attractions.',
        ]
      },
      {
        icon: '📸',
        title: 'Photography & Media',
        points: [
          'Personal photography and videos are permitted for personal use. Commercial photography or videography requires prior written permission from the management.',
          'By entering the park, you consent to being photographed or filmed as part of crowd or event footage used for promotional purposes.',
          'Ride photography services are available for purchase. Guests may not use personal devices on select rides for safety reasons.',
        ]
      },
      {
        icon: '🪪',
        title: 'Annual Passport Terms',
        points: [
          'WOW Annual Passports are valid for 365 days from the date of KYC approval and activation, not from the date of purchase.',
          'Passports are strictly non-transferable and may only be used by the named passport holder. Photo ID verification may be required at every visit.',
          'Annual Passports do not guarantee entry on days of private events, technical closures, or capacity restrictions. Passport holders are advised to check availability in advance.',
          'Guest passes bundled with Passports are single-use and expire with the passport validity period.',
          'Passports can be suspended or revoked without refund in cases of misuse, resale, or violation of park rules.',
          'Digital passport (QR code) is available immediately after KYC approval. Physical passport cards are dispatched within 7–10 working days by post.',
        ]
      },
      {
        icon: '👥',
        title: 'Group Bookings',
        points: [
          'Group bookings are for 20 or more guests. Minimum group size must be maintained on the day of visit; no refund for absent guests.',
          'Group rates and discounts are applicable only to the ticket categories specified at the time of booking.',
          'A group coordinator will be assigned and must report to the group sales counter upon arrival for badge collection and orientation.',
          'Special seating, venue reservations, and dedicated services are subject to availability and additional charges.',
          'Group advance payment (30%) is non-refundable. Balance payments must be cleared 7 days before the visit date.',
        ]
      },
      {
        icon: '⚖️',
        title: 'Liability & Governing Law',
        points: [
          'Worlds of Wonder, operated by EAPL (Entertainment & Amusement Parks Ltd.), is not liable for any injury, illness, loss, or damage arising from participation in rides or activities unless caused by proven negligence of the management.',
          'Worlds of Wonder reserves the right to refuse entry to any guest who is under the influence of alcohol or drugs, behaves in a disorderly manner, or poses a safety risk.',
          'These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Noida, Uttar Pradesh.',
          'Worlds of Wonder reserves the right to amend these terms and conditions at any time without prior notice. The latest version is always available at worldsofwonder.in/terms.',
        ]
      },
      {
        icon: '📞',
        title: 'Contact & Support',
        points: [
          'For booking support, cancellation queries, or grievances: Email support@worldsofwonder.in | Call 080-6909-0000 (9 AM–7 PM, all days).',
          'For group sales & corporate enquiries: groups@worldsofwonder.in | +91 98765 43200.',
          'Lost & found: Contact the Guest Services desk at the park entrance or email lostandfound@worldsofwonder.in.',
        ]
      },
    ]
  };

  // ── INJECT MODAL HTML ─────────────────────────────────────────
  function _injectModal() {
    if (document.getElementById('wow-terms-modal')) return;

    const sectionsHTML = TERMS.sections.map(s => `
      <div class="wtc-section">
        <div class="wtc-section-head">
          <span class="wtc-section-icon">${s.icon}</span>
          <span class="wtc-section-title">${s.title}</span>
        </div>
        <ul class="wtc-section-list">
          ${s.points.map(p => `<li>${p}</li>`).join('')}
        </ul>
      </div>
    `).join('');

    const html = `
    <!-- ── WOW T&C MODAL ── -->
    <div id="wow-terms-modal" class="wtc-overlay" role="dialog" aria-modal="true" aria-label="Terms and Conditions" style="display:none;">
      <div class="wtc-modal">
        <div class="wtc-modal-header">
          <div class="wtc-modal-title-wrap">
            <div class="wtc-modal-icon">📜</div>
            <div>
              <h2 class="wtc-modal-title">Terms &amp; Conditions</h2>
              <p class="wtc-modal-sub">Worlds of Wonder · EAPL · Last updated ${TERMS.lastUpdated}</p>
            </div>
          </div>
          <button class="wtc-close-btn" onclick="WOWTerms.closeModal()" aria-label="Close">✕</button>
        </div>
        <div class="wtc-modal-body" id="wtc-body">
          <div class="wtc-intro">
            By proceeding with your booking, you confirm that you have read, understood, and agreed to all the terms and conditions set out below. Please read them carefully before completing your purchase.
          </div>
          ${sectionsHTML}
          <div class="wtc-footer-note">
            <strong>EAPL — Entertainment &amp; Amusement Parks Ltd.</strong><br>
            A-2, Sector 38A, Noida, Uttar Pradesh 201301 · CIN: U92490UP1993PLC015432<br>
            support@worldsofwonder.in · 080-6909-0000
          </div>
        </div>
        <div class="wtc-modal-footer">
          <button class="wtc-agree-btn" onclick="WOWTerms.agreeAndClose()">
            ✅ I Have Read &amp; Agree to the Terms
          </button>
          <button class="wtc-decline-btn" onclick="WOWTerms.closeModal()">Close</button>
        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  // ── INJECT STYLES ─────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById('wow-terms-styles')) return;
    const css = `
/* ── WOW T&C MODAL STYLES ── */
.wtc-overlay {
  position: fixed; inset: 0; z-index: 99999;
  background: rgba(8,14,30,.72);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: wtc-fade-in .22s ease;
}
@keyframes wtc-fade-in { from { opacity:0; } to { opacity:1; } }

.wtc-modal {
  background: #fff; border-radius: 20px;
  width: 100%; max-width: 760px; max-height: 88vh;
  display: flex; flex-direction: column;
  box-shadow: 0 32px 80px rgba(0,0,0,.35);
  overflow: hidden;
  animation: wtc-slide-up .28s cubic-bezier(.175,.885,.32,1.1) both;
}
@keyframes wtc-slide-up {
  from { transform: translateY(28px) scale(.97); opacity:0; }
  to   { transform: translateY(0)    scale(1);   opacity:1; }
}

.wtc-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 22px 26px 18px;
  border-bottom: 1px solid #E8EDF5;
  background: linear-gradient(135deg, #003D82, #0055B3);
  flex-shrink: 0;
}
.wtc-modal-title-wrap { display:flex; align-items:center; gap:14px; }
.wtc-modal-icon {
  width: 46px; height: 46px; background: rgba(255,255,255,.18);
  border-radius: 12px; display:flex; align-items:center; justify-content:center;
  font-size: 22px; flex-shrink: 0;
}
.wtc-modal-title {
  font-family: 'Nunito', 'Poppins', sans-serif;
  font-size: 20px; font-weight: 900; color: #fff; margin-bottom: 3px;
}
.wtc-modal-sub { font-size: 12px; color: rgba(255,255,255,.7); }
.wtc-close-btn {
  width: 36px; height: 36px; border-radius: 50%;
  background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.25);
  color: #fff; font-size: 15px; font-weight: 700;
  cursor: pointer; flex-shrink: 0; transition: background .2s;
  display:flex; align-items:center; justify-content:center;
}
.wtc-close-btn:hover { background: rgba(255,255,255,.28); }

.wtc-modal-body {
  flex: 1; overflow-y: auto; padding: 22px 26px;
  overscroll-behavior: contain;
}
.wtc-modal-body::-webkit-scrollbar { width: 6px; }
.wtc-modal-body::-webkit-scrollbar-track { background: #f1f5f9; }
.wtc-modal-body::-webkit-scrollbar-thumb { background: #CBD5E0; border-radius: 4px; }

.wtc-intro {
  background: #EBF3FF; border: 1px solid rgba(0,85,179,.18);
  border-radius: 12px; padding: 14px 16px;
  font-size: 13.5px; color: #1e40af; font-weight: 500;
  line-height: 1.6; margin-bottom: 20px;
}

.wtc-section { margin-bottom: 22px; }
.wtc-section-head {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #F0F4FA;
}
.wtc-section-icon { font-size: 18px; flex-shrink: 0; }
.wtc-section-title {
  font-family: 'Nunito', 'Poppins', sans-serif;
  font-size: 15px; font-weight: 800; color: #080E1E;
}

.wtc-section-list {
  padding-left: 0; margin: 0; list-style: none;
  display: flex; flex-direction: column; gap: 7px;
}
.wtc-section-list li {
  font-size: 13px; color: #374151; line-height: 1.6;
  padding-left: 20px; position: relative;
}
.wtc-section-list li::before {
  content: '›'; position: absolute; left: 4px;
  color: #0055B3; font-weight: 800; font-size: 15px; top: -1px;
}

.wtc-footer-note {
  background: #F8FAFC; border: 1px solid #E2E8F0;
  border-radius: 10px; padding: 14px 16px;
  font-size: 12px; color: #6B7280; line-height: 1.6;
  margin-top: 20px;
}

.wtc-modal-footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 16px 26px 20px;
  border-top: 1px solid #E8EDF5;
  background: #F8FAFC; flex-shrink: 0;
  flex-wrap: wrap;
}
.wtc-agree-btn {
  flex: 1; min-width: 200px;
  padding: 13px 24px;
  background: linear-gradient(135deg, #065C38, #0A9B5F);
  color: #fff; border: none; border-radius: 11px;
  font-family: 'Nunito', 'Poppins', sans-serif;
  font-size: 15px; font-weight: 800; cursor: pointer;
  transition: all .2s; letter-spacing: .01em;
  box-shadow: 0 4px 16px rgba(10,155,95,.3);
}
.wtc-agree-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(10,155,95,.35); }
.wtc-decline-btn {
  padding: 13px 20px;
  background: transparent; color: #6B7280;
  border: 1.5px solid #DDE3EE; border-radius: 11px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  font-family: 'Poppins', sans-serif;
  transition: all .2s; white-space: nowrap;
}
.wtc-decline-btn:hover { border-color: #0055B3; color: #0055B3; }

/* ── T&C CHECKBOX BLOCK ── */
.wtc-consent-block {
  background: #F8FAFC;
  border: 1.5px solid #DDE3EE;
  border-radius: 14px;
  padding: 16px 18px;
  margin-top: 20px;
  transition: border-color .2s, background .2s;
}
.wtc-consent-block.checked {
  border-color: #0A9B5F;
  background: #F0FDF4;
}
.wtc-consent-block.error {
  border-color: #EF4444;
  background: #FFF5F5;
  animation: wtc-shake .4s ease;
}
@keyframes wtc-shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-6px); }
  40%      { transform: translateX(6px); }
  60%      { transform: translateX(-4px); }
  80%      { transform: translateX(4px); }
}
.wtc-consent-row {
  display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
  user-select: none;
}
.wtc-checkbox-wrap {
  position: relative; flex-shrink: 0; margin-top: 2px;
}
.wtc-checkbox-wrap input[type="checkbox"] {
  position: absolute; opacity: 0; width: 0; height: 0;
}
.wtc-checkbox-custom {
  width: 22px; height: 22px; border-radius: 6px;
  border: 2px solid #CBD5E0; background: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s; font-size: 13px; color: transparent;
}
.wtc-checkbox-wrap input:checked + .wtc-checkbox-custom {
  background: #0A9B5F; border-color: #0A9B5F; color: #fff;
}
.wtc-consent-text {
  font-size: 13.5px; color: #374151; line-height: 1.6; flex: 1;
}
.wtc-consent-link {
  color: #0055B3; font-weight: 700; cursor: pointer;
  text-decoration: underline; background: none; border: none;
  font-size: 13.5px; font-family: inherit; padding: 0;
  display: inline;
}
.wtc-consent-link:hover { color: #003D82; }
.wtc-error-msg {
  font-size: 12px; color: #EF4444; font-weight: 600;
  margin-top: 8px; padding-left: 34px;
  display: none; align-items: center; gap: 5px;
}
.wtc-error-msg.visible { display: flex; }
.wtc-read-progress {
  height: 3px; background: #E2E8F0; border-radius: 2px;
  margin-top: 12px; overflow: hidden;
}
.wtc-read-fill {
  height: 100%; background: linear-gradient(90deg, #0055B3, #0A9B5F);
  border-radius: 2px; width: 0%;
  transition: width .3s ease;
}
.wtc-read-label {
  font-size: 11px; color: #9CA3AF; margin-top: 5px;
  text-align: right;
}

@media (max-width: 600px) {
  .wtc-modal { max-height: 94vh; border-radius: 16px; }
  .wtc-modal-header { padding: 16px 18px 14px; }
  .wtc-modal-title { font-size: 17px; }
  .wtc-modal-body  { padding: 16px 18px; }
  .wtc-modal-footer { padding: 14px 18px 16px; }
  .wtc-agree-btn { font-size: 14px; padding: 12px 18px; }
  .wtc-overlay { padding: 10px; }
}
    `;
    const style = document.createElement('style');
    style.id = 'wow-terms-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── STATE ─────────────────────────────────────────────────────
  let _agreedByModal = false; // set true when user clicks "I Agree" inside modal
  let _onAgreeCallback = null;

  // ── PUBLIC API ────────────────────────────────────────────────
  const WOWTerms = {

    /**
     * Render a T&C consent block into the given container element.
     * @param {string|HTMLElement} container  CSS selector or DOM element
     * @param {object}             opts
     *   opts.context  'ticket'|'passport'|'group'  — customises label text
     */
    renderConsentBlock(container, opts) {
      opts = opts || {};
      const ctx = opts.context || 'ticket';
      const el  = typeof container === 'string' ? document.querySelector(container) : container;
      if (!el) return;

      const label = {
        ticket:   'I have read and agree to the <button class="wtc-consent-link" onclick="WOWTerms.openModal();return false;">Ticket Terms &amp; Conditions</button>, park rules, safety guidelines, and the <button class="wtc-consent-link" onclick="WOWTerms.openModal();return false;">Cancellation &amp; Refund Policy</button>.',
        passport: 'I have read and agree to the <button class="wtc-consent-link" onclick="WOWTerms.openModal();return false;">Annual Passport Terms &amp; Conditions</button>, KYC requirements, refund policy, and park rules applicable to passport holders.',
        group:    'I confirm that I am authorised to make this group booking on behalf of all guests listed, and I agree to the <button class="wtc-consent-link" onclick="WOWTerms.openModal();return false;">Group Booking Terms &amp; Conditions</button>, payment schedule, and cancellation policy.',
      }[ctx] || label.ticket;

      el.innerHTML = `
        <div class="wtc-consent-block" id="wtc-consent-block">
          <label class="wtc-consent-row" for="wtc-agree-chk">
            <span class="wtc-checkbox-wrap">
              <input type="checkbox" id="wtc-agree-chk" onchange="WOWTerms._onCheckboxChange(this)" />
              <span class="wtc-checkbox-custom">✓</span>
            </span>
            <span class="wtc-consent-text">${label}</span>
          </label>
          <div class="wtc-error-msg" id="wtc-error-msg">
            ⚠️ You must agree to the terms and conditions before proceeding.
          </div>
          <div class="wtc-read-progress">
            <div class="wtc-read-fill" id="wtc-read-fill"></div>
          </div>
          <div class="wtc-read-label" id="wtc-read-label">Read T&amp;C before agreeing</div>
        </div>`;
    },

    /** Check if user has agreed. Returns true/false. */
    isAgreed() {
      const chk = document.getElementById('wtc-agree-chk');
      return chk ? chk.checked : false;
    },

    /**
     * Validate consent. Shows error shake if not agreed.
     * Returns true if agreed, false otherwise.
     */
    validate() {
      if (this.isAgreed()) {
        this._clearError();
        return true;
      }
      this._showError();
      return false;
    },

    /** Open the T&C modal */
    openModal(onAgreeCallback) {
      _onAgreeCallback = onAgreeCallback || null;
      const overlay = document.getElementById('wow-terms-modal');
      if (!overlay) return;
      overlay.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      // Track scroll progress
      const body = document.getElementById('wtc-body');
      if (body) {
        body.scrollTop = 0;
        body.onscroll = function () {
          const pct = Math.min(100, Math.round((body.scrollTop / (body.scrollHeight - body.clientHeight)) * 100));
          const fill  = document.getElementById('wtc-read-fill');
          const label = document.getElementById('wtc-read-label');
          if (fill)  fill.style.width = pct + '%';
          if (label) label.textContent = pct >= 95 ? '✅ Fully read' : `${pct}% read — scroll to read all`;
        };
      }
    },

    /** Close the modal without agreeing */
    closeModal() {
      const overlay = document.getElementById('wow-terms-modal');
      if (overlay) overlay.style.display = 'none';
      document.body.style.overflow = '';
    },

    /** Called when user clicks "I Agree" inside the modal */
    agreeAndClose() {
      _agreedByModal = true;
      // Auto-tick the checkbox
      const chk = document.getElementById('wtc-agree-chk');
      if (chk) {
        chk.checked = true;
        this._onCheckboxChange(chk);
      }
      this.closeModal();
      if (typeof _onAgreeCallback === 'function') _onAgreeCallback();
    },

    /** Internal: handle checkbox change */
    _onCheckboxChange(chk) {
      const block = document.getElementById('wtc-consent-block');
      if (!block) return;
      if (chk.checked) {
        block.classList.add('checked');
        block.classList.remove('error');
        this._clearError();
      } else {
        block.classList.remove('checked');
      }
    },

    _showError() {
      const block = document.getElementById('wtc-consent-block');
      const msg   = document.getElementById('wtc-error-msg');
      if (block) {
        block.classList.add('error');
        block.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => block.classList.remove('error'), 2000);
      }
      if (msg) msg.classList.add('visible');
    },

    _clearError() {
      const msg = document.getElementById('wtc-error-msg');
      if (msg) msg.classList.remove('visible');
    },

    /** Initialize: inject styles + modal DOM */
    init() {
      _injectStyles();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _injectModal);
      } else {
        _injectModal();
      }
      // Close on overlay click
      document.addEventListener('click', function (e) {
        const overlay = document.getElementById('wow-terms-modal');
        if (overlay && e.target === overlay) WOWTerms.closeModal();
      });
      // Close on Escape key
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') WOWTerms.closeModal();
      });
    }
  };

  // Auto-init
  WOWTerms.init();

  // Expose globally
  global.WOWTerms = WOWTerms;

}(window));
