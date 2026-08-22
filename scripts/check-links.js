const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pages = [
  'index.html', '404.html',
  'lessons/index.html', 'lessons/identity-problematique.html',
  'lessons/identity-synthesis.html', 'lessons/identity-philosophers.html',
  'philomedia/index.html', 'prompts/index.html', 'skills/index.html',
  'games/index.html', 'notebooklm/index.html', 'booklet/index.html', 'feedback/index.html',
];

function extractRefs(html) {
  const refs = new Set();
  const re = /(?:href|src)="([^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) refs.add(m[1]);
  return [...refs].filter((r) => !/^(https?:|mailto:|data:|#|javascript:|\$\{)/.test(r) && r.length > 1);
}

function head(urlPath) {
  return new Promise((resolve) => {
    const req = http.request({ host: 'localhost', port: 8123, path: urlPath.split('?')[0], method: 'GET' }, (res) => {
      res.resume();
      resolve({ status: res.statusCode, type: res.headers['content-type'] || '' });
    });
    req.on('error', () => resolve({ status: 0, type: '' }));
    req.end();
  });
}

(async () => {
  let failures = 0;
  const publicUrls = ['/', '/lessons', '/philomedia', '/prompts', '/skills', '/games', '/notebooklm', '/booklet', '/feedback',
    '/lessons/identity-problematique', '/lessons/identity-philosophers', '/lessons/identity-synthesis'];
  for (const u of publicUrls) {
    const r = await head(u);
    const ok = r.status === 200 && r.type.includes('text/html');
    if (!ok) { failures++; console.log(`URL FAIL ${u} -> ${r.status} ${r.type}`); }
    else console.log(`url ok  ${u}`);
  }
  for (const page of pages) {
    const html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const refs = extractRefs(html);
    for (const ref of refs) {
      const urlPath = ref.startsWith('/') ? ref : '/' + path.join(path.dirname(page), ref).replace(/\\/g, '/');
      const r = await head(urlPath);
      if (r.status !== 200) { failures++; console.log(`BROKEN [${page}] ${ref} -> ${urlPath} (${r.status})`); }
    }
    console.log(`refs ok ${page} (${refs.length})`);
  }
  console.log(failures ? `FAILURES: ${failures}` : 'ALL CHECKS PASSED');
})();
