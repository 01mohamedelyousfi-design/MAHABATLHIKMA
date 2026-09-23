/**
 * repoint-lesson-assets.js  (Phase 2.1 — one-off migration)
 *
 * The 9 lesson pages referenced a stale duplicate media tree under
 * lessons/assets/ (heavy PNGs, old WebP copies). The optimised canonical
 * copies live in the root assets/ tree. This script rewrites every
 * relative "assets/…" reference in lessons/*.html to a root-absolute
 * "/assets/…" reference, and swaps the 4 stale PNG names for their
 * WebP counterparts.
 *
 * Kept relative on purpose: assets/css/tailwind.css — the lessons-specific
 * Tailwind build produced by `npm run build` (tailwind.lessons.config.js).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const LESSONS_DIR = path.join(ROOT, 'lessons');

// Stale PNG duplicates -> optimised WebP copies already in root /assets/philosophers/
const PNG_TO_WEBP = {
    'philosophers-header.png': 'philosophers-header.webp',
    'john-locke.png': 'john-locke.webp',
    'schopenhauer.png': 'schopenhauer.webp',
    'freud.png': 'freud.webp',
};

const files = fs.readdirSync(LESSONS_DIR).filter((f) => f.endsWith('.html') && f !== 'index.html');

let total = 0;
for (const file of files) {
    const p = path.join(LESSONS_DIR, file);
    let html = fs.readFileSync(p, 'utf8');
    let count = 0;

    // 1) Swap stale PNG names for their WebP counterparts (before absolutising).
    for (const [png, webp] of Object.entries(PNG_TO_WEBP)) {
        const re = new RegExp(`assets/philosophers/${png.replace('.', '\\.')}`, 'g');
        html = html.replace(re, () => { count++; return `assets/philosophers/${webp}`; });
    }

    // 2) Root-absolute every remaining relative asset ref except the lessons-specific CSS build.
    html = html.replace(/"assets\/(?!css\/tailwind\.css)/g, () => { count++; return '"/assets/'; });

    fs.writeFileSync(p, html, 'utf8');
    console.log(`${file}: ${count} refs updated`);
    total += count;
}
console.log(`TOTAL: ${total} refs across ${files.length} pages`);
