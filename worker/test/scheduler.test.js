import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRemind, localDate, localTimeParts, pickSessionItems } from '../src/scheduler.js';
import { makeTestContext, T0, DAY } from './helpers.js';

const TZ = 'Africa/Casablanca';

/** ms timestamp for a given UTC time. */
const utc = (h, m = 0) => Date.UTC(2026, 5, 10, h, m, 0);

test('Africa/Casablanca local date/time are correct in summer (UTC+1)', () => {
  // 18:45 UTC == 19:45 in Casablanca during summer.
  assert.equal(localTimeParts(utc(18, 45), TZ).minutes, 19 * 60 + 45);
  assert.equal(localDate(utc(23, 30), TZ), '2026-06-11'); // past midnight local
});

test('reminder fires only at/after preferred local time, once per day', () => {
  const settings = {
    notifications_enabled: 1, timezone: TZ,
    preferred_review_time: '19:30', last_reminder_date: null,
  };
  assert.equal(shouldRemind({ settings, hasDue: true, now: utc(10, 0) }), false, 'morning: too early');
  assert.equal(shouldRemind({ settings, hasDue: true, now: utc(18, 35) }), true, '19:35 local: fire');
  const after = { ...settings, last_reminder_date: localDate(utc(18, 35), TZ) };
  assert.equal(shouldRemind({ settings: after, hasDue: true, now: utc(19, 0) }), false, 'once per day');
  assert.equal(shouldRemind({ settings, hasDue: false, now: utc(18, 35) }), false, 'nothing due');
  assert.equal(shouldRemind({ settings: { ...settings, notifications_enabled: 0 }, hasDue: true, now: utc(18, 35) }), false, 'paused');
});

test('only items with next_review_at <= now are returned as due', async () => {
  const ctx = await makeTestContext();
  const user = await ctx.users.getOrCreate('212600000009', T0);
  const items = ctx.lessons.getSeedItems('person-identity');
  await ctx.reviews.createProgram(user.id, 'person-identity', items, T0);

  let due = await ctx.reviews.dueItems(user.id, T0, 20);
  assert.equal(due.length, 1, 'only the first item due at T0');
  due = await ctx.reviews.dueItems(user.id, T0 + 6 * DAY, 20);
  assert.equal(due.length, 7, 'all items due 6 days later');
  due = await ctx.reviews.dueItems(user.id, T0 + 6 * DAY, 4);
  assert.equal(due.length, 4, 'daily limit respected');
});

test('pickSessionItems prioritizes overdue reviews over new material', () => {
  const rows = [
    { id: 1, fsrs_state: 'new', review_count: 0, next_review_at: 100 },
    { id: 2, fsrs_state: 'review', review_count: 3, next_review_at: 50 }, // overdue review
    { id: 3, fsrs_state: 'review', review_count: 1, next_review_at: 80 },
  ];
  const picked = pickSessionItems(rows, 3);
  assert.deepEqual(picked.map((r) => r.id), [2, 3, 1], 'reviews first, new material last');
});
