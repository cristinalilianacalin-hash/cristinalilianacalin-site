/* young.js | young readers zone (home band + series page). Edited by hand; not generated.
   Everything here runs only in the reader's browser and only while the page is open.
   No network requests, no cookies, no storage, nothing sent anywhere. */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- starfield: paused off-screen and in hidden tabs; static for reduced motion ---------- */
  function starfield(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var stars = [], w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), running = false, visible = false, raf = 0;
    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(260, Math.round(w * h / 5200));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random() * .9 + .1,
                     t: Math.random() * 6.28, c: Math.random() < .12 ? (Math.random() < .5 ? '94,240,212' : '182,150,255') : '220,228,255' });
      }
      draw(0);
    }
    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x -= s.z * dt * .012; s.t += dt * .002 * s.z;
        if (s.x < -2) { s.x = w + 2; s.y = Math.random() * h; }
        var a = (.35 + .45 * Math.abs(Math.sin(s.t))) * s.z;
        ctx.fillStyle = 'rgba(' + s.c + ',' + a.toFixed(3) + ')';
        var r = s.z * 1.4;
        ctx.fillRect(s.x, s.y, r, r);
      }
    }
    var last = 0;
    function loop(t) {
      if (!running) return;
      var dt = last ? Math.min(t - last, 50) : 16; last = t;
      draw(dt);
      raf = requestAnimationFrame(loop);
    }
    function update() {
      var should = visible && !document.hidden && !reduce;
      if (should && !running) { running = true; last = 0; raf = requestAnimationFrame(loop); }
      if (!should && running) { running = false; cancelAnimationFrame(raf); }
    }
    size();
    var to;
    window.addEventListener('resize', function () { clearTimeout(to); to = setTimeout(size, 150); });
    document.addEventListener('visibilitychange', update);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; update(); }).observe(canvas);
    } else { visible = true; update(); }
  }
  Array.prototype.forEach.call(document.querySelectorAll('.z-stars'), starfield);

  /* ---------- scramble-in: visual only (the real text is in a visually hidden span or the element itself) ---------- */
  var GLYPHS = '01<>/\\[]{}=+*#%?_';
  function scramble(el, ms) {
    if (reduce || el._busy) return;
    var target = el.getAttribute('data-text') || el.textContent;
    el.setAttribute('data-text', target);
    // keep links inside the element intact: scramble the deepest text holder
    var holder = el.querySelector('a') || el;
    var start = null; el._busy = true;
    function frame(t) {
      if (!start) start = t;
      var p = Math.min(1, (t - start) / ms), out = '';
      var fixed = Math.floor(p * target.length);
      for (var i = 0; i < target.length; i++) {
        var ch = target[i];
        out += (i < fixed || ch === ' ') ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      holder.textContent = out;
      if (p < 1) requestAnimationFrame(frame); else { holder.textContent = target; el._busy = false; }
    }
    requestAnimationFrame(frame);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-scramble]'), function (el) {
    el.setAttribute('data-text', el.textContent);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { scramble(el, 900); io.disconnect(); } });
      io.observe(el);
    } else scramble(el, 900);
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-scramble-hover]'), function (el) {
    var holder = el.querySelector('a') || el;
    // for screen readers the text never changes: label the holder with the real title
    if (!holder.hasAttribute('aria-label')) holder.setAttribute('aria-label', holder.textContent);
    el.setAttribute('data-text', holder.textContent);
    var card = el.closest('.holo') || el;
    card.addEventListener('mouseenter', function () { scramble(el, 450); });
  });

  /* ---------- tilt + sheen on holographic cards (mouse only) ---------- */
  if (finePointer && !reduce) {
    Array.prototype.forEach.call(document.querySelectorAll('.holo'), function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - .5) * 10).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((.5 - y) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- "Ask the AI which book is your vibe": a fake chat, preset answers only ---------- */
  var term = document.querySelector('[data-vibe]');
  if (!term) return;
  var log = term.querySelector('.term-log'), chipsBox = term.querySelector('.term-chips');
  var books = Array.prototype.map.call(document.querySelectorAll('.holo.is-card'), function (li) {
    return { pos: +li.getAttribute('data-pos'), title: li.getAttribute('data-title'), quip: li.getAttribute('data-quip') || '', el: li };
  });
  if (!books.length) return;
  // each answer nudges a few books (by position in the series) and adds a word about you
  var QUESTIONS = [
    { q: 'Quick scan first. What is your Monday energy?',
      a: [{ t: 'Low battery', w: [5, 2, 10], trait: 'running on low battery' },
          { t: 'Organised chaos', w: [4, 9, 1], trait: 'chaotic, but with a plan' },
          { t: 'Quietly plotting', w: [3, 7, 8], trait: 'quietly plotting something' }] },
    { q: 'Your phone has opinions about you. What would it say?',
      a: [{ t: '"Too much screen time"', w: [1, 5, 4], trait: 'a little too online' },
          { t: '"Talks to the AI more than to people"', w: [1, 10, 6], trait: 'friends with the machines' },
          { t: '"Lives in the group chat"', w: [4, 8, 2], trait: 'always in the group chat' }] },
    { q: 'Last one. Pick a superpower you would regret.',
      a: [{ t: 'Reading every mind', w: [7, 3, 8], trait: 'brave about the truth' },
          { t: 'Seeing your future', w: [3, 10, 2], trait: 'curious about what comes next' },
          { t: 'Making your parents cool', w: [6, 9, 1], trait: 'ready for family chaos' }] }
  ];
  var step = 0, score = {}, traits = [], timer = 0;

  function scrollLog() { log.scrollTop = log.scrollHeight; }
  function say(cls, html) {
    var p = document.createElement('p'); p.className = 'term-msg ' + cls; p.innerHTML = html; log.appendChild(p); scrollLog(); return p;
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function typeAI(html, then) {
    var bubble = say('ai', '<span class="term-typing" aria-label="typing"><i></i><i></i><i></i></span>');
    bubble.setAttribute('aria-hidden', 'true');
    clearTimeout(timer);
    timer = setTimeout(function () {
      bubble.removeAttribute('aria-hidden');
      bubble.innerHTML = html; scrollLog();
      if (then) then();
    }, reduce ? 150 : 700 + Math.min(900, html.length * 6));
  }
  var keepFocus = false;
  log.setAttribute('tabindex', '-1');
  function clearChips() {
    // keep keyboard users inside the game while the chips are swapped
    if (chipsBox.contains(document.activeElement)) { keepFocus = true; log.focus({ preventScroll: true }); }
    chipsBox.innerHTML = '';
  }
  function focusFirst() {
    var first = chipsBox.querySelector('button, a');
    if (first && keepFocus) { first.focus({ preventScroll: true }); keepFocus = false; }
  }
  function chips(list) {
    chipsBox.innerHTML = '';
    list.forEach(function (c) {
      var b = document.createElement(c.href ? 'a' : 'button');
      if (c.href) b.href = c.href; else b.type = 'button';
      b.className = c.cls || 'chip'; b.textContent = c.t;
      b.addEventListener('click', c.on);
      chipsBox.appendChild(b);
    });
  }
  function ask() {
    var Q = QUESTIONS[step];
    typeAI(esc(Q.q), function () {
      chips(Q.a.map(function (a) {
        return { t: a.t, on: function () { answer(a); } };
      }));
      focusFirst();
    });
  }
  function answer(a) {
    clearChips();
    say('me', esc(a.t));
    a.w.forEach(function (pos, i) { score[pos] = (score[pos] || 0) + (3 - i); });
    traits.push(a.trait);
    step++;
    if (step < QUESTIONS.length) ask(); else result();
  }
  function result() {
    var best = null, bestScore = -1;
    books.forEach(function (b) {
      var s = (score[b.pos] || 0) + Math.random() * .9;
      if (s > bestScore) { bestScore = s; best = b; }
    });
    var msg = 'Scan complete. You are ' + esc(traits[0]) + ', ' + esc(traits[1]) + ', and ' + esc(traits[2]) + '.<br>' +
      'Your vibe: <strong>' + esc(best.title) + '</strong> (Book ' + best.pos + ').' +
      (best.quip ? '<br>' + esc(best.quip) : '');
    typeAI(msg, function () {
      chips([
        { t: 'Show me the book', cls: 'z-btn', on: function () { show(best); } },
        { t: 'Ask again', cls: 'chip alt', on: restart }
      ]);
      focusFirst();
    });
  }
  function show(b) {
    books.forEach(function (x) { x.el.classList.remove('is-picked'); });
    b.el.classList.add('is-picked');
    b.el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    b.el.setAttribute('tabindex', '-1'); b.el.focus({ preventScroll: true });
    var t = b.el.querySelector('[data-scramble-hover]'); if (t) setTimeout(function () { scramble(t, 600); }, 350);
  }
  function restart() {
    clearTimeout(timer);
    step = 0; score = {}; traits = []; clearChips(); log.innerHTML = '';
    books.forEach(function (x) { x.el.classList.remove('is-picked'); });
    start();
  }
  function start() {
    say('ai', 'Hi. I am a very small AI. I live on this page, I forget everything when you leave, and I have read all ten titles. Three taps and I pick your book.');
    chips([{ t: 'Start the scan', on: function () { clearChips(); ask(); } }]);
    focusFirst();
  }
  start();
})();
