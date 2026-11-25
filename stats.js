/* stats.js | anonymous event counts for Umami (no cookies, no personal data). Edited by hand; not generated.
   Counts only: clicks on Amazon / buy links, clicks on the young readers portal.
   Quiz start/finish and the envelope are counted from christmas.js through window.clcTrack.
   Nothing typed into the quiz is ever sent here. */
(function () {
  'use strict';
  function track(name, data) {
    try { if (window.umami && typeof window.umami.track === 'function') window.umami.track(name, data || {}); } catch (e) {}
  }
  window.clcTrack = track;

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var label = (a.getAttribute('aria-label') || a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    if (/amazon\.|amzn\./i.test(href)) {
      track('amazon-click', { page: location.pathname, label: label });
    } else if (a.classList.contains('xm-portal') || /christmas\/young-readers\/?$/.test(href)) {
      track('young-portal-click', { page: location.pathname });
    } else if (/^mailto:.*subject=/i.test(href) && /pre-?order/i.test(decodeURIComponent(href))) {
      track('preorder-click', { page: location.pathname });
    }
  }, true);
})();
