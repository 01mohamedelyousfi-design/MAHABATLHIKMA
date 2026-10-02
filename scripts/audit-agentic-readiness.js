/**
 * Agentic-readiness audit for the Mahabat Lhikma static site.
 *
 * Mirrors the Lighthouse "Agentic Browsing" checks this site fails:
 *   1. "Accessibility tree is not well-formed" — the Lighthouse subset of rules
 *      critical for machine interaction, notably "Names and labels": every
 *      interactive element needs a programmatic name. Detects <button>/<a>
 *      elements exposing no accessible name (no aria-label, aria-labelledby,
 *      title, visible text, or alt-bearing image child).
 *   2. "llms.txt does not follow recommendations" — llms.txt must contain an H1,
 *      be at least 50 characters long, and contain at least one Markdown link
 *      in the `[text](url)` form (bare URLs do not count).
 *
 * Usage:
 *   node scripts/audit-agentic-readiness.js          # report only
 *   node scripts/audit-agentic-readiness.js --fix    # report + auto-add labels
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const FIX = process.argv.includes('--fix');

const pages = [
  'index.html', '404.html',
  'lessons/index.html', 'lessons/lesson-identity.html',
  'lessons/lesson-value.html', 'lessons/lesson-freedom.html',
  'lessons/lesson-identity-synthesis.html', 'lessons/philosophers.html',
  'lessons/philosophers-value.html', 'lessons/philosophers-freedom.html',
  'lessons/lesson-value-synthesis.html', 'lessons/lesson-freedom-synthesis.html',
  'philomedia/index.html', 'prompts/index.html', 'skills/index.html',
  'games/index.html', 'notebooklm/index.html', 'booklet/index.html', 'feedback/index.html',
  'examples/aflatoon-freedom-programming/index.html',
];

/** Strip HTML tags/comments and collapse whitespace. */
function textContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Human label inferred from the icon inside an icon-only control. */
const ICON_LABELS = {
  x: 'إغلاق',
  menu: 'فتح القائمة',
  copy: 'نسخ',
  'clipboard-copy': 'نسخ',
  check: 'تم',
  search: 'بحث',
  'chevron-down': 'توسيع',
  'chevron-up': 'طيّ',
  'chevron-left': 'السابق',
  'chevron-right': 'التالي',
  'arrow-left': 'السابق',
  'arrow-right': 'التالي',
  play: 'تشغيل',
  'play-circle': 'تشغيل',
  pause: 'إيقاف مؤقت',
  'rotate-ccw': 'إعادة',
  'refresh-cw': 'إعادة',
  download: 'تحميل',
  share: 'مشاركة',
  'external-link': 'فتح الرابط',
  'zoom-in': 'تكبير',
  'zoom-out': 'تصغير',
};

/** Precise Arabic names, keyed by the control's onclick handler. */
const HANDLER_LABELS = {
  closeModal: 'إغلاق عرض الفيديو',
  closeImageModal: 'إغلاق عرض الصورة',
  closeAudioBar: 'إغلاق شريط الصوت',
  closeToolModal: 'إغلاق تفاصيل الأداة',
  closeExampleLightbox: 'إغلاق عرض المثال',
  closeSkillModal: 'إغلاق تفاصيل المهارة',
  closeHowToVideo: 'إغلاق الفيديو',
  closeGameModal: 'إغلاق تفاصيل اللعبة',
  closeCardModal: 'إغلاق تفاصيل الدليل',
  copyPrompt: 'نسخ المثال',
  openTools: 'فتح أدوات الحجاج',
};

function handlerOf(openTag) {
  const m = /onclick="([^"(;]+)/.exec(openTag);
  return m ? m[1].trim() : '';
}

function labelFor(inner, openTag) {
  const icon = (/data-lucide="([^"]+)"/.exec(inner) || [])[1] || '';
  const handler = handlerOf(openTag);
  // The sidebar toggle shares one handler between its menu and close buttons.
  if (handler === 'toggleSidebar') {
    return icon === 'x' ? 'إغلاق قائمة التنقل' : 'فتح قائمة التنقل';
  }
  if (HANDLER_LABELS[handler]) return HANDLER_LABELS[handler];
  if (icon && ICON_LABELS[icon]) return ICON_LABELS[icon];
  if (/close/i.test(handler)) return 'إغلاق';
  if (/open|toggle/i.test(handler)) return 'فتح';
  if (/copy/i.test(handler)) return 'نسخ';
  if (/reset|clear/i.test(handler)) return 'إعادة';
  if (/play/i.test(handler)) return 'تشغيل';
  if (/next/i.test(handler)) return 'التالي';
  if (/prev|back/i.test(handler)) return 'السابق';
  return 'زر'; // generic fallback
}

/** Extract interactive elements that expose no accessible name. */
function auditPage(page) {
  const file = path.join(ROOT, page);
  let html = fs.readFileSync(file, 'utf8');
  const problems = [];
  const fixes = [];

  const tagRe = /<(button|a)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const [full, tag, attrs, inner] = m;
    if (/aria-label=|aria-labelledby=|title=/.test(attrs)) continue;
    const text = textContent(inner);
    const hasAltImage = /<img[^>]*alt="[^"]+"/.test(inner) || /<svg[^>]*(role="img"|aria-label)/.test(inner);
    const isDecorative = /aria-hidden="true"/.test(attrs);
    if (text === '' && !hasAltImage && !isDecorative) {
      const label = labelFor(inner, attrs);
      problems.push({ tag, label });
      fixes.push({ full, tag, label, index: m.index });
    }
  }

  // Clickable containers acting as controls (not exposed in the a11y tree).
  const divRe = /<div\b([^>]*onclick=[^>]*)>/g;
  let d;
  const divFixes = [];
  while ((d = divRe.exec(html)) !== null) {
    if (/role=|aria-label=/.test(d[1])) continue;
    divFixes.push({ full: d[0], index: d.index });
  }

  // Form controls without a programmatic name — agents must know what to fill.
  const ctrlRe = /<(input|select|textarea)\b([^>]*)>/g;
  let c;
  const controls = [];
  while ((c = ctrlRe.exec(html)) !== null) {
    const attrs = c[2] || '';
    if (/\btype="(hidden|submit|button|image|reset)"/.test(attrs)) continue;
    if (/aria-label=|aria-labelledby=|title=/.test(attrs)) continue;
    const id = (/\bid="([^"]+)"/.exec(attrs) || [])[1];
    if (id && new RegExp(`<label[^>]*for="${id}"`).test(html)) continue;
    // A control wrapped in <label> inherits the label text.
    const upto = html.slice(0, c.index);
    if (upto.lastIndexOf('<label') > upto.lastIndexOf('</label>')) continue;
    controls.push({ tag: c[1], index: c.index });
  }

  if (FIX && fixes.length) {
    // Apply from the end so earlier indices stay valid.
    const all = [...fixes].sort((a, b) => b.index - a.index);
    for (const f of all) {
      let named = f.full.replace(/^(<(?:button|a)\b[^>]*?)(\s*>)/, `$1 aria-label="${f.label}"$2`);
      // Keep the accessibility tree clean: the decorative icon is not content.
      named = named.replace(/<i data-lucide="([^"]+)"/, '<i aria-hidden="true" data-lucide="$1"');
      if (f.label === 'فتح قائمة التنقل' && !/aria-controls=/.test(named)) {
        named = named.replace(
          /( aria-label="[^"]+")/,
          '$1 aria-controls="sidebar" aria-expanded="false"'
        );
      }
      html = html.slice(0, f.index) + named + html.slice(f.index + f.full.length);
    }
    fs.writeFileSync(file, html);
  }

  return { page, problems, divProblems: divFixes.length, controls };
}

/** Lighthouse 13.3+ check: does llms.txt follow the recommended structure? */
function auditLlmsTxt() {
  const file = path.join(ROOT, 'llms.txt');
  if (!fs.existsSync(file)) return { ok: false, reasons: ['llms.txt missing'] };
  const txt = fs.readFileSync(file, 'utf8');
  const reasons = [];
  if (!/^#\s+\S/m.test(txt)) reasons.push('missing H1 header (# Title)');
  if (txt.trim().length < 50) reasons.push('file suspiciously short (<50 chars)');
  if (!/\[[^\]]+\]\([^)]+\)/.test(txt)) reasons.push('no Markdown link in [text](url) form');
  return { ok: reasons.length === 0, reasons };
}

let totalButtons = 0;
let totalControls = 0;
const reports = [];
for (const page of pages) {
  const r = auditPage(page);
  totalButtons += r.problems.length;
  totalControls += r.controls.length;
  reports.push(r);
}

console.log('=== llms.txt ===');
const llms = auditLlmsTxt();
console.log(llms.ok ? 'PASS - follows recommendations' : 'FAIL - ' + llms.reasons.join('; '));

console.log('\n=== Accessibility names & labels (agent-critical subset) ===');
for (const r of reports) {
  if (!r.problems.length && !r.controls.length && !r.divProblems) continue;
  console.log(`\n${r.page}`);
  for (const p of r.problems) console.log(`  <${p.tag}> without accessible name -> aria-label="${p.label}"`);
  for (const c of r.controls) console.log(`  <${c.tag}> without a programmatic name (add a <label for> or aria-label)`);
  if (r.divProblems) console.log(`  note: ${r.divProblems} clickable <div onclick> backdrop(s) — mouse-only, not exposed as controls`);
}
console.log(`\nUnnamed interactive elements: ${totalButtons} buttons across ${reports.filter((r) => r.problems.length).length} page(s)`);
console.log(`Unnamed form controls: ${totalControls} across ${reports.filter((r) => r.controls.length).length} page(s)`);
console.log(FIX ? '\n(--fix applied)' : '\nRun with --fix to auto-add aria-labels.');