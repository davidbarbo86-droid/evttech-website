/* ============================================================
   EVT Tech Ltd — Falkenklev-Inspired main.js
   ============================================================ */

(function () {
  'use strict';

  // ---- Navbar scroll behaviour ----
  var nav = document.getElementById('nav');

  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- Mobile navigation ----
  var navToggle = document.getElementById('navToggle');
  var navLinks  = document.getElementById('navLinks');

  function closeNav() {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    var spans = navToggle.querySelectorAll('span');
    spans[0].style.transform = '';
    spans[1].style.opacity   = '';
    spans[2].style.transform = '';
  }

  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    var spans = navToggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity   = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      closeNav();
    }
  });

  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeNav);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  // ---- Smooth scroll for anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href   = anchor.getAttribute('href');
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });

  // ---- Volta Zero sketch scroll effect (CSS clip-path — no canvas pixel reads) ----
  (function () {
    var section  = document.getElementById('sketch');
    var wrap     = document.getElementById('sketchWrap');
    if (!section || !wrap) return;

    var sRaf     = null;
    var lastP    = -1;
    var hint     = document.getElementById('sketchHint');
    var fill     = document.getElementById('sketchProgressFill');
    var waveLine = document.getElementById('sketchWaveLine');

    function drawFrame(p) {
      var pct = (p * 100).toFixed(2) + '%';
      wrap.style.setProperty('--sketch-wave', pct);
      if (fill) fill.style.width = pct;
      if (waveLine) waveLine.classList.toggle('active', p > 0.01 && p < 0.99);
    }

    window.addEventListener('scroll', function () {
      var rect     = section.getBoundingClientRect();
      var progress = Math.max(0, Math.min(1, -rect.top / (section.offsetHeight - window.innerHeight)));
      if (hint) hint.classList.toggle('hidden', progress > 0.04);
      if (Math.abs(progress - lastP) < 0.002) return;
      lastP = progress;
      if (sRaf) cancelAnimationFrame(sRaf);
      sRaf = requestAnimationFrame(function () { sRaf = null; drawFrame(progress); });
    }, { passive: true });
  }());

  // ---- Spec section: photo fades to sketch as user scrolls through the spec list ----
  (function () {
    var section = document.getElementById('specs');
    var photo   = document.getElementById('specPhotoTop');
    if (!section || !photo) return;

    var sRaf  = null;
    var lastP = -1;

    window.addEventListener('scroll', function () {
      var rect     = section.getBoundingClientRect();
      var travel   = section.offsetHeight - window.innerHeight;
      var progress = travel > 0 ? Math.max(0, Math.min(1, -rect.top / travel)) : 0;
      if (Math.abs(progress - lastP) < 0.003) return;
      lastP = progress;
      if (sRaf) cancelAnimationFrame(sRaf);
      sRaf = requestAnimationFrame(function () {
        sRaf = null;
        photo.style.opacity = (1 - progress).toFixed(3);
      });
    }, { passive: true });
  }());

  // ---- (legacy canvas code removed — replaced by CSS clip-path above) ----
  (function () {
    var section  = null; /* disabled */
    var canvas   = null;
    if (!section || !canvas) return;

    var ctx = canvas.getContext('2d');
    var sW = 0, sH = 0;
    var origPx   = null;
    var sketchPx = null;
    var sRaf     = null;
    var lastP    = -1;
    var hint     = null;
    var fill     = null;
    var waveLine = null;

    /* Luminance — works with Float32Array or Uint8ClampedArray */
    function lum(d, i) {
      return d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
    }

    /* One separable box-blur pass (horizontal when horiz=true, vertical otherwise) */
    function boxPass(src, w, h, r, horiz) {
      var out  = new Float32Array(src.length);
      var diam = 2 * r + 1;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var rr = 0, gg = 0, bb = 0;
          for (var d = -r; d <= r; d++) {
            var nx = horiz ? Math.max(0, Math.min(w - 1, x + d)) : x;
            var ny = horiz ? y : Math.max(0, Math.min(h - 1, y + d));
            var ni = (ny * w + nx) * 4;
            rr += src[ni]; gg += src[ni + 1]; bb += src[ni + 2];
          }
          var ti = (y * w + x) * 4;
          out[ti] = rr / diam; out[ti + 1] = gg / diam; out[ti + 2] = bb / diam; out[ti + 3] = 255;
        }
      }
      return out;
    }

    /* 3 passes of separable box blur ≈ Gaussian (σ ≈ r * 1.73) */
    function gaussBlur(src, w, h, r) {
      var d = new Float32Array(src);
      for (var p = 0; p < 3; p++) {
        d = boxPass(d, w, h, r, true);   /* horizontal */
        d = boxPass(d, w, h, r, false);  /* vertical   */
      }
      return d;
    }

    /*
     * Blur → Sobel → threshold → navy lines on white.
     *
     * The pre-blur suppresses:  cabin interior through glass, shading gradients,
     *   fine texture (<10 px features at working scale).
     * The threshold keeps only: outer silhouette, cab/body junction, door panel
     *   lines, headlights, wheel arches, VOLTA logo edge.
     * Line colour: EVT navy #0E2841 on white — technical blueprint look.
     */
    function sobel(id) {
      var w = id.width, h = id.height;
      var src = gaussBlur(id.data, w, h, 4);  /* radius 4 — removes interior detail */
      var out = new Uint8ClampedArray(id.data.length);
      var THRESH = 55;                          /* suppress shading; keep hard edges  */
      var NR = 14, NG = 40, NB = 65;           /* navy line colour: #0E2841           */

      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          var i = (y * w + x) * 4;
          if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
            out[i] = out[i+1] = out[i+2] = 255; out[i+3] = 255; continue;
          }
          var Gx = (
            -lum(src, ((y-1)*w+(x-1))*4) + lum(src, ((y-1)*w+(x+1))*4) +
            -2*lum(src, (y*w+(x-1))*4)   + 2*lum(src, (y*w+(x+1))*4)   +
            -lum(src, ((y+1)*w+(x-1))*4) + lum(src, ((y+1)*w+(x+1))*4)
          );
          var Gy = (
            -lum(src, ((y-1)*w+(x-1))*4) - 2*lum(src, ((y-1)*w+x)*4) - lum(src, ((y-1)*w+(x+1))*4) +
             lum(src, ((y+1)*w+(x-1))*4) + 2*lum(src, ((y+1)*w+x)*4) + lum(src, ((y+1)*w+(x+1))*4)
          );
          var mag = Math.min(255, Math.sqrt(Gx * Gx + Gy * Gy) * 2.2);
          if (mag < THRESH) {
            out[i] = out[i+1] = out[i+2] = 255; out[i+3] = 255;
          } else {
            var t    = Math.min(1, (mag - THRESH) / (200 - THRESH));
            out[i]   = Math.round(255 + (NR - 255) * t);
            out[i+1] = Math.round(255 + (NG - 255) * t);
            out[i+2] = Math.round(255 + (NB - 255) * t);
            out[i+3] = 255;
          }
        }
      }
      return out;
    }

    /* Blend frame: left = sketch, right = photo, with soft wave boundary */
    function drawFrame(progress) {
      if (!origPx || !sketchPx) return;
      var blended  = ctx.createImageData(sW, sH);
      var out      = blended.data;
      var p        = Math.max(0, Math.min(1, progress));
      var zone     = sW * 0.10;          /* soft-edge width = 10% of canvas */
      var wavePos  = p * (sW + zone) - zone;

      for (var y = 0; y < sH; y++) {
        for (var x = 0; x < sW; x++) {
          var i  = (y * sW + x) * 4;
          var lp = Math.max(0, Math.min(1, (x - wavePos) / zone)); /* 1=photo, 0=sketch */
          out[i]   = Math.round(origPx[i]   * lp + sketchPx[i]   * (1 - lp));
          out[i+1] = Math.round(origPx[i+1] * lp + sketchPx[i+1] * (1 - lp));
          out[i+2] = Math.round(origPx[i+2] * lp + sketchPx[i+2] * (1 - lp));
          out[i+3] = 255;
        }
      }
      ctx.putImageData(blended, 0, 0);

      /* Update wave line position */
      if (waveLine) {
        var canvasRect = canvas.getBoundingClientRect();
        var displayScale = canvasRect.width / sW;
        var lineX = wavePos * displayScale;
        waveLine.style.transform = 'translateX(' + lineX.toFixed(1) + 'px)';
        waveLine.classList.toggle('active', p > 0.01 && p < 0.99);
      }
      /* Progress bar */
      if (fill) fill.style.width = (p * 100).toFixed(1) + '%';
    }

    var img = new Image();
    img.onload = function () {
      var maxW  = Math.min(820, img.naturalWidth);
      var scale = maxW / img.naturalWidth;
      sW = Math.round(img.naturalWidth  * scale);
      sH = Math.round(img.naturalHeight * scale);
      canvas.width  = sW;
      canvas.height = sH;
      ctx.drawImage(img, 0, 0, sW, sH);
      try {
        var id  = ctx.getImageData(0, 0, sW, sH);
        origPx  = new Uint8ClampedArray(id.data);
        sketchPx = sobel(id);
      } catch (e) {
        /* Canvas tainted (unlikely on file://) — show photo only */
        origPx = sketchPx = new Uint8ClampedArray(ctx.getImageData(0,0,sW,sH).data);
      }
      drawFrame(0);
    };
    img.src = '../img/slide08_img03.png';

    window.addEventListener('scroll', function () {
      var rect     = section.getBoundingClientRect();
      var scrolled = -rect.top;
      var progress = Math.max(0, Math.min(1, scrolled / (section.offsetHeight - window.innerHeight)));

      if (hint) hint.classList.toggle('hidden', progress > 0.04);

      if (Math.abs(progress - lastP) < 0.002) return;
      lastP = progress;

      if (sRaf) cancelAnimationFrame(sRaf);
      sRaf = requestAnimationFrame(function () { sRaf = null; drawFrame(progress); });
    }, { passive: true });
  }());

  // ---- Fade-up scroll animations ----
  var fadeEls = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    fadeEls.forEach(function (el) { observer.observe(el); });
  } else {
    fadeEls.forEach(function (el) { el.classList.add('visible'); });
  }

})();
