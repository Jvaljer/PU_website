(function () {
  'use strict';

  /* DOM References */
  var sidebar = document.getElementById('sidebar');
  var navToggle = document.getElementById('navToggle');
  var siteContent = document.querySelector('.site-content');
  var sections = document.querySelectorAll('.section');
  var sidebarLinks = sidebar ? sidebar.querySelectorAll('.sidebar__nav-link') : [];

  /* Create overlay element for mobile  */
  var overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  document.body.appendChild(overlay);

  /* Scroll Container
     On desktop the scroll container is .site-content
     (it has overflow-y: auto + height: 100vh for snap).
     On mobile (<= 768 px) we fall back to window.       */
  function getScrollContainer() {
    return (window.innerWidth > 768 && siteContent) ? siteContent : null;
  }

  function getScrollY() {
    var container = getScrollContainer();
    return container ? container.scrollTop : window.scrollY;
  }

  /* Active Link Highlighting  */
  function updateActiveLink() {
    var scrollY = getScrollY();
    var current = '';

    sections.forEach(function (section) {
      var sectionTop = section.offsetTop - 200;
      var sectionBottom = sectionTop + section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionBottom) {
        current = section.getAttribute('id');
      }
    });

    sidebarLinks.forEach(function (link) {
      link.classList.remove('is-active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('is-active');
      }
    });
  }

  /* Mobile Menu Toggle */
  function openMobileMenu() {
    sidebar.classList.add('is-open');
    navToggle.classList.add('is-open');
    overlay.classList.add('is-visible');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    sidebar.classList.remove('is-open');
    navToggle.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMobileMenu() {
    if (sidebar.classList.contains('is-open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  /* Smooth Scroll for Anchor Links */
  function handleAnchorClick(e) {
    var href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      var target = document.querySelector(href);
      if (target) {
        var container = getScrollContainer();

        if (container) {
          // Desktop: scroll within .site-content container
          var offset = href === '#hero' ? 0 : 0;
          container.scrollTo({
            top: target.offsetTop - offset,
            behavior: 'smooth'
          });
        } else {
          // Mobile: scroll window
          var mobileOffset = href === '#hero' ? 0 : 56;
          window.scrollTo({
            top: target.offsetTop - mobileOffset,
            behavior: 'smooth'
          });
        }

        // Close mobile menu if open
        closeMobileMenu();
      }
    }
  }

  /* Resize Handler */
  function handleResize() {
    if (window.innerWidth > 768) {
      closeMobileMenu();
    }
    // Re-bind scroll listener to correct container
    bindScrollListener();
  }

  /* Bind/rebind scroll listener */
  var currentScrollTarget = null;

  function bindScrollListener() {
    var newTarget = getScrollContainer() || window;

    if (newTarget !== currentScrollTarget) {
      if (currentScrollTarget) {
        currentScrollTarget.removeEventListener('scroll', updateActiveLink);
      }
      newTarget.addEventListener('scroll', updateActiveLink, { passive: true });
      currentScrollTarget = newTarget;
    }
  }

  /* Initialize */
  function init() {
    // Scroll: update active link (bind to correct container)
    bindScrollListener();
    window.addEventListener('resize', handleResize, { passive: true });

    // Mobile menu toggle
    if (navToggle) {
      navToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu on overlay click
    overlay.addEventListener('click', closeMobileMenu);

    // Smooth scroll for ALL anchor links (sidebar, mobile header, etc.)
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', handleAnchorClick);
    });

    // Initial active link check
    updateActiveLink();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
