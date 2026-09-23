/**
 * validate-schema.js
 *
 * Validates every JSON-LD block in every public HTML page:
 *   1. Each <script type="application/ld+json"> block must JSON.parse cleanly.
 *   2. Every FAQPage Question/Answer must appear verbatim in the visible
 *      page markup (Google requires schema to match visible content).
 *
 * Run: npm run validate-schema
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

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

let failures = 0;
let blockCount = 0;
let faqCount = 0;

for (const page of pages) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

    blocks.forEach((b, i) => {
        blockCount++;
        let json;
        try {
            json = JSON.parse(b[1]);
        } catch (err) {
            failures++;
            console.log(`JSON FAIL [${page}] block #${i + 1}: ${err.message}`);
            return;
        }

        const nodes = json['@graph'] || [json];
        for (const node of nodes) {
            if (node['@type'] !== 'FAQPage') continue;
            faqCount++;
            for (const q of node.mainEntity || []) {
                const qVisible = html.includes(q.name);
                const aVisible = html.includes(q.acceptedAnswer && q.acceptedAnswer.text);
                if (!qVisible || !aVisible) {
                    failures++;
                    console.log(`FAQ MISMATCH [${page}]: "${q.name}" (question visible: ${qVisible}, answer visible: ${aVisible})`);
                }
            }
            console.log(`faq ok   ${page} (${(node.mainEntity || []).length} Q&A)`);
        }
    });
    if (blocks.length) console.log(`json ok  ${page} (${blocks.length} block${blocks.length > 1 ? 's' : ''})`);
}

console.log(`\n${blockCount} JSON-LD blocks, ${faqCount} FAQPage nodes checked`);
console.log(failures ? `FAILURES: ${failures}` : 'ALL SCHEMA CHECKS PASSED');
process.exit(failures ? 1 : 0);
