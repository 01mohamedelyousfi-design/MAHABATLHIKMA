/**
 * fix-heading-hierarchy.js  (Phase 2.2 — one-off migration)
 *
 * booklet/index.html had no H2 at all (H1 -> H3 x5 -> H4 x12):
 *   section titles promoted H3 -> H2, sub-items promoted H4 -> H3.
 * feedback/index.html opened with an H3 ("شكراً لك!" success heading)
 * before its first H2: that heading is promoted H3 -> H2.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// --- booklet/index.html ---
const booklet = path.join(ROOT, 'booklet', 'index.html');
let b = fs.readFileSync(booklet, 'utf8');
const countH3 = (b.match(/<h3(?=[ >])/g) || []).length;
const countH4 = (b.match(/<h4(?=[ >])/g) || []).length;
// Order matters: promote H3 -> H2 first, then H4 -> H3.
b = b
    .replace(/<h3(?=[ >])/g, '<h2')
    .replace(/<\/h3>/g, '</h2>')
    .replace(/<h4(?=[ >])/g, '<h3')
    .replace(/<\/h4>/g, '</h3>');
fs.writeFileSync(booklet, b, 'utf8');
console.log(`booklet/index.html: ${countH3} headings H3->H2, ${countH4} headings H4->H3`);

// --- feedback/index.html ---
const feedback = path.join(ROOT, 'feedback', 'index.html');
let f = fs.readFileSync(feedback, 'utf8');
const successH3 = '<h3 class="text-2xl font-black">شكراً لك!</h3>';
if (!f.includes(successH3)) throw new Error('feedback success heading not found');
f = f.replace(successH3, '<h2 class="text-2xl font-black">شكراً لك!</h2>');
fs.writeFileSync(feedback, f, 'utf8');
console.log('feedback/index.html: success heading H3->H2');
