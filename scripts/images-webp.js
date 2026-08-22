const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const files = [
    'assets/philosophers/philosophers-header.png',
    'assets/philosophers/john-locke.png',
    'assets/philosophers/schopenhauer.png',
    'assets/philosophers/freud.png',
    'assets/examples/philosimage/example-descartes.png',
    'assets/examples/philosimage/example-spinoza.png',
];

async function main() {
    let beforeTotal = 0;
    let afterTotal = 0;

    for (const file of files) {
        const input = path.resolve(file);
        const output = input.replace(/\.png$/i, '.webp');

        if (!fs.existsSync(input)) {
            console.log(`SKIP ${file} (missing)`);
            continue;
        }

        const before = fs.statSync(input).size;
        await sharp(input).webp({ quality: 80 }).toFile(output);
        const after = fs.statSync(output).size;
        fs.unlinkSync(input);

        beforeTotal += before;
        afterTotal += after;
        console.log(`${path.basename(file)}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
    }

    if (beforeTotal > 0) {
        const saved = ((beforeTotal - afterTotal) / beforeTotal * 100).toFixed(1);
        console.log(`Total: ${(beforeTotal / 1048576).toFixed(2)} MB -> ${(afterTotal / 1048576).toFixed(2)} MB (-${saved}%)`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
