(function () {
  'use strict';
  var HERO_VIDEO = 'hero.mp4';
  var HERO_POSTER = 'hero-first.jpg';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (x, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, x)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;

  /* ---------- ripple + haptics ---------- */
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn,.frow,.crow,.x');
    if (!b) return;
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (_) {}
    if (reduce || !b.classList.contains('btn')) return;
    var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    var s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
    b.appendChild(s);
    setTimeout(function () { s.remove(); }, 750);
  }, { passive: true });
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.btn');
    if (!b || reduce) return;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  });

  /* ---------- pointer specular + tilt ---------- */
  var pend = null;
  document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glass');
    if (!g) return;
    pend = { g: g, x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' };
    if (pend.raf) return;
    requestAnimationFrame(function () {
      if (!pend) return;
      var r = pend.g.getBoundingClientRect();
      var px = (pend.x - r.left) / r.width, py = (pend.y - r.top) / r.height;
      pend.g.style.setProperty('--mx', (px * 100) + '%');
      pend.g.style.setProperty('--my', (py * 100) + '%');
      if (pend.mouse && !reduce && pend.g.classList.contains('plate')) {
        pend.g.style.transform = 'perspective(900px) rotateY(' + ((px - .5) * 10) + 'deg) rotateX(' + ((.5 - py) * 10) + 'deg)';
      }
      pend = null;
    });
    pend.raf = true;
  }, { passive: true });
  $$('.plate').forEach(function (p) {
    p.addEventListener('pointerleave', function () { p.style.transform = ''; });
  });

  /* nav underline origin from pointer */
  $$('.nav-links a').forEach(function (a) {
    a.addEventListener('pointerenter', function (e) {
      var r = a.getBoundingClientRect(), x = clamp((e.clientX - r.left) / r.width) * 100;
      a.style.setProperty('--ox', x + '%'); a.style.setProperty('--ox2', (100 - x) + '%');
    });
  });

  /* ---------- mobile menu ---------- */
  var burger = $('.burger'), menu = $('.menu');
  if (burger && menu) {
    var setMenu = function (o) {
      burger.setAttribute('aria-expanded', o); menu.classList.toggle('open', o);
      menu.setAttribute('aria-hidden', !o); document.body.classList.toggle('lock', o);
      if (menu.inert !== undefined) menu.inert = !o;
    };
    setMenu(false);
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- detail sheet ---------- */
  var SHEETS = window.SHEETS || {};
  var ov = null, trigger = null, sheetOpen = false, panel = null, bodyEls = [];
  var EASE = 'cubic-bezier(.2,.8,.2,1)';

  function flipFrom(rect, p) {
    var t = p.getBoundingClientRect();
    return 'translate(' + (rect.left + rect.width / 2 - t.left - t.width / 2) + 'px,' + (rect.top + rect.height / 2 - t.top - t.height / 2) + 'px) scale(' + clamp(rect.width / t.width, .2, 1) + ',' + clamp(rect.height / t.height, .1, 1) + ')';
  }
  function openSheet(key, el) {
    var d = SHEETS[key];
    if (!d || sheetOpen) return;
    sheetOpen = true; trigger = el;
    ov = document.createElement('div');
    ov.className = 'ov';
    ov.innerHTML = '<div class="sheet glass" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="sheet-h"><h3 id="sh-t"></h3><button class="x" aria-label="Close">Close</button></div><div class="sheet-b"></div></div>';
    $('#sh-t', ov).textContent = d.t;
    $('.sheet-b', ov).innerHTML = d.h;
    document.body.appendChild(ov);
    document.body.classList.add('lock');
    panel = $('.sheet', ov);
    bodyEls = $$('header,main,footer,.menu');
    bodyEls.forEach(function (n) { n.inert = true; });
    requestAnimationFrame(function () {
      ov.classList.add('show');
      if (!reduce && el && panel.animate) {
        panel.animate([{ transform: flipFrom(el.getBoundingClientRect(), panel), opacity: .3 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: EASE });
      }
      $('.x', ov).focus();
    });
    try { history.pushState({ sheet: 1 }, ''); } catch (_) {}
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
    $('.x', ov).addEventListener('click', closeSheet);
    /* swipe down */
    var sy = null, dy = 0;
    panel.addEventListener('touchstart', function (e) {
      var sb = $('.sheet-b', panel);
      if (sb.scrollTop <= 0 || e.target.closest('.sheet-h')) sy = e.touches[0].clientY; else sy = null;
      dy = 0;
    }, { passive: true });
    panel.addEventListener('touchmove', function (e) {
      if (sy === null) return;
      dy = e.touches[0].clientY - sy;
      if (dy > 0) panel.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: true });
    panel.addEventListener('touchend', function () {
      if (sy === null) return;
      if (dy > 90) closeSheet(); else panel.style.transform = '';
      sy = null;
    });
  }
  function doClose() {
    if (!sheetOpen) return;
    sheetOpen = false;
    var o = ov, p = panel, t = trigger;
    bodyEls.forEach(function (n) { n.inert = false; });
    document.body.classList.remove('lock');
    o.classList.remove('show');
    var done = function () { o.remove(); if (t && document.contains(t)) t.focus({ preventScroll: true }); };
    if (!reduce && p.animate && t && document.contains(t)) {
      var a = p.animate([{ transform: p.style.transform || 'none', opacity: 1 }, { transform: flipFrom(t.getBoundingClientRect(), p), opacity: 0 }], { duration: 350, easing: EASE, fill: 'forwards' });
      a.onfinish = done;
    } else setTimeout(done, 200);
  }
  function closeSheet() {
    if (!sheetOpen) return;
    if (history.state && history.state.sheet) history.back(); else doClose();
  }
  window.addEventListener('popstate', function () { if (sheetOpen) doClose(); });
  document.addEventListener('keydown', function (e) {
    if (!sheetOpen) return;
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key === 'Tab') {
      var f = $$('button,a[href],[tabindex]:not([tabindex="-1"])', ov);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sheet]');
    if (t) { e.preventDefault(); openSheet(t.getAttribute('data-sheet'), t); }
  });

  /* ---------- hero: scroll-scrubbed video ---------- */
  var hero = $('#hero');
  if (hero) {
    var video = $('#heroVideo'), chaps = $$('.chap', hero), bar = $('.loadbar', hero), dot = $('.prog i', hero);
    var ranges = [[0, .18], [.2, .42], [.44, .66], [.68, .86], [.88, 1]];
    var ready = false, dur = 0, isStatic = false;
    hero.style.setProperty('--poster', 'url(' + HERO_POSTER + ')');

    var goStatic = function () {
      if (isStatic) return;
      isStatic = true; hero.classList.add('static'); chaps.forEach(function (c) { c.style.cssText = ''; c.removeAttribute('aria-hidden'); });
    };
    if (reduce) { goStatic(); }
    else {
      video.addEventListener('loadedmetadata', function () { dur = video.duration; ready = dur > 0; if (bar) bar.classList.add('done'); });
      video.addEventListener('error', goStatic);
      var failTimer = setTimeout(function () { if (!ready) goStatic(); }, 12000);
      video.addEventListener('loadedmetadata', function () {
        clearTimeout(failTimer);
        /* hosts without range requests cannot seek: load the file whole instead */
        setTimeout(function () {
          var ok = video.seekable && video.seekable.length && video.seekable.end(0) >= dur - .5;
          if (ok || !window.fetch || !window.URL) return;
          fetch(HERO_VIDEO).then(function (r) { return r.blob(); }).then(function (bl) {
            ready = false; video.src = URL.createObjectURL(bl);
            video.addEventListener('loadedmetadata', function () { dur = video.duration; ready = true; }, { once: true });
          }).catch(function () {});
        }, 1500);
      });
      video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
      video.src = HERO_VIDEO; video.load();
      var unlock = function () {
        document.removeEventListener('touchstart', unlock); document.removeEventListener('click', unlock); window.removeEventListener('scroll', unlock);
        var p = video.play(); if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
      };
      document.addEventListener('touchstart', unlock, { passive: true });
      document.addEventListener('click', unlock);
      window.addEventListener('scroll', unlock, { passive: true });
    }

    var sm = function (x) { x = clamp(x); return x * x * (3 - 2 * x); };
    var last = chaps.length - 1;
    var frame = function () {
      if (!isStatic) {
        var r = hero.getBoundingClientRect();
        var p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
        for (var i = 0; i <= last; i++) {
          var a = ranges[i][0], b = ranges[i][1];
          var fin = i === 0 ? 1 : sm((p - (a - .04)) / .04);
          var fout = i === last ? 1 : 1 - sm((p - b) / .04);
          var v = fin * fout, c = chaps[i];
          c.style.opacity = v.toFixed(3);
          c.style.transform = 'translateY(' + (((1 - fin) * 26) - ((1 - fout) * 26)).toFixed(1) + 'px)';
          c.style.filter = v < .99 ? 'blur(' + ((1 - v) * 6).toFixed(1) + 'px)' : 'none';
          c.style.pointerEvents = v > .6 ? 'auto' : 'none';
          c.setAttribute('aria-hidden', v > .5 ? 'false' : 'true');
        }
        if (dot) dot.style.top = (p * 100) + '%';
        if (ready) {
          var target = clamp(p * dur, 0, Math.max(0, dur - .04)), diff = target - video.currentTime;
          if (Math.abs(diff) > .01) { try { video.currentTime += diff * .12; } catch (_) {} }
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
})();
