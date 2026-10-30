#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert docs/PLATFORM.md into a beautifully styled RTL HTML file,
ready to be printed to PDF via headless Chrome.

Usage:
    python scripts/build-docs-pdf.py
Then print:
    chrome --headless --print-to-pdf=docs/PLATFORM.pdf docs/PLATFORM.html
"""
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "PLATFORM.md"
OUT = ROOT / "docs" / "PLATFORM.html"

md_text = SRC.read_text(encoding="utf-8")
md = markdown.Markdown(extensions=["tables", "sane_lists", "toc"])
body = md.convert(md_text)


def strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", "", html).strip()


# --- Extract cover pieces: first <h1> = title, first <blockquote> = tagline ---
m_h1 = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
title = strip_tags(m_h1.group(1)) if m_h1 else "منصة محبة الحكمة"
if m_h1:
    body = body[: m_h1.start()] + body[m_h1.end():]

m_bq = re.search(r"<blockquote>(.*?)</blockquote>", body, re.S)
tagline_html = m_bq.group(1).strip() if m_bq else ""
if m_bq:
    body = body[: m_bq.start()] + body[m_bq.end():]

# --- Table of contents from <h2 id="..."> headings ---
sections = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body, re.S)
toc_items = "\n".join(
    f'<li><a href="#{sid}">{strip_tags(text)}</a></li>' for sid, text in sections
)

CSS = """
:root {
  --primary: #0f766e; --primary-dark: #115e59;
  --secondary: #7c3aed; --accent: #d97706;
  --ink: #1e293b; --muted: #64748b; --cream: #fcfbf7; --line: #e2e8f0;
}
@page { size: A4; margin: 15mm 14mm 17mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  font-family: 'Tajawal', 'Segoe UI', Tahoma, Arial, sans-serif;
  direction: rtl; color: var(--ink); background: var(--cream);
  line-height: 1.85; margin: 0; font-size: 10.8pt;
}
a { color: var(--primary); text-decoration: none; }

/* ---------- Cover ---------- */
.cover {
  height: 261mm; border-radius: 20px; overflow: hidden;
  background: linear-gradient(160deg, #0f766e 0%, #134e4a 42%, #312e81 78%, #4c1d95 100%);
  color: #fff; display: flex; flex-direction: column;
  justify-content: center; align-items: center; text-align: center;
  padding: 22mm; page-break-after: always; position: relative;
}
.cover .ornament { font-size: 26pt; letter-spacing: 8px; opacity: .55; }
.cover h1 { font-size: 34pt; font-weight: 900; margin: 18px 0 6px; line-height: 1.35; }
.cover .tagline {
  font-size: 13pt; font-weight: 500; color: #d7f3ee; max-width: 130mm; line-height: 2;
}
.cover .tagline strong, .cover .tagline b { color: #fcd34d; }
.cover .divider {
  width: 58mm; height: 3px; border-radius: 3px; margin: 20px 0;
  background: linear-gradient(90deg, #2dd4bf, #a78bfa, #fbbf24);
}
.cover .meta {
  margin-top: 34px; font-size: 10.5pt; color: #c7d2fe; font-weight: 700;
  border: 1px solid rgba(255,255,255,.28); border-radius: 999px; padding: 6px 22px;
}

/* ---------- TOC ---------- */
.toc { page-break-after: always; }
.toc h2 { border: none; text-align: center; font-size: 20pt; margin-top: 8mm; }
.toc ol {
  list-style: none; padding: 0; margin: 10mm auto 0; max-width: 150mm; counter-reset: toc;
}
.toc li {
  counter-increment: toc; margin: 0 0 4.5mm; padding: 3mm 5mm;
  background: #fff; border: 1px solid var(--line); border-radius: 10px;
  font-weight: 700; page-break-inside: avoid;
}
.toc li::before {
  content: counter(toc, arabic-indic);
  display: inline-block; min-width: 8mm; text-align: center; margin-left: 4mm;
  background: linear-gradient(135deg, var(--primary), #14b8a6);
  color: #fff; border-radius: 8px; font-weight: 900;
}
.toc a { color: var(--ink); }
"""


CSS += """
/* ---------- Content ---------- */
.content { max-width: 172mm; margin: 0 auto; }
h2 {
  font-size: 16.5pt; font-weight: 900; color: var(--primary-dark);
  margin: 30px 0 12px; padding-bottom: 7px; page-break-after: avoid;
  border-bottom: 3px solid transparent;
  border-image: linear-gradient(90deg, var(--primary), var(--secondary), var(--accent)) 1;
}
h3 {
  font-size: 12.5pt; font-weight: 900; color: var(--secondary);
  margin: 20px 0 8px; page-break-after: avoid;
}
p { margin: 8px 0; }
strong { color: #0f172a; }
ul, ol { margin: 8px 0; padding-right: 22px; }
li { margin: 4px 0; page-break-inside: avoid; }
li::marker { color: var(--primary); font-weight: 900; }

table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  margin: 12px 0; font-size: 9.8pt; page-break-inside: avoid;
  border: 1px solid var(--line); border-radius: 12px; overflow: hidden;
  background: #fff;
}
thead:has(th:empty) { display: none; }
th {
  background: linear-gradient(135deg, var(--primary), var(--primary-dark));
  color: #fff; font-weight: 900; padding: 8px 12px; text-align: right;
}
td { padding: 8px 12px; border-bottom: 1px solid var(--line); vertical-align: top; }
tr:last-child td { border-bottom: none; }
tbody tr:nth-child(even) td { background: #f8fafc; }

blockquote {
  margin: 14px 0; padding: 12px 18px; page-break-inside: avoid;
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
  border-right: 4px solid var(--accent); border-radius: 12px;
  color: #78350f; font-weight: 500;
}
blockquote p { margin: 4px 0; }

hr {
  border: none; height: 2px; margin: 26px auto; width: 70%;
  background: linear-gradient(90deg, transparent, #99f6e4, #c4b5fd, #fcd34d, transparent);
}

.footer-note {
  margin-top: 34px; text-align: center; color: var(--muted);
  font-size: 9.5pt; font-weight: 700;
}
"""


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>__TITLE__</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Amiri:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>__CSS__</style>
</head>
<body>

<section class="cover">
  <div class="ornament">❁ ✦ ❁</div>
  <h1>__TITLE__</h1>
  <div class="divider"></div>
  <div class="tagline">__TAGLINE__</div>
  <div class="meta">mahabatalhikma.app &nbsp;•&nbsp; ٢٠٢٦</div>
</section>

<section class="toc">
  <h2>فهرس المحتويات</h2>
  <ol>
__TOC__
  </ol>
</section>

<main class="content">
__BODY__
</main>

</body>
</html>
"""

html = (
    HTML_TEMPLATE.replace("__TITLE__", title)
    .replace("__CSS__", CSS)
    .replace("__TAGLINE__", tagline_html)
    .replace("__TOC__", toc_items)
    .replace("__BODY__", body)
)

OUT.write_text(html, encoding="utf-8")
print(f"HTML written: {OUT}")
print(f"Sections in TOC: {len(sections)}")

