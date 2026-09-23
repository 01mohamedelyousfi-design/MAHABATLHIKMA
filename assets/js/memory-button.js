/**
 * memory-button.js — «🧠 أضف إلى ذاكرة الحكمة»
 *
 * Shared component for every lesson page. Reads the stable lesson id from
 * <body data-lesson-id="...">, looks it up in the machine-readable catalog
 * (/assets/data/lessons.catalog.json — derived from lessons/index.html), and
 * opens WhatsApp with a prefilled message containing the secure identifier
 * `mahaba_review_lesson=<id>`.
 *
 * Design rule: the site never claims the lesson WAS added — registration is
 * only confirmed by the bot inside WhatsApp.
 *
 * To change the bot number later, either edit WA_NUMBER here or set
 *   <body data-wa-number="2126XXXXXXXX"> on the page.
 */
(function () {
  'use strict';

  var WA_NUMBER = ''; // e.g. '212612345678' — set once the WhatsApp Business number exists
  var LABEL = '🧠 أضف إلى ذاكرة الحكمة';
  var CATALOG_URL = '/assets/data/lessons.catalog.json';

  function waNumber() {
    return document.body.getAttribute('data-wa-number') || WA_NUMBER || '';
  }

  function buildHref(lessonId) {
    var msg = 'mahaba_review_lesson=' + lessonId;
    var num = waNumber();
    return num
      ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg)
      : 'https://wa.me/?text=' + encodeURIComponent(msg);
  }

  function makeButton(lessonId, compact) {
    var a = document.createElement('a');
    a.href = buildHref(lessonId);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('data-memory-button', lessonId);
    a.className = compact
      ? 'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-50 text-violet-700 font-bold text-sm border border-violet-200 hover:bg-violet-100 hover:scale-[1.02] transition-all'
      : 'inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-l from-violet-600 to-fuchsia-600 text-white font-black text-sm sm:text-base shadow-lg shadow-violet-600/25 hover:scale-[1.03] hover:shadow-xl hover:shadow-violet-600/30 transition-all';
    a.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M12 5v13"/></svg>' +
      '<span>' + LABEL + '</span>';
    return a;
  }

  function mount(lessonId) {
    // Explicit mount points first…
    var mounts = document.querySelectorAll('[data-memory-mount]');
    var mounted = false;
    mounts.forEach(function (el) {
      el.appendChild(makeButton(lessonId, el.getAttribute('data-memory-mount') === 'compact'));
      mounted = true;
    });

    // …otherwise inject a floating button (bottom-center, above content).
    if (!mounted) {
      var holder = document.createElement('div');
      holder.className = 'fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4';
      var inner = makeButton(lessonId, false);
      inner.classList.add('pointer-events-auto');
      holder.appendChild(inner);
      document.body.appendChild(holder);
    }
  }

  function init() {
    var lessonId = document.body.getAttribute('data-lesson-id');
    if (!lessonId) return; // not a lesson page

    // Verify the lesson exists in the catalog before showing the button.
    fetch(CATALOG_URL)
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (catalog) {
        var exists = catalog.some(function (l) { return l.id === lessonId; });
        if (exists) mount(lessonId);
      })
      .catch(function () {
        // Catalog unreachable (offline preview etc.) — still show the button;
        // the backend validates the id anyway.
        mount(lessonId);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
