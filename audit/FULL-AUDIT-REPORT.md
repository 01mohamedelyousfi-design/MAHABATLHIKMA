# Full Website Audit Report — mahabatlhikma.pages.dev

**Date:** 2026-08-21 · **Type:** Education platform (Arabic/RTL, Moroccan Bac philosophy) · **Stack:** Static HTML + Cloudflare Pages + Pages Functions
**Scope:** 14 HTML pages analyzed from source + live deployment header checks

---

## Overall Health Score: **82 / 100**

| Category | Weight | Score | Weighted |
|---|---|---|---|
| Technical SEO | 22% | 90 | 19.8 |
| Content Quality / E-E-A-T | 23% | 85 | 19.6 |
| On-Page SEO | 20% | 82 | 16.4 |
| Schema / Structured Data | 10% | 95 | 9.5 |
| AI Search Readiness (GEO) | 10% | 88 | 8.8 |
| Performance (CWV) | 10% | 55 | 5.5 |
| Images | 5% | 50 | 2.5 |

---

## Top 5 Issues

| # | Severity | Issue | Evidence |
|---|---|---|---|
| 1 | **Critical** | `Code.gs` (Apps Script source) publicly served on production | Live check: `GET /Code.gs` → 200. Local `_redirects` fix exists but is **not yet deployed** |
| 2 | **High** | 347 KB `lucide.min.js` loaded synchronously (render-blocking) on 12 pages | No `defer`/`async`; icon library blocks first paint → LCP/TBT penalty |
| 3 | **High** | Unoptimized media (~74 MB total assets) | PNGs up to 2.6 MB (`philosophers-header.png` 2.4 MB), MP3s up to 17.8 MB ×4 (37 MB), MP4s 25.5 MB — no WebP/AVIF/compression |
| 4 | **High** | SVG used as `og:image` on examples page | Facebook/X/WhatsApp scrapers don't render SVG → broken share card (`examples/aflatoon-freedom-programming/index.html`) |
| 5 | **Medium** | Heading hierarchy breaks | `booklet/index.html`: zero H2 across 17 headings (H1→H3→H4); `feedback/index.html`: opens H3 before its single H2 |

## Top 5 Quick Wins

1. Deploy current branch (moves `Code.gs` + adds `_redirects` blocks) — closes issue #1 instantly
2. Add `defer` to `lucide.min.js` script tag on all 12 pages (one-line change each)
3. Swap examples page `og:image` SVG → existing `og-image.png`
4. Convert philosopher/example PNGs → WebP (~70–80% size reduction expected)
5. Fix H2 headings in booklet + feedback pages

---

## Category Findings

### Technical SEO — 90/100
✅ robots.txt + sitemap.xml live (both 200), canonicals on all indexable pages matching sitemap exactly (13 URLs), security headers exemplary (HSTS preload, strict CSP, nosniff, XFO, Permissions-Policy), HTTP/3 enabled, immutable caching on `/assets/*`, HTML served UTF-8.
⚠️ `/Code.gs` exposed on production (fix staged locally, undeployed). `Cache-Control: max-age=0, must-revalidate` on HTML — correct choice, no issue.

### Content Quality / E-E-A-T — 85/100
✅ Strong author identity: Person schema (Mohamed Elyousfi) + EducationalOrganization on every content page; real profile photo; curriculum-aligned (2ème Bac Identity unit split problematique→philosophers→synthesis); llms.txt valid UTF-8 with section map.
⚠️ Single lesson unit published (Identity) — topical depth thin vs. full Moroccan Bac curriculum; descriptions on some lesson pages are short (81c minimum).

### On-Page SEO — 82/100
✅ Exactly 1 H1 per page (all 14); titles 31–59 chars; meta descriptions 71–143 chars; viewport meta universal; 100% static-image alt coverage; uniform `lang="ar" dir="rtl"`.
⚠️ Heading skips on booklet/feedback; 4 pages missing `og:image:width/height/alt`; mixed relative vs absolute asset paths (root index.html only); skills page links raw `index.html` path instead of directory URL.

### Schema / Structured Data — 95/100
✅ Well-formed single-block JSON-LD `@graph` with stable `@id`s on every page: WebSite, EducationalOrganization, Person, Book, WebApplication, ContactPage, CollectionPage, LearningResource, BreadcrumbList. Appropriate type selection per page.
⚠️ LearningResource pages could add `educationalLevel`, `inLanguage: "ar"`, `learningResourceType`; FAQ schema opportunity on prompts/booklet pages.

### Performance (CWV) — 55/100
⚠️ Render-blocking JS: `lucide.min.js` (347 KB) sync-loaded on 12 pages; `howto-video.js` also sync on 2 pages.
⚠️ LCP images heavy: lesson covers 208 KB JPG (acceptable) but philosophers PNGs 1–2.4 MB; example PNGs 2.3–2.6 MB.
⚠️ 37 MB MP3 + 25.5 MB MP4 self-hosted — inflates build size and bandwidth; no `preload` metadata hints on audio.
✅ Tailwind CSS minified (46 KB single file); Google Fonts with preconnect + `display=swap`.

### Images — 50/100
✅ Alt text coverage 100% on static images.
⚠️ Format: 11 MB across 8 PNGs where WebP/AVIF would cut ~75%; no `<picture>`/srcset responsive variants; poster images OK (61 KB).

### AI Search Readiness (GEO) — 88/100
✅ llms.txt valid + descriptive; semantic HTML; passage-friendly headings on most pages; structured data aids entity extraction; fast TTFB via Cloudflare edge.
⚠️ Heading breaks hurt passage-level extraction on 2 pages; no FAQ/Q&A blocks formatted for direct citation; Arabic content is an advantage (low competition in AI answers for this niche).

---

## Strengths (keep doing)

- Clean URL architecture (folder/index.html pattern), consistent canonicals
- Best-practice security headers incl. strict CSP without breaking functionality
- Complete OG + Twitter card suite on 13/14 indexable pages
- Per-page tailored schema types (not copy-paste boilerplate)
- Zero broken internal links (link checker passes all 13 pages)
- Free, fast global hosting with proper cache headers

*Generated by automated audit — see ACTION-PLAN.md for the prioritized fix roadmap.*
