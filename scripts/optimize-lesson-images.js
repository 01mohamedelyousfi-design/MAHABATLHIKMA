/**
 * optimize-lesson-images.js  (Phase 2.1 + 2.3 — one-off migration)
 *
 * 1) Moves the 6 philosopher images that only existed in the stale
 *    lessons/assets/philosophers/ tree into the canonical root
 *    assets/philosophers/ tree. The two ~1 MB portraits
 *    (georges-gusdorf, immanuel-kant) are resized to 1200px width
 *    in the process.
 * 2) Phase 2.3: recompresses the two ~1 MB WebP covers in
 *    assets/lessons/ (value-cover, value-kant-gusdorf) to <=1200px width.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const MAX_WIDTH = 1200;
const QUALITY = 80;

// [source (stale tree), destination (canonical tree), resize?]
const MOVES = [
    ['lessons/assets/philosophers/emmanuel-mounier.webp', 'assets/philosophers/emmanuel-mounier.webp', false],
    ['lessons/assets/philosophers/jean-paul-sartre.webp', 'assets/philosophers/jean-paul-sartre.webp', false],
    ['lessons/assets/philosophers/necessity-freedom-header.webp', 'assets/philosophers/necessity-freedom-header.webp', false],
    ['lessons/assets/philosophers/value-philosophers-header.webp', 'assets/philosophers/value-philosophers-header.webp', false],
    ['lessons/assets/philosophers/georges-gusdorf.webp', 'assets/philosophers/georges-gusdorf.webp', true],
    ['lessons/assets/philosophers/immanuel-kant.webp', 'assets/philosophers/immanuel-kant.webp', true],
];

const RESIZE_IN_PLACE = [
    'assets/lessons/value-cover.webp',
    'assets/lessons/value-kant-gusdorf.webp',
];

async function processImage(input, output, resize) {
    const before = fs.statSync(input).size;
    // Read into a buffer so sharp never holds a lock on the input file (Windows EBUSY/EPERM).
    let img = sharp(fs.readFileSync(input));
    const meta = await img.metadata();
    let note = `${meta.width}x${meta.height}`;
    if (resize && meta.width > MAX_WIDTH) {
        img = img.resize({ width: MAX_WIDTH });
        note += ` -> ${MAX_WIDTH}px wide`;
    }
    await img.webp({ quality: QUALITY }).toFile(output);
    const after = fs.statSync(output).size;
    console.log(`${path.basename(output)}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB (${note})`);
}

async function main() {
    for (const [src, dest, resize] of MOVES) {
        const input = path.resolve(ROOT, src);
        const output = path.resolve(ROOT, dest);
        if (!fs.existsSync(input)) { console.log(`SKIP ${src} (missing)`); continue; }
        if (fs.existsSync(output)) { console.log(`SKIP ${dest} (already exists)`); continue; }
        await processImage(input, output, resize);
    }

    for (const rel of RESIZE_IN_PLACE) {
        const input = path.resolve(ROOT, rel);
        if (!fs.existsSync(input)) { console.log(`SKIP ${rel} (missing)`); continue; }
        const tmp = input + '.tmp';
        await processImage(input, tmp, true);
        fs.unlinkSync(input); // Windows: rename cannot overwrite an existing file
        fs.renameSync(tmp, input);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
