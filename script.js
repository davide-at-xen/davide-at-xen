// Xen Quantum — Site Scripts (vanilla JS, no dependencies)

(function () {
  'use strict';

  // --- Sticky navbar background on scroll ---
  var navbar = document.getElementById('navbar');
  if (!navbar) return;

  function updateNavbar() {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  // --- Mobile menu toggle ---
  var toggle = document.querySelector('.nav-toggle');
  var navLinks = document.querySelector('.nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      toggle.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --- Active nav link highlighting ---
  var allNavLinks = document.querySelectorAll('.nav-links a');
  var path = window.location.pathname;

  // On sub-pages (e.g. /careers/, /careers/privacy/), highlight the matching nav link
  if (path.indexOf('/careers') === 0 || path.indexOf('careers/') !== -1) {
    allNavLinks.forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && (href === '/careers/' || href === '/careers' || href === './' || href === '../' ||
          href.indexOf('careers/') !== -1 || href.indexOf('careers') === href.length - 7)) {
        // Only mark the Careers link active, not other links
        if (a.textContent.trim() === 'Careers') {
          a.classList.add('active');
        }
      }
    });
  } else {
    // On the main page, highlight based on scroll position
    var sections = document.querySelectorAll('section[id]');
    var hashNavItems = document.querySelectorAll('.nav-links a[href^="#"]');

    function highlightNav() {
      var scrollPos = window.scrollY + window.innerHeight / 3;

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        var id = section.getAttribute('id');

        if (scrollPos >= top && scrollPos < top + height) {
          hashNavItems.forEach(function (a) {
            a.classList.remove('active');
            if (a.getAttribute('href') === '#' + id) {
              a.classList.add('active');
            }
          });
        }
      });
    }

    window.addEventListener('scroll', highlightNav, { passive: true });
    highlightNav();
  }
})();
