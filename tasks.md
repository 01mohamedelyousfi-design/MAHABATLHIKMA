# SEO & Technical Fixes Implementation Plan (tasks.md)
**Project**: Mahabat Lhikma (`https://mahabatlhikma.pages.dev`)  
**Based on Audit**: `mahabatlhikma.pages.dev-audit`  
**Status**: Ready for Execution  

---

## 📋 Task Checklist Overview

```
[x] Phase 1: Critical Server & Crawlability Infrastructure
[x] Phase 2: URL Normalization & Internal Link Optimization
[x] Phase 3: Head Metadata, Social Sharing & Canonicals
[x] Phase 4: Structured Data (Schema.org JSON-LD) Implementation
[x] Phase 5: On-Page Semantics, Image SEO & Information Architecture
[x] Phase 6: Quality Assurance & Final Verification
```

---

## Phase 1: Critical Server & Crawlability Infrastructure
*Fixes the SPA catchall bug serving HTML on `/robots.txt` and `/sitemap.xml`, and configures CDN caching.*

- [x] **Task 1.1: Create root `robots.txt`**
  - Path: [`robots.txt`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/robots.txt)
  - Purpose: Provide standard plain text crawler directives and declare sitemap location.
  - Verification: Ensure file returns `text/plain` and points to `https://mahabatlhikma.pages.dev/sitemap.xml`.

- [x] **Task 1.2: Create root `sitemap.xml`**
  - Path: [`sitemap.xml`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/sitemap.xml)
  - Purpose: Provide valid XML sitemap indexing all 8 canonical routes + interactive examples with `<lastmod>`, `<changefreq>`, and `<priority>`.
  - Verification: Zero XML parse errors (eliminates `"DOCTYPE is not allowed in sitemap XML"`).

- [x] **Task 1.3: Create Cloudflare Pages `_headers` configuration**
  - Path: [`_headers`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/_headers)
  - Purpose: Enforce 1-year immutable caching for static assets (`/assets/*`), security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`), and proper MIME types.

---

## Phase 2: URL Normalization & Internal Link Optimization
*Eliminates `308 Permanent Redirect` cascades caused by `.html` extensions on Cloudflare Pages.*

- [x] **Task 2.1: Update internal links in `index.html`**
  - Change all `href="xxx.html"` to clean relative URLs (`href="philomedia"`, `href="prompts"`, `href="skills"`, `href="games"`, `href="notebooklm"`, `href="booklet"`, `href="feedback"`).

- [x] **Task 2.2: Update internal links across all subpages**
  - [`philomedia.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/philomedia.html)
  - [`prompts.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/prompts.html)
  - [`skills.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/skills.html)
  - [`games.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/games.html)
  - [`notebooklm.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/notebooklm.html)
  - [`booklet.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/booklet.html)
  - [`feedback.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/feedback.html)
  - [`examples/aflatoon-freedom-programming/index.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/examples/aflatoon-freedom-programming/index.html)
  - Replace all `href="index.html"` with `href="/"`.

---

## Phase 3: Head Metadata, Social Sharing & Canonicals
*Adds missing meta descriptions, Open Graph, Twitter Cards, Canonical links, and font preconnects.*

- [x] **Task 3.1: Add Self-Referential `<link rel="canonical">` to all 8 HTML files**
  - Set canonical domain to `https://mahabatlhikma.pages.dev/...` on every page.

- [x] **Task 3.2: Add Missing Meta Descriptions**
  - Add rich Arabic description to [`philomedia.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/philomedia.html).
  - Add rich Arabic description to [`examples/aflatoon-freedom-programming/index.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/examples/aflatoon-freedom-programming/index.html).

- [x] **Task 3.3: Implement Open Graph Protocol (`og:*`) on all 8 HTML files**
  - `og:type` (`website` / `article`)
  - `og:site_name`: `محبة الحكمة | Mahabat Lhikma`
  - `og:title`, `og:description`, `og:url`
  - `og:image`: `https://mahabatlhikma.pages.dev/assets/logo/logo-mark.svg` (or dedicated preview image)
  - `og:locale`: `ar_AR`

- [x] **Task 3.4: Implement Twitter Card Tags (`twitter:*`) on all 8 HTML files**
  - `twitter:card`: `summary_large_image`
  - `twitter:title`, `twitter:description`, `twitter:image`

- [x] **Task 3.5: Add Google Fonts `preconnect` Resource Hints**
  - Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` to all HTML headers before Google Font stylesheets.

---

## Phase 4: Structured Data (Schema.org JSON-LD) Implementation
*Enables Google Rich Results, Knowledge Graph recognition, and Sitelinks.*

- [x] **Task 4.1: Homepage Schema (`index.html`)**
  - Implement JSON-LD with:
    - `WebSite` entity (with `name`, `url`, `inLanguage: "ar"`)
    - `EducationalOrganization` entity (with `name`, `logo`, `founder`, `sameAs`)
    - `Person` entity (Mohamed Elyousfi as creator/educator)

- [x] **Task 4.2: Educational Tools & Skills Schema (`skills.html`, `prompts.html`, `notebooklm.html`)**
  - Implement `BreadcrumbList` schema.
  - Implement `LearningResource` / `Course` schema detailing pedagogical objectives.

- [x] **Task 4.3: Media Gallery Schema (`philomedia.html`)**
  - Implement `BreadcrumbList` schema.
  - Implement `CollectionPage` / `MediaGallery` schema.

- [x] **Task 4.4: AI Booklet Schema (`booklet.html`)**
  - Implement `BreadcrumbList` schema.
  - Implement `DigitalDocument` / `Book` / `LearningResource` schema.

- [x] **Task 4.5: Games & Feedback Schema (`games.html`, `feedback.html`)**
  - Implement `BreadcrumbList` and `WebApplication` schema on `games.html`.
  - Implement `BreadcrumbList` and `ContactPage` schema on `feedback.html`.

---

## Phase 5: On-Page Semantics, Image SEO & Information Architecture
*Optimizes heading tree, Core Web Vitals (CLS/LCP), and cross-module crawl discovery.*

- [x] **Task 5.1: Fix Heading Hierarchy Across Subpages**
  - Ensure main visual titles in subpage headers use clean, prominent `<h1>` elements.
  - Clean up `<nav>` brand elements so they don't compete with primary subject `<h1>` tags.

- [x] **Task 5.2: Image SEO & Layout Shift Prevention**
  - Add explicit `width`, `height`, `loading="lazy"`, and `decoding="async"` to all images.
  - Add context-rich Arabic `alt` descriptions to profile photos, logos, and card visuals.

- [x] **Task 5.3: Deep Content Discovery & Static Linking**
  - Add direct static link to the Plato interactive module (`examples/aflatoon-freedom-programming/`) inside [`skills.html`](file:///c:/Users/Pc/Desktop/mahabatlhikma/mahabatlhikma-website/skills.html).

- [x] **Task 5.4: Contextual Cross-Linking (Related Modules Navigation)**
  - Add a consistent "أقسام أخرى قد تهمك" (Other sections you might like) footer widget across subpages to eliminate dead-end silos.

---

## Phase 6: Quality Assurance & Final Verification
*Automated validation of SEO schemas, crawl configurations, and internal links.*

- [x] **Task 6.1: Validate XML Sitemap syntax & canonical routes**
- [x] **Task 6.2: Validate `robots.txt` plain text crawler rules**
- [x] **Task 6.3: JSON-LD Syntax & Schema Validation across all files**
- [x] **Task 6.4: Validate all relative internal links & eliminate 404s**
