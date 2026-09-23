# Improvement Action Plan — mahabatlhikma.pages.dev

**Based on:** FULL-AUDIT-REPORT.md v2 (Health Score **84/100**, up from 82) · **Date:** 2026-09-19
**Status:** ✅ **Phase 1 implemented** (2026-09-19) — see the completion log at the bottom. Phases 2–4 pending.
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

## Phase 2 — Medium (next)

| # | Fix | Files | Effort |
|---|---|---|---|
| 2.1 | **Repoint lesson pages to the optimised root assets and delete the stale duplicate tree.** Live `philosophers` page still serves **2.4 MB `philosophers-header.png` + 1.8 MB `john-locke.png` + 1.0 MB ×2** from `lessons/assets/` while 235 KB WebP versions exist in root `assets/`. Change `assets/…` → `/assets/…` on the 9 lesson pages, then remove the duplicated media under `lessons/assets/` (keep `lessons/assets/css/tailwind.css`, which is the lessons-specific build) | `lessons/*.html`, `lessons/assets/*` | M |
| 2.2 | Repair heading hierarchy: booklet section titles H3→H2, sub-items H4→H3; feedback page H2 before H3s | `booklet/index.html`, `feedback/index.html` | S |
| 2.3 | Compress the two ~1 MB WebP covers (`value-*.webp`) to ≤1200px width | `assets/lessons/` | S |
| 2.4 | Commit the pending working tree (memory-button feature, 9 lesson pages, catalog, worker) — currently 19 modified + 5 untracked paths | `git` | S |
| 2.5 | Consider true 404 status in `_redirects` instead of `/404.html 200` soft-404s | `_redirects` | S |

## Phase 3 — Content & media (month 2)

| # | Action | Notes |
|---|---|---|
| 3.1 | Move the 3.66 MB `value-intro.mp4` (and `identity-reel.mp4`, 9.1 MB in the duplicate tree) to YouTube (unlisted embed) or Cloudflare Stream | Faster deploys, less bandwidth |
| 3.2 | Keep expanding lesson coverage toward the full Bac curriculum (one module/month) | Topical authority for "فلسفة باك" queries |
| 3.3 | Add FAQ blocks (visible + `FAQPage` schema) to prompts/booklet/skills pages | Strong AI-citation candidates in Arabic |
| 3.4 | Responsive `srcset` for lesson cover images | Better mobile LCP |

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
| Heavy duplicates still referenced | ~6 MB PNGs | ⚠️ pending Phase 2.1 |