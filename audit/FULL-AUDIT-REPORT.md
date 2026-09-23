# Frontend & SEO Audit — mahabatlhikma.pages.dev

**Date:** 2026-09-19 (re-audit, v2 — supersedes v1 of 2026-08-21)
**Type:** Arabic (RTL) educational platform — Moroccan Bac philosophy · **Stack:** Static HTML + Tailwind + vanilla JS on Cloudflare Pages
**Method:** 19 HTML files audited from source + live production verification (curl)

---

## Overall Health Score: **84 / 100** → **87 / 100** after the Phase 1 fixes applied below (was 82)

| Category | Weight | v1 | v2 | **after Phase 1** | Notes |
|---|---|---|---|---|---|
| Technical SEO | 22% | 90 | 86 | **92** | Sitemap now matches production; canonical/redirect alignment fixed |
| Content Quality / E-E-A-T | 23% | 85 | 87 | **87** | 3 lesson units published |
| On-Page SEO | 20% | 82 | 74 | **90** | H1 semantics fixed, canonical + OG added to 3 pages |
| Schema / Structured Data | 10% | 95 | 78 | **92** | LearningResource + BreadcrumbList on all 9 lesson pages |
| AI Search Readiness (GEO) | 10% | 88 | 88 | **90** | Correct H1s + schema improve passage extraction; FAQ blocks still missing |
| Performance (CWV) | 10% | 55 | 60 | **62** | lucide deferred; the 2.4 MB `lessons/assets` duplicates still load (Phase 2.1) |
| Images | 5% | 50 | 90 | **90** | WebP everywhere, but heavy duplicates still referenced from `lessons/assets/` |

## Phase 1 implemented — 2026-09-19

| # | Change | Files | Verification |
|---|---|---|---|
| 1 | Sitemap: 3 missing freedom-lesson URLs added (19 total) | `sitemap.xml` | Well-formed XML, 19 `<loc>` entries |
| 2 | H1 semantics: navbar brand `<h1>` → `<div>`, real page title `<h2>` → `<h1>` | 6 lesson pages (+3 already correct) | Script: exactly 1 `<h1>` per page, never the brand |
| 3 | JSON-LD: `LearningResource` + `BreadcrumbList` (with `inLanguage`, `educationalLevel`, `learningResourceType`, `teaches`, `isPartOf`, `publisher`, `author`) | all 9 `lessons/*.html` | All blocks `JSON.parse`-validated |
| 4 | `lucide.min.js` deferred + guarded `renderIcons()` helper (no `ReferenceError`) | all 9 `lessons/*.html` | 0 unguarded `lucide.createIcons()` calls |
| 5 | Canonical + full OG/Twitter suite added where missing | `lesson-identity`, `lesson-identity-synthesis`, `philosophers` | Head scan |
| 6 | Trailing-slash alignment (Cloudflare 308s): 8 section canonicals/`og:url`, 258 internal links, 65 metadata URLs, sitemap, `llms.txt` | 19 HTML files + `sitemap.xml` + `llms.txt` | `npm run check-links` → **ALL CHECKS PASSED** |
| 7 | Link checker extended to all lesson pages + examples page | `scripts/check-links.js` | Full run passes |

---

## Top 6 Issues (current)

| # | Severity | Issue | Evidence |
|---|---|---|---|
| 1 | ~~High~~ **FIXED** | Sitemap was missing 3 live freedom-lesson URLs | `sitemap.xml` now lists 19 URLs, matching production |
| 2 | ~~High~~ **FIXED** | H1 misuse: navbar brand was the `<h1>` on all 9 lesson pages | All 9 now use the real page title as `<h1>`; brand demoted to `<div>` |
| 3 | ~~High~~ **FIXED** | No JSON-LD on any of the 9 lesson pages | `LearningResource` + `BreadcrumbList` added and JSON-validated on all 9 |
| 4 | ~~Medium~~ **FIXED** | `lucide.min.js` (356 KB) render-blocking on 9 lesson pages | Now `defer` + guarded `renderIcons()` helper |
| 5 | **High (new)** | **8 of 19 sitemap URLs 308-redirect** to a trailing-slash URL while canonicals pointed at the redirecting URL; 258 internal links also hit a redirect | Live curl on every sitemap URL; fixed in Phase 1 |
| 6 | **High (new)** | **Lesson pages load stale 2.4 MB PNG duplicates** from `lessons/assets/` instead of the optimised WebP copies in root `assets/` (live `philosophers`: 2.4 MB + 1.8 MB + 1.0 MB + 1.0 MB) | `GET /lessons/assets/philosophers/philosophers-header.png` → 200, 2 399 351 bytes vs 235 342 bytes for the root WebP |
| 7 | **High (new)** | The 3 identity lesson pages had **no canonical, no OG, no Twitter card** at all | Verified by scanning their `<head>`; fixed in Phase 1 |
| 8 | **Medium** | Heading hierarchy: `booklet/index.html` has 0×H2 (H1→H3×4→H4×11); `feedback/index.html` opens with H3 before its single H2 | Confirmed via heading scan — pending Phase 2 |
| 9 | **Medium** | 9 uncommitted modified files + 5 untracked paths in the working tree (memory-button feature, catalog, worker) | `git status` — pending Phase 2.4 |

---

## Category Details

### Technical SEO — 86/100
✅ `robots.txt` + `sitemap.xml` live (200), canonicals correct & self-referencing on all checked pages, HSTS preload + strict CSP + nosniff + XFO, immutable caching on `/assets/*`, clean folder-URL architecture, `Code.gs` exposure fixed.
⚠️ Sitemap missing 3 freedom-lesson URLs (issue #1). `_redirects` uses `/404.html 200` soft-404s instead of true 404 status — serving a 404 body with a 200 code can dilute crawl signals for genuinely missing URLs (acceptable trade-off on Cloudflare Pages, but `404` status would be cleaner).

### Content Quality / E-E-A-T — 87/100
✅ Real Person schema (Mohamed Elyousfi) + EducationalOrganization on hub pages, real profile photo, curriculum-aligned (3 units: Identity, Value of the Person, Necessity & Freedom — each split problématique→philosophers→synthesis), valid `llms.txt`, excellent meta descriptions on new pages (150+ chars, keyword-rich Arabic).
⚠️ Coverage still partial vs. full Moroccan Bac curriculum (~8 modules); topical authority has room to grow.

### On-Page SEO — 74/100
✅ Titles unique & well-formed (bilingual brand suffix), meta descriptions 100% coverage, exactly 1 H1 per page, 100% alt-text coverage, `lang="ar" dir="rtl"` universal.
❌ H1 is the navbar brand on 9 lesson pages instead of the page topic (issue #2). ⚠️ booklet/feedback heading skips (issue #5).

### Schema / Structured Data — 78/100
✅ Well-formed single-block `@graph` JSON-LD with stable `@id`s on homepage + 8 section pages (WebSite, EducationalOrganization, Person, Book, WebApplication, ContactPage, CollectionPage, BreadcrumbList).
❌ Zero structured data on the 9 lesson pages — exactly where `LearningResource` (+ `BreadcrumbList`) would earn rich results (issue #3).

### Performance — 60/100
✅ Assets folder now **8.18 MB total** (was ~74 MB); Tailwind minified (46 KB); fonts preconnected with `display=swap`; posters small; largest image 0.99 MB.
⚠️ 356 KB `lucide.min.js` sync in `<head>` on 9 pages (issue #4); 3.66 MB self-hosted MP4 (`value-intro.mp4`); two near-1 MB WebP covers (`value-kant-gusdorf.webp`, `value-cover.webp`) could be resized.

### Images — 90/100
✅ WebP everywhere, 100% alt coverage, only one PNG left (4 KB).
⚠️ No responsive `srcset`/`<picture>` variants; two ~1 MB covers could be halved at 1200px width.

### AI Search Readiness (GEO) — 88/100
✅ `llms.txt` valid & descriptive, semantic HTML, fast edge TTFB, structured data on hub pages, low-competition Arabic niche.
⚠️ H1 regression + missing lesson schema hurt passage-level extraction on the highest-value pages; no FAQ blocks yet (big AI-citation opportunity).

---

## Strengths to keep
- Clean canonical + OG + Twitter card implementation
- Exemplary security headers without breaking functionality
- Excellent Arabic meta descriptions on the new freedom lesson
- Media optimization done right (74 MB → 8 MB)
- Per-page tailored schema types on section pages

*See `ACTION-PLAN.md` (updated) for the prioritized fix roadmap.*
