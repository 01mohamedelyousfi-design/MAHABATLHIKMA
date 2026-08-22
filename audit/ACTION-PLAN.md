# Improvement Action Plan — mahabatlhikma.pages.dev

**Based on:** FULL-AUDIT-REPORT.md (Health Score 82/100) · **Date:** 2026-08-21
Effort: S = <1h · M = 1–4h · L = 1+ day

---

## Phase 1 — Critical & High (this week)

| # | Fix | Files | Effort | Impact |
|---|---|---|---|---|
| 1.1 | **Deploy current branch** — moves `Code.gs` into `google-apps-script/` and activates `_redirects` blocks (`/Code.gs`, `/scripts/*`, configs currently live on production) | `git push` | S | Closes public source-code exposure |
| 1.2 | **Add `defer` to `lucide.min.js`** on all 12 pages (and `howto-video.js` on booklet/skills). Verify icons still init — may need `DOMContentLoaded` wrapper | every `index.html` + `lessons/*.html` | S | Major LCP/TBT improvement; ~347 KB off critical path |
| 1.3 | **Fix examples-page `og:image`** — replace `logo-mark.svg` with `/assets/logo/og-image.png`; add width/height/alt like other pages | `examples/aflatoon-freedom-programming/index.html` | S | Working social share cards |
| 1.4 | **Convert PNGs → WebP** and update references: `philosophers-header.png`, `john-locke.png`, `freud.png`, `schopenhauer.png`, both `example-*.png`. `sharp` is already in devDependencies — add an npm script | assets + referencing HTML/JS | M | ~8 MB → ~2 MB; faster lessons/games pages |

## Phase 2 — Medium (weeks 2–3)

| # | Fix | Files | Effort |
|---|---|---|---|
| 2.1 | Repair heading hierarchy: add real H2s to booklet page (17 headings, zero H2); reorder feedback page so H2 precedes H3s | `booklet/index.html`, `feedback/index.html` | S |
| 2.2 | Add missing `og:image:width/height/alt` to the 3 identity lesson pages | `lessons/identity-*.html` | S |
| 2.3 | Self-host fonts (Tajawal, Amiri as woff2 in `assets/fonts/`) — removes Google Fonts dependency, tightens CSP (`style-src/font-src 'self'`), improves LCP consistency | all pages + `_headers` | M |
| 2.4 | Unify Tailwind builds — single config producing both outputs; delete `tailwind.example.config.js` drift risk | `package.json`, root | S |
| 2.5 | Normalize asset paths to root-absolute (`/assets/...`) everywhere incl. root `index.html`; fix skills-page link to `/examples/aflatoon-freedom-programming/` | several pages | S |
| 2.6 | Standardize font family (Cairo vs Tajawal inconsistency on examples page) or intentionally keep brand distinction | examples page | S |

## Phase 3 — Content & Media Strategy (month 2)

| # | Action | Notes |
|---|---|---|
| 3.1 | Move MP3s/MP4s off the static bundle (~63 MB) → YouTube (unlisted/embed), Cloudflare Stream/R2, or at minimum re-encode (AAC 96k audio ≈ −70%) | Faster deploys, lower bandwidth |
| 3.2 | Expand lesson coverage beyond Identity unit — one new module/month builds topical authority for Moroccan Bac philosophy queries | SEO + monetization foundation |
| 3.3 | Add FAQ blocks (visible text + FAQPage schema) to prompts/booklet/skills pages — strong AI-citation candidates | GEO win, low competition in Arabic |
| 3.4 | Enrich LearningResource schema: `inLanguage: "ar"`, `educationalLevel: "2ème Bac"`, `learningResourceType` | Rich-result eligibility |
| 3.5 | Write unique 140–160 char descriptions for thin lesson pages (currently 81c min) | CTR improvement |

## Phase 4 — Monitoring (ongoing)

1. **Google Search Console** — verify property (verification file already present!), submit sitemap, watch Coverage + CWV reports
2. **Re-run link checker before each deploy:** `npm run check-links`
3. **Set up drift baseline** after Phase 1 fixes to catch future regressions
4. **Monthly re-audit** — target: score 90+ after Phases 1–2

---

### Expected outcome

| Metric | Now | After Phase 1–2 |
|---|---|---|
| Health Score | 82 | ~93 |
| JS on critical path | 347 KB | ~0 KB (deferred) |
| Image payload (key pages) | ~11 MB | ~2–3 MB |
| Exposed files on prod | Code.gs + configs | none |
