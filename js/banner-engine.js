// ============================================================
//  Worlds of Wonder — Hero Banner Engine  v3.0
//  Full-size cinematic hero slider
//  Supports: gradient, image, video slide types
//  Config:   /data/banners.json  (override via localStorage)
//  Admin:    /admin/cms.html
// ============================================================
'use strict';

const WOWBanners = (function () {

  /* ── Path helpers ──────────────────────────────────────── */
  const IS_SUBPAGE = window.location.pathname.includes('/book/') ||
                     window.location.pathname.includes('/admin/');
  const BASE_PATH  = IS_SUBPAGE ? '../' : '';
  const CONFIG_URL = BASE_PATH + 'data/banners.json';
  const STORAGE_KEY = 'wow_banners_v3';

  /* ── State ─────────────────────────────────────────────── */
  let _cfg      = null;
  let _idx      = 0;
  let _timer    = null;
  let _section  = null;
  let _slides   = [];

  /* ── Escape helper ─────────────────────────────────────── */
  function esc(s) { return (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function resolveUrl(u) {
    if (!u) return '';
    if (u.startsWith('http') || u.startsWith('//') || u.startsWith('data:')) return u;
    return BASE_PATH + u;
  }

  /* ── Load config ───────────────────────────────────────── */
  async function loadConfig(key) {
    try {
      // Priority: wow_banners_v3 → wow_banners_override → data/banners.json
      const stored = localStorage.getItem(STORAGE_KEY)
                  || localStorage.getItem('wow_banners_override');
      if (stored) { _cfg = JSON.parse(stored); }
      else {
        const r = await fetch(CONFIG_URL + '?t=' + Date.now());
        _cfg = await r.json();
      }
      return _cfg[key] || null;
    } catch (e) {
      console.warn('[WOWBanners] Config load failed, using fallback.', e);
      return null;
    }
  }

  /* ── Build one slide ───────────────────────────────────── */
  function buildSlide(slide, isActive) {
    const div = document.createElement('div');
    div.className = 'hero-slide' + (isActive ? ' active' : '');

    // ── Background ───
    const bg = document.createElement('div');
    bg.className = 'hero-slide-bg';

    if (slide.type === 'youtube' && slide.youtubeId) {
      // YouTube iframe background
      bg.style.cssText = 'position:relative;overflow:hidden;';
      const ytWrap = document.createElement('div');
      ytWrap.className = 'yt-bg-wrap';
      ytWrap.innerHTML = `<iframe class="yt-bg-iframe"
        src="https://www.youtube.com/embed/${slide.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${slide.youtubeId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&vq=hd1080"
        frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" loading="lazy"></iframe>`;
      // Fallback gradient behind the iframe
      if (slide.fallbackGradient) bg.style.background = slide.fallbackGradient;
      bg.appendChild(ytWrap);

    } else if (slide.type === 'video' && slide.videoUrl) {
      const vid = document.createElement('video');
      Object.assign(vid, { src: resolveUrl(slide.videoUrl), autoplay: true, muted: true, loop: true, playsInline: true });
      if (slide.videoPoster) vid.poster = resolveUrl(slide.videoPoster);
      vid.setAttribute('webkit-playsinline', '');
      bg.appendChild(vid);

    } else if (slide.type === 'image' && slide.imageUrl) {
      bg.style.cssText = `background-image:url('${resolveUrl(slide.imageUrl)}');background-size:cover;background-position:center;`;

    } else {
      // gradient type (or fallback)
      bg.style.background = slide.fallbackGradient || 'linear-gradient(155deg,#001840,#0068c8)';
    }

    // Overlay
    const ov = document.createElement('div');
    ov.className = 'hero-slide-overlay';
    const opac = slide.overlayOpacity ?? 0.45;
    if (opac > 0) ov.style.background = `rgba(0,0,0,${opac})`;
    bg.appendChild(ov);
    div.appendChild(bg);

    // ── Content ───
    const content = document.createElement('div');
    content.className = 'hero-slide-content hero-slide-content--left';
    if (slide.textAlign === 'center') content.classList.replace('hero-slide-content--left', 'hero-slide-content--center');

    // Multiline title support (\n → <br>)
    const titleHtml = (slide.title || '').replace(/\n/g, '<br>');

    content.innerHTML = `
      ${slide.badge ? `<div class="hero-eyebrow">${esc(slide.badge)}</div>` : ''}
      <h1 class="hero-slide-title">${titleHtml}</h1>
      <p class="hero-slide-sub">${esc(slide.subtitle || '')}</p>
      <div class="hero-slide-cta">
        ${slide.cta        ? `<a href="${resolveUrl(slide.cta.url)}"        class="btn btn-primary btn-xl">${esc(slide.cta.label)}</a>` : ''}
        ${slide.ctaSecondary ? `<a href="${resolveUrl(slide.ctaSecondary.url)}" class="btn btn-outline-white btn-lg">${esc(slide.ctaSecondary.label)}</a>` : ''}
      </div>`;
    div.appendChild(content);

    return div;
  }

  /* ── Bubbles ───────────────────────────────────────────── */
  function buildBubbles() {
    const wrap = document.createElement('div');
    wrap.className = 'hero-bubbles';
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('div');
      b.className = 'bubble';
      const sz = Math.random() * 70 + 20;
      b.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;
        animation-duration:${Math.random()*8+7}s;animation-delay:${Math.random()*5}s;
        opacity:${(Math.random()*0.1+0.03).toFixed(2)};`;
      wrap.appendChild(b);
    }
    return wrap;
  }

  /* ── Controls (dots + arrows) ──────────────────────────── */
  function buildControls(cfg) {
    if (!cfg.showDots && !cfg.showArrows) return null;
    const ctrl = document.createElement('div');
    ctrl.className = 'hero-controls';

    if (cfg.showArrows) {
      ['prev','next'].forEach(dir => {
        const btn = document.createElement('button');
        btn.className = `hero-arrow hero-arrow--${dir}`;
        btn.innerHTML = dir === 'prev' ? '‹' : '›';
        btn.setAttribute('aria-label', dir === 'prev' ? 'Previous slide' : 'Next slide');
        btn.addEventListener('click', () => { stopAuto(); goTo(_idx + (dir === 'next' ? 1 : -1)); });
        ctrl.appendChild(btn);
      });
    }

    if (cfg.showDots) {
      const dots = document.createElement('div');
      dots.className = 'hero-dots';
      dots.id = 'hero-dots';
      _slides.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'hero-dot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', `Slide ${i + 1}`);
        d.addEventListener('click', () => { stopAuto(); goTo(i); });
        dots.appendChild(d);
      });
      ctrl.appendChild(dots);
    }
    return ctrl;
  }

  /* ── Transition ────────────────────────────────────────── */
  function goTo(idx) {
    const total = _slides.length;
    _idx = ((idx % total) + total) % total;
    _slides.forEach((s, i) => s.classList.toggle('active', i === _idx));
    _section.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === _idx));
    // Video: pause all, play active
    _section.querySelectorAll('video').forEach(v => v.pause());
    const vid = _slides[_idx]?.querySelector('video');
    if (vid) vid.play().catch(() => {});
  }

  /* ── Autoplay ──────────────────────────────────────────── */
  function startAuto(cfg) {
    if (!cfg.autoplay || _slides.length <= 1) return;
    _timer = setInterval(() => goTo(_idx + 1), cfg.autoplayInterval || 6000);
  }
  function stopAuto() { clearInterval(_timer); _timer = null; }

  /* ── Progress bar ──────────────────────────────────────── */
  function buildProgressBar(interval) {
    const bar = document.createElement('div');
    bar.id = 'hero-progress';
    bar.style.cssText = `position:absolute;bottom:0;left:0;height:3px;
      background:var(--accent,#F5A800);z-index:12;
      animation:heroProg ${interval}ms linear infinite;`;
    const style = document.createElement('style');
    style.textContent = `@keyframes heroProg{0%{width:0%}100%{width:100%}}`;
    document.head.appendChild(style);
    return bar;
  }

  /* ── Fallback ──────────────────────────────────────────── */
  function buildFallback(section) {
    section.style.cssText = 'min-height:100vh;background:linear-gradient(155deg,#001840,#0068c8);display:flex;align-items:flex-end;';
  }

  /* ── Main init ─────────────────────────────────────────── */
  async function init(targetSelector, sectionKey) {
    _section = document.querySelector(targetSelector);
    if (!_section) return null;

    const cfg = await loadConfig(sectionKey);
    if (!cfg) { buildFallback(_section); return null; }

    const active = (cfg.slides || []).filter(s => s.active);
    if (!active.length) { buildFallback(_section); return null; }

    // Clear and rebuild
    _section.innerHTML = '';
    _section.classList.add('hero-slider');

    // Bubbles
    _section.appendChild(buildBubbles());

    // Slides
    _slides = active.map((s, i) => {
      const el = buildSlide(s, i === 0);
      _section.appendChild(el);
      return el;
    });

    // Widget slot (homepage injects quick-book widget here)
    const widgetSlot = document.createElement('div');
    widgetSlot.id = 'hero-widget-slot';
    _section.appendChild(widgetSlot);

    // Scroll cue
    const cue = document.createElement('div');
    cue.className = 'hero-scroll-cue';
    cue.innerHTML = `<span>Scroll</span>
      <svg width="20" height="20" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="2" viewBox="0 0 24 24">
        <path d="M19 9l-7 7-7-7"/>
      </svg>`;
    _section.appendChild(cue);

    // Controls
    const ctrl = buildControls(cfg);
    if (ctrl) _section.appendChild(ctrl);

    // Progress bar (only for multi-slide autoplay)
    if (cfg.autoplay && _slides.length > 1) {
      _section.appendChild(buildProgressBar(cfg.autoplayInterval || 6000));
    }

    startAuto(cfg);
    _section.addEventListener('mouseenter', stopAuto);
    _section.addEventListener('mouseleave', () => startAuto(cfg));

    // Touch/swipe support
    let _tx = 0;
    _section.addEventListener('touchstart', e => { _tx = e.touches[0].clientX; }, { passive: true });
    _section.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - _tx;
      if (Math.abs(dx) > 50) { stopAuto(); goTo(_idx + (dx < 0 ? 1 : -1)); }
    }, { passive: true });

    return cfg;
  }

  /* ── Public ────────────────────────────────────────────── */
  return { init, goTo, stopAuto, loadConfig };
})();
