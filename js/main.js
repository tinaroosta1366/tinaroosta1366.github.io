/* Tina Toodeh Roosta — portfolio interactions (no dependencies) */
(function () {
  'use strict';
  var root = document.documentElement;
  var FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
  function lang() { return root.lang === 'en' ? 'en' : 'fa'; }
  function num(n) { var s = String(n); return lang() === 'fa' ? s.replace(/\d/g, function (d) { return FA_DIGITS[d]; }) : s; }

  /* ---------- Language ---------- */
  var ATTRS = ['alt', 'aria-label', 'content', 'title'];
  function applyLang(l, scope) {
    scope = scope || document;
    ATTRS.forEach(function (a) {
      scope.querySelectorAll('[data-' + l + '-' + a + ']').forEach(function (el) {
        el.setAttribute(a, el.getAttribute('data-' + l + '-' + a));
      });
    });
    if (scope === document) {
      var t = document.querySelector('title');
      if (t && t.dataset[l]) document.title = t.dataset[l];
      var og = { fa: 'fa_IR', en: 'en_US' };
      var loc = document.querySelector('meta[property="og:locale"]');
      if (loc) loc.setAttribute('content', og[l]);
    }
  }
  function setLang(l, save) {
    root.lang = l; root.dir = l === 'en' ? 'ltr' : 'rtl';
    applyLang(l);
    if (save) { try { localStorage.setItem('lang', l); } catch (e) {} }
    if (pd && pd.open) renderSlide();
  }
  var langBtn = document.getElementById('langBtn');
  langBtn.addEventListener('click', function () {
    setLang(lang() === 'fa' ? 'en' : 'fa', true);
    var u = new URL(location.href);
    if (u.searchParams.has('lang')) { u.searchParams.delete('lang'); history.replaceState(null, '', u); }
  });

  /* ---------- Header + mobile menu ---------- */
  var header = document.querySelector('.site-header');
  var nav = document.getElementById('nav');
  var menuBtn = document.getElementById('menuBtn');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  function closeMenu() {
    nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('data-fa-aria-label', 'باز کردن منو'); menuBtn.setAttribute('data-en-aria-label', 'Open menu');
    applyLang(lang(), menuBtn.parentNode);
  }
  menuBtn.addEventListener('click', function () {
    var open = !nav.classList.contains('open');
    nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('data-fa-aria-label', open ? 'بستن منو' : 'باز کردن منو');
    menuBtn.setAttribute('data-en-aria-label', open ? 'Close menu' : 'Open menu');
    applyLang(lang(), menuBtn.parentNode);
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); menuBtn.focus(); } });

  /* ---------- Scroll spy ---------- */
  var links = {};
  nav.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); links[k].removeAttribute('aria-current'); });
          var a = links[en.target.id]; if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });

    /* ---------- Reveal ---------- */
    var rev = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); rev.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    document.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 70 + 'ms';
      rev.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Project dialog ---------- */
  var pd = document.getElementById('pd');
  var stage = pd.querySelector('.pd-stage');
  var body = pd.querySelector('.pd-body');
  var navBar = pd.querySelector('.pd-nav');
  var count = pd.querySelector('.pd-count');
  var slides = [], idx = 0, opener = null;

  function renderSlide() {
    stage.innerHTML = '';
    if (!slides.length) return;
    stage.appendChild(slides[idx].cloneNode(true));
    applyLang(lang(), stage);
    count.textContent = num(idx + 1) + ' / ' + num(slides.length);
  }
  function openProject(id, trigger) {
    var card = document.querySelector('[data-project="' + id + '"]');
    if (!card) return;
    opener = trigger || null;
    var tpl = card.querySelector('template.detail');
    var frag = tpl.content.cloneNode(true);
    slides = Array.prototype.slice.call(frag.querySelectorAll('.gallery figure'));
    slides.forEach(function (f) { var im = f.querySelector('img'); if (im) { im.loading = 'eager'; } });
    idx = 0;
    var src = card.querySelector('.card-body, .feature-body');
    var b = src.cloneNode(true);
    b.querySelectorAll('.reveal').forEach(function (r) { r.classList.remove('reveal'); });
    var h = b.querySelector('h3'); if (h) h.id = 'pd-title';
    var pts = frag.querySelector('.points');
    if (pts && !b.querySelector('.points')) {
      var desc = b.querySelectorAll('.card-desc'); var after = desc[desc.length - 1];
      after.parentNode.insertBefore(pts, after.nextSibling);
    }
    body.innerHTML = ''; while (b.firstChild) body.appendChild(b.firstChild);
    navBar.hidden = slides.length < 2;
    renderSlide();
    if (typeof pd.showModal === 'function') pd.showModal(); else pd.setAttribute('open', '');
    document.body.classList.add('pd-open');
    pd.querySelector('.pd-close').focus();
  }
  function step(d) { if (slides.length < 2) return; idx = (idx + d + slides.length) % slides.length; renderSlide(); }
  pd.querySelector('.pd-prev').addEventListener('click', function () { step(-1); });
  pd.querySelector('.pd-next').addEventListener('click', function () { step(1); });
  pd.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') step(lang() === 'fa' ? 1 : -1);
    if (e.key === 'ArrowRight') step(lang() === 'fa' ? -1 : 1);
  });
  pd.querySelector('[data-close]').addEventListener('click', function () { pd.close(); });
  pd.addEventListener('click', function (e) { if (e.target === pd) pd.close(); });
  pd.addEventListener('close', function () {
    document.body.classList.remove('pd-open');
    if (opener) opener.focus();
  });
  document.querySelectorAll('[data-open]').forEach(function (btn) {
    btn.addEventListener('click', function () { openProject(btn.getAttribute('data-open'), btn); });
  });

  /* ---------- Copy email ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var v = btn.getAttribute('data-copy'), out = btn.querySelector('.copied');
      function done() { out.textContent = lang() === 'fa' ? 'کپی شد' : 'Copied'; setTimeout(function () { out.textContent = ''; }, 1600); }
      if (navigator.clipboard) navigator.clipboard.writeText(v).then(done, function () {});
    });
  });

  /* ---------- Back to top ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    function topVis() { toTop.classList.toggle('is-in', window.scrollY > 400); }
    window.addEventListener('scroll', topVis, { passive: true });
    topVis();
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      var instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: instant ? 'auto' : 'smooth' });
    });
  }

  applyLang(lang());
})();
