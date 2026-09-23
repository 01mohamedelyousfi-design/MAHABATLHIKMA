/**
 * demo.js — end-to-end conversation demo (not a test; run with: node test/demo.js)
 * Simulates a learner over several days using the mock WhatsApp provider.
 */
import { makeTestContext, T0, DAY } from './helpers.js';

const ctx = await makeTestContext();
const wa = '212612345678';

async function say(text, now) {
  const replies = await ctx.chat(wa, text, now);
  console.log('\n👤 ' + text);
  for (const r of replies) console.log('\n🤖 ' + r);
}

console.log('=== DAY 0: learner adds the lesson from the website deep link ===');
await say('mahaba_review_lesson=person-identity', T0);

console.log('\n=== DAY 6: reminder time — learner starts the review ===');
const t = T0 + 6 * DAY + 19 * 3600000;
await say('مراجعة', t);
await say('نعم', t + 60000);
await say('عند لوك أساس الهوية هو الوعي المصاحب للفكر والذاكرة التي تمتد إلى الماضي', t + 120000);
await say('الإرادة والطبع الثابت', t + 180000);
await say('لا أعرف', t + 240000);
await say('لوك يعتمد الوعي والذاكرة بينما شوبنهاور يعتمد الإرادة والطبع الثابت', t + 300000);

console.log('\n=== حالة المتعلم ===');
await say('حالتي', t + 360000);

console.log('\n=== WhatsApp mock: messages actually "sent" ===');
console.log(ctx.whatsapp.sent.length, 'messages delivered via MockWhatsAppProvider (nothing real was sent).');
