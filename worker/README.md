# 🧠 ذاكرة الحكمة — MahabatLhikma Memory Companion

> Study a lesson once on MahabatLhikma. The companion remembers it and brings
> it back through WhatsApp at the right time, as short concept-level quizzes.

```
MahabatLhikma (Cloudflare Pages, static)
        │  🧠 أضف إلى ذاكرة الحكمة  →  wa.me deep link with `mahaba_review_lesson=<id>`
        ▼
Cloudflare Worker (worker/)                ← zero paid infrastructure
        ├── D1 (SQLite at the edge)        users, lessons, concepts, review items…
        ├── Cron trigger (hourly)          per-user reminders at preferred time
        ├── Workers AI (optional)          semantic answer evaluation (Arabic)
        ├── FSRS-4.5 (src/fsrs.js)         self-contained spaced repetition
        └── WhatsAppProvider interface     Meta Cloud API  ⇆  Mock (dev/tests)
```

## Zero-cost design decisions

| Need | Choice | Why |
|---|---|---|
| Hosting/API | Cloudflare Workers free plan | existing CF infrastructure, 100k req/day |
| Database | Cloudflare D1 free tier | serverless SQLite, 5 GB free |
| Reminders | Cron Triggers (hourly) | free, no queues/Redis needed |
| AI evaluation | Workers AI free allocation (optional) | falls back to deterministic heuristic evaluator |
| WhatsApp | Meta WhatsApp Business Cloud API | the only official route — 1,000 service conversations/month free. No scraping, no unofficial clients. |
| Review items | Curated seeds grounded in the real lesson texts | no paid content generation for v1; AI can enrich later |

## Local development (no Cloudflare account needed)

```bash
cd worker
npm test          # 30 tests: bot flows, FSRS, evaluation, scheduling, mock WA
```

Tests run entirely on `node:sqlite` in-memory with the MockWhatsApp provider —
nothing is ever sent.

## Deploy (when ready)

```bash
cd worker
npx wrangler login
npx wrangler d1 create mahabatlhikma-memory        # paste database_id into wrangler.toml
npx wrangler d1 execute mahabatlhikma-memory --remote --file=migrations/0001_init.sql
npx wrangler secret put ADMIN_SECRET
npx wrangler deploy
```

Then in the site repo, set the bot number on lesson pages
(`<body data-wa-number="2126XXXXXXXX">`) or in `assets/js/memory-button.js`.

### WhatsApp (official Meta route)

1. Meta for Developers → create app → add **WhatsApp** product (free test number included).
2. Configure webhook: `https://<worker>/api/webhooks/whatsapp` with your `WHATSAPP_VERIFY_TOKEN`.
3. `npx wrangler secret put WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`.
4. Set `WHATSAPP_PROVIDER = "meta"` in `wrangler.toml`, redeploy.

## Dev harness (protected by `ADMIN_SECRET`)

```bash
# simulate a learner message (uses the bot logic, mock channel)
curl -X POST https://<worker>/api/dev/message \
  -H 'x-admin-secret: <secret>' -H 'content-type: application/json' \
  -d '{"waId":"2126...","text":"mahaba_review_lesson=person-identity"}'

# time-travel: advance the review clock by 3 days
curl -X POST https://<worker>/api/admin/advance-clock \
  -H 'x-admin-secret: <secret>' -d '{"days":3}'

# inspect users / due reviews / whatsapp events / open sessions
curl 'https://<worker>/api/admin/overview?secret=<secret>'
```

## Learner commands (natural language works; these are guaranteed)

| Message | Action |
|---|---|
| `mahaba_review_lesson=<id>` | deep-link from the website button |
| درست اليوم + lesson title | claim a lesson (fuzzy-matched against the catalog only) |
| مراجعة / ماذا أراجع؟ | start today's due review session |
| حالتي | memory-strength bars per concept |
| وقت المراجعة 19:30 | preferred daily reminder time (Africa/Casablanca default) |
| إيقاف المراجعة / تفعيل المراجعة | pause / resume notifications |
| حذف الذاكرة → نعم احذف ذاكرتي | full data deletion (right to be forgotten) |

## Architecture modules

```
src/catalog-data.js     generated from LESSONS_DATA (scripts/build-lesson-catalog.js)
src/lesson-seeds.js     QuestionGenerator output: concepts + items per lesson
src/fsrs.js             ReviewEngine (FSRS-4.5, zero deps)
src/evaluator.js        AnswerEvaluator (Workers AI → heuristic fallback)
src/scheduler.js        ReminderScheduler (timezones, daily window, priority)
src/bot.js              conversation orchestration (pure, testable)
src/repository.js       LessonRepository + UserRepository
src/review-repository.js ReviewRepository + SessionRepository
src/whatsapp.js         WhatsAppProvider: MetaWhatsAppProvider | MockWhatsAppProvider
src/db.js               D1 adapter; sqlite-adapter.node.js for tests
```

**Hard rule:** the bot only ever registers lessons that exist in the catalog.
Anything else is rejected with suggestions from the existing MahabatLhikma lessons.
