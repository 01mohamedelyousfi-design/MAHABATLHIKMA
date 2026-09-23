import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newCard, reviewCard, retrievability, ratingFromScore, Rating, intervalForRetention,
} from '../src/fsrs.js';

const DAY = 86400000;

test('new card is immediately due and in state new', () => {
  const c = newCard(1000);
  assert.equal(c.state, 'new');
  assert.equal(c.nextReviewAt, 1000);
  assert.equal(c.reviewCount, 0);
});

test('good rating on a new card schedules a future review and moves to review', () => {
  const c = reviewCard(newCard(0), Rating.GOOD, 0);
  assert.equal(c.state, 'review');
  assert.ok(c.stability > 0, 'stability initialized');
  assert.ok(c.difficulty >= 1 && c.difficulty <= 10, 'difficulty in range');
  assert.ok(c.nextReviewAt > 0, 'scheduled in the future');
  assert.equal(c.reviewCount, 1);
});

test('again rating counts a lapse and brings the item back soon', () => {
  let c = reviewCard(newCard(0), Rating.GOOD, 0);
  const s1 = c.stability;
  c = reviewCard(c, Rating.AGAIN, c.nextReviewAt);
  assert.equal(c.state, 'relearning');
  assert.equal(c.lapses, 1);
  assert.ok(c.stability <= s1, 'stability must not grow after a lapse');
  assert.ok(c.nextReviewAt - c.lastReviewAt <= DAY, 'relearning comes back within a day');
});

test('consecutive good reviews increase intervals (spacing effect)', () => {
  let c = reviewCard(newCard(0), Rating.GOOD, 0);
  const intervals = [];
  for (let i = 0; i < 4; i++) {
    intervals.push(c.nextReviewAt - c.lastReviewAt);
    c = reviewCard(c, Rating.GOOD, c.nextReviewAt);
  }
  for (let i = 1; i < intervals.length; i++) {
    assert.ok(intervals[i] >= intervals[i - 1], `interval ${i} should not shrink: ${intervals}`);
  }
});

test('retrievability decays to ~90% at the scheduled interval', () => {
  const s = 5;
  const ivl = intervalForRetention(s, 0.9);
  const r = retrievability(ivl, s);
  assert.ok(Math.abs(r - 0.9) < 0.01, `expected ~0.9, got ${r}`);
});

test('ratingFromScore thresholds', () => {
  assert.equal(ratingFromScore(0.95), Rating.EASY);
  assert.equal(ratingFromScore(0.7), Rating.GOOD);
  assert.equal(ratingFromScore(0.4), Rating.HARD);
  assert.equal(ratingFromScore(0.1), Rating.AGAIN);
});
