import test from 'node:test';
import assert from 'node:assert/strict';
import { makeTestContext, T0, DAY } from './helpers.js';

test('Flow A: deep-link token registers a valid lesson and creates review items', async () => {
  const ctx = await makeTestContext();
  const replies = await ctx.chat('212600000001', 'mahaba_review_lesson=person-identity', T0);

  assert.ok(replies[0].includes('هوية الشخص'), 'reply should mention the lesson title');
  assert.ok(replies[0].includes('تمت إضافة'), 'reply should confirm registration');

  const user = await ctx.adapter.first('SELECT * FROM users WHERE whatsapp_id = ?', ['212600000001']);
  assert.ok(user, 'user registered');
  const items = await ctx.adapter.all('SELECT * FROM review_items WHERE user_id = ?', [user.id]);
  assert.equal(items.length, 7, 'seed items created');
  const concepts = await ctx.adapter.all('SELECT * FROM lesson_concepts WHERE lesson_id = ?', ['person-identity']);
  assert.ok(concepts.length >= 5, 'lesson concepts stored');
});

test('Invalid lesson id is rejected and nothing is created', async () => {
  const ctx = await makeTestContext();
  const replies = await ctx.chat('212600000002', 'mahaba_review_lesson=political-freedom', T0);
  assert.ok(replies[0].includes('لم أجد درسًا'), 'rejection message');
  const user = await ctx.adapter.first('SELECT * FROM users WHERE whatsapp_id = ?', ['212600000002']);
  const items = await ctx.adapter.all('SELECT * FROM review_items WHERE user_id = ?', [user.id]);
  assert.equal(items.length, 0, 'no review items for unknown lesson');
});

test('Unknown lesson title gets a rejection, never an invention', async () => {
  const ctx = await makeTestContext();
  const replies = await ctx.chat('212600000003', 'درست اليوم مفهوم الحرية السياسية', T0);
  assert.ok(replies[0].includes('لم أجد درسًا بهذا العنوان'), 'must not invent lessons');
});

test('Ambiguous title asks learner to choose, then registers the choice', async () => {
  const ctx = await makeTestContext();
  const replies = await ctx.chat('212600000004', 'درست اليوم الشخص', T0);
  assert.ok(/أيّها تقصد|هل تقصد/.test(replies[0]), 'disambiguation prompt');

  const replies2 = await ctx.chat('212600000004', '1', T0 + 1000);
  const user = await ctx.adapter.first('SELECT * FROM users WHERE whatsapp_id = ?', ['212600000004']);
  const items = await ctx.adapter.all('SELECT * FROM review_items WHERE user_id = ?', [user.id]);
  assert.ok(items.length > 0, 'lesson registered after numeric choice');
});

test('Duplicate add does not create a second review program', async () => {

test('Full review session: intro, questions, feedback, summary with lesson link', async () => {
  const ctx = await makeTestContext();
  const wa = '212600000006';
  await ctx.chat(wa, 'mahaba_review_lesson=person-identity', T0);

  // Only the first item is due at T0 (gradual introduction: 1 new item/day).
  // Advance 6 days so more items are due; session limit = 4.
  const t = T0 + 6 * DAY;
  const intro = await ctx.chat(wa, 'مراجعة', t);
  assert.ok(intro[0].includes('حان وقت المراجعة'), 'review intro');
  assert.ok(intro[0].includes('4 أسئلة'), 'session length capped at 4');

  const q1 = await ctx.chat(wa, 'نعم', t + 1000);
  assert.ok(q1[0].includes('السؤال 1/4'), 'first question');

  // Item 1 is the Locke recall question (first seed item).
  const a1 = await ctx.chat(wa, 'عند لوك أساس الهوية هو الوعي والذاكرة التي تربط الماضي بالحاضر', t + 2000);
  assert.ok(a1[0].startsWith('✅'), 'correct feedback expected, got: ' + a1[0]);
  assert.ok(a1[1].includes('السؤال 2/4'), 'next question asked');

  const a2 = await ctx.chat(wa, 'الجسد والمادة', t + 3000);
  assert.ok(a2[0].startsWith('❌') || a2[0].startsWith('🟡'), 'wrong answer feedback');

  await ctx.chat(wa, 'الهو والأنا والأنا الأعلى', t + 4000);
  const last = await ctx.chat(wa, 'الوعي هو الذي يميز الشخص', t + 5000);
  const summary = last[last.length - 1];
  assert.ok(summary.includes('قوة ذاكرتك'), 'memory summary shown');
  assert.ok(summary.includes('mahabatlhikma.pages.dev'), 'lesson link at end');
  assert.ok(summary.includes('تقدير داخلي'), 'disclaimer present');

  const events = await ctx.adapter.all('SELECT * FROM review_events');
  assert.equal(events.length, 4, 'one event per answered question');
});

test('Review with nothing due returns guidance', async () => {
  const ctx = await makeTestContext();
  const replies = await ctx.chat('212600000007', 'مراجعة', T0);
  assert.ok(replies[0].includes('لا توجد لديك مراجعات'), 'nothing due for a fresh user');
});

test('Set review time / pause / resume / delete flows', async () => {
  const ctx = await makeTestContext();
  const wa = '212600000008';
  await ctx.chat(wa, 'mahaba_review_lesson=necessity-freedom', T0);

  const t = await ctx.chat(wa, 'وقت المراجعة 21:15', T0 + 1000);
  assert.ok(t[0].includes('21:15'));
  const settings = await ctx.adapter.first(
    'SELECT * FROM user_settings WHERE user_id = (SELECT id FROM users WHERE whatsapp_id = ?)', [wa]);
  assert.equal(settings.preferred_review_time, '21:15');

  await ctx.chat(wa, 'إيقاف المراجعة', T0 + 2000);
  const s2 = await ctx.adapter.first(
    'SELECT * FROM user_settings WHERE user_id = (SELECT id FROM users WHERE whatsapp_id = ?)', [wa]);
  assert.equal(s2.notifications_enabled, 0);

  await ctx.chat(wa, 'تفعيل المراجعة', T0 + 3000);
  const s3 = await ctx.adapter.first(
    'SELECT * FROM user_settings WHERE user_id = (SELECT id FROM users WHERE whatsapp_id = ?)', [wa]);
  assert.equal(s3.notifications_enabled, 1);

  await ctx.chat(wa, 'حذف الذاكرة', T0 + 4000);
  const done = await ctx.chat(wa, 'نعم احذف ذاكرتي', T0 + 5000);
  assert.ok(done[0].includes('تم حذف بياناتك'));
  const user = await ctx.adapter.first('SELECT * FROM users WHERE whatsapp_id = ?', [wa]);
  assert.equal(user, null, 'user row removed');
});

  const ctx = await makeTestContext();
  await ctx.chat('212600000005', 'mahaba_review_lesson=person-value', T0);
  const again = await ctx.chat('212600000005', 'mahaba_review_lesson=person-value', T0 + DAY);
  assert.ok(again[0].includes('مضاف إلى ذاكرتك من قبل'), 'idempotent response');
  const user = await ctx.adapter.first('SELECT * FROM users WHERE whatsapp_id = ?', ['212600000005']);
  const items = await ctx.adapter.all('SELECT * FROM review_items WHERE user_id = ?', [user.id]);
  assert.equal(items.length, 7, 'still one program');
});
