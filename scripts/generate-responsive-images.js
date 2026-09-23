/**
 * generate-responsive-images.js  (Phase 3.4)
 *
 * Generates responsive width variants (-480, -768, -1200) for the lesson
 * cover / story / hero images, so the HTML can serve the right size via
 * srcset instead of shipping the full-resolution file to every device.
 *
 * Idempotent: safe to re-run after replacing a source image; variants are
 * regenerated from the current sources. Widths >= the source width are
 * skipped (never upscale).
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const QUALITY = 80;

const IMAGES = [
    // Lesson covers (lessons/index.html cards)
    { src: 'assets/lessons/identity-cover.jpg', widths: [480, 768, 1200] },
    { src: 'assets/lessons/value-cover.webp', widths: [480, 768, 1200] },
    { src: 'assets/lessons/freedom-cover.webp', widths: [480, 768, 1200] },
    { src: 'assets/lessons/nexsis-city.webp', widths: [480, 768, 1200] },
    // Story images (lesson intro pages)
    { src: 'assets/lessons/freedom-story.webp', widths: [480, 768, 1200] },
    { src: 'assets/lessons/identity-story.jpg', widths: [480, 768, 1200] },
    { src: 'assets/lessons/value-kant-gusdorf.webp', widths: [480, 768] },
    // Hero headers (philosophers pages — LCP candidates)
    { src: 'assets/philosophers/philosophers-header.webp', widths: [768, 1200] },
    { src: 'assets/philosophers/necessity-freedom-header.webp', widths: [768, 1200] },
    { src: 'assets/philosophers/value-philosophers-header.webp', widths: [768, 1200] },
];

async function main() {
    for (const { src, widths } of IMAGES) {
        const input = path.resolve(ROOT, src);
        if (!fs.existsSync(input)) { console.log(`SKIP ${src} (missing)`); continue; }

        // Read into a buffer so sharp never holds a lock on the input file (Windows EBUSY/EPERM).
        const buffer = fs.readFileSync(input);
        const meta = await sharp(buffer).metadata();
        const ext = path.extname(src);
        const base = input.slice(0, -ext.length);

        for (const w of widths) {
            if (w > meta.width) continue; // never upscale; the original covers the largest slot
            const output = `${base}-${w}${ext}`;
            let img = sharp(buffer).resize({ width: w });
            img = ext.toLowerCase() === '.webp' ? img.webp({ quality: QUALITY }) : img.jpeg({ quality: QUALITY, mozjpeg: true });
            await img.toFile(output);
            const size = (fs.statSync(output).size / 1024).toFixed(0);
            console.log(`${path.basename(output)}  ${w}px  ${size} KB`);
        }
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
