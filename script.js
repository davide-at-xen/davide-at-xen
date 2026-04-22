// Xen Quantum — Site Scripts (vanilla JS, no dependencies)

(function () {
  'use strict';

  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  // --- Scroll handler with rAF throttle ---
  var ticking = false;
  var scrollY = 0;

  function onScroll() {
    scrollY = window.scrollY;
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateOnScroll);
    }
  }

  function updateOnScroll() {
    ticking = false;

    // Sticky navbar background
    if (scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Scroll-based nav highlighting (main page only)
    if (highlightSections) {
      var scrollPos = scrollY + viewThird;
      for (var i = 0; i < highlightSections.length; i++) {
        var s = highlightSections[i];
        if (scrollPos >= s.top && scrollPos < s.top + s.height) {
          if (activeHash !== s.hash) {
            if (activeHash) {
              var prev = hashMap[activeHash];
              if (prev) prev.classList.remove('active');
            }
            activeHash = s.hash;
            var next = hashMap[activeHash];
            if (next) next.classList.add('active');
          }
          break;
        }
      }
    }
  }

  // --- Mobile menu toggle ---
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // --- Active nav link highlighting ---
  var allNavLinks = document.querySelectorAll('.nav-links a');
  var path = window.location.pathname;
  var highlightSections = null;
  var hashMap = {};
  var activeHash = '';
  var viewThird = 0;

  if (path.indexOf('/careers') === 0 || path.indexOf('careers/') !== -1) {
    setActiveByText('Careers');
  } else if (path.indexOf('/news') === 0 || path.indexOf('news/') !== -1) {
    setActiveByText('News');
  } else if (path.indexOf('/contact') === 0 || path.indexOf('contact/') !== -1) {
    setActiveByText('Get in Touch');
  } else {
    // Main page — cache section positions for scroll highlighting
    var sections = document.querySelectorAll('section[id]');
    var hashNavItems = document.querySelectorAll('.nav-links a[href^="#"]');

    if (sections.length && hashNavItems.length) {
      // Build lookup map
      for (var i = 0; i < hashNavItems.length; i++) {
        hashMap[hashNavItems[i].getAttribute('href')] = hashNavItems[i];
      }

      // Cache section positions (recalculate on resize)
      function cacheSections() {
        highlightSections = [];
        viewThird = window.innerHeight / 3;
        for (var i = 0; i < sections.length; i++) {
          highlightSections.push({
            top: sections[i].offsetTop,
            height: sections[i].offsetHeight,
            hash: '#' + sections[i].getAttribute('id')
          });
        }
      }
      cacheSections();

      var resizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(cacheSections, 200);
      }, { passive: true });
    }
  }

  function setActiveByText(text) {
    for (var i = 0; i < allNavLinks.length; i++) {
      if (allNavLinks[i].textContent.trim() === text) {
        allNavLinks[i].classList.add('active');
      }
    }
  }

  // Single scroll listener
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Click-to-load maps ---
  document.querySelectorAll('.location-map[data-map-src]').forEach(function (container) {
    var btn = container.querySelector('.map-placeholder');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var iframe = document.createElement('iframe');
      iframe.src = container.getAttribute('data-map-src');
      iframe.width = '100%';
      iframe.height = '280';
      iframe.style.border = '0';
      iframe.style.borderRadius = '8px';
      iframe.allowFullscreen = true;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.title = container.getAttribute('data-map-title') || 'Map';
      container.innerHTML = '';
      container.appendChild(iframe);
    });
  });
})();
