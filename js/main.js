/* ============================================================
   Sanctuary — main.js
   Vanilla JS. One function per feature, guard clauses,
   IntersectionObserver, prefers-reduced-motion aware.
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile navigation ---------- */
  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('mobileMenu');
    var backdrop = document.getElementById('navBackdrop');
    var closeBtn = document.getElementById('menuClose');
    if (!toggle || !menu || !backdrop) return;

    var lastFocus = null;

    function open() {
      lastFocus = document.activeElement;
      menu.classList.add('open');
      backdrop.hidden = false;
      requestAnimationFrame(function () { backdrop.classList.add('show'); });
      toggle.setAttribute('aria-expanded', 'true');
      menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var first = menu.querySelector('a, button');
      if (first) first.focus();
    }

    function close() {
      menu.classList.remove('open');
      backdrop.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      window.setTimeout(function () { backdrop.hidden = true; }, 320);
      if (lastFocus) lastFocus.focus();
    }

    toggle.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', close);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });
  }

  /* ---------- Sticky header state ---------- */
  function initStickyHeader() {
    var nav = document.getElementById('siteNav');
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle('is-stuck', window.scrollY > 8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Smooth scroll for in-page anchors ---------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      var id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      link.addEventListener('click', function (e) {
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 76;
        window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Count-up stats ---------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var prefix = el.getAttribute('data-prefix') || '';
      var suffix = el.getAttribute('data-suffix') || '';
      if (reduceMotion) { el.textContent = prefix + target + suffix; return; }
      var start = null;
      var dur = 1600;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.floor(eased * target).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target.toLocaleString() + suffix;
      }
      requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
      nums.forEach(run);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Give amount selector ---------- */
  function initGive() {
    var btns = document.querySelectorAll('.amount-btn');
    var label = document.querySelector('.give-amount-label');
    if (!btns.length) return;
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (label) {
          var val = btn.textContent.trim();
          label.textContent = /^\$/.test(val) ? val : '';
        }
      });
    });
  }

  /* ---------- Newsletter form ---------- */
  function initNewsletter() {
    document.querySelectorAll('.newsletter-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var msg = form.parentElement.querySelector('.form-msg');
        if (!input) return;
        var val = input.value.trim();
        var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        if (!valid) {
          if (msg) { msg.textContent = 'Please enter a valid email address.'; msg.className = 'form-msg'; }
          input.focus();
          return;
        }
        if (msg) { msg.textContent = 'Thank you — you are on the list. See you Sunday!'; msg.className = 'form-msg ok'; }
        form.reset();
      });
    });
  }

  /* ---------- Gallery lightbox ---------- */
  function initLightbox() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.gallery-item'));
    var box = document.getElementById('lightbox');
    if (!items.length || !box) return;

    var img = document.getElementById('lbImg');
    var closeBtn = document.getElementById('lbClose');
    var prevBtn = document.getElementById('lbPrev');
    var nextBtn = document.getElementById('lbNext');
    var count = document.getElementById('lbCount');
    var current = 0;
    var lastFocus = null;

    var sources = items.map(function (it) {
      return {
        src: it.getAttribute('data-full'),
        alt: (it.querySelector('img') && it.querySelector('img').alt) || ''
      };
    });

    function show(i) {
      current = (i + sources.length) % sources.length;
      img.src = sources[current].src;
      img.alt = sources[current].alt;
      if (count) count.textContent = (current + 1) + ' / ' + sources.length;
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      box.classList.remove('open');
      document.body.style.overflow = '';
      img.src = '';
      if (lastFocus) lastFocus.focus();
    }

    items.forEach(function (it, i) {
      it.addEventListener('click', function () { open(i); });
    });
    closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });

    document.addEventListener('keydown', function (e) {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- Sermon filtering + search ---------- */
  function initSermonFilter() {
    var grid = document.getElementById('sermonGrid');
    if (!grid) return;
    var chips = Array.prototype.slice.call(document.querySelectorAll('.filter-chip'));
    var search = document.getElementById('sermonSearch');
    var cols = Array.prototype.slice.call(grid.querySelectorAll('.sermon-col'));
    var noResults = document.getElementById('noResults');
    var activeFilter = 'all';

    function apply() {
      var q = search ? search.value.trim().toLowerCase() : '';
      var shown = 0;
      cols.forEach(function (col) {
        var series = col.getAttribute('data-series') || '';
        var title = col.getAttribute('data-title') || '';
        var matchFilter = activeFilter === 'all' || series === activeFilter;
        var matchSearch = !q || title.indexOf(q) !== -1;
        var visible = matchFilter && matchSearch;
        col.classList.toggle('hide', !visible);
        if (visible) shown++;
      });
      if (noResults) noResults.classList.toggle('show', shown === 0);
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        activeFilter = chip.getAttribute('data-filter') || 'all';
        apply();
      });
    });
    if (search) search.addEventListener('input', apply);
  }

  /* ---------- Back to top ---------- */
  function initToTop() {
    var btn = document.getElementById('toTop');
    if (!btn) return;
    function onScroll() {
      btn.classList.toggle('show', window.scrollY > 600);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Boot ---------- */
  function init() {
    initMobileNav();
    initStickyHeader();
    initSmoothScroll();
    initReveal();
    initCounters();
    initGive();
    initNewsletter();
    initLightbox();
    initSermonFilter();
    initToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
