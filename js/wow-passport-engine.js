/**
 * WOW Passport Engine v1.0
 * ════════════════════════════════════════════════════════════════════════════
 * Enterprise-grade Passport Product Engine for Worlds of Wonder digital
 * commerce, membership, entitlement, QR redemption & lifecycle management.
 *
 * Storage keys (localStorage):
 *   wpe_config          – product master + tier definitions
 *   wpe_voucher_lib     – voucher template library
 *   wpe_offer_lib       – linked offer library
 *   wpe_passports       – issued passport records
 *   wpe_kyc             – KYC application records
 *   wpe_redemptions     – redemption ledger
 *   wpe_audit           – audit trail
 *   wpe_customers       – customer records
 * ════════════════════════════════════════════════════════════════════════════
 */
(function (global) {
  'use strict';

  const SK = {
    CONFIG:'wpe_config', VOUCHERS:'wpe_voucher_lib', OFFERS:'wpe_offer_lib',
    PASSPORTS:'wpe_passports', KYC:'wpe_kyc', REDEMPTIONS:'wpe_redemptions',
    AUDIT:'wpe_audit', CUSTOMERS:'wpe_customers',
  };

  /* ─── DEFAULT CONFIG ─────────────────────────────────────────────────── */
  const DEFAULT_CONFIG = {
    meta:{
      programName:'WOW Passport', programTagline:'Your World, Unlimited.',
      logoTreatment:'gold-line-art', contactEmail:'passport@worldsofwonder.in',
      supportPhone:'080-6909-0000', gstRate:0.18,
      passportNumberPrefix:'WOW-PAX', passportNumberYear:true,
      passportNumberPadding:6, renewalWindowDays:30, gracePeriodDays:7,
      maxPassportsPerCustomer:3, kycMandatoryBeforeIssuance:true,
      paymentBeforeKyc:false, version:'1.0', updatedAt:null,
    },
    tiers:[
      { id:'explore', code:'EXPLORE', name:'Explore', displayName:'WOW Explore',
        tagline:'Your gateway to unlimited wonder',
        description:'Perfect for solo adventurers who want the freedom of unlimited park access all year.',
        colorPrimary:'#1a56db', colorSecondary:'#93c5fd', colorAccent:'#C9A84C',
        gradientFrom:'#0f2057', gradientTo:'#1a56db', badgeStyle:'silver',
        emblemIcon:'🌟', rank:1, status:'active', holders:1, maxHolders:1,
        guestPassesIncluded:0, transferable:false, upgradeToTier:'together' },
      { id:'together', code:'TOGETHER', name:'Together', displayName:'WOW Together',
        tagline:'One passport. The whole family.',
        description:'Designed for families — covers up to 4 members with shared benefits and family-first privileges.',
        colorPrimary:'#7c3aed', colorSecondary:'#c4b5fd', colorAccent:'#C9A84C',
        gradientFrom:'#2d1b69', gradientTo:'#7c3aed', badgeStyle:'gold',
        emblemIcon:'👑', rank:2, status:'active', holders:4, maxHolders:4,
        guestPassesIncluded:2, transferable:false, upgradeToTier:'legacy' },
      { id:'legacy', code:'LEGACY', name:'Legacy', displayName:'WOW Legacy',
        tagline:'The pinnacle of the WOW experience',
        description:'The most prestigious tier — unlimited VIP access, concierge, and exclusive privileges for up to 6.',
        colorPrimary:'#92400e', colorSecondary:'#fde68a', colorAccent:'#C9A84C',
        gradientFrom:'#1a0a00', gradientTo:'#92400e', badgeStyle:'platinum',
        emblemIcon:'🏆', rank:3, status:'active', holders:6, maxHolders:6,
        guestPassesIncluded:4, transferable:false, upgradeToTier:null },
    ],
    products:[
      { id:'prod_explore_annual', tierId:'explore', name:'WOW Explore Passport',
        sku:'WOW-PASS-EXP-001', status:'active', basePrice:4999, taxInclusive:true,
        issueFee:0, validityType:'from_purchase', validityDays:365,
        startDateLogic:'immediate', renewalPrice:3999,
        renewalBonus:'Extra 30 days validity', upgradePrice:8500,
        kycLevel:'basic', kycDocs:['photo','id_proof'],
        salesChannels:['direct','salesperson','partner'], maxQuantity:1,
        renewalWindowDays:30, gracePeriodDays:7, displayOrder:1, heroImage:'',
        shortDesc:'1 person · 365 days · Both parks unlimited',
        longDesc:'The WOW Explore Passport gives you unlimited visits to both Worlds of Wonder parks for a full year.',
        termsUrl:'', voucherIds:['v_10pct_fnb','v_free_locker_monthly','v_birthday_upgrade'],
        offerIds:['o_priority_booking','o_guest_discount'],
        entryRights:{ type:'unlimited', parks:['WATER_DAY','AMUSEMENT_DAY'],
          entriesPerDay:1, cooldownHours:0, blackoutDates:[], requiresPreBooking:false,
          weekendSurcharge:false, vipLane:false },
        benefits:[
          {icon:'🎢',text:'Unlimited entry — both parks'},
          {icon:'🍽',text:'10% F&B discount all year'},
          {icon:'🔐',text:'Free locker once per month'},
          {icon:'🎂',text:'Birthday upgrade benefit'},
          {icon:'⚡',text:'Priority booking access'},
        ],
        analytics:{sold:0,active:0,expired:0,revenue:0},
        version:1, createdAt:null, updatedAt:null },
      { id:'prod_together_annual', tierId:'together', name:'WOW Together Passport',
        sku:'WOW-PASS-TOG-001', status:'active', basePrice:12999, taxInclusive:true,
        issueFee:0, validityType:'from_purchase', validityDays:365,
        startDateLogic:'immediate', renewalPrice:10999,
        renewalBonus:'Extra 45 days + birthday cake voucher', upgradePrice:12000,
        kycLevel:'full', kycDocs:['photo','id_proof','address_proof'],
        salesChannels:['direct','salesperson','partner'], maxQuantity:1,
        renewalWindowDays:30, gracePeriodDays:14, displayOrder:2, heroImage:'',
        shortDesc:'Family of 4 · 365 days · Both parks · Priority lane',
        longDesc:'The WOW Together Passport covers up to 4 family members with unlimited access, priority lanes, birthday packs, and family-only events.',
        termsUrl:'', voucherIds:['v_15pct_fnb','v_free_locker_weekly','v_birthday_party_pack','v_guest_pass_x2','v_photo_session'],
        offerIds:['o_priority_booking','o_guest_discount','o_family_events'],
        entryRights:{ type:'unlimited', parks:['WATER_DAY','AMUSEMENT_DAY'],
          entriesPerDay:1, cooldownHours:0, blackoutDates:[], requiresPreBooking:true,
          weekendSurcharge:false, vipLane:false },
        benefits:[
          {icon:'👨‍👩‍👧‍👦',text:'Up to 4 family members covered'},
          {icon:'🎢',text:'Unlimited entry — both parks'},
          {icon:'⚡',text:'Priority lane — skip the queue'},
          {icon:'🍽',text:'15% F&B discount all year'},
          {icon:'🔐',text:'Free locker every visit'},
          {icon:'🎂',text:'Birthday party pack'},
          {icon:'🎟',text:'2 guest passes per year'},
          {icon:'📸',text:'Annual photo session'},
        ],
        analytics:{sold:0,active:0,expired:0,revenue:0},
        version:1, createdAt:null, updatedAt:null },
      { id:'prod_legacy_annual', tierId:'legacy', name:'WOW Legacy Passport',
        sku:'WOW-PASS-LEG-001', status:'active', basePrice:24999, taxInclusive:true,
        issueFee:0, validityType:'from_purchase', validityDays:365,
        startDateLogic:'immediate', renewalPrice:19999,
        renewalBonus:'60 extra days + ₹1,000 merchandise credit + concierge call',
        upgradePrice:null,
        kycLevel:'enhanced', kycDocs:['photo','id_proof','address_proof','selfie_with_id'],
        salesChannels:['direct','salesperson'], maxQuantity:1,
        renewalWindowDays:60, gracePeriodDays:30, displayOrder:3, heroImage:'',
        shortDesc:'Premium family of 6 · VIP · Concierge · ₹1K merch credit',
        longDesc:'The WOW Legacy Passport is the pinnacle of park membership — up to 6 VIP members, concierge access, ₹1,000 merchandise credit and the most exclusive park events.',
        termsUrl:'', voucherIds:['v_25pct_fnb','v_free_locker_unlimited','v_birthday_vip_pack','v_guest_pass_x4','v_merch_credit_1k','v_vip_lounge','v_concierge_call'],
        offerIds:['o_priority_booking','o_guest_discount','o_family_events','o_vip_events','o_legacy_renewal_bonus'],
        entryRights:{ type:'unlimited', parks:['WATER_DAY','AMUSEMENT_DAY'],
          entriesPerDay:2, cooldownHours:0, blackoutDates:[], requiresPreBooking:false,
          weekendSurcharge:false, vipLane:true },
        benefits:[
          {icon:'👑',text:'Up to 6 premium members covered'},
          {icon:'🎢',text:'Unlimited VIP-lane park entry'},
          {icon:'🛎',text:'Personal concierge service'},
          {icon:'🍽',text:'25% F&B discount all year'},
          {icon:'🔐',text:'Unlimited free lockers'},
          {icon:'🎂',text:'VIP birthday suite experience'},
          {icon:'🎟',text:'4 guest passes per year'},
          {icon:'🛍',text:'₹1,000 merchandise credit'},
          {icon:'🏆',text:'VIP lounge access'},
          {icon:'📱',text:'Concierge WhatsApp line'},
        ],
        analytics:{sold:0,active:0,expired:0,revenue:0},
        version:1, createdAt:null, updatedAt:null },
    ],
  };

  const DEFAULT_VOUCHERS = [
    {id:'v_10pct_fnb',code:'WOW-FNB-10',name:'10% F&B Discount',category:'fnb_discount',type:'percentage_discount',description:'10% off at any food & beverage outlet inside Worlds of Wonder.',redeemQty:-1,redeemFreq:'per_visit',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['fnb'],status:'active',displayIcon:'🍽',discountValue:10,discountType:'pct'},
    {id:'v_15pct_fnb',code:'WOW-FNB-15',name:'15% F&B Discount',category:'fnb_discount',type:'percentage_discount',description:'15% off at any food & beverage outlet inside Worlds of Wonder.',redeemQty:-1,redeemFreq:'per_visit',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['fnb'],status:'active',displayIcon:'🍽',discountValue:15,discountType:'pct'},
    {id:'v_25pct_fnb',code:'WOW-FNB-25',name:'25% F&B Discount',category:'fnb_discount',type:'percentage_discount',description:'25% off at any food & beverage outlet inside Worlds of Wonder.',redeemQty:-1,redeemFreq:'per_visit',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['fnb'],status:'active',displayIcon:'🍽',discountValue:25,discountType:'pct'},
    {id:'v_free_locker_monthly',code:'WOW-LCKR-M',name:'Free Locker — Monthly',category:'locker',type:'free_service',description:'One complimentary locker per calendar month.',redeemQty:1,redeemFreq:'monthly',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['locker'],status:'active',displayIcon:'🔐'},
    {id:'v_free_locker_weekly',code:'WOW-LCKR-W',name:'Free Locker — Every Visit',category:'locker',type:'free_service',description:'One complimentary locker on every park visit.',redeemQty:1,redeemFreq:'per_visit',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['locker'],status:'active',displayIcon:'🔐'},
    {id:'v_free_locker_unlimited',code:'WOW-LCKR-U',name:'Unlimited Free Lockers',category:'locker',type:'free_service',description:'Complimentary lockers — unlimited, every visit.',redeemQty:-1,redeemFreq:'per_visit',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['locker'],status:'active',displayIcon:'🔐'},
    {id:'v_birthday_upgrade',code:'WOW-BDAY-EXP',name:'Birthday Upgrade',category:'birthday',type:'experience_upgrade',description:'Birthday sash, priority lane & a complimentary dessert.',redeemQty:1,redeemFreq:'annual',singleUse:true,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['guest_services'],status:'active',displayIcon:'🎂'},
    {id:'v_birthday_party_pack',code:'WOW-BDAY-FAM',name:'Birthday Party Pack',category:'birthday',type:'experience_upgrade',description:'Private table, cake, party sash, priority entry & ₹500 F&B voucher.',redeemQty:1,redeemFreq:'annual',singleUse:true,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['events'],status:'active',displayIcon:'🎉'},
    {id:'v_birthday_vip_pack',code:'WOW-BDAY-VIP',name:'VIP Birthday Suite',category:'birthday',type:'experience_upgrade',description:'Private cabana, curated menu, personalised cake, dedicated host & priority entry.',redeemQty:1,redeemFreq:'annual',singleUse:true,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['vip_events'],status:'active',displayIcon:'👑'},
    {id:'v_guest_pass_x2',code:'WOW-GUEST-2',name:'2 Guest Passes',category:'guest_entry',type:'free_entry',description:'Two complimentary single-day park entry passes for guests.',redeemQty:2,redeemFreq:'annual',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['entry'],status:'active',displayIcon:'🎟'},
    {id:'v_guest_pass_x4',code:'WOW-GUEST-4',name:'4 Guest Passes',category:'guest_entry',type:'free_entry',description:'Four complimentary single-day park entry passes for guests.',redeemQty:4,redeemFreq:'annual',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['entry'],status:'active',displayIcon:'🎟'},
    {id:'v_photo_session',code:'WOW-PHOTO-ANN',name:'Annual Photo Session',category:'experience',type:'experience',description:'One complimentary professional photo session per year.',redeemQty:1,redeemFreq:'annual',singleUse:true,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['photo'],status:'active',displayIcon:'📸'},
    {id:'v_merch_credit_1k',code:'WOW-MERCH-1K',name:'₹1,000 Merchandise Credit',category:'merchandise',type:'credit',description:'₹1,000 credit towards any WOW merchandise — valid for the passport year.',redeemQty:1,redeemFreq:'annual',singleUse:true,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['merch'],status:'active',displayIcon:'🛍',creditValue:1000},
    {id:'v_vip_lounge',code:'WOW-VIP-LOUNGE',name:'VIP Lounge Access',category:'lounge',type:'access',description:'Unlimited access to the WOW VIP Lounge — air-conditioned rest area.',redeemQty:-1,redeemFreq:'per_visit',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['vip_lounge'],status:'active',displayIcon:'🏆'},
    {id:'v_concierge_call',code:'WOW-CONCIERGE',name:'Concierge Priority Line',category:'service',type:'service',description:'Dedicated WhatsApp concierge line for priority booking and special arrangements.',redeemQty:-1,redeemFreq:'on_demand',singleUse:false,validFrom:null,validTo:null,blackoutDates:[],timeWindow:null,parks:['WATER_DAY','AMUSEMENT_DAY'],counters:['concierge'],status:'active',displayIcon:'📱'},
  ];

  const DEFAULT_OFFERS = [
    {id:'o_priority_booking',name:'Priority Booking Window',description:'7-day advance booking window vs standard 3-day window.',tiers:['explore','together','legacy'],status:'active'},
    {id:'o_guest_discount',name:'Guest Ticket Discount',description:'20% off on tickets purchased for guests accompanying the passport holder.',tiers:['explore','together','legacy'],status:'active'},
    {id:'o_family_events',name:'Family Event Access',description:'Invitation-only family events exclusive to Together & Legacy holders.',tiers:['together','legacy'],status:'active'},
    {id:'o_vip_events',name:'VIP Event Access',description:'Priority invitation to seasonal VIP events and park previews.',tiers:['legacy'],status:'active'},
    {id:'o_legacy_renewal_bonus',name:'Legacy Renewal Bonus',description:'Renew before expiry: 60 bonus days + ₹1,000 merchandise credit.',tiers:['legacy'],status:'active'},
  ];

  /* ─── UTILITIES ──────────────────────────────────────────────────────── */
  function _read(key,def){try{const v=localStorage.getItem(key);return v?JSON.parse(v):(def!==undefined?def:null);}catch(e){return def!==undefined?def:null;}}
  function _write(key,val){try{localStorage.setItem(key,JSON.stringify(val));return true;}catch(e){return false;}}
  function _now(){return new Date().toISOString();}
  function _today(){return new Date().toISOString().slice(0,10);}
  function _uuid(){return'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);});}
  function _pad(n,p){return String(n).padStart(p,'0');}
  function _inr(n){return'₹'+Number(n).toLocaleString('en-IN');}

  /* ─── PASSPORT NUMBER ─────────────────────────────────────────────── */
  function generatePassportNumber(cfg){
    const c=cfg||_getConfig().meta;
    const seq=(_read('wpe_passport_seq',0)||0)+1;
    _write('wpe_passport_seq',seq);
    return`${c.passportNumberPrefix}-${new Date().getFullYear()}-${_pad(seq,c.passportNumberPadding||6)}`;
  }

  /* ─── QR ENGINE ───────────────────────────────────────────────────── */
  function generateQRToken(passportId,voucherInstanceId,counterScope){
    const payload={p:passportId,v:voucherInstanceId,c:counterScope||'any',ts:Date.now(),n:Math.random().toString(36).slice(2,10)};
    const encoded=btoa(JSON.stringify(payload)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    const chk=_chksum(encoded);
    return`WOW-QR.${encoded}.${chk}`;
  }
  function _chksum(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h).toString(36).toUpperCase().slice(0,6);}
  function parseQRToken(token){
    try{const p=token.split('.');if(p.length!==3||p[0]!=='WOW-QR')return null;const[,enc,chk]=p;if(_chksum(enc)!==chk)return null;const pad=enc.replace(/-/g,'+').replace(/_/g,'/');return JSON.parse(atob(pad+'=='.slice((pad.length%4)||4)));}catch(e){return null;}
  }

  /* ─── CONFIG ENGINE ───────────────────────────────────────────────── */
  function _getConfig(){const s=_read(SK.CONFIG,null);if(!s)return JSON.parse(JSON.stringify(DEFAULT_CONFIG));return s;}
  function _saveConfig(cfg){cfg.meta.updatedAt=_now();_write(SK.CONFIG,cfg);_audit('CONFIG_UPDATED',{version:cfg.meta.version});}

  /* ─── VOUCHER LIBRARY ─────────────────────────────────────────────── */
  function _getVouchers(){const s=_read(SK.VOUCHERS,null);if(!s){_write(SK.VOUCHERS,DEFAULT_VOUCHERS);return DEFAULT_VOUCHERS;}return s;}
  function _saveVouchers(v){_write(SK.VOUCHERS,v);}
  function getVoucherById(id){return _getVouchers().find(v=>v.id===id)||null;}

  /* ─── OFFER LIBRARY ───────────────────────────────────────────────── */
  function _getOffers(){const s=_read(SK.OFFERS,null);if(!s){_write(SK.OFFERS,DEFAULT_OFFERS);return DEFAULT_OFFERS;}return s;}

  /* ─── PASSPORT RECORDS ────────────────────────────────────────────── */
  function _getPassports(){return _read(SK.PASSPORTS,[]);}
  function _savePassports(l){_write(SK.PASSPORTS,l);}
  function getPassportById(id){return _getPassports().find(p=>p.id===id)||null;}
  function getPassportsByCustomer(cid){return _getPassports().filter(p=>p.customerId===cid);}

  /* ─── KYC ENGINE ──────────────────────────────────────────────────── */
  function _getKYCRecords(){return _read(SK.KYC,[]);}
  function _saveKYCRecords(l){_write(SK.KYC,l);}
  function getKYCById(id){return _getKYCRecords().find(k=>k.id===id)||null;}
  function getKYCByCustomer(cid){return _getKYCRecords().filter(k=>k.customerId===cid);}

  /* ─── AUDIT ENGINE ────────────────────────────────────────────────── */
  function _currentUser(){try{const s=JSON.parse(sessionStorage.getItem('wow_auth_session')||'{}');return s.email||'system';}catch(e){return'system';}}
  function _audit(action,meta,actor){
    const log=_read(SK.AUDIT,[]);
    log.unshift({id:_uuid(),action,meta:meta||{},actor:actor||_currentUser(),ts:_now()});
    _write(SK.AUDIT,log.slice(0,500));
  }

  /* ─── REDEMPTION LEDGER ───────────────────────────────────────────── */
  function _getRedemptions(){return _read(SK.REDEMPTIONS,[]);}

  /* ─── VOUCHER INSTANCE BUILDER ────────────────────────────────────── */
  function buildVoucherInstances(passportId,productId){
    const cfg=_getConfig();
    const prod=cfg.products.find(p=>p.id===productId);
    if(!prod)return[];
    const vouchers=_getVouchers();
    return(prod.voucherIds||[]).map(vid=>{
      const tpl=vouchers.find(v=>v.id===vid);
      if(!tpl||tpl.status!=='active')return null;
      const instanceId=`${passportId}-${vid}-${_uuid().slice(0,8)}`;
      const token=generateQRToken(passportId,instanceId,(tpl.counters||['any']).join(','));
      return{id:instanceId,voucherId:vid,passportId,name:tpl.name,category:tpl.category,
        type:tpl.type,description:tpl.description,icon:tpl.displayIcon,
        counters:tpl.counters,parks:tpl.parks,redeemQty:tpl.redeemQty,
        redeemFreq:tpl.redeemFreq,singleUse:tpl.singleUse,usedCount:0,lastUsed:null,
        status:'active',qrToken:token,issuedAt:_now(),
        discountValue:tpl.discountValue||null,discountType:tpl.discountType||null,
        creditValue:tpl.creditValue||null};
    }).filter(Boolean);
  }

  /* ─── ISSUANCE ENGINE ─────────────────────────────────────────────── */
  function issuePassport(opts){
    const cfg=_getConfig();
    const prod=cfg.products.find(p=>p.id===opts.productId);
    if(!prod)return{success:false,error:'Product not found'};
    if(prod.status!=='active')return{success:false,error:'Product is not active'};
    if(cfg.meta.kycMandatoryBeforeIssuance&&prod.kycLevel!=='none'){
      const kyc=opts.kycId?getKYCById(opts.kycId):null;
      if(!kyc||kyc.status!=='approved')return{success:false,error:'KYC must be approved before issuance.'};
    }
    const tier=cfg.tiers.find(t=>t.id===prod.tierId);
    const pn=generatePassportNumber(cfg.meta);
    const startDate=opts.startDate||_today();
    const d=new Date(startDate);d.setDate(d.getDate()+(prod.validityDays||365));
    const expiryDate=d.toISOString().slice(0,10);
    const vi=buildVoucherInstances(pn,opts.productId);
    const passport={
      id:pn,number:pn,productId:prod.id,tierId:prod.tierId,
      tierName:tier?tier.name:prod.tierId,tierCode:tier?tier.code:prod.tierId.toUpperCase(),
      tierColorPrimary:tier?tier.colorPrimary:'#1a56db',tierColorSecondary:tier?tier.colorSecondary:'#93c5fd',
      tierGradientFrom:tier?tier.gradientFrom:'#0f2057',tierGradientTo:tier?tier.gradientTo:'#1a56db',
      tierBadgeStyle:tier?tier.badgeStyle:'silver',tierEmblem:tier?tier.emblemIcon:'🌟',
      productName:prod.name,customerId:opts.customerId,customerName:opts.customerName,
      customerEmail:opts.customerEmail,customerMobile:opts.customerMobile,
      customerDob:opts.customerDob||null,customerPhoto:opts.customerPhoto||null,
      kycId:opts.kycId||null,paymentRef:opts.paymentRef||null,
      soldBy:opts.soldBy||null,channel:opts.channel||'direct',
      issueDate:_today(),startDate,expiryDate,status:'active',
      statusHistory:[{status:'active',at:_now(),by:opts.soldBy||'system',note:'Passport issued'}],
      voucherInstances:vi,entryRights:prod.entryRights,entryLog:[],
      renewalCount:0,parentPassportId:null,version:prod.version,
      notes:opts.notes||'',createdAt:_now(),updatedAt:_now(),
    };
    const pl=_getPassports();pl.push(passport);_savePassports(pl);
    // update analytics
    const cfg2=_getConfig();const pi=cfg2.products.findIndex(p=>p.id===prod.id);
    if(pi>=0){cfg2.products[pi].analytics=cfg2.products[pi].analytics||{sold:0,active:0,expired:0,revenue:0};
      cfg2.products[pi].analytics.sold++;cfg2.products[pi].analytics.active++;
      cfg2.products[pi].analytics.revenue+=prod.basePrice;_write(SK.CONFIG,cfg2);}
    _audit('PASSPORT_ISSUED',{passportId:passport.id,productId:prod.id,customerId:opts.customerId,channel:opts.channel},opts.soldBy);
    return{success:true,passport};
  }

  /* ─── KYC ENGINE ──────────────────────────────────────────────────── */
  function submitKYC(opts){
    const kycId='KYC-'+_uuid().replace(/-/g,'').slice(0,10).toUpperCase();
    const rec={id:kycId,customerId:opts.customerId,productId:opts.productId,
      customerName:opts.customerName,customerEmail:opts.customerEmail,
      customerMobile:opts.customerMobile,customerDob:opts.customerDob||null,
      address:opts.address||null,idType:opts.idType||null,
      idRefLast4:opts.idReference?opts.idReference.slice(-4):null,
      photoData:opts.photoData||null,
      documents:(opts.documents||[]).map(d=>({name:d.name,type:d.type,data:d.data})),
      status:'pending_review',
      statusHistory:[{status:'pending_review',at:_now(),by:opts.submittedBy||'customer',note:'KYC submitted'}],
      reviewNotes:[],submittedBy:opts.submittedBy||'customer',channel:opts.channel||'direct',
      submittedAt:_now(),reviewedAt:null,reviewedBy:null,approvedAt:null,
      notes:opts.notes||'',createdAt:_now(),updatedAt:_now()};
    const records=_getKYCRecords();records.push(rec);_saveKYCRecords(records);
    _audit('KYC_SUBMITTED',{kycId,customerId:opts.customerId,productId:opts.productId},opts.submittedBy);
    return{success:true,kycId,record:rec};
  }
  function updateKYCStatus(kycId,status,note,reviewedBy){
    const recs=_getKYCRecords();const i=recs.findIndex(k=>k.id===kycId);
    if(i<0)return{success:false,error:'KYC not found'};
    recs[i].status=status;recs[i].statusHistory.push({status,at:_now(),by:reviewedBy||'admin',note:note||''});
    recs[i].reviewedAt=_now();recs[i].reviewedBy=reviewedBy||'admin';
    if(status==='approved')recs[i].approvedAt=_now();
    recs[i].updatedAt=_now();_saveKYCRecords(recs);
    _audit('KYC_STATUS_CHANGED',{kycId,newStatus:status,note},reviewedBy);
    return{success:true,record:recs[i]};
  }

  /* ─── REDEMPTION ENGINE ───────────────────────────────────────────── */
  function validateQR(qrToken,ctx){
    const payload=parseQRToken(qrToken);
    if(!payload)return{valid:false,reason:'INVALID_TOKEN'};
    const passport=getPassportById(payload.p);
    if(!passport)return{valid:false,reason:'PASSPORT_NOT_FOUND',requiresManual:true};
    if(passport.status==='suspended')return{valid:false,reason:'PASSPORT_SUSPENDED',requiresManual:true,passport};
    if(passport.status==='revoked')return{valid:false,reason:'PASSPORT_REVOKED',passport};
    if(passport.status!=='active')return{valid:false,reason:`PASSPORT_${passport.status.toUpperCase()}`,passport};
    if(_today()>passport.expiryDate){
      _setPassportStatus(passport.id,'expired','system','Auto-expired at scan');
      return{valid:false,reason:'PASSPORT_EXPIRED',passport};
    }
    const vi=passport.voucherInstances.find(v=>v.id===payload.v);
    if(!vi)return{valid:false,reason:'VOUCHER_INSTANCE_NOT_FOUND',requiresManual:true,passport};
    if(vi.status==='redeemed')return{valid:false,reason:'VOUCHER_ALREADY_REDEEMED',passport,voucherInstance:vi};
    if(vi.status!=='active')return{valid:false,reason:'VOUCHER_INACTIVE',passport,voucherInstance:vi};
    if(ctx&&ctx.counter&&vi.counters&&vi.counters.length&&!vi.counters.includes('any')&&!vi.counters.includes(ctx.counter))
      return{valid:false,reason:'WRONG_COUNTER',passport,voucherInstance:vi};
    if(vi.redeemFreq==='monthly'&&vi.lastUsed&&vi.lastUsed.slice(0,7)===_today().slice(0,7))
      return{valid:false,reason:'VOUCHER_FREQ_LIMIT_MONTHLY',passport,voucherInstance:vi};
    if(vi.redeemFreq==='per_visit'&&vi.lastUsed===_today())
      return{valid:false,reason:'VOUCHER_ALREADY_USED_TODAY',passport,voucherInstance:vi};
    if(vi.redeemQty!==-1&&vi.usedCount>=vi.redeemQty)
      return{valid:false,reason:'VOUCHER_QUANTITY_EXHAUSTED',passport,voucherInstance:vi};
    return{valid:true,passport,voucherInstance:vi,reason:'OK'};
  }

  function redeemVoucher(qrToken,ctx,overrideReason){
    const val=validateQR(qrToken,ctx);
    const isOverride=!!overrideReason;
    if(!val.valid&&!isOverride){
      _audit('REDEMPTION_FAILED',{reason:val.reason,token:qrToken.slice(0,20)},ctx?ctx.staffId:null);
      return{success:false,error:val.reason,passport:val.passport,voucherInstance:val.voucherInstance};
    }
    const payload=parseQRToken(qrToken);
    const pl=_getPassports();const pi=pl.findIndex(p=>p.id===(payload?payload.p:null));
    if(pi<0)return{success:false,error:'PASSPORT_NOT_FOUND'};
    const passport=pl[pi];
    const vi=passport.voucherInstances.find(v=>v.id===(payload?payload.v:null));
    if(!vi)return{success:false,error:'VOUCHER_INSTANCE_NOT_FOUND'};
    const prevStatus=vi.status;
    vi.usedCount=(vi.usedCount||0)+1;vi.lastUsed=_today();
    if(vi.singleUse||(vi.redeemQty!==-1&&vi.usedCount>=vi.redeemQty))vi.status='redeemed';
    passport.updatedAt=_now();_savePassports(pl);
    const redemptionId='RDM-'+_uuid().replace(/-/g,'').slice(0,12).toUpperCase();
    const rdm=[...(_getRedemptions())];
    rdm.unshift({id:redemptionId,passportId:passport.id,passportNumber:passport.number,
      customerId:passport.customerId,customerName:passport.customerName,
      voucherInstanceId:vi.id,voucherTemplateId:vi.voucherId,voucherName:vi.name,
      qrToken:qrToken.slice(0,32)+'...',counter:ctx?ctx.counter:'unknown',
      park:ctx?ctx.park:'unknown',staffId:ctx?ctx.staffId:'unknown',
      channel:ctx?ctx.channel:'scan',statusBefore:prevStatus,statusAfter:vi.status,
      usedCountAfter:vi.usedCount,isOverride,overrideReason:overrideReason||null,redeemedAt:_now()});
    _write(SK.REDEMPTIONS,rdm.slice(0,2000));
    _audit(isOverride?'REDEMPTION_MANUAL_OVERRIDE':'VOUCHER_REDEEMED',
      {redemptionId,passportId:passport.id,voucherName:vi.name,overrideReason},ctx?ctx.staffId:null);
    return{success:true,redemptionId,passport,voucherInstance:vi};
  }

  function validateParkEntry(passportId,park){
    const p=getPassportById(passportId);
    if(!p)return{valid:false,reason:'PASSPORT_NOT_FOUND'};
    if(p.status!=='active')return{valid:false,reason:`PASSPORT_${p.status.toUpperCase()}`,passport:p};
    if(_today()>p.expiryDate)return{valid:false,reason:'PASSPORT_EXPIRED',passport:p};
    const r=p.entryRights;if(!r)return{valid:false,reason:'NO_ENTRY_RIGHTS',passport:p};
    if(!r.parks.includes(park))return{valid:false,reason:'PARK_NOT_COVERED',passport:p};
    if(r.blackoutDates&&r.blackoutDates.includes(_today()))return{valid:false,reason:'BLACKOUT_DATE',passport:p};
    if(r.entriesPerDay){
      const todayE=(p.entryLog||[]).filter(e=>e.date===_today()&&e.park===park);
      if(todayE.length>=r.entriesPerDay)return{valid:false,reason:'DAILY_LIMIT_REACHED',passport:p};
    }
    return{valid:true,passport:p,vipLane:!!(r.vipLane),reason:'OK'};
  }

  function recordParkEntry(passportId,park,ctx){
    const val=validateParkEntry(passportId,park);
    if(!val.valid)return{success:false,error:val.reason,passport:val.passport};
    const pl=_getPassports();const i=pl.findIndex(p=>p.id===passportId);if(i<0)return{success:false,error:'PASSPORT_NOT_FOUND'};
    pl[i].entryLog=pl[i].entryLog||[];
    const e={id:'ENT-'+_uuid().slice(0,8).toUpperCase(),date:_today(),ts:_now(),park,gate:ctx?ctx.gate:'MAIN',staffId:ctx?ctx.staffId:'system',vipLane:!!(pl[i].entryRights&&pl[i].entryRights.vipLane)};
    pl[i].entryLog.push(e);pl[i].updatedAt=_now();_savePassports(pl);
    _audit('PARK_ENTRY_RECORDED',{passportId,park},ctx?ctx.staffId:null);
    return{success:true,entryRecord:e,passport:pl[i]};
  }

  /* ─── PASSPORT STATUS ─────────────────────────────────────────────── */
  function _setPassportStatus(id,status,by,note){
    const pl=_getPassports();const i=pl.findIndex(p=>p.id===id);if(i<0)return false;
    const prev=pl[i].status;pl[i].status=status;
    pl[i].statusHistory=pl[i].statusHistory||[];
    pl[i].statusHistory.push({status,at:_now(),by:by||'system',note:note||''});
    pl[i].updatedAt=_now();_savePassports(pl);
    _audit('PASSPORT_STATUS_CHANGED',{id,from:prev,to:status,note},by);
    return true;
  }

  /* ─── RENEWAL ENGINE ──────────────────────────────────────────────── */
  function initiateRenewal(passportId,opts){
    const p=getPassportById(passportId);if(!p)return{success:false,error:'Passport not found'};
    if(!['active','expired'].includes(p.status))return{success:false,error:'Not eligible for renewal'};
    const savedKycFlag=_read(SK.CONFIG,DEFAULT_CONFIG).meta.kycMandatoryBeforeIssuance;
    const cfg=_getConfig();cfg.meta.kycMandatoryBeforeIssuance=false;_write(SK.CONFIG,cfg);
    const res=issuePassport(Object.assign({},opts,{productId:p.productId,customerId:p.customerId,customerName:p.customerName,customerEmail:p.customerEmail,customerMobile:p.customerMobile,customerDob:p.customerDob,customerPhoto:p.customerPhoto,kycId:p.kycId,notes:`Renewal of ${passportId}`}));
    const cfg2=_getConfig();cfg2.meta.kycMandatoryBeforeIssuance=savedKycFlag;_write(SK.CONFIG,cfg2);
    if(!res.success)return res;
    const pl=_getPassports();
    const ni=pl.findIndex(x=>x.id===res.passport.id);if(ni>=0){pl[ni].renewalCount=(p.renewalCount||0)+1;pl[ni].parentPassportId=passportId;}
    const oi=pl.findIndex(x=>x.id===passportId);if(oi>=0){pl[oi].status='renewed';pl[oi].statusHistory.push({status:'renewed',at:_now(),by:opts.soldBy||'system',note:`Renewed as ${res.passport.id}`});}
    _savePassports(pl);_audit('PASSPORT_RENEWED',{oldId:passportId,newId:res.passport.id},opts.soldBy);
    return{success:true,oldPassport:p,newPassport:res.passport};
  }

  /* ─── ANALYTICS ───────────────────────────────────────────────────── */
  function getAnalytics(){
    const cfg=_getConfig();const passports=_getPassports();const redemptions=_getRedemptions();const kyc=_getKYCRecords();
    const byTier={};cfg.tiers.forEach(t=>{byTier[t.id]={name:t.name,sold:0,active:0,expired:0,revenue:0};});
    passports.forEach(p=>{const t=byTier[p.tierId];if(!t)return;t.sold++;if(p.status==='active')t.active++;if(['expired','renewed'].includes(p.status))t.expired++;const pr=cfg.products.find(x=>x.id===p.productId);if(pr)t.revenue+=pr.basePrice;});
    const totalRevenue=Object.values(byTier).reduce((s,t)=>s+t.revenue,0);
    const issued=passports.reduce((s,p)=>s+p.voucherInstances.length,0);
    const redeemed=passports.reduce((s,p)=>s+p.voucherInstances.filter(vi=>vi.status==='redeemed').length,0);
    const in30=new Date();in30.setDate(in30.getDate()+30);
    return{byTier,totalRevenue,totalPassports:passports.length,activePassports:passports.filter(p=>p.status==='active').length,
      expiringIn30:passports.filter(p=>p.status==='active'&&p.expiryDate<=in30.toISOString().slice(0,10)).length,
      breakageRate:issued?Math.round(((issued-redeemed)/issued)*100):0,
      voucherRedemptionRate:issued?Math.round((redeemed/issued)*100):0,
      kycStats:{total:kyc.length,pending:kyc.filter(k=>k.status==='pending_review').length,approved:kyc.filter(k=>k.status==='approved').length,rejected:kyc.filter(k=>k.status==='rejected').length},
      recentRedemptions:redemptions.slice(0,20),totalRedemptions:redemptions.length,
      _inr};
  }

  /* ─── CUSTOMERS ───────────────────────────────────────────────────── */
  function _getCustomers(){return _read(SK.CUSTOMERS,[]);}
  function getCustomerById(id){return _getCustomers().find(c=>c.id===id)||null;}
  function findCustomer(q){const s=(q||'').toLowerCase();return _getCustomers().filter(c=>(c.name||'').toLowerCase().includes(s)||(c.email||'').toLowerCase().includes(s)||(c.mobile||'').includes(s));}
  function upsertCustomer(data){
    const cl=_getCustomers();let c=cl.find(x=>x.email===data.email||(data.mobile&&x.mobile===data.mobile));
    if(!c){c={id:'CUST-'+_uuid().slice(0,8).toUpperCase(),createdAt:_now()};cl.push(c);}
    Object.assign(c,data,{updatedAt:_now()});_write(SK.CUSTOMERS,cl);return c;
  }

  /* ─── INITIALIZE ──────────────────────────────────────────────────── */
  function initialize(){
    if(!localStorage.getItem(SK.CONFIG)){const c=JSON.parse(JSON.stringify(DEFAULT_CONFIG));c.products.forEach(p=>{p.createdAt=_now();p.updatedAt=_now();});_write(SK.CONFIG,c);}
    if(!localStorage.getItem(SK.VOUCHERS))_write(SK.VOUCHERS,DEFAULT_VOUCHERS);
    if(!localStorage.getItem(SK.OFFERS))_write(SK.OFFERS,DEFAULT_OFFERS);
    if(!localStorage.getItem(SK.PASSPORTS))_write(SK.PASSPORTS,[]);
    if(!localStorage.getItem(SK.KYC))_write(SK.KYC,[]);
    if(!localStorage.getItem(SK.REDEMPTIONS))_write(SK.REDEMPTIONS,[]);
    if(!localStorage.getItem(SK.AUDIT))_write(SK.AUDIT,[]);
    if(!localStorage.getItem(SK.CUSTOMERS))_write(SK.CUSTOMERS,[]);
  }

  /* ─── PUBLIC API ──────────────────────────────────────────────────── */
  global.WPE = {
    getConfig:_getConfig, saveConfig:_saveConfig,
    getDefaults:()=>({config:DEFAULT_CONFIG,vouchers:DEFAULT_VOUCHERS,offers:DEFAULT_OFFERS}),
    getTiers:()=>_getConfig().tiers, getProducts:()=>_getConfig().products,
    getProductById:id=>_getConfig().products.find(p=>p.id===id)||null,
    getTierById:id=>_getConfig().tiers.find(t=>t.id===id)||null,
    getVouchers:_getVouchers, saveVouchers:_saveVouchers, getVoucherById,
    addVoucher(v){const vl=_getVouchers();v.id=v.id||'v_'+_uuid().slice(0,8);vl.push(v);_saveVouchers(vl);_audit('VOUCHER_CREATED',{id:v.id});return v;},
    updateVoucher(id,data){const vl=_getVouchers();const i=vl.findIndex(v=>v.id===id);if(i<0)return null;Object.assign(vl[i],data);_saveVouchers(vl);_audit('VOUCHER_UPDATED',{id});return vl[i];},
    getOffers:_getOffers, saveOffers(o){_write(SK.OFFERS,o);},
    getPassports:_getPassports, getPassportById, getPassportsByCustomer,
    getPassportsByStatus:s=>_getPassports().filter(p=>p.status===s),
    issuePassport, buildVoucherInstances,
    suspendPassport:(id,r,by)=>_setPassportStatus(id,'suspended',by,r),
    revokePassport:(id,r,by)=>_setPassportStatus(id,'revoked',by,r),
    reactivatePassport:(id,n,by)=>_setPassportStatus(id,'active',by,n),
    expirePassport:(id,by)=>_setPassportStatus(id,'expired',by,'Manual expiry'),
    updatePassport(id,data){const pl=_getPassports();const i=pl.findIndex(p=>p.id===id);if(i<0)return null;Object.assign(pl[i],data,{updatedAt:_now()});_savePassports(pl);_audit('PASSPORT_UPDATED',{id});return pl[i];},
    getKYCRecords:_getKYCRecords, getKYCById, getKYCByCustomer,
    submitKYC, updateKYCStatus,
    generateQRToken, parseQRToken, validateQR, redeemVoucher,
    validateParkEntry, recordParkEntry,
    initiateRenewal,
    getCustomers:_getCustomers, getCustomerById, findCustomer, upsertCustomer,
    getAuditLog:()=>_read(SK.AUDIT,[]),
    getRedemptions:_getRedemptions,
    getAnalytics, generatePassportNumber,
    inr:_inr, now:_now, today:_today, uuid:_uuid,
    initialize, SK,
  };

  WPE.initialize();

})(window);

