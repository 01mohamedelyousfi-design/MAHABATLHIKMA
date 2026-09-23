import test from 'node:test';
import assert from 'node:assert/strict';
import { parseIntent, matchLesson, normalizeArabic } from '../src/intents.js';
import { MockWhatsApp, makeTestContext, T0 } from './helpers.js';
import { LESSON_CATALOG } from '../src/catalog-data.js';

test('mock provider records all messages without sending anything', async () => {
  const wa = new MockWhatsApp();
  await wa.sendMessage('2126', 'مرحبا');
  await wa.sendMessage('2126', 'السؤال 1/4');
  assert.equal(wa.sent.length, 2);
  assert.equal(wa.lastTo('2126')[1], 'السؤال 1/4');
});

test('mock provider with db logs into whatsapp_events', async () => {
  const ctx = await makeTestContext();
  await ctx.whatsapp.sendMessage('2126', 'تجربة');
  const rows = await ctx.adapter.all('SELECT * FROM whatsapp_events');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].direction, 'out');
  assert.equal(rows[0].kind, 'mock');
});

test('deep-link token intent is recognized with several separators', () => {
  assert.equal(parseIntent('mahaba_review_lesson=person-identity').name, 'add_lesson_token');
  assert.equal(parseIntent('mahaba_review_lesson: person-value').payload.lessonId, 'person-value');
});

test('arabic intents: greeting, review, status, time, pause, delete', () => {
  assert.equal(parseIntent('السلام عليكم').name, 'greeting');
  assert.equal(parseIntent('ماذا أراجع اليوم؟').name, 'start_review');
  assert.equal(parseIntent('حالتي').name, 'status');
  const t = parseIntent('وقت المراجعة 19:30');
  assert.equal(t.name, 'set_time');
  assert.equal(t.payload.hh, '19');
  assert.equal(parseIntent('إيقاف المراجعة').name, 'pause');
  assert.equal(parseIntent('حذف الذاكرة').name, 'request_delete');
  assert.equal(parseIntent('نعم احذف ذاكرتي').name, 'confirm_delete');
});

test('normalizeArabic handles diacritics, hamza, ta marbuta', () => {
  assert.equal(normalizeArabic('الهُويَّة'), normalizeArabic('الهوية'));
  assert.equal(normalizeArabic('إشكالية'), normalizeArabic('اشكاليه'));
});

test('matchLesson: exact, partial, and no-match against the catalog', () => {
  const exact = matchLesson('هوية الشخص', LESSON_CATALOG);
  assert.equal(exact.exact?.id, 'person-identity');

  const partial = matchLesson('الضرورة والحرية', LESSON_CATALOG);
  assert.ok(partial.matches.some((m) => m.id === 'necessity-freedom'));

  const none = matchLesson('مفهوم الدولة', LESSON_CATALOG);
  assert.equal(none.exact, null);
  assert.equal(none.matches.length, 0, 'no fuzzy false positive for unrelated title');
});

test('matching never returns lessons outside the catalog', () => {
  const { matches } = matchLesson('الشخص', LESSON_CATALOG);
  const ids = new Set(LESSON_CATALOG.map((l) => l.id));
  for (const m of matches) assert.ok(ids.has(m.id));
});
