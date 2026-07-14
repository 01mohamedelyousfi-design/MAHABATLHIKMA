/**
 * محبة الحكمة — YouTube playlist auto-sync
 *
 * Serves GET /api/youtube-playlist/:playlistId
 *
 * Whenever Mohamed adds a new video to a YouTube playlist, it appears on
 * the site automatically the next time this endpoint's cache expires —
 * no manual video-ID copying, no Google Cloud account, no API key.
 *
 * HOW: YouTube publishes a free public RSS/Atom feed for any playlist:
 *   https://www.youtube.com/feeds/videos.xml?playlist_id=PLAYLIST_ID
 * This function fetches that feed server-side, parses out each video's
 * ID and title, and returns clean JSON. No authentication of any kind
 * is required — this is a public, documented YouTube feature.
 *
 * LIMITATION: this feed format returns roughly the 15 most recent videos
 * in the playlist (not the full history if it ever grows past that).
 * That's far more than enough for "لحظات فلسفية" (5 videos) and
 * "محاورات" (1 video) today, but worth knowing if either playlist grows
 * large later.
 *
 * SETUP: nothing to configure — just commit this file (already done in
 * the folder you have) and git push. Cloudflare Pages picks up any
 * `functions/` directory automatically.
 *
 * Test directly: visit
 *   https://your-site.pages.dev/api/youtube-playlist/PLWA-YFTjaHpM
 * in a browser — you should see JSON with a "videos" array, not an error.
 */

export async function onRequestGet(context) {
  const { params, request } = context;
  const playlistId = params.playlistId;

  if (!playlistId) {
    return jsonResponse({ error: 'Missing playlist id' }, 400);
  }

  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;

  let xml;
  try {
    const feedRes = await fetch(feedUrl);
    if (!feedRes.ok) {
      return jsonResponse(
        { error: `Could not fetch this playlist's feed (status ${feedRes.status}). Double check the playlist ID and that the playlist is public or unlisted (not private).` },
        502
      );
    }
    xml = await feedRes.text();
  } catch (err) {
    return jsonResponse({ error: 'Network error fetching the YouTube feed.' }, 502);
  }

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1]);

  const videos = entries
    .map((entry) => {
      const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
      return {
        videoId: videoIdMatch ? videoIdMatch[1].trim() : null,
        title: titleMatch ? decodeXmlEntities(titleMatch[1].trim()) : '',
        published: publishedMatch ? publishedMatch[1].trim() : '',
      };
    })
    .filter((v) => v.videoId);

  const response = jsonResponse({ videos }, 200, {
    'Cache-Control': 'public, max-age=3600', // re-check for new videos every hour
  });

  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function jsonResponse(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}
