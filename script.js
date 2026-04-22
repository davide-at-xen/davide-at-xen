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

  // --- Interactive Node Network (hero canvas) ---
  var canvas = document.getElementById('network-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var nodes = [];
    var edges = [];
    var mouseX = -9999;
    var mouseY = -9999;
    var needsDraw = true;
    var CONNECT_DIST = 170;
    var HOVER_RADIUS = 130;
    var NODE_COUNT = 120;

    // Colors
    var IDLE_NODE = 'rgba(255, 255, 255, 0.15)';
    var IDLE_EDGE = 'rgba(255, 255, 255, 0.05)';
    var ACTIVE_NODE = '#EF6D3D';
    var ACTIVE_EDGE = 'rgba(239, 109, 61, 0.3)';
    var ACTIVE_GLOW = 'rgba(239, 109, 61, 0.4)';

    function initCanvas() {
      var rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return rect;
    }

    function generateNodes() {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;
      var pad = 20;
      var usableW = w - pad * 2;
      var usableH = h - pad * 2;
      var exclPad = 5; // tight padding around excluded elements

      // Build exclusion zones from hero content elements
      var exclZones = [];
      var navEl = document.getElementById('navbar');
      if (navEl) {
        var nr = navEl.getBoundingClientRect();
        exclZones.push({
          x1: 0,
          y1: 0,
          x2: w,
          y2: nr.bottom - rect.top + exclPad
        });
      }
      var logoEl = document.querySelector('.hero-logo');
      if (logoEl) {
        var lr = logoEl.getBoundingClientRect();
        exclZones.push({
          x1: lr.left - rect.left - exclPad,
          y1: lr.top - rect.top - exclPad,
          x2: lr.right - rect.left + exclPad,
          y2: lr.bottom - rect.top + exclPad
        });
      }
      var textEls = document.querySelectorAll('#hero h1, .hero-subtitle, .hero-actions');
      for (var t = 0; t < textEls.length; t++) {
        var tr = textEls[t].getBoundingClientRect();
        exclZones.push({
          x1: tr.left - rect.left - exclPad,
          y1: tr.top - rect.top - exclPad,
          x2: tr.right - rect.left + exclPad,
          y2: tr.bottom - rect.top + exclPad
        });
      }

      function inExclusion(x, y) {
        for (var z = 0; z < exclZones.length; z++) {
          var zone = exclZones[z];
          if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) return true;
        }
        return false;
      }

      // Grid-based placement with jitter for uniform distribution
      var area = usableW * usableH;
      var cellSize = Math.sqrt(area / NODE_COUNT);
      var cols = Math.round(usableW / cellSize);
      var rows = Math.round(usableH / cellSize);
      var spacingX = usableW / cols;
      var spacingY = usableH / rows;
      var jitterX = spacingX * 0.4;
      var jitterY = spacingY * 0.4;

      nodes = [];
      for (var row = 0; row < rows; row++) {
        for (var col = 0; col < cols; col++) {
          if (nodes.length >= NODE_COUNT) break;
          var x = pad + spacingX * (col + 0.5) + (Math.random() - 0.5) * 2 * jitterX;
          var y = pad + spacingY * (row + 0.5) + (Math.random() - 0.5) * 2 * jitterY;
          // Clamp within bounds
          x = Math.max(pad, Math.min(w - pad, x));
          y = Math.max(pad, Math.min(h - pad, y));
          // Skip if inside any exclusion zone
          if (inExclusion(x, y)) continue;
          nodes.push({
            x: x,
            y: y,
            r: 2 + Math.random() * 1.5
          });
        }
      }
      computeEdges();
    }

    function computeEdges() {
      edges = [];
      // Count connections per node
      var connCount = new Array(nodes.length);
      for (var i = 0; i < nodes.length; i++) connCount[i] = 0;

      // Build candidate edges sorted by distance (shortest first)
      var candidates = [];
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            candidates.push({ a: i, b: j, dist: dist });
          }
        }
      }
      candidates.sort(function (a, b) { return a.dist - b.dist; });

      // Add edges, respecting max 4 connections per node
      for (var c = 0; c < candidates.length; c++) {
        var e = candidates[c];
        if (connCount[e.a] < 4 && connCount[e.b] < 4) {
          edges.push(e);
          connCount[e.a]++;
          connCount[e.b]++;
        }
      }
    }

    function draw() {
      var rect = canvas.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;

      ctx.clearRect(0, 0, w, h);

      // Determine active nodes (near mouse)
      var activeSet = {};
      for (var i = 0; i < nodes.length; i++) {
        var dx = nodes[i].x - mouseX;
        var dy = nodes[i].y - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < HOVER_RADIUS) {
          activeSet[i] = 1 - (dist / HOVER_RADIUS); // intensity 0-1
        }
      }

      // Draw edges
      for (var e = 0; e < edges.length; e++) {
        var edge = edges[e];
        var aActive = activeSet[edge.a];
        var bActive = activeSet[edge.b];
        var edgeActive = aActive !== undefined || bActive !== undefined;

        ctx.beginPath();
        ctx.moveTo(nodes[edge.a].x, nodes[edge.a].y);
        ctx.lineTo(nodes[edge.b].x, nodes[edge.b].y);

        if (edgeActive) {
          var intensity = Math.max(aActive || 0, bActive || 0);
          ctx.strokeStyle = 'rgba(239, 109, 61, ' + (0.08 + intensity * 0.25) + ')';
          ctx.lineWidth = 0.5 + intensity * 1;
        } else {
          ctx.strokeStyle = IDLE_EDGE;
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
      }

      // Draw nodes
      ctx.shadowColor = 'transparent';
      for (var n = 0; n < nodes.length; n++) {
        var node = nodes[n];
        var active = activeSet[n];

        ctx.beginPath();
        if (active !== undefined) {
          ctx.shadowColor = ACTIVE_GLOW;
          ctx.shadowBlur = 12 * active;
          ctx.fillStyle = ACTIVE_NODE;
          ctx.arc(node.x, node.y, node.r + 2 * active, 0, Math.PI * 2);
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.fillStyle = IDLE_NODE;
          ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    function requestDraw() {
      if (!needsDraw) {
        needsDraw = true;
        requestAnimationFrame(function () {
          needsDraw = false;
          draw();
        });
      }
    }

    // Mouse events
    canvas.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      requestDraw();
    });

    canvas.addEventListener('mouseleave', function () {
      mouseX = -9999;
      mouseY = -9999;
      requestDraw();
    });

    // Touch support
    canvas.addEventListener('touchmove', function (e) {
      var rect = canvas.getBoundingClientRect();
      var touch = e.touches[0];
      mouseX = touch.clientX - rect.left;
      mouseY = touch.clientY - rect.top;
      requestDraw();
    }, { passive: true });

    canvas.addEventListener('touchend', function () {
      mouseX = -9999;
      mouseY = -9999;
      requestDraw();
    });

    // Init and resize
    function setup() {
      initCanvas();
      generateNodes();
      needsDraw = false;
      draw();
    }

    setup();

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        var rect = canvas.getBoundingClientRect();
        var oldW = canvas.width / dpr;
        var oldH = canvas.height / dpr;
        initCanvas();
        // Scale node positions proportionally
        var scaleX = rect.width / oldW;
        var scaleY = rect.height / oldH;
        for (var i = 0; i < nodes.length; i++) {
          nodes[i].x *= scaleX;
          nodes[i].y *= scaleY;
        }
        computeEdges();
        needsDraw = false;
        draw();
      }, 150);
    }, { passive: true });
  }
})();
