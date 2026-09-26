/**
 * build-system-prompts.js
 *
 * Copies the standalone system prompt of every skill card into
 * assets/data/skill-system-prompts.json, which skills/index.html fetches to
 * power its "نسخ System Prompt" buttons.
 *
 * Single source of truth: Skills/specs/system-prompts/<folder>/SYSTEM.md — the
 * folder kept next to the downloadable skill packages (outside this repository,
 * because it also holds the ZIPs). Override it when needed:
 *
 *   node scripts/build-system-prompts.js "D:\path\to\system-prompts"
 *
 * Every skill id found in skills/index.html must be mapped in SKILL_PROMPTS,
 * otherwise the build fails on purpose: a card whose prompt cannot be copied is
 * a bug, not a warning. Ids come from the page, so the JSON order always
 * matches the card order and a new card can never ship silently without a prompt.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INDEX_HTML = path.join(ROOT, 'skills', 'index.html');
const OUT_JSON = path.join(ROOT, 'assets', 'data', 'skill-system-prompts.json');
const SOURCE_DIR = process.argv[2] || path.join(ROOT, '..', 'Skills', 'specs', 'system-prompts');

/** skill id on the page -> folder name under SOURCE_DIR */
const SKILL_PROMPTS = {
  aflatoon: 'aflatoon',
  storm: 'storm-research',
  teach: 'teach',
  'philosophy-tutor': 'philosophy-tutor',
  tawjih: 'tawjih-assistant',
  sophist: 'sophist',
};

/** Skill ids declared in the SKILLS array of the skills page, in page order. */
function skillIdsOnPage() {
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  return [...html.matchAll(/^\s*id: '([^']+)',/gm)].map((m) => m[1]);
}

function readPrompt(skillId) {
  const file = path.join(SOURCE_DIR, SKILL_PROMPTS[skillId], 'SYSTEM.md');
  if (!fs.existsSync(file)) {
    throw new Error(`missing system prompt for "${skillId}": ${file}`);
  }
  const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n').trimEnd();
  if (!text) throw new Error(`empty system prompt for "${skillId}": ${file}`);
  return text + '\n';
}

const ids = skillIdsOnPage();
const unmapped = ids.filter((id) => !SKILL_PROMPTS[id]);
if (unmapped.length) {
  throw new Error(
    `skills/index.html has cards without a mapped system prompt: ${unmapped.join(', ')} — add them to SKILL_PROMPTS`
  );
}

const prompts = {};
for (const id of ids) prompts[id] = readPrompt(id);

fs.writeFileSync(OUT_JSON, JSON.stringify(prompts, null, 2) + '\n', 'utf8');
console.log(`system prompts: ${ids.length} -> ${path.relative(ROOT, OUT_JSON)}`);
for (const id of ids) console.log(`  - ${id}: ${prompts[id].length} chars`);
