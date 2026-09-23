import test from 'node:test';
import assert from 'node:assert/strict';
import { HeuristicEvaluator, classifyScore } from '../src/evaluator.js';
import { LESSON_SEEDS } from '../src/lesson-seeds.js';

const ev = new HeuristicEvaluator();
const locke = LESSON_SEEDS['person-identity'].items[0]; // Locke recall item

test('correct answer in a different formulation is still correct', async () => {
  const r = await ev.evaluate(
    { question: locke.question, expectedPoints: locke.expectedPoints },
    'يرى لوك أن الوعي هو أساس الهوية، والذاكرة تمتد نحو الماضي'
  );
  assert.equal(r.result, 'correct');
  assert.ok(r.score >= 0.85);
  assert.equal(r.missing_points.length, 0);
});

test('partial answer is partial, with the missing point listed', async () => {
  const r = await ev.evaluate(
    { question: locke.question, expectedPoints: locke.expectedPoints },
    'يرى لوك أن الوعي هو الأساس فقط'
  );
  assert.equal(r.result, 'partially_correct');
  assert.ok(r.missing_points.length >= 1);
  assert.ok(r.feedback.includes('ينقص'));
});

test('wrong/inverted answer is incorrect and misconception capped', async () => {
  const r = await ev.evaluate(
    { question: locke.question, expectedPoints: locke.expectedPoints },
    'الجسد هو أساس الهوية عند لوك'
  );
  assert.equal(r.result, 'incorrect');
  assert.ok(r.score <= 0.25);
  assert.ok(r.misconceptions.length >= 1);
});

test('too-short answer is unclear', async () => {
  const r = await ev.evaluate(
    { question: locke.question, expectedPoints: locke.expectedPoints },
    'نعم'
  );
  assert.equal(r.result, 'unclear');
});

test('classifyScore boundaries', () => {
  assert.equal(classifyScore(0.9), 'correct');
  assert.equal(classifyScore(0.6), 'mostly_correct');
  assert.equal(classifyScore(0.35), 'partially_correct');
  assert.equal(classifyScore(0.2), 'incorrect');
});
