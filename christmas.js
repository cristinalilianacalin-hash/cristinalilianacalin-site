/* christmas.js | "A Book for Christmas Eve" pages. Edited by hand; not generated.
   Envelope with the sample letter, the countdown to Christmas Eve, and the letter quiz.
   The quiz sends its answers only when the grown-up presses the final button, and only to the
   endpoint set in _data/catalog.json > christmas.form_endpoint (a Google Apps Script web app).
   While that endpoint is empty (preview), nothing is sent anywhere. No cookies, no storage. */
(function () {
  'use strict';

  /* ---------- envelope: opens to the sample letter ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.xm-envelope'), function (btn) {
    var letter = document.getElementById(btn.getAttribute('aria-controls'));
    var label = btn.querySelector('.env-label');
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      letter.hidden = !open;
      label.textContent = open ? 'Close the sample letter' : 'Open the sample letter';
      if (open && window.innerWidth < 860) letter.scrollIntoView({ block: 'start' });
    });
  });

  /* ---------- countdown to Christmas Eve (the visitor's own time zone) ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('[data-countdown]'), function (box) {
    var p = box.getAttribute('data-countdown').split('-');
    var target = new Date(+p[0], +p[1] - 1, +p[2], 0, 0, 0);
    var d = box.querySelector('[data-d]'), h = box.querySelector('[data-h]'), m = box.querySelector('[data-m]');
    function tick() {
      var ms = target - new Date();
      if (ms <= 0) {
        box.innerHTML = '<p class="mono">Christmas Eve</p><p class="xm-order-by">It is here. Santa suggests a blanket and chapter one.</p>';
        return;
      }
      var mins = Math.floor(ms / 60000);
      d.textContent = Math.floor(mins / 1440);
      h.textContent = Math.floor(mins % 1440 / 60);
      m.textContent = mins % 60;
      setTimeout(tick, 30000);
    }
    tick();
  });

  /* ---------- the letter quiz ---------- */
  var root = document.querySelector('.xm-quiz');
  var dataEl = document.getElementById('xm-data');
  if (!root || !dataEl) return;
  var DATA = JSON.parse(dataEl.textContent);
  /* Endpoint: set in catalog.json (christmas.form_endpoint) and written into data-endpoint by the build.
     TODO(Cris): deploy tools/christmas_form_apps_script.gs, paste its /exec URL there, rebuild. */
  var ENDPOINT = root.getAttribute('data-endpoint') || '';
  var KIND = root.getAttribute('data-quiz');
  var stage = root.querySelector('.xm-stage'), bar = root.querySelector('.xm-progress span'), count = root.querySelector('.xm-count');
  var coverBase = (document.querySelector('link[href$="christmas.css"]').getAttribute('href') || '').replace('christmas.css', '');

  function opts(list) { return list.map(function (t) { return { v: t, t: t }; }); }

  var ADULT = [
    { id: 'book', type: 'books', q: 'Which book is going under the tree?', help: true },
    { id: 'their_name', type: 'text', q: 'What do you call them?', hint: 'Their first name, or the name only you use.', required: true, max: 40 },
    { id: 'relation', type: 'choice', q: 'They are your…', o: opts(['Sister', 'Best friend', 'Partner', 'The colleague who became family', 'My manager (brave of you)', 'Someone else']) },
    { id: 'status', type: 'choice', q: 'Their 2026 status report says “Everything is on track.” What’s actually true?',
      o: opts(['New role, same smile, very little sleep', 'Carrying a team nobody sees', 'Proving something to someone who isn’t watching', 'Quietly changing direction', 'Honestly? Doing great. I want them to know I noticed.']) },
    { id: 'unsaid', type: 'choice', q: 'The sentence they would never say out loud:',
      o: opts(['“I’m tired.”', '“I’m not sure I’m good at this.”', '“Someone please say well done.”', '“I want out.”', '“I’m proud of myself.”']) },
    { id: 'santa_file', type: 'choice', q: 'What does Santa have on file for them?',
      o: opts(['Nice list, obviously', 'Nice list, after a long internal review', 'Naughty, but for very good reasons', 'Santa has asked not to comment']) },
    { id: 'love_line', type: 'textarea', q: 'One thing you love about them that they don’t hear enough.', hint: 'One line, in your own words. This is what the letter is built around.', required: true, max: 280 },
    { id: 'tone', type: 'choice', q: 'How should the letter sound?', o: opts(['Warm, like tea', 'Funny, with a straight face', 'A bit of both']) },
    { id: 'where', type: 'choice', q: 'Where will they read it?', o: opts(['Christmas Eve, under a blanket', 'On the train to work', 'Hiding from the team chat', 'I’ll let them decide']) },
    { id: 'you', type: 'you', q: 'Last one. Where should Cristina send the letter?' }
  ];
  var YOUNG = [
    { id: 'book', type: 'books', q: 'Which book is going under the tree?' },
    { id: 'relation', type: 'choice', q: 'The reader is your…', o: opts(['Kid', 'Niece or nephew', 'Godchild', 'Grandchild', 'A friend’s kid']) },
    { id: 'their_name', type: 'text', q: 'What should the letter call them?', hint: 'Optional. A first name or a nickname. You can leave it empty and the letter will still work.', required: false, max: 30 },
    { id: 'age_band', type: 'choice', q: 'Roughly how old?', o: opts(['11–13', '14–16', '17–18']) },
    { id: 'reading', type: 'choice', q: 'Their relationship with reading right now:', o: opts(['Reads under the blanket', 'Only if it has a screen', 'Used to, then the phone won', 'Swears books are boring']) },
    { id: 'ai', type: 'choice', q: 'Their relationship with AI:', o: opts(['Uses it for homework (we don’t talk about it)', 'Talks to it more than to us', 'Thinks it’s overhyped', 'Wants to build one']) },
    { id: 'message', type: 'choice', q: 'What would you like them to hear from someone who isn’t you?', o: opts(['It’s ok not to be fine', 'You’re allowed to say no', 'Mistakes are part of the plot', 'You’re more than your grades']) },
    { id: 'santa_file', type: 'choice', q: 'What does Santa have on file?', o: opts(['Nice list', 'Nice list, mostly', 'Under review by the elves']) },
    { id: 'tone', type: 'choice', q: 'How should the letter sound?', o: opts(['Funny', 'Warm', 'Both']) },
    { id: 'you', type: 'you', q: 'Last one, for the grown-up. Where should Cristina send the letter?' }
  ];
  var STEPS = KIND === 'young' ? YOUNG : ADULT;
  var answers = {}, step = 0, touched = false;

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function bookBy(slug) { for (var i = 0; i < DATA.books.length; i++) if (DATA.books[i].slug === slug) return DATA.books[i]; return null; }
  function coverNode(b) {
    if (b.cover) { var img = el('img', 'xm-cover'); img.src = coverBase + b.cover; img.alt = ''; img.width = 600; img.height = 900; img.loading = 'lazy'; return img; }
    var ph = el('span', 'xm-cover xm-cover-ph ink-' + (b.ink || 'light')); ph.style.setProperty('--c', b.accent);
    ph.appendChild(el('span', 'ph-title', b.title)); ph.appendChild(el('span', 'ph-author', 'Cristina Liliana Calin')); return ph;
  }

  function wrapNode(teen) {
    var t = document.getElementById(teen ? 'xm-wrap-teen' : 'xm-wrap-adult');
    return t ? t.content.firstElementChild.cloneNode(true) : document.createTextNode('');
  }

  // "Help me" branch: a gentle pick among the books that are out before Christmas
  function recommend() {
    var w = { 'the-friday-we-promised': 1, 'approved-with-no-questions': 0, 'the-risk-we-buried': 0 };
    var s = answers.status || '', u = answers.unsaid || '';
    if (/New role|Proving|Doing great/.test(s)) w['the-friday-we-promised'] += 2;
    if (/team nobody/.test(s)) w['approved-with-no-questions'] += 2;
    if (/changing direction/.test(s)) w['the-risk-we-buried'] += 2;
    if (/tired/.test(u)) w['the-friday-we-promised'] += 1;
    if (/good at this|well done/.test(u)) w['approved-with-no-questions'] += 1;
    if (/want out|proud/.test(u)) w['the-risk-we-buried'] += 1;
    var best = 'the-friday-we-promised';
    Object.keys(w).forEach(function (k) { if (w[k] > w[best] && bookBy(k)) best = k; });
    return bookBy(best);
  }

  function nav(canNext, onNext) {
    var row = el('div', 'xm-nav');
    if (step > 0) {
      var back = el('button', 'xm-back', 'Back'); back.type = 'button';
      back.addEventListener('click', function () { step--; render(); });
      row.appendChild(back);
    } else row.appendChild(el('span'));
    if (canNext) {
      var next = el('button', 'btn solid', 'Next'); next.type = 'button';
      next.addEventListener('click', onNext);
      row.appendChild(next);
    }
    return row;
  }

  function choose(id, v) { answers[id] = v; touched = true; setTimeout(function () { step++; render(); }, 180); }

  function render() {
    var s = STEPS[step];
    stage.innerHTML = '';
    bar.style.width = ((step + 1) / STEPS.length * 100) + '%';
    count.textContent = 'Question ' + (step + 1) + ' of ' + STEPS.length;
    var h = el('h3', 'xm-q', s.q); h.tabIndex = -1; h.id = 'xm-q-' + KIND + '-' + step;
    stage.appendChild(h);
    var wrap = el('div', 'xm-opts'); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-labelledby', h.id);

    if (s.type === 'books') {
      wrap.className = 'xm-opts xm-book-opts';
      DATA.books.forEach(function (b) {
        var btn = el('button', 'xm-opt xm-book-opt'); btn.type = 'button';
        btn.setAttribute('aria-pressed', answers.book === b.slug ? 'true' : 'false');
        var g = el('span', 'xm-gift'); g.appendChild(coverNode(b)); g.appendChild(wrapNode(b.teen)); btn.appendChild(g);
        if (b.teen) btn.className += ' is-teen';
        btn.appendChild(el('span', null, b.title));
        btn.appendChild(el('span', 'tg-q', b.teen ? 'GIFT_MODE: ON \u00b7 Christmas 2026' : 'Christmas Gift Edition 2026, with a personal letter'));
        btn.appendChild(el('small', null, b.twice ? 'Letter now, book in January' : b.avail));
        btn.addEventListener('click', function () { choose('book', b.slug); });
        wrap.appendChild(btn);
      });
      if (s.help) {
        var hb = el('button', 'xm-opt xm-book-help', 'I haven’t picked one yet. Help me.'); hb.type = 'button';
        hb.setAttribute('aria-pressed', answers.book === 'help' ? 'true' : 'false');
        hb.addEventListener('click', function () { choose('book', 'help'); });
        wrap.appendChild(hb);
      }
      stage.appendChild(wrap); stage.appendChild(nav(false));
    } else if (s.type === 'choice') {
      s.o.forEach(function (o) {
        var btn = el('button', 'xm-opt', o.t); btn.type = 'button';
        btn.setAttribute('aria-pressed', answers[s.id] === o.v ? 'true' : 'false');
        btn.addEventListener('click', function () { choose(s.id, o.v); });
        wrap.appendChild(btn);
      });
      stage.appendChild(wrap); stage.appendChild(nav(false));
    } else if (s.type === 'text' || s.type === 'textarea') {
      var f = el('div', 'xm-field');
      var inp = el(s.type === 'text' ? 'input' : 'textarea');
      if (s.type === 'text') inp.type = 'text';
      inp.id = 'xm-in-' + KIND + '-' + s.id; inp.maxLength = s.max; inp.value = answers[s.id] || '';
      inp.autocomplete = 'off';
      var lab = el('label', null, s.hint); lab.htmlFor = inp.id;
      var err = el('p', 'xm-err'); err.id = inp.id + '-err'; err.hidden = true;
      inp.setAttribute('aria-describedby', err.id);
      f.appendChild(lab); f.appendChild(inp); f.appendChild(err);
      stage.appendChild(f);
      var go = function () {
        var v = inp.value.trim();
        if (s.required && !v) { err.textContent = 'Santa needs this one. A few words are enough.'; err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
        answers[s.id] = v; touched = true; step++; render();
      };
      if (s.type === 'text') inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      stage.appendChild(nav(true, go));
    } else if (s.type === 'you') {
      renderYou(s);
    }
    if (touched) h.focus();
  }

  function check(id, text, required) {
    var row = el('div', 'xm-check');
    var c = el('input'); c.type = 'checkbox'; c.id = 'xm-' + KIND + '-' + id; if (required) c.required = true;
    var l = el('label', null, text); l.htmlFor = c.id;
    row.appendChild(c); row.appendChild(l);
    return { row: row, input: c };
  }
  function field(id, label, type, ac) {
    var f = el('div', 'xm-field');
    var i = el('input'); i.type = type; i.id = 'xm-' + KIND + '-' + id; i.autocomplete = ac; i.required = true; i.maxLength = type === 'email' ? 120 : 40;
    var l = el('label', null, label); l.htmlFor = i.id;
    f.appendChild(l); f.appendChild(i);
    return { row: f, input: i };
  }

  function renderYou(s) {
    var form = el('form'); form.noValidate = true;
    var name = field('from', 'Your first name', 'text', 'given-name');
    var mail = field('email', 'Your email (the PDF goes here)', 'email', 'email');
    form.appendChild(name.row); form.appendChild(mail.row);
    var adult = null;
    if (KIND === 'young') { adult = check('adult', 'I am 18 or older. I am the grown-up giving this book.', true); form.appendChild(adult.row); }
    var gdpr = check('consent', 'I agree that Cristina Liliana Calin uses these answers only to write and send this letter. They are deleted on ' + DATA.retention + '.', true);
    var news = check('news', 'Optional: send me news about Cristina’s books, now and then. Unsubscribe any time.', false);
    form.appendChild(gdpr.row); form.appendChild(news.row);
    var hp = el('input'); hp.type = 'text'; hp.name = 'website'; hp.tabIndex = -1; hp.autocomplete = 'off';
    hp.setAttribute('aria-hidden', 'true'); hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0';
    form.appendChild(hp);
    var err = el('p', 'xm-err'); err.setAttribute('role', 'alert'); form.appendChild(err);
    var row = nav(false);
    var submit = el('button', 'btn solid', 'Send it to Cristina'); submit.type = 'submit';
    row.appendChild(submit); form.appendChild(row);
    stage.appendChild(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var problems = [];
      if (!name.input.value.trim()) problems.push([name.input, 'your first name']);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.input.value.trim())) problems.push([mail.input, 'a valid email']);
      if (adult && !adult.input.checked) problems.push([adult.input, 'the 18+ confirmation']);
      if (!gdpr.input.checked) problems.push([gdpr.input, 'your consent']);
      [name.input, mail.input, gdpr.input].concat(adult ? [adult.input] : []).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      if (problems.length) {
        problems.forEach(function (p) { p[0].setAttribute('aria-invalid', 'true'); });
        err.textContent = 'Almost there. Santa still needs ' + problems.map(function (p) { return p[1]; }).join(', ') + '.';
        problems[0][0].focus();
        return;
      }
      if (hp.value) { done(); return; }
      var rec = answers.book === 'help' ? recommend() : null;
      var payload = { quiz: KIND, submitted_at: new Date().toISOString(), page: location.pathname,
                      book: answers.book === 'help' ? 'help' : (bookBy(answers.book) || {}).title || answers.book,
                      recommended: rec ? rec.title : '', from_name: name.input.value.trim(), email: mail.input.value.trim(),
                      adult_confirmed: adult ? 'yes' : '', consent: 'yes', news: news.input.checked ? 'yes' : 'no' };
      STEPS.forEach(function (st) { if (st.id !== 'book' && st.id !== 'you') payload[st.id] = answers[st.id] || ''; });
      if (!ENDPOINT) { done(rec, true); return; }
      submit.disabled = true; submit.textContent = 'Sending…';
      fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(payload) })
        .then(function () { done(rec, false); })
        .catch(function () {
          submit.disabled = false; submit.textContent = 'Send it to Cristina';
          err.textContent = 'Something went wrong on the way. Please try again, or write to ' + DATA.email + '.';
        });
    });
  }

  function done(rec, preview) {
    stage.innerHTML = '';
    bar.style.width = '100%';
    count.textContent = 'Done';
    var box = el('div', 'xm-done');
    box.appendChild(el('div', 'xm-done-seal', 'C'));
    var h = el('h3', 'xm-q', 'Your letter is on its way.'); h.tabIndex = -1; box.appendChild(h);
    box.appendChild(el('p', null, 'Print it, slip it inside the cover, and let the book do the rest.'));
    box.appendChild(el('p', 'xm-help', 'Cristina will email you the PDF within 48 hours.'));
    var chosen = bookBy(answers.book);
    if (chosen && chosen.twice) box.appendChild(el('p', 'xm-help', 'This one is the gift that arrives twice: the letter and card can go under the tree now, the printed book follows in January.'));
    if (rec) {
      var r = el('div', 'xm-rec'); r.appendChild(coverNode(rec));
      var t = el('div'); t.appendChild(el('p', 'mono', 'Santa’s pick for ' + (answers.their_name || 'them')));
      t.appendChild(el('p', null, rec.title)); t.appendChild(el('p', 'xm-help', rec.avail + '. Order the printed copy and the letter will be written for this book.'));
      r.appendChild(t); box.appendChild(r);
    }
    var again = el('button', 'xm-back', 'Write another letter'); again.type = 'button';
    again.addEventListener('click', function () { answers = {}; step = 0; render(); });
    box.appendChild(again);
    if (preview) box.appendChild(el('p', 'xm-preview-note', 'Preview: nothing was sent. The quiz goes live when the form endpoint is set.'));
    stage.appendChild(box);
    h.focus();
  }

  render();
})();
