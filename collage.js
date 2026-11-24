/* Between chapters: the tree draws itself as it scrolls into view; prints appear on its branches.
   Click or Enter on a print opens it larger in a dialog. Nothing is stored or sent. */
(function () {
  var tree = document.querySelector('[data-tree]');
  if (!tree) return;
  var leaves = tree.querySelectorAll('.leaf'), n = leaves.length, tick = false;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function upd() {
    tick = false;
    var r = tree.getBoundingClientRect(), vh = innerHeight;
    var p = reduce ? 1 : Math.min(1, Math.max(0, (vh * .95 - r.top) / (r.height * .7)));
    tree.style.setProperty('--tp', p.toFixed(3));
    leaves.forEach(function (l, i) {
      var s = Math.min(1, Math.max(0, (p - .62 - i * .025) / .14));
      l.style.setProperty('--show', s.toFixed(2));
    });
    tree.classList.toggle('ready', p > .95);
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); upd();
  var box = document.querySelector('.lightbox');
  if (!box || typeof box.showModal !== 'function') return;
  var big = box.querySelector('img'), cap = box.querySelector('figcaption');
  leaves.forEach(function (l) {
    l.addEventListener('click', function () {
      var img = l.querySelector('img');
      big.src = l.getAttribute('data-full'); big.alt = img.alt;
      cap.textContent = l.querySelector('.cap').textContent; box.showModal();
    });
  });
  box.querySelector('.lb-close').addEventListener('click', function () { box.close(); });
  box.addEventListener('click', function (e) { if (e.target === box) box.close(); });
  box.addEventListener('close', function () { big.removeAttribute('src'); });
})();

/* About: the coffee line draws itself as the "Why I do this" text is read. */
(function () {
  var lc = document.querySelector('.linecup'), txt = document.querySelector('#about .about-text, #about .wrap.about > div:last-child');
  if (!lc || !txt) return;
  var ticking = false;
  function upd() {
    ticking = false;
    var r = txt.getBoundingClientRect(), vh = innerHeight;
    var p = (vh * .75 - r.top) / Math.max(1, r.height - vh * .25);
    p = Math.min(1, Math.max(0, p));
    lc.style.setProperty('--lc', p.toFixed(3));
    lc.classList.toggle('done', p > .97);
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('resize', upd); upd();
})();
