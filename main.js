(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var SHEETS = {
    buy: { t: 'How to buy PRO', h: '<ol><li>Open the STREC app on your Android phone.</li><li>Sign in with your Google account.</li><li>Tap <b>PRO</b> and choose 1 Month or 3 Months.</li><li>Pay securely with Razorpay (UPI, cards, netbanking and wallets, as available).</li><li>PRO activates on that same Google account within moments.</li></ol><p>Plans are one-time payments with no auto-renewal. Buying again extends your PRO expiry.</p>' },
    apk: { t: 'Install the app', h: '<ol><li>Tap <b>Download APK</b>. A Google Drive page opens.</li><li>Tap the download icon. If Google says it cannot scan the file, choose <b>Download anyway</b>.</li><li>Open the downloaded file and allow installs from your browser or file manager if Android asks.</li><li>Open STREC and sign in with Google.</li></ol><p>STREC is for Android only.</p>' }
  };

  /* mobile menu */
  var burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var o = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', o); mnav.classList.toggle('open', o);
    });
    mnav.addEventListener('click', function (e) { if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); mnav.classList.remove('open'); } });
  }

  /* simple sheet */
  var ov = null, open = false, trigger = null, blocks = [];
  function openSheet(key, el) {
    var d = SHEETS[key]; if (!d || open) return;
    open = true; trigger = el;
    ov = document.createElement('div'); ov.className = 'ov';
    ov.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="sheet-h"><h3 id="sh-t"></h3><button class="x" type="button" aria-label="Close">Close</button></div><div class="sheet-b"></div></div>';
    $('#sh-t', ov).textContent = d.t; $('.sheet-b', ov).innerHTML = d.h;
    document.body.appendChild(ov); document.body.classList.add('lock');
    blocks = $$('header,main,footer'); blocks.forEach(function (n) { n.inert = true; });
    requestAnimationFrame(function () { ov.classList.add('show'); $('.x', ov).focus(); });
    try { history.pushState({ sheet: 1 }, ''); } catch (_) {}
    ov.addEventListener('click', function (e) { if (e.target === ov) closeSheet(); });
    $('.x', ov).addEventListener('click', closeSheet);
  }
  function doClose() {
    if (!open) return; open = false;
    var o = ov, t = trigger;
    blocks.forEach(function (n) { n.inert = false; });
    document.body.classList.remove('lock'); o.classList.remove('show');
    setTimeout(function () { o.remove(); if (t && document.contains(t)) t.focus({ preventScroll: true }); }, 250);
  }
  function closeSheet() { if (!open) return; if (history.state && history.state.sheet) history.back(); else doClose(); }
  window.addEventListener('popstate', function () { if (open) doClose(); });
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    if (e.key === 'Escape') closeSheet();
    if (e.key === 'Tab') {
      var f = $$('button,a[href]', ov); if (!f.length) return;
      var a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sheet]');
    if (t) { e.preventDefault(); openSheet(t.getAttribute('data-sheet'), t); }
  });
})();
