// Worlds of Wonder — Module Gate System  v2.1
// KEY FIX: applyGates uses readyState so banner shows when script loads after DOM ready
'use strict';

const MODULE_DEFAULTS = {
  water_ticketing:true,amusement_ticketing:true,combo_ticketing:true,
  payment_gateway:true,gst_engine:true,booking_confirmation:true,
  passport_system:true,loyalty_program:false,guest_booking:true,
  social_login:true,reschedule_cancel:true,whatsapp_ticket:true,
  flash_offers:true,weather_widget:true,gate_scanner:true,
  capacity_mgmt:true,dual_park_config:true,group_booking:true,
  fnb_packages:false,crm_module:true,partner_portal:true,
  razorpay:true,twilio_whatsapp:true,msg91_sms:true,
  sendgrid_email:true,google_analytics:true,salesforce_sync:false,
  digi_locker:false,push_notifications:false,email_campaigns:true,
  sms_campaigns:true,whatsapp_campaigns:false,promo_codes:true,referral_program:false,
};

function loadModuleState(){
  const state={...MODULE_DEFAULTS};
  try{const s=localStorage.getItem('wow_module_state');if(s)Object.assign(state,JSON.parse(s));}
  catch(e){console.warn('[WOW Modules]',e);}
  return state;
}

const WOWModules={
  _state:null,
  getState(){if(!this._state)this._state=loadModuleState();return this._state;},
  isEnabled(id){return!!this.getState()[id];},

  applyGates(){
    const s=this.getState();
    const page=window.location.pathname;
    const routeGates=[
      {module:'passport_system',   patterns:['/passport.html','/book/passport.html','/portal/passport.html']},
      {module:'amusement_ticketing',patterns:['/amusement-park.html','/book/amusement-park.html']},
      {module:'combo_ticketing',   patterns:['/combo.html','/book/combo.html']},
      {module:'loyalty_program',   patterns:['/portal/loyalty.html']},
      {module:'group_booking',     patterns:['/groups/','/book/group.html']},
      {module:'partner_portal',    patterns:['/partner/','/travel-agent.html','/reseller.html']},
    ];
    const run=()=>{
      for(const g of routeGates){
        if(!s[g.module]&&g.patterns.some(p=>page.includes(p))){
          showModuleDisabledBanner(g.module);return;
        }
      }
      const el=document.querySelector('[data-module-page]');
      if(el){const m=el.getAttribute('data-module-page');if(m&&!s[m]){showModuleDisabledBanner(m);return;}}
      this._applyDOMGates(s);
    };
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}
    else{run();}
  },

  _applyDOMGates(s){
    if(!s.passport_system){this._hideByAttr('data-module','passport_system');this._hideLinks(['passport.html','book/passport.html','portal/passport.html']);}
    if(!s.amusement_ticketing){this._hideByAttr('data-module','amusement_ticketing');this._hideLinks(['amusement-park.html','book/amusement-park.html']);}
    if(!s.combo_ticketing){this._hideByAttr('data-module','combo_ticketing');this._hideLinks(['combo.html','book/combo.html']);}
    if(!s.loyalty_program){this._hideByAttr('data-module','loyalty_program');this._hideLinks(['portal/loyalty.html']);}
    if(!s.flash_offers){this._hideByAttr('data-module','flash_offers');document.querySelectorAll('.flash-offer-banner,.countdown-timer-wrap').forEach(e=>e.style.display='none');}
    if(!s.weather_widget){this._hideByAttr('data-module','weather_widget');document.querySelectorAll('.weather-chip,#weather-chip,.weather-widget').forEach(e=>{e.style.visibility='hidden';e.style.width='0';});}
    if(!s.social_login){document.querySelectorAll('.portal-google-btn,.portal-instagram-btn,[data-module="social_login"],.portal-divider').forEach(e=>e.style.display='none');}
    if(!s.group_booking){this._hideByAttr('data-module','group_booking');this._hideLinks(['groups/','book/group.html']);}
    if(!s.partner_portal){this._hideByAttr('data-module','partner_portal');this._hideLinks(['partner/','travel-agent.html','reseller.html']);}
    if(!s.promo_codes){document.querySelectorAll('.promo-code-wrap,.promo-input-row,[data-module="promo_codes"]').forEach(e=>e.style.display='none');}
    if(!s.fnb_packages){this._hideByAttr('data-module','fnb_packages');}
    if(!s.guest_booking){document.querySelectorAll('[data-module="guest_booking"],.guest-checkout-option').forEach(e=>e.style.display='none');}
    if(!s.referral_program){this._hideByAttr('data-module','referral_program');}
    if(!s.whatsapp_campaigns){this._hideByAttr('data-module','whatsapp_campaigns');}
  },

  _hideByAttr(a,v){document.querySelectorAll('['+a+'="'+v+'"]').forEach(e=>e.style.display='none');},
  _hideLinks(hrefs){hrefs.forEach(h=>document.querySelectorAll('a[href*="'+h+'"]').forEach(a=>{(a.closest('.nav-dropdown-item,.nav-dropdown,li')||a).style.display='none';}));}
};

function showModuleDisabledBanner(moduleId){
  const names={passport_system:'Annual Passport',amusement_ticketing:'Amusement Park Ticketing',combo_ticketing:'Combo Tickets',loyalty_program:'Loyalty Programme',group_booking:'Group Bookings',partner_portal:'Partner Portal'};
  const name=names[moduleId]||moduleId;
  const b=document.createElement('div');
  b.id='wow-module-disabled-banner';
  b.style.cssText='position:fixed;inset:0;z-index:9999;background:linear-gradient(135deg,#0a0f1e,#1a2035);display:flex;align-items:center;justify-content:center;font-family:Nunito,sans-serif;color:#fff;text-align:center;padding:24px;';
  b.innerHTML='<div style="max-width:480px;"><div style="font-size:64px;margin-bottom:24px;">🚧</div><h1 style="font-size:28px;font-weight:900;margin-bottom:12px;">'+name+'</h1><p style="font-size:16px;color:rgba(255,255,255,.7);line-height:1.6;margin-bottom:28px;">This module is currently disabled by the site administrator. Please check back shortly or contact our team.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"><a href="../index.html" style="padding:12px 24px;background:linear-gradient(135deg,#003D82,#0055B3);color:#fff;border-radius:10px;text-decoration:none;font-weight:800;font-size:14px;">Go to Homepage</a><a href="tel:08069090000" style="padding:12px 24px;background:rgba(255,255,255,.1);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;border:1px solid rgba(255,255,255,.2);">📞 Call Us</a></div></div>';
  document.body.appendChild(b);
}

WOWModules.applyGates();
window.WOWModules=WOWModules;
