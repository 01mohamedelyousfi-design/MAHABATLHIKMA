/**
 * fsrs.js — ReviewEngine
 *
 * Self-contained implementation of the FSRS-4.5 scheduling algorithm
 * (free-spaced-repetition-scheduler). No external dependencies, so the same
 * code runs in the Cloudflare Worker and in the Node test suite.
 *
 * Card state stored per review item:
 *   { state: 'new'|'learning'|'review'|'relearning',
 *     stability, difficulty, lastReviewAt, nextReviewAt, reviewCount, lapses }
 *
 * Ratings: 1 = again, 2 = hard, 3 = good, 4 = easy
 */

export const Rating = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };

// FSRS-4.5 default parameters (w[0..17]).
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616,
  0.1544, 1.0824, 1.9813, 0.0953, 0.2975, 2.2042, 0.2407, 2.9466, 0.5034, 0.6567,
];

export const REQUEST_RETENTION = 0.9;
const DECAY = -0.5;
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1; // 19/81
const MAX_INTERVAL_DAYS = 3650;

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function initDifficulty(rating) {
  return clamp(W[4] - Math.exp((rating - 1) * W[5]) + 1, 1, 10);
}

function initStability(rating) {
  return Math.max(W[rating - 1], 0.1);
}

/** Retrievability after `days` days given stability `s`. */
export function retrievability(days, s) {
  if (!s || s <= 0) return 0;
  return Math.pow(1 + (FACTOR * days) / s, DECAY);
}

/** Interval (in days) that brings retrievability down to `r`. */
export function intervalForRetention(s, r = REQUEST_RETENTION) {
  return (s / FACTOR) * (Math.pow(r, 1 / DECAY) - 1);
}

function nextDifficulty(d, rating) {
  const delta = -W[6] * (rating - 3);
  const dPrime = d + delta * (10 - d) / 9;
  const dNext = W[7] * initDifficulty(4) + (1 - W[7]) * dPrime;
  return clamp(dNext, 1, 10);
}

function shortTermStability(s, rating) {
  return s * Math.exp(W[17] * (rating - 3 + W[18]));
}

/** Stability after a successful recall (rating >= 2). */
function recallStability(d, s, r, rating) {
  const hardPenalty = rating === Rating.HARD ? W[15] : 1;
  const easyBonus = rating === Rating.EASY ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) *
    (Math.exp((1 - r) * W[10]) - 1) * hardPenalty * easyBonus);
}

/** Stability after a lapse (rating = 1). */
function forgetStability(d, s, r) {
  return W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]);
}

export function newCard(now = Date.now()) {
  return {
    state: 'new',
    stability: 0,
    difficulty: 0,
    lastReviewAt: null,
    nextReviewAt: now, // immediately due so it can be introduced
    reviewCount: 0,
    lapses: 0,
  };
}

/**
 * Apply one review to a card. Returns the new card state.
 * @param {object} card
 * @param {1|2|3|4} rating
 * @param {number} now epoch ms
 */
export function reviewCard(card, rating, now = Date.now()) {
  rating = clamp(rating | 0, 1, 4);
  const c = { ...card };

  if (c.state === 'new') {
    c.difficulty = initDifficulty(rating);
    c.stability = initStability(rating);
    c.state = rating === Rating.AGAIN ? 'learning' : 'review';
    // Same-day relearn for "again"; otherwise schedule normally.
    var intervalDays = rating === Rating.AGAIN
      ? 0
      : clamp(intervalForRetention(c.stability), 1, MAX_INTERVAL_DAYS);
  } else {
    const elapsedDays = Math.max(0, (now - c.lastReviewAt) / 86400000);
    const r = retrievability(elapsedDays, c.stability);
    c.difficulty = nextDifficulty(c.difficulty, rating);
    if (rating === Rating.AGAIN) {
      c.stability = clamp(forgetStability(c.difficulty, c.stability, r), 0.1, c.stability);
      c.state = 'relearning';
      c.lapses = (c.lapses || 0) + 1;
      // Relearning: bring it back soon (next day), then it grows again.
      var intervalDays = 1;
    } else {
      let newS = recallStability(c.difficulty, c.stability, r, rating);
      if (c.state === 'learning' || c.state === 'relearning') {
        newS = Math.max(newS, shortTermStability(c.stability, rating));
      }
      c.stability = Math.max(newS, 0.1);
      c.state = 'review';
      var intervalDays = clamp(intervalForRetention(c.stability), 1, MAX_INTERVAL_DAYS);
    }
  }

  c.lastReviewAt = now;
  c.nextReviewAt = now + Math.round(intervalDays * 86400000);
  c.reviewCount = (c.reviewCount || 0) + 1;
  return c;
}

/**
 * Map an AI evaluation score (0..1) to an FSRS rating (1..4).
 *   >= 0.85 easy | >= 0.60 good | >= 0.35 hard | else again
 */
export function ratingFromScore(score) {
  if (score == null || isNaN(score)) return Rating.AGAIN;
  if (score >= 0.85) return Rating.EASY;
  if (score >= 0.6) return Rating.GOOD;
  if (score >= 0.35) return Rating.HARD;
  return Rating.AGAIN;
}
