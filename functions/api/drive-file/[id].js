/**
 * محبة الحكمة — Drive file proxy (OPTIONAL / NOT CURRENTLY USED)
 *
 * NOTE: as of the latest update, philomedia.html no longer calls this
 * endpoint — it uses Google Drive's public direct-link format instead
 * (https://drive.google.com/thumbnail?id=... and .../uc?export=download&id=...),
 * which needs no API key and no Google Cloud account. That was changed
 * specifically because creating a Google Cloud project asks for a
 * billing/payment method up front, which isn't accessible to everyone.
 *
 * Keep this file around for later — it's still useful if the project
 * ever needs Range-accurate video streaming, private (non-link-shared)
 * files, or a Sheet-driven /api/philomedia endpoint. Until then, it's
 * safe to ignore; it won't run unless something calls /api/drive-file/:id.
 *
 * SETUP (one-time, only if/when you decide to use this):
 * 1. Go to https://console.cloud.google.com/ → create a project (or reuse one).
 * 2. APIs & Services → Library → search "Google Drive API" → Enable.
 * 3. APIs & Services → Credentials → Create Credentials → API key.
 *    - Click "Restrict key" → under "API restrictions" choose "Restrict key"
 *      → select "Google Drive API" only. (No need for an app/referrer
 *      restriction since this key is only ever used server-side, inside
 *      this function — never sent to the browser.)
 * 4. Make sure every file (and/or the parent folder) inside your
 *    MahabatLhikma-Media Drive folder is shared as:
 *    "Anyone with the link" → Viewer.
 *    (An API key with no OAuth can only read files shared this way —
 *    it cannot read fully private files.)
 * 5. In the Cloudflare Pages dashboard: your project → Settings →
 *    Environment variables → add a variable named
 *    GOOGLE_DRIVE_API_KEY = <the key you created>, for both
 *    Production and Preview.
 * 6. Commit this whole `functions/` folder into your Pages project repo
 *    (same repo as index.html etc.) and git push — Cloudflare Pages picks
 *    up any `functions/` directory automatically, no separate deployment
 *    or "Worker" step needed.
 * 7. Test directly: visit
 *    https://your-site.pages.dev/api/drive-file/<a real file id>
 *    in a browser tab — it should play/show the file, not error out.
 */

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const fileId = params.id;

  if (!fileId) {
    return new Response('Missing file id', { status: 400 });
  }

  const apiKey = env.GOOGLE_DRIVE_API_KEY;
  if (!apiKey) {
    return new Response(
      'Server misconfigured: GOOGLE_DRIVE_API_KEY environment variable is not set in Cloudflare Pages settings.',
      { status: 500 }
    );
  }

  const range = request.headers.get('Range');

  // Only use Cloudflare's edge cache for full-file requests (no Range
  // header) — images and small files typically get requested this way.
  // Video/audio scrubbing sends Range requests, which we pass straight
  // through fresh each time to keep behavior correct and simple.
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);

  if (!range) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const driveUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&key=${apiKey}`;

  const driveRes = await fetch(driveUrl, {
    headers: range ? { Range: range } : {},
  });

  if (!driveRes.ok && driveRes.status !== 206) {
    return new Response(
      `Could not fetch this file from Google Drive (status ${driveRes.status}). ` +
      `Check that the file exists and is shared as "Anyone with the link".`,
      { status: driveRes.status }
    );
  }

  const headers = new Headers();
  ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'].forEach((h) => {
    const v = driveRes.headers.get(h);
    if (v) headers.set(h, v);
  });
  headers.set('Cache-Control', 'public, max-age=86400');
  headers.set('Access-Control-Allow-Origin', '*');

  const response = new Response(driveRes.body, {
    status: driveRes.status,
    headers,
  });

  if (!range) {
    context.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}
