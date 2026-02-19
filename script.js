/* ═══════════════════════════════════════════════════════════════════
   PRATIQUES URBAINES · draft_2 · script.js
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Constants ───────────────────────────────────────────────── */
  const NAV_ITEM_H  = 60;   // matches --nav-item-h in CSS (60px)
  const NAV_VISIBLE = 4;    // matches --nav-visible (240px viewport)

  /* ── DOM refs ────────────────────────────────────────────────── */
  const navList     = document.getElementById('navList');
  const navItems    = [...document.querySelectorAll('.section-nav__item')];
  const navDots     = [...document.querySelectorAll('.dot')];
  const sections    = [...document.querySelectorAll('[data-section-index]')];
  const scrollHint  = document.getElementById('scrollHint');

  /* ── State ───────────────────────────────────────────────────── */
  let currentActiveIndex = 0;
  let isSnapping = false;

  /* ─────────────────────────────────────────────────────────────
     SCROLL STATE
     Returns: { activeIndex, sectionProgress }
     sectionProgress: 0 = just entered section, 1 = about to leave
  ───────────────────────────────────────────────────────────── */
  function getScrollState () {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;

    // Find which section is currently in view
    for (let i = sections.length - 1; i >= 0; i--) {
      const top = sections[i].offsetTop;
      if (scrollY >= top - vh * 0.05) {  // small tolerance
        const h = sections[i].offsetHeight;
        const progress = Math.max(0, Math.min(1, (scrollY - top) / h));
        return { activeIndex: i, sectionProgress: progress };
      }
    }
    return { activeIndex: 0, sectionProgress: 0 };
  }

  /* ─────────────────────────────────────────────────────────────
     NAV — SLOT-MACHINE ANIMATION
     Formula: T = (N-1) * H - pos * H
     where pos = activeIndex + sectionProgress
     This gives: at pos=i (start of section i), item i is at the
     bottom of the nav viewport. As pos increases, items slide up.
  ───────────────────────────────────────────────────────────── */
  function updateNav (activeIndex, sectionProgress) {
    const pos = activeIndex + sectionProgress;
    const T   = (NAV_VISIBLE - 1) * NAV_ITEM_H - pos * NAV_ITEM_H;
    navList.style.transform = `translateY(${T}px)`;

    // Update active / past / future classes
    navItems.forEach((item, i) => {
      item.classList.remove('is-active', 'is-past', 'is-future');
      if      (i === activeIndex) item.classList.add('is-active');
      else if (i  <  activeIndex) item.classList.add('is-past');
      else                        item.classList.add('is-future');
    });

    // Mobile dots
    navDots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === activeIndex);
    });
  }


  /* ─────────────────────────────────────────────────────────────
     NAVIGATE TO SECTION (smooth scroll)
  ───────────────────────────────────────────────────────────── */
  function goToSection (index) {
    if (index < 0 || index >= sections.length) return;
    const target = sections[index];
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ─────────────────────────────────────────────────────────────
     NAV CLICK HANDLERS
  ───────────────────────────────────────────────────────────── */
  navItems.forEach((item, i) => {
    const link = item.querySelector('.section-nav__link');
    if (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        goToSection(i);
      });
    }
  });

  navDots.forEach((dot) => {
    dot.addEventListener('click', function () {
      const i = parseInt(this.dataset.index, 10);
      goToSection(i);
    });
  });

  /* ─────────────────────────────────────────────────────────────
     KEYBOARD NAVIGATION (arrow keys)
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      goToSection(currentActiveIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      goToSection(currentActiveIndex - 1);
    }
  });

  /* ─────────────────────────────────────────────────────────────
     TOUCH SWIPE NAVIGATION (mobile)
  ───────────────────────────────────────────────────────────── */
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener('touchstart', function (e) {
    touchStartY    = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    const dy       = touchStartY - e.changedTouches[0].clientY;
    const dt       = Date.now() - touchStartTime;
    const velocity = Math.abs(dy) / dt; // px/ms

    // Quick swipe: fast flick to navigate between sections
    if (velocity > 0.6 && Math.abs(dy) > 50) {
      if (dy > 0) {
        // Swipe up → go to next section
        goToSection(currentActiveIndex + 1);
      } else {
        // Swipe down → go to previous section
        goToSection(currentActiveIndex - 1);
      }
    }
  }, { passive: true });

  /* ─────────────────────────────────────────────────────────────
     ENTRANCE ANIMATIONS — Intersection Observer
     Cards, book-cards, article-rows, media-rows, timeline-items
     fade up when they enter the viewport.
  ───────────────────────────────────────────────────────────── */
  const animatables = document.querySelectorAll(
    '.card, .book-card, .article-row, .media-row, .timeline__item'
  );

  const observerOpts = {
    root:       null,
    rootMargin: '0px 0px -60px 0px',
    threshold:  0.08,
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, observerOpts);

  animatables.forEach(function (el) {
    observer.observe(el);
  });

  /* ─────────────────────────────────────────────────────────────
     BACKGROUND PARALLAX
     Pans the fixed bg image from top (hero) to bottom (contact)
     as you scroll, revealing different strates of the territory.
  ───────────────────────────────────────────────────────────── */
  function updateBackgroundPosition (activeIndex, sectionProgress) {
    const total   = sections.length - 1;   // 6
    const pos     = (activeIndex + sectionProgress) / total;
    const yPct    = (pos * 100).toFixed(1);
    document.body.style.backgroundPositionY = yPct + '%';
  }

  /* ─────────────────────────────────────────────────────────────
     LOGO — stays fully visible (background is always light)
  ───────────────────────────────────────────────────────────── */
  const siteLogo = document.getElementById('siteLogo');

  function updateLogo () {
    // Background is permanently light — no inversion needed.
    // Logo stays at full opacity throughout.
    if (siteLogo) siteLogo.style.opacity = 1;
  }

  /* ─────────────────────────────────────────────────────────────
     SCROLL HINT — visible only while on the hero
     Fades out quickly as soon as you start scrolling through it,
     disappears entirely past the first section.
  ───────────────────────────────────────────────────────────── */
  function updateScrollHint (activeIndex, sectionProgress) {
    if (!scrollHint) return;
    // On hero: full opacity at top (progress=0), fades to 0 by 40% through
    // the section so it doesn't linger while content is visible.
    // Past hero: hidden.
    const opacity = activeIndex === 0
      ? Math.max(0, 1 - sectionProgress * 2.5)
      : 0;
    scrollHint.style.opacity = opacity;
  }

  /* ─────────────────────────────────────────────────────────────
     ENHANCED SCROLL HANDLER (combined)
  ───────────────────────────────────────────────────────────── */
  function onScrollFull () {
    const { activeIndex, sectionProgress } = getScrollState();
    updateNav(activeIndex, sectionProgress);
    updateBackgroundPosition(activeIndex, sectionProgress);
    updateScrollHint(activeIndex, sectionProgress);
    currentActiveIndex = activeIndex;
  }

  /* ─────────────────────────────────────────────────────────────
     RESIZE — recalculate section offsets cached nowhere,
     but re-trigger a render pass.
  ───────────────────────────────────────────────────────────── */
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(onScrollFull, 100);
  });

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  window.addEventListener('scroll', onScrollFull, { passive: true });

  // Initial render — also handle case where page is loaded mid-scroll
  // (e.g. via hash)
  window.addEventListener('DOMContentLoaded', function () {
    onScrollFull();
  });

  // Fallback in case DOMContentLoaded already fired
  onScrollFull();

  /* ─────────────────────────────────────────────────────────────
     HASH-BASED NAVIGATION on load
     e.g. #reflexions → scroll to that section
  ───────────────────────────────────────────────────────────── */
  if (window.location.hash) {
    const targetId = window.location.hash.slice(1);
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
      // Delay to let layout settle
      setTimeout(function () {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }

})();
