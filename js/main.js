(function () {
  'use strict';

  var root = document.documentElement;

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function libsReady() {
    return !!(window.gsap && window.ScrollTrigger && window.Lenis);
  }

  /* ---------- Smooth scroll ---------- */
  function initSmoothScroll() {
    var lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    return lenis;
  }

  /* ---------- Hero entrance ---------- */
  function initIntro() {
    var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.fromTo('.hero__fade', { opacity: 0 }, { opacity: 1, duration: 0.9, stagger: 0.12 }, 0.1)
      .from('.hero__eyebrow, .hero__title', { y: 28, duration: 1, stagger: 0.1 }, 0.1);
  }

  /* ---------- Word-by-word text reveals ---------- */
  function initTextReveals() {
    gsap.utils.toArray('[data-reveal]').forEach(function (el) {
      var text = el.textContent.trim();
      el.innerHTML = text.split(/\s+/).map(function (w) {
        return '<span class="w-wrap"><span class="w">' + w + '</span></span>';
      }).join(' ');
      gsap.fromTo(el.querySelectorAll('.w'),
        { yPercent: 110, y: 0, opacity: 0 },
        { yPercent: 0, y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.04,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  /* ---------- Page theme follows the section in view ---------- */
  function initCaseThemes() {
    var sections = gsap.utils.toArray('section[data-bg]');
    var instant = prefersReducedMotion();

    function apply(sec, now) {
      gsap.to(document.body, {
        '--bg': sec.dataset.bg, '--fg': sec.dataset.fg, '--accent': sec.dataset.accent,
        duration: (now || instant) ? 0 : 0.7, ease: 'power2.out', overwrite: true
      });
    }

    sections.forEach(function (sec) {
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onEnter: function () { apply(sec); },
        onEnterBack: function () { apply(sec); }
      });
    });

    function applyCurrent() {
      var line = window.innerHeight * 0.55;
      var current = sections.filter(function (s) {
        var r = s.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
      })[0] || sections[0];
      apply(current, true);
    }
    applyCurrent();
    window.addEventListener('load', function () { ScrollTrigger.refresh(); applyCurrent(); });
  }

  /* ---------- Simple fade-up for blocks with inline markup ---------- */
  function initFades() {
    gsap.utils.toArray('[data-fade]').forEach(function (el) {
      gsap.fromTo(el, { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
  }

  /* ---------- Image parallax ---------- */
  function initParallax() {
    gsap.utils.toArray('[data-parallax]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -4 }, {
        yPercent: 4, ease: 'none',
        scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  }

  /* ---------- Horizontal galleries: pinned on desktop, native swipe below ---------- */
  function initGalleries() {
    var mm = gsap.matchMedia();
    mm.add('(min-width: 900px)', function () {
      var strips = gsap.utils.toArray('.case__strip');
      strips.forEach(function (strip) {
        var track = strip.querySelector('.case__track');
        var dist = function () { return Math.max(0, track.scrollWidth - strip.clientWidth); };
        strip.classList.add('is-pinned');
        gsap.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: strip, start: 'center center',
            end: function () { return '+=' + dist(); },
            pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1
          }
        });
      });
      return function () {
        strips.forEach(function (s) { s.classList.remove('is-pinned'); });
      };
    });
  }

  /* ---------- Lazy video: load + play near the viewport, pause away ---------- */
  function initVideos(autoplay) {
    var videos = document.querySelectorAll('video[data-src]');
    if (!('IntersectionObserver' in window)) { return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && autoplay) {
          if (!v.getAttribute('src')) { v.src = v.dataset.src; }
          var p = v.play();
          if (p && p.catch) { p.catch(function () { /* autoplay blocked: poster stays */ }); }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: '200px' });
    videos.forEach(function (v) { io.observe(v); });
  }

  /* ---------- In-page links ---------- */
  function initNav(lenis) {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var target = document.querySelector(a.getAttribute('href'));
        if (!target) { return; }
        e.preventDefault();
        if (lenis) { lenis.scrollTo(target, { duration: 1.4 }); }
        else { target.scrollIntoView(); }
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        history.pushState(null, '', a.getAttribute('href'));
      });
    });
  }

  /* Pins are created in page order at boot. Crossing the 900px breakpoint
     later (iPad rotation, window resize) would re-create them out of order
     and desync the theme triggers, so start over cleanly instead. */
  function reloadOnBreakpointChange() {
    var mq = window.matchMedia('(min-width: 900px)');
    var wide = mq.matches;
    var timer;
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (mq.matches !== wide) { window.location.reload(); }
      }, 300);
    });
  }

  /* ---------- Boot ---------- */
  function boot() {
    var degrade = !libsReady() || !root.classList.contains('js') || prefersReducedMotion();
    if (degrade) {
      root.classList.remove('js'); // content stays fully visible, no motion
      initNav(null);
      initVideos(!prefersReducedMotion()); // reduced motion: poster only, no looping video
      if (libsReady()) { gsap.registerPlugin(ScrollTrigger); initCaseThemes(); }
      window.__gabzReady = true;
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    var lenis = initSmoothScroll();
    initNav(lenis);
    initVideos(true);
    initIntro();
    // Pins first: ScrollTriggers must be created after the pins above them
    // exist, otherwise their start/end ignore the pin spacers.
    initGalleries();
    initCaseThemes();
    initTextReveals();
    initFades();
    initParallax();
    reloadOnBreakpointChange();
    window.__gabzReady = true;
  }

  boot();
})();
