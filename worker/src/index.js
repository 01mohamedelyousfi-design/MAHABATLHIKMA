/**
 * index.js — Cloudflare Worker entry for the MahabatLhikma Memory Companion.
 *
 * Routes:
 *   GET  /api/health                      liveness
 *   GET  /api/webhooks/whatsapp           Meta webhook verification
 *   POST /api/webhooks/whatsapp           inbound WhatsApp messages
 *   POST /api/dev/message                 dev harness (protected by ADMIN_SECRET)
 *   GET  /api/admin/*                     debug dashboard data (ADMIN_SECRET)
 *   POST /api/admin/advance-clock         dev time travel (days) — admin only
 *   scheduled()                           hourly cron: daily reminders
 *
 * Modular wiring:
 *   LessonRepository / ReviewRepository / UserRepository / SessionRepository
 *   ReviewEngine (fsrs.js) / QuestionGenerator output (lesson-seeds.js)
 *   AnswerEvaluator (evaluator.js) / ReminderScheduler (scheduler.js)
 *   WhatsAppProvider (whatsapp.js — Meta or Mock)
 */

import { D1Adapter } from './db.js';
import { LessonRepository, UserRepository } from './repository.js';
import { ReviewRepository, SessionRepository } from './review-repository.js';
import { Bot } from './bot.js';
import { buildWhatsAppProvider } from './whatsapp.js';
import { buildEvaluator } from './evaluator.js';
import { shouldRemind, pickSessionItems, localDate } from './scheduler.js';
import { T } from './templates.js';

const DAY = 86400000;

/** Simulated clock: real now + dev offset stored in dev_clock table. */
async function getNow(env) {
  try {
    const row = await env.DB.prepare(
      `SELECT v FROM dev_clock WHERE k = 'offset_ms'`
    ).first();
    return Date.now() + (row ? Number(row.v) || 0 : 0);
  } catch {
    return Date.now(); // table missing in prod is fine
  }
}

function makeBot(env) {
  const db = new D1Adapter(env.DB);
  return new Bot({
    lessons: new LessonRepository(db),
    users: new UserRepository(db),
    reviews: new ReviewRepository(db),
    sessions: new SessionRepository(db),
    evaluator: buildEvaluator(env),
    siteUrl: env.SITE_URL || 'https://mahabatlhikma.pages.dev',
  });
}

async function logEvent(env, direction, waId, body, kind) {
  try {
    await env.DB.prepare(
      'INSERT INTO whatsapp_events (direction, wa_id, body, kind) VALUES (?, ?, ?, ?)'
    ).bind(direction, waId, body, kind).run();
  } catch { /* never block */ }
}

/** Process one inbound message end-to-end and send replies. */
async function processInbound(env, waId, text) {
  const provider = buildWhatsAppProvider(env);
  const bot = makeBot(env);
  const now = await getNow(env);
  await logEvent(env, 'in', waId, text, 'text');
  let replies;
  try {
    replies = await bot.handleMessage(waId, text, now);
  } catch (err) {
    await logEvent(env, 'error', waId, String(err && err.stack || err), 'handler_error');
    replies = ['حدث خلل مؤقت في النظام. حاول مرة أخرى بعد قليل من فضلك.'];
  }
  for (const r of replies) {
    await provider.sendMessage(waId, r);
  }
  return replies;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // --- health ---
    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, service: 'mahabatlhikma-memory' });
    }

    // --- WhatsApp webhook (Meta) ---
    if (url.pathname === '/api/webhooks/whatsapp') {
      if (request.method === 'GET') {
        const mode = url.searchParams.get('hub.mode');
        const token = url.searchParams.get('hub.verify_token');
        const challenge = url.searchParams.get('hub.challenge');
        if (mode === 'subscribe' && token && token === env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge || '', { status: 200 });
        }
        return new Response('forbidden', { status: 403 });
      }
      if (request.method === 'POST') {
        // NOTE: full X-Hub-Signature-256 validation requires the app secret;
        // configure WHATSAPP_APP_SECRET and it will be enforced.
        if (env.WHATSAPP_APP_SECRET) {
          const ok = await verifySignature(request.clone(), env.WHATSAPP_APP_SECRET);
          if (!ok) return new Response('invalid signature', { status: 401 });
        }
        let body;
        try { body = await request.json(); } catch { return new Response('bad json', { status: 400 }); }
        const messages = extractMessages(body);
        // Always 200 fast; process async to avoid webhook retries.
        ctx.waitUntil((async () => {
          for (const m of messages) {
            await processInbound(env, m.from, m.text);
          }
        })());
        return new Response('ok', { status: 200 });
      }
      return new Response('method not allowed', { status: 405 });
    }

    // --- Dev message harness: POST /api/dev/message { waId, text } ---
    if (url.pathname === '/api/dev/message' && request.method === 'POST') {
      if (!checkAdmin(request, env)) return new Response('unauthorized', { status: 401 });
      let body;
      try { body = await request.json(); } catch { return new Response('bad json', { status: 400 }); }
      const waId = String(body.waId || 'dev-user');
      const text = String(body.text || '');
      const bot = makeBot(env);
      const now = await getNow(env);
      const replies = await bot.handleMessage(waId, text, now);
      await logEvent(env, 'in', waId, text, 'dev');
      for (const r of replies) await logEvent(env, 'out', waId, r, 'dev');
      return Response.json({ now, waId, replies });
    }

    // --- Admin: advance the simulated clock ---
    if (url.pathname === '/api/admin/advance-clock' && request.method === 'POST') {
      if (!checkAdmin(request, env)) return new Response('unauthorized', { status: 401 });
      let body = {};
      try { body = await request.json(); } catch { /* empty ok */ }
      const days = Number(body.days || 1);
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS dev_clock (k TEXT PRIMARY KEY, v TEXT)`
      ).run();
      const row = await env.DB.prepare(`SELECT v FROM dev_clock WHERE k = 'offset_ms'`).first();
      const offset = (row ? Number(row.v) || 0 : 0) + days * DAY;
      await env.DB.prepare(
        `INSERT INTO dev_clock (k, v) VALUES ('offset_ms', ?)
         ON CONFLICT(k) DO UPDATE SET v = excluded.v`
      ).bind(String(offset)).run();
      const now = Date.now() + offset;
      return Response.json({ advancedDays: days, offsetMs: offset, simulatedNow: now,
        simulatedLocalCasablanca: localDate(now, 'Africa/Casablanca') });
    }

    // --- Admin debug view (JSON) ---
    if (url.pathname === '/api/admin/overview' && request.method === 'GET') {
      if (!checkAdmin(request, env)) return new Response('unauthorized', { status: 401 });
      const db = new D1Adapter(env.DB);
      const now = await getNow(env);
      const [users, lessons, items, events, due, waEvents, openSessions] = await Promise.all([
        db.all('SELECT id, whatsapp_id, created_at, last_seen_at FROM users ORDER BY id DESC LIMIT 50'),
        db.all('SELECT * FROM lessons'),
        db.first('SELECT COUNT(*) AS n FROM review_items'),
        db.first('SELECT COUNT(*) AS n FROM review_events'),
        db.all(`SELECT ri.id, ri.user_id, ri.lesson_id, ri.concept_id, ri.fsrs_state,
                  ri.next_review_at, ri.review_count, ri.lapses, ri.stability
                FROM review_items ri WHERE ri.next_review_at <= ? ORDER BY ri.next_review_at ASC LIMIT 50`, [now]),
        db.all('SELECT id, direction, wa_id, substr(body,1,200) AS body, kind, created_at FROM whatsapp_events ORDER BY id DESC LIMIT 50'),
        db.all(`SELECT id, user_id, kind, lesson_id, current_index, status FROM sessions WHERE status='open'`),
      ]);
      return Response.json({
        now, users, lessons, reviewItemsCount: items?.n || 0,
        reviewEventsCount: events?.n || 0, dueNow: due, whatsappEvents: waEvents,
        openSessions,
      });
    }

    return new Response('not found', { status: 404 });
  },

  /** Hourly cron: send daily review reminders at each user's preferred time. */
  async scheduled(event, env, ctx) {
    const db = new D1Adapter(env.DB);
    const reviews = new ReviewRepository(db);
    const users = new UserRepository(db);
    const lessons = new LessonRepository(db);
    const provider = buildWhatsAppProvider(env);
    const now = Date.now();

    await lessons.syncCatalog();

    const dueUsers = await reviews.usersWithDue(now);
    for (const u of dueUsers) {
      const settings = await users.getSettings(u.id);
      if (!shouldRemind({ settings, hasDue: true, now })) continue;

      const dueItems = await reviews.dueItems(u.id, now, 20);
      const items = pickSessionItems(dueItems, settings.daily_review_limit || 4);
      if (!items.length) continue;

      const lessonIds = [...new Set(items.map((i) => i.lesson_id))];
      const titles = lessonIds
        .map((id) => lessons.getCatalogLesson(id)?.title || id)
        .join('، ');
      await provider.sendMessage(u.whatsapp_id, T.reviewIntro(titles, items.length));
      await db.run(
        'UPDATE user_settings SET last_reminder_date = ? WHERE user_id = ?',
        [localDate(now, settings.timezone || 'Africa/Casablanca'), u.id]
      );
    }
  },
};

// === helpers ===

function checkAdmin(request, env) {
  const secret = env.ADMIN_SECRET;
  if (!secret) return false; // no admin secret configured -> admin routes closed
  const url = new URL(request.url);
  return request.headers.get('x-admin-secret') === secret ||
    url.searchParams.get('secret') === secret;
}

/** Extract (from, text) pairs from a Meta webhook payload. */
function extractMessages(body) {
  const out = [];
  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const msg of value.messages || []) {
          if (msg.type === 'text' && msg.text && msg.text.body) {
            out.push({ from: msg.from, text: msg.text.body });
          }
        }
      }
    }
  } catch { /* ignore malformed payloads */ }
  return out;
}

/** Validate X-Hub-Signature-256 with the Meta app secret. */
async function verifySignature(request, appSecret) {
  const sig = request.headers.get('x-hub-signature-256') || '';
  if (!sig.startsWith('sha256=')) return false;
  const raw = await request.text();
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hex}` === sig;
}

