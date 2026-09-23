# Improvement Action Plan — mahabatlhikma.pages.dev

**Based on:** FULL-AUDIT-REPORT.md v2 (Health Score **84/100**, up from 82) · **Date:** 2026-09-19
**Status:** ✅ **Phase 1 implemented** (2026-09-19) · ✅ **Phase 2 implemented** (2026-09-23) · Phase 3 partially implemented (2026-09-23: 3.3 + 3.4 done; 3.1 blocked on YouTube upload; 3.2 ongoing). Phase 4 pending.
Effort: S = <1h · M = 1–4h · L = 1+ day

---

## ✅ Phase 1 — DONE (implemented 2026-09-19)

| # | Fix | Status | Evidence |
|---|---|---|---|
| 1.1 | Sitemap updated with the 3 live-but-unlisted freedom URLs | ✅ done | `sitemap.xml` now has **19 URLs** (well-formed XML, verified) |
| 1.2 | H1 semantics fixed on all 9 lesson pages (navbar brand `<h1>` → `<div>`, real page title `<h2>` → `<h1>`) | ✅ done | Validator: every page has exactly 1 `<h1>`, none is the brand |
| 1.3 | JSON-LD added to all 9 lesson pages (`LearningResource` + `BreadcrumbList`) | ✅ done | Validator: all 9 JSON-LD blocks parse; `inLanguage`, `educationalLevel`, `learningResourceType`, `teaches` present |
| 1.4 | `lucide.min.js` deferred on all 9 lesson pages (356 KB off the critical path) | ✅ done | `renderIcons()` guard added; 0 unguarded `lucide.createIcons()` calls |
| 1.5 | **(new finding)** Canonical/sitemap/internal-link alignment with Cloudflare's 308 trailing-slash URLs | ✅ done | 8 section URLs + 258 internal links + 65 metadata URLs normalised; `npm run check-links` → **ALL CHECKS PASSED** |
| 1.6 | **(new finding)** Canonical + full OG/Twitter suite added to the 3 identity lesson pages (they had none) | ✅ done | `lesson-identity`, `lesson-identity-synthesis`, `philosophers` now have canonical + OG + Twitter |
| 1.7 | Link checker extended to cover the 3 new lesson pages + examples page | ✅ done | `scripts/check-links.js` |

## ✅ Phase 2 — DONE (implemented 2026-09-23)

| # | Fix | Status | Evidence |
|---|---|---|---|
| 2.1 | Lesson pages repointed from the stale `lessons/assets/` duplicate tree to the optimised root `/assets/…` (72 refs across 9 pages; the 4 stale PNG names swapped for their WebP counterparts); the 6 philosopher images that existed only in the duplicate tree moved to `assets/philosophers/`; duplicate tree deleted — only `lessons/assets/css/tailwind.css` (lessons-specific build) remains | ✅ done | 19/19 `/assets/` refs resolve on disk; `npm run check-links` → **ALL CHECKS PASSED** (~17 MB of duplicates removed) |
| 2.2 | Heading hierarchy repaired: booklet section titles H3→H2 (×5), sub-items H4→H3 (×12); feedback success heading H3→H2 so no H3 precedes the first H2 | ✅ done | Heading scan: booklet H1→H2×5→H3×12, feedback H1→H2×2→H3×2 — no level skips |
| 2.3 | The two ~1 MB WebP covers recompressed to ≤1200px width | ✅ done | `value-cover.webp` 890→49 KB, `value-kant-gusdorf.webp` 1016→60 KB; also `georges-gusdorf.webp` 1148→84 KB and `immanuel-kant.webp` 1052→63 KB while moving them (same 1200px/q80 rule) |
| 2.4 | Pending working tree committed | ✅ done | `4534aec` (Phase 1 + memory-button/catalog/worker) + Phase 2 commit |
| 2.5 | True 404 status in `_redirects` instead of `/404.html 200` soft-404s | ✅ done | All 8 blocked paths now rewrite to `/404.html 404` |

Migration scripts kept for the record: `scripts/repoint-lesson-assets.js`, `scripts/optimize-lesson-images.js`, `scripts/fix-heading-hierarchy.js`.

## Phase 3 — Content & media (month 2) — 3.3 + 3.4 DONE (2026-09-23)

| # | Action | Status | Notes |
|---|---|---|---|
| 3.1 | Move the 3.66 MB `value-intro.mp4` to YouTube (unlisted embed) or Cloudflare Stream | ⏳ **blocked — needs the video uploaded to the site's YouTube channel**, then swap the `<video>` tag for a nocookie iframe (the pattern already exists in `assets/js/howto-video.js`). `identity-reel.mp4` no longer needs this: it was unreferenced and deleted with the duplicate tree in Phase 2.1 | Faster deploys, less bandwidth |
| 3.2 | Keep expanding lesson coverage toward the full Bac curriculum (one module/month) | 🔁 ongoing content work, not a code task | Topical authority for "فلسفة باك" queries |
| 3.3 | FAQ blocks (visible `<details>` accordions + `FAQPage` schema) added to prompts/booklet/skills pages — 5 Arabic Q&A per page, text-identical between markup and schema | ✅ done | New `npm run validate-schema`: 19 JSON-LD blocks parse; all 15 FAQ Q&A match visible content verbatim |
| 3.4 | Responsive `srcset` for lesson cover images — extended to story images + philosophers hero headers (the real LCP elements) | ✅ done | 25 variants (480/768/1200w) via `scripts/generate-responsive-images.js` (`npm run images:responsive`); heroes got `fetchpriority="high"` + `sizes="100vw"`; story images got `width`/`height` (CLS) + lazy; covers handled in the `lessons/index.html` card template; `check-links.js` now validates `srcset` URLs too → **ALL CHECKS PASSED** |

## Phase 4 — Monitoring (ongoing)
1. **Deploy** the current branch, then in Google Search Console: submit the updated sitemap, use "Validate fix" on the affected URLs, watch Coverage + CWV
2. Run `npm run check-links` (needs `npm run serve` on :8123) before each deploy
3. Re-audit in 4–6 weeks — target **score ≥ 92**

---

### Expected outcome after Phases 1–2

| Metric | Before | Now (after Phase 1) |
|---|---|---|
| Health Score | 84 | ~91 |
| Pages with correct H1 | 10/19 | **19/19** ✅ |
| Lesson pages with LearningResource schema | 0/9 | **9/9** ✅ |
| Sitemap ↔ live page parity | 16/19 URLs | **19/19** ✅ |
| Render-blocking JS | 356 KB on 9 pages | **deferred** ✅ |
| Internal links hitting a 308 redirect | 258 | **0** ✅ |
| Canonical pointing at a redirecting URL | 8 | **0** ✅ |
| Heavy duplicates still referenced | ~6 MB PNGs | **0 — duplicate tree deleted** ✅ |