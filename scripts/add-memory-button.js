/**
 * add-memory-button.js — one-time (idempotent) page patcher.
 *
 * Injects `data-lesson-id` on <body> and the shared
 * /assets/js/memory-button.js script tag into each canonical lesson page.
 * Safe to re-run: already-patched files are skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PAGES = {
  'lessons/lesson-identity.html': 'person-identity',
  'lessons/philosophers.html': 'person-identity',
  'lessons/lesson-identity-synthesis.html': 'person-identity',
  'lessons/lesson-value.html': 'person-value',
  'lessons/philosophers-value.html': 'person-value',
  'lessons/lesson-value-synthesis.html': 'person-value',
  'lessons/lesson-freedom.html': 'necessity-freedom',
  'lessons/philosophers-freedom.html': 'necessity-freedom',
  'lessons/lesson-freedom-synthesis.html': 'necessity-freedom',
};

const SCRIPT_TAG =
  '    <!-- MahabatLhikma Memory Companion: add-to-memory button -->\n' +
  '    <script src="/assets/js/memory-button.js" defer></script>\n';

let changed = 0;
for (const [rel, id] of Object.entries(PAGES)) {
  const file = path.join(ROOT, rel);
  let s = fs.readFileSync(file, 'utf8');
  if (s.includes('data-lesson-id')) { console.log('already patched:', rel); continue; }
  if (!s.includes('</body>')) { console.log('SKIP (no </body>):', rel); continue; }

  s = s.replace(
    '<body class="font-sans text-slate-900 antialiased">',
    `<body class="font-sans text-slate-900 antialiased" data-lesson-id="${id}">`
  );
  s = s.replace('</body>', SCRIPT_TAG + '</body>');
  fs.writeFileSync(file, s, 'utf8');
  changed++;
  console.log('patched:', rel, '->', id);
}
console.log('changed:', changed);
