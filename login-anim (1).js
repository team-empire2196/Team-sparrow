/* ===== login-anim.js  –  Paint-splash login intro (add-on; pure JS, no libraries) =====
   1) Add  <link rel="stylesheet" href="login-anim.css">  and  <script src="login-anim.js" defer></script>
   2) (optional) define window.LOGIN_ANIM_CONFIG BEFORE this script (see CONFIG below)
   3) Give your "Login" button/link the attribute  data-login-anim   -> animation + form opens on click
      or call  LoginAnim.open()  from your existing login step, or set autoOpen:true.
*/
(function (w, d) {
  'use strict';
  /* ------------------------------ CONFIG ------------------------------ */
  var DEFAULTS = {
    users: [{ username: 'Team Sparrow', password: 'Butterfly' }],   // add as many as you like (front-end check only)
    redirectUrl: 'dashboard.html',    // where to go after a correct login
    caseSensitiveUsername: false,
    sessionKey: '',                   // e.g. 'empire_auth' -> sessionStorage.setItem('empire_auth','1') on success
    onSuccess: null,                  // function(user){ ... }  return false to stop the automatic redirect
    triggerSelector: '[data-login-anim]',
    autoOpen: false,                  // true = play as soon as the page loads
    closable: true,                   // show the × button / Esc to close
    showSkip: true,
    playOnce: false,                  // true = play the boy animation only once per browser session
    text: { title: 'Welcome back', subtitle: 'Sign in to continue', username: 'Username', password: 'Password',
            button: 'Log in', error: 'Incorrect username or password. Please try again.', skip: 'Skip animation' }
  };
  var cfg = null, root, S = {};

  function merge() {
    var u = w.LOGIN_ANIM_CONFIG || {}, c = {}, k;
    for (k in DEFAULTS) c[k] = DEFAULTS[k];
    for (k in u) c[k] = u[k];
    c.text = {}; for (k in DEFAULTS.text) c.text[k] = DEFAULTS.text[k];
    if (u.text) for (k in u.text) c.text[k] = u.text[k];
    return c;
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var R = Math.random;

  /* ------------------------------ MARKUP ------------------------------ */
  var BOY = '<svg class="la-boy-svg" viewBox="0 0 220 320" aria-hidden="true">'
    + '<ellipse cx="112" cy="312" rx="54" ry="7" fill="rgba(0,0,0,.28)"/>'
    + '<g class="la-legB" style="transform-origin:104px 196px"><rect x="94" y="192" width="22" height="84" rx="11" fill="#1b2d63"/><path d="M86 270h34a8 8 0 0 1 8 8v6H82v-8a6 6 0 0 1 4-6z" fill="#e9edfb"/><rect x="82" y="282" width="46" height="5" rx="2.5" fill="#f2b705"/></g>'
    + '<g class="la-legA" style="transform-origin:118px 196px"><rect x="108" y="192" width="22" height="84" rx="11" fill="#223c82"/><path d="M100 270h34a8 8 0 0 1 8 8v6H96v-8a6 6 0 0 1 4-6z" fill="#fff"/><rect x="96" y="282" width="46" height="5" rx="2.5" fill="#f2b705"/></g>'
    + '<g class="la-body" style="transform-origin:110px 200px">'
    + '<g class="la-armB" style="transform-origin:90px 134px"><rect x="82" y="128" width="16" height="34" rx="8" fill="#14306e"/><rect x="84" y="152" width="12" height="40" rx="6" fill="#f0bd95"/><circle cx="90" cy="195" r="7.5" fill="#f0bd95"/></g>'
    + '<rect x="78" y="116" width="68" height="94" rx="24" fill="#14306e"/><rect x="78" y="150" width="68" height="9" fill="#f2b705"/>'
    + '<rect x="102" y="104" width="18" height="16" rx="6" fill="#f0bd95"/>'
    + '<circle cx="84" cy="88" r="6.5" fill="#f0bd95"/><circle cx="112" cy="82" r="34" fill="#f4c7a1"/>'
    + '<path d="M76 80C74 52 94 42 114 44c20 2 34 14 32 38-6-12-16-18-30-18-16 0-30 6-40 16z" fill="#2b1c14"/><path d="M96 46c4-9 16-11 22-5" stroke="#2b1c14" stroke-width="6" stroke-linecap="round" fill="none"/>'
    + '<ellipse cx="128" cy="84" rx="5.5" ry="6.5" fill="#fff"/><circle cx="130" cy="85" r="3.3" fill="#1d1d28"/><circle cx="131" cy="83.6" r="1.1" fill="#fff"/>'
    + '<path d="M120 74q8-4 16 0" stroke="#2b1c14" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M139 90q5 4 0 8" stroke="#d99a78" stroke-width="2.6" stroke-linecap="round" fill="none"/>'
    + '<path d="M122 101q9 8 19-1" stroke="#8a3b2e" stroke-width="3" stroke-linecap="round" fill="none"/><circle cx="121" cy="96" r="6" fill="#ff9c8a" opacity=".45"/>'
    + '<g class="la-arm" style="transform-origin:134px 132px"><rect x="126" y="126" width="16" height="34" rx="8" fill="#14306e"/><rect x="128" y="150" width="12" height="42" rx="6" fill="#f0bd95"/>'
    + '<g class="la-bucket" style="transform-origin:134px 198px">'
    + '<path d="M114 224Q134 178 154 224" fill="none" stroke="#b6bfd9" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M110 222H158L151 272Q134 280 117 272Z" fill="#7d8db8"/><path d="M110 222H158L156 234H112Z" fill="#a4b4dc"/>'
    + '<ellipse cx="134" cy="222" rx="24" ry="6" fill="#5a6a96"/><ellipse cx="134" cy="222.4" rx="20.5" ry="4.4" fill="#ffd24a"/>'
    + '<path d="M118 222q-2 12 2 18" stroke="#ffd24a" stroke-width="4" stroke-linecap="round" fill="none"/>'
    + '<circle cx="134" cy="198" r="8" fill="#f0bd95"/></g></g></g></svg>';

  var IC_USER = '<svg class="la-ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.2 4.2-6 8-6s7 1.8 8 6"/></svg>';
  var IC_LOCK = '<svg class="la-ic" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="3"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>';
  var IC_EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';

  function blobPath(cx, cy, r, n) {
    var pts = [], i, a, rr;
    for (i = 0; i < n; i++) {
      a = (i / n) * Math.PI * 2 + R() * 0.2;
      rr = r * (i % 2 ? (0.62 + R() * 0.2) : (0.95 + R() * 0.5));
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    var mid = function (p, q) { return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]; };
    var m0 = mid(pts[n - 1], pts[0]), s = 'M' + m0[0].toFixed(1) + ' ' + m0[1].toFixed(1);
    for (i = 0; i < n; i++) { var p = pts[i], m = mid(p, pts[(i + 1) % n]); s += 'Q' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ' ' + m[0].toFixed(1) + ' ' + m[1].toFixed(1); }
    return s + 'Z';
  }
  function splashSVG() {
    var cx = 300, cy = 300, i, s = '', a, dist, rad;
    s += '<svg class="la-splash" viewBox="0 0 600 600" aria-hidden="true"><defs>'
      + '<radialGradient id="laGold" gradientUnits="userSpaceOnUse" cx="250" cy="220" r="420"><stop offset="0" stop-color="#fff2b0"/><stop offset=".33" stop-color="#ffd54a"/><stop offset=".72" stop-color="#e8a800"/><stop offset="1" stop-color="#b57a00"/></radialGradient>'
      + '<filter id="laSh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".35"/></filter></defs>'
      + '<g class="la-sp-main" filter="url(#laSh)" fill="url(#laGold)"><path d="' + blobPath(cx, cy, 196, 14) + '"/>';
    for (i = 0; i < 18; i++) {
      a = R() * Math.PI * 2; dist = 205 + R() * 105; rad = 5 + Math.pow(R(), 1.6) * 24;
      s += '<circle class="la-dot" style="--d:' + (60 + i * 28) + 'ms" cx="' + (cx + Math.cos(a) * dist).toFixed(1) + '" cy="' + (cy + Math.sin(a) * dist).toFixed(1) + '" r="' + rad.toFixed(1) + '"/>';
    }
    for (i = 0; i < 6; i++) {
      var x = cx - 135 + i * 54 + (R() - 0.5) * 22, y = cy + 40 + R() * 40, h = 90 + R() * 110, wd = 7 + R() * 6;
      s += '<g class="la-drip" style="--d:' + (350 + i * 130) + 'ms"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + wd.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + (wd / 2).toFixed(1) + '"/><circle cx="' + (x + wd / 2).toFixed(1) + '" cy="' + (y + h).toFixed(1) + '" r="' + (wd * 0.85).toFixed(1) + '"/></g>';
    }
    s += '</g><g fill="#fff" opacity=".3"><ellipse cx="250" cy="236" rx="62" ry="20" transform="rotate(-24 250 236)"/><ellipse cx="352" cy="330" rx="26" ry="9" transform="rotate(-24 352 330)"/></g></svg>';
    return s;
  }

  function build() {
    var t = cfg.text;
    root = d.createElement('div');
    root.className = 'la-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', t.title);
    root.innerHTML = '<div class="la-dim"></div><div class="la-stage"><canvas class="la-fx"></canvas>' + splashSVG() + '<div class="la-boy">' + BOY + '</div></div>'
      + '<form class="la-card" autocomplete="on" novalidate>'
      + (cfg.closable ? '<button type="button" class="la-close" aria-label="Close">&times;</button>' : '')
      + '<h2>' + esc(t.title) + '</h2><p class="la-sub">' + esc(t.subtitle) + '</p>'
      + '<div class="la-field"><label for="la-u">' + esc(t.username) + '</label>' + IC_USER + '<input id="la-u" name="username" type="text" placeholder="' + esc(t.username) + '" autocomplete="username" autocapitalize="off" spellcheck="false"></div>'
      + '<div class="la-field"><label for="la-p">' + esc(t.password) + '</label>' + IC_LOCK + '<input id="la-p" name="password" type="password" placeholder="' + esc(t.password) + '" autocomplete="current-password"><button type="button" class="la-eye" aria-label="Show password">' + IC_EYE + '</button></div>'
      + '<div class="la-err" role="alert"></div><button class="la-btn" type="submit">' + esc(t.button) + '</button></form>'
      + (cfg.showSkip ? '<button type="button" class="la-skip">' + esc(t.skip) + '</button>' : '');
    d.body.appendChild(root);
    S.boy = root.querySelector('.la-boy'); S.splash = root.querySelector('.la-splash'); S.cv = root.querySelector('.la-fx');
    S.card = root.querySelector('.la-card'); S.err = root.querySelector('.la-err'); S.u = root.querySelector('#la-u'); S.p = root.querySelector('#la-p');
    S.btn = root.querySelector('.la-btn'); S.skip = root.querySelector('.la-skip');
    S.card.addEventListener('submit', submit);
    root.querySelector('.la-eye').addEventListener('click', function () { var h = S.p.type === 'password'; S.p.type = h ? 'text' : 'password'; this.setAttribute('aria-label', h ? 'Hide password' : 'Show password'); S.p.focus(); });
    var cl = root.querySelector('.la-close'); if (cl) cl.addEventListener('click', close);
    if (S.skip) S.skip.addEventListener('click', function () { S.skipped = true; wake(); });
  }

  /* ------------------------------ PAINT PARTICLES (canvas) ------------------------------ */
  var FX = { ctx: null, parts: [], stains: [], run: false, last: 0, W: 0, H: 0, dpr: 1 };
  var GOLDS = ['#fff0a0', '#ffd54a', '#f2b705', '#e8a800', '#ffe27a'];
  function fxSize() {
    FX.dpr = Math.min(w.devicePixelRatio || 1, 2); FX.W = S.cv.clientWidth; FX.H = S.cv.clientHeight;
    S.cv.width = FX.W * FX.dpr; S.cv.height = FX.H * FX.dpr; FX.ctx = S.cv.getContext('2d'); FX.ctx.setTransform(FX.dpr, 0, 0, FX.dpr, 0, 0);
  }
  function fxSpawn(ox, oy, tx, ty) {
    var G = 1100, i, T, ex, ey;
    for (i = 0; i < 170; i++) {
      T = 0.42 + R() * 0.5; ex = tx + (R() - 0.5) * FX.W * 0.7; ey = ty + (R() - 0.5) * FX.H * 0.62;
      FX.parts.push({ x: ox, y: oy, vx: (ex - ox) / T, vy: (ey - oy - 0.5 * G * T * T) / T, t: -R() * 0.12, T: T, s: 2 + Math.pow(R(), 2.2) * 8, c: GOLDS[(R() * GOLDS.length) | 0], G: G });
    }
    if (!FX.run) { FX.run = true; FX.last = performance.now(); requestAnimationFrame(fxLoop); }
  }
  function blobAt(ctx, x, y, r, c, a) {
    ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    for (var i = 0; i < 2; i++) { var an = (i * 2.9) + x, dd = r * (1.15 + i * 0.3); ctx.beginPath(); ctx.arc(x + Math.cos(an) * dd, y + Math.sin(an) * dd, r * 0.26, 0, 6.2832); ctx.fill(); }
  }
  function fxLoop(now) {
    if (!FX.run) return;
    var dt = Math.min(0.05, (now - FX.last) / 1000), ctx = FX.ctx, i, p, st; FX.last = now;
    ctx.clearRect(0, 0, FX.W, FX.H);
    for (i = FX.stains.length - 1; i >= 0; i--) {
      st = FX.stains[i]; if (st.drip < st.max) st.drip += st.sp * dt;
      blobAt(ctx, st.x, st.y, st.r, st.c, 0.92);
      if (st.max > 0) { ctx.globalAlpha = 0.92; ctx.strokeStyle = st.c; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, st.r * 0.34); ctx.beginPath(); ctx.moveTo(st.x, st.y); ctx.lineTo(st.x, st.y + st.drip); ctx.stroke(); ctx.beginPath(); ctx.arc(st.x, st.y + st.drip, ctx.lineWidth * 0.8, 0, 6.2832); ctx.fill(); }
    }
    for (i = FX.parts.length - 1; i >= 0; i--) {
      p = FX.parts[i]; p.t += dt; if (p.t < 0) continue;
      p.vy += p.G * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t >= p.T) { FX.stains.push({ x: p.x, y: p.y, r: p.s * (0.9 + R() * 1.4), c: p.c, drip: 0, max: p.s > 7 && R() < 0.55 ? 25 + R() * 90 : 0, sp: 35 + R() * 60 }); FX.parts.splice(i, 1); continue; }
      var sp = Math.hypot(p.vx, p.vy), ang = Math.atan2(p.vy, p.vx);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.globalAlpha = 0.95; ctx.fillStyle = p.c; ctx.beginPath(); ctx.ellipse(0, 0, p.s * (1 + Math.min(sp / 1800, 0.7)), p.s * 0.85, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (FX.parts.length || FX.stains.length) requestAnimationFrame(fxLoop); else FX.run = false;
  }
  function fxClear() { FX.run = false; FX.parts = []; FX.stains = []; if (FX.ctx) FX.ctx.clearRect(0, 0, FX.W, FX.H); }

  /* ------------------------------ TIMELINE ------------------------------ */
  var waiters = [];
  function wait(ms) { return new Promise(function (res) { var t = setTimeout(res, ms); waiters.push(function () { clearTimeout(t); res(); }); }); }
  function wake() { var a = waiters.splice(0); a.forEach(function (f) { f(); }); }

  function finish() {
    S.boy.style.display = 'none'; S.splash.classList.add('la-gone'); S.cv.classList.add('la-fade'); fxClear();
    root.classList.add('la-reveal', 'la-done'); S.playing = false;
    setTimeout(function () { try { S.u.focus({ preventScroll: true }); } catch (e) { S.u.focus(); } }, 60);
  }
  function reset() {
    S.skipped = false; S.boy.style.display = ''; S.boy.className = 'la-boy'; S.boy.style.transform = 'translateX(-60vw)';
    S.splash.setAttribute('class', 'la-splash'); S.cv.classList.remove('la-fade'); fxClear();
    root.classList.remove('la-reveal', 'la-done'); S.err.classList.remove('la-show'); S.btn.disabled = false; S.btn.textContent = cfg.text.button;
    if (S.skip) S.skip.classList.remove('la-hide');
  }
  async function play() {
    S.playing = true; reset(); fxSize();
    var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seen = false; try { seen = cfg.playOnce && sessionStorage.getItem('la_seen') === '1'; } catch (e) {}
    if (reduce || seen) { finish(); return; }
    try { sessionStorage.setItem('la_seen', '1'); } catch (e) {}
    var W = w.innerWidth, H = w.innerHeight, bw = S.boy.offsetWidth;
    var stop = W < 700 ? Math.max(10, W / 2 - bw / 2 - W * 0.12) : Math.max(24, W / 2 - Math.min(W, H) * 0.3 - bw / 2);
    S.boy.classList.add('la-walking');
    var walk = S.boy.animate([{ transform: 'translateX(' + (-bw * 1.5) + 'px)' }, { transform: 'translateX(' + stop + 'px)' }], { duration: 2700, easing: 'cubic-bezier(.35,.55,.4,1)', fill: 'forwards' });
    await new Promise(function (res) { walk.onfinish = res; waiters.push(function () { walk.finish(); }); });
    if (S.skipped) return finish();
    S.boy.style.transform = 'translateX(' + stop + 'px)'; walk.cancel();
    S.boy.classList.remove('la-walking'); await wait(180); if (S.skipped) return finish();
    S.boy.classList.add('la-throw'); await wait(690); if (S.skipped) return finish();
    var br = root.querySelector('.la-bucket').getBoundingClientRect();
    fxSpawn(br.left + br.width * 0.55, br.top + br.height * 0.3, W / 2, H / 2);
    await wait(560); if (S.skipped) return finish();
    S.splash.classList.add('la-show', 'la-pop'); await wait(420); if (S.skipped) return finish();
    root.classList.add('la-reveal'); await wait(700); if (S.skipped) return finish();
    S.boy.classList.add('la-out'); if (S.skip) S.skip.classList.add('la-hide'); await wait(650); if (S.skipped) return finish();
    S.splash.classList.add('la-gone'); S.cv.classList.add('la-fade'); await wait(950); if (S.skipped) return finish();
    finish();
  }

  /* ------------------------------ LOGIN ------------------------------ */
  function submit(e) {
    e.preventDefault();
    var u = S.u.value.trim(), p = S.p.value, ok = null, i, a, b;
    for (i = 0; i < cfg.users.length; i++) {
      a = cfg.caseSensitiveUsername ? cfg.users[i].username : String(cfg.users[i].username).toLowerCase();
      b = cfg.caseSensitiveUsername ? u : u.toLowerCase();
      if (a === b && String(cfg.users[i].password) === p) { ok = cfg.users[i]; break; }
    }
    if (!ok) {
      S.err.textContent = cfg.text.error; S.err.classList.add('la-show');
      S.card.classList.remove('la-shake'); void S.card.offsetWidth; S.card.classList.add('la-shake');
      S.p.value = ''; S.p.focus(); return;
    }
    S.err.classList.remove('la-show'); S.btn.disabled = true; S.btn.textContent = '✓';
    try { if (cfg.sessionKey) sessionStorage.setItem(cfg.sessionKey, '1'); } catch (x) {}
    var go = true;
    if (typeof cfg.onSuccess === 'function') { try { go = cfg.onSuccess(ok) !== false; } catch (x) {} }
    if (go && cfg.redirectUrl) setTimeout(function () { w.location.href = cfg.redirectUrl; }, 600);
  }

  function open() {
    if (!root) build();
    d.documentElement.classList.add('la-lock');
    root.classList.add('la-on');
    if (!S.playing && !root.classList.contains('la-done')) play();
    else if (root.classList.contains('la-done')) setTimeout(function () { S.u.focus(); }, 60);
  }
  function close() {
    if (!root) return; wake(); root.classList.remove('la-on'); d.documentElement.classList.remove('la-lock'); S.playing = false;
    S.skipped = false; setTimeout(function () { if (!root.classList.contains('la-on')) { reset(); } }, 500);
  }
  function onKey(e) { if (e.key === 'Escape' && root && root.classList.contains('la-on') && cfg.closable) close(); }
  function onClick(e) {
    if (!cfg.triggerSelector) return;
    var t = e.target.closest && e.target.closest(cfg.triggerSelector);
    if (t) { e.preventDefault(); open(); }
  }
  function init() {
    cfg = merge();
    d.addEventListener('click', onClick, true); d.addEventListener('keydown', onKey);
    w.addEventListener('resize', function () { if (root && S.playing) fxSize(); });
    if (cfg.autoOpen) open();
  }
  w.LoginAnim = { init: init, open: open, close: close };
  if (!w.LOGIN_ANIM_MANUAL) { if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init(); }
})(window, document);
