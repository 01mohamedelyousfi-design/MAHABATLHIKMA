/**
 * intents.js — natural-language intent parsing + fuzzy Arabic lesson matching.
 *
 * The bot never invents lessons: matching only happens against the catalog
 * that LessonRepository exposes (canonical MahabatLhikma lessons).
 */

const PREFIX_RE = /^(mahaba_review_lesson|mahaba_review)\s*[=:]?\s*/i;
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function normalizeArabic(s) {
  return String(s || '')
    .replace(/[ً-ْٰ]/g, '')      // diacritics
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[«»"“”()[\],.;:!؟?_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeDigits(s) {
  return String(s).replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/**
 * Parse an incoming learner message into { name, payload }.
 * Returns { name: 'unknown' } when nothing matches.
 */
export function parseIntent(raw) {
  const text = String(raw || '').trim();
  if (!text) return { name: 'empty' };

  // 1) Machine token coming from the website deep link (Flow A).
  const m = text.match(PREFIX_RE);
  if (m) {
    const rest = text.slice(m[0].length).trim();
    return { name: 'add_lesson_token', payload: { lessonId: rest } };
  }

  const norm = normalizeArabic(normalizeDigits(text));

  // 2) Confirmation of a destructive action.
  if (/^نعم\s*(احذف|امسح)/.test(norm) || norm === 'نعم احذف ذاكرتي') {
    return { name: 'confirm_delete' };
  }

  // 3) Simple commands.
  if (/^(ابدا|بدا|مرحبا|اهلا|السلام عليكم|وعليكم|هاي|salam)/.test(norm)) return { name: 'greeting' };
  if (norm === 'مساعده' || norm === 'مساعدة' || norm === 'help') return { name: 'help' };
  if (norm === 'الدروس' || norm === 'الدروس المتاحه' || norm === 'استعرض الدروس') return { name: 'list_lessons' };
  if (/^(مراجعه|مراجعتي|مراجعتي اليوم|اريد المراجعه|لنراجع|نعم)$/.test(norm) ||
      /ماذا اراجع/.test(norm)) return { name: 'start_review' };
  if (/^(حالتي|تقدمي|قوة ذاكرتي|حاله ذاكرتي|ذاكرتي)$/.test(norm)) return { name: 'status' };
  if (/^(ايقاف|اوقف|الغاء|الغ).*(مراجعه|تذكير)/.test(norm)) return { name: 'pause' };
  if (/^(تفعيل|استئناف|استانف).*(مراجعه|تذكير)/.test(norm)) return { name: 'resume' };
  if (/^(حذف|امسح).*(ذاكره|بيانات)/.test(norm)) return { name: 'request_delete' };

  // 4) Review-time setting: «وقت المراجعة 19:30»
  const timeMatch = norm.match(/وقت\s+المراجعه\D*(\d{1,2})[\s:.,](\d{2})/) ||
    norm.match(/المراجعه\s+(?:الساعه\s+)?(\d{1,2})[\s:.,](\d{2})/);
  if (timeMatch) {
    return { name: 'set_time', payload: { hh: timeMatch[1], mm: timeMatch[2] } };
  }

  // 5) «درست اليوم …» / «أضف درس …»
  const studied = norm.match(/^(?:درست|اتممت|انهيت|خلصت)\s+(?:اليوم\s+)?(?:درس\s+)?(.+)$/);
  if (studied) return { name: 'claim_lesson', payload: { query: studied[1].trim() } };
  const add = norm.match(/^(?:اضف|سجل|احفظ)\s+(?:درس|درسا)?\s*(.+?)\s*(?:في\s+ذاكرتي)?$/);
  if (add && add[1] && add[1] !== 'الي ذاكرتي') {
    return { name: 'claim_lesson', payload: { query: add[1].trim() } };
  }

  return { name: 'unknown', payload: { text: norm } };
}

/**
 * Fuzzy-match a free-text query against the lesson catalog.
 * Returns { exact: lesson|null, matches: [lessons...] }.
 */
export function matchLesson(query, catalog) {
  const q = normalizeArabic(normalizeDigits(query));
  if (!q) return { exact: null, matches: [] };

  // Numeric choice from a suggestion list.
  if (/^\d{1,2}$/.test(q)) {
    return { exact: null, matches: [], choice: parseInt(q, 10) };
  }

  const scored = [];
  for (const lesson of catalog) {
    const title = normalizeArabic(lesson.title);
    const aliases = [title, normalizeArabic('درس ' + lesson.title)];
    let best = 0;
    for (const a of aliases) {
      if (a === q) best = Math.max(best, 100);
      else if (a.includes(q) || q.includes(a)) best = Math.max(best, 80);
      else {
        // word overlap
        const qWords = q.split(' ').filter(Boolean);
        const aWords = new Set(a.split(' '));
        const hit = qWords.filter((w) => aWords.has(w)).length;
        const ratio = hit / Math.max(qWords.length, 1);
        if (ratio >= 0.5) best = Math.max(best, 40 + Math.round(ratio * 30));
      }
    }
    if (best > 0) scored.push({ lesson, score: best });
  }
  scored.sort((a, b) => b.score - a.score);

  const exact = scored.find((s) => s.score >= 100) || null;
  if (exact) return { exact: exact.lesson, matches: [] };
  return { exact: null, matches: scored.slice(0, 3).map((s) => s.lesson) };
}
