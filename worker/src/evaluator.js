/**
 * evaluator.js — AnswerEvaluator.
 *
 * Two layers, both grounded in the review item's expected points:
 *   1. WorkersAiEvaluator (if env.AI binding is available): semantic
 *      evaluation in Arabic, instructed to return strict JSON and to never
 *      contradict the canonical expected points.
 *   2. HeuristicEvaluator (always available, zero cost): normalized Arabic
 *      keyword coverage over expected points with misconception detection.
 *
 * Both return the same shape:
 *   { result: 'correct'|'mostly_correct'|'partially_correct'|'incorrect'|'unclear',
 *     score: 0..1, missing_points: [], misconceptions: [], feedback: string }
 */

import { normalizeArabic } from './intents.js';

export function classifyScore(score) {
  if (score >= 0.85) return 'correct';
  if (score >= 0.6) return 'mostly_correct';
  if (score >= 0.35) return 'partially_correct';
  return 'incorrect';
}

/** Common misconception markers per concept — used to catch inverted answers. */
const MISCONCEPTION_RULES = [
  {
    pattern: /لوك/,
    wrong: /(الجسد|الجسم)\s+(هو\s+)?(اساس|مصدر)/,
    note: 'لوك لا يجعل الجسد أساس الهوية، بل الوعي والذاكرة.',
  },
  {
    pattern: /شوبنهاور/,
    wrong: /(الذاكره|الوعي)\s+(هي|هو)\s+(الاساس|اساس)/,
    note: 'شوبنهاور يرفض الذاكرة والوعي أساسًا للهوية، ويجعلها في الإرادة والطبع الثابت.',
  },
  {
    pattern: /كانط/,
    wrong: /(وسيله|منفعه|حاجتنا)\s+(فقط|محضه)?\s*$/,
    note: 'كانط يرى أن الشخص غاية في ذاته ولا يجوز اختزاله في وسيلة للمنفعة.',
  },
];

export class HeuristicEvaluator {
  async evaluate(item, answer) {
    const points = item.expectedPoints || [];
    const ansNorm = normalizeArabic(answer);
    const qNorm = normalizeArabic(item.question || '');

    if (!ansNorm || ansNorm.split(' ').length < 2) {
      return {
        result: 'unclear', score: 0, missing_points: points,
        misconceptions: [], feedback: '',
      };
    }

    // Misconception detection: wrong attribution patterns.
    const misconceptions = [];
    for (const rule of MISCONCEPTION_RULES) {
      if (rule.pattern.test(qNorm) && rule.wrong.test(ansNorm)) {
        misconceptions.push(rule.note);
      }
    }

    // Coverage: a point counts when its key words appear in the answer.
    const missing = [];
    let covered = 0;
    for (const p of points) {
      // A point may contain alternatives separated by '/'.
      const alternatives = String(p).split('/').map((a) => normalizeArabic(a));
      const hit = alternatives.some((alt) => {
        const words = alt.split(' ').filter((w) => w.length >= 2);
        if (!words.length) return false;
        const matched = words.filter((w) => ansNorm.includes(w)).length;
        return matched / words.length >= 0.6;
      });
      if (hit) covered++;
      else missing.push(p);
    }

    let score = points.length ? covered / points.length : 0;
    if (misconceptions.length) score = Math.min(score, 0.25); // inverted understanding caps the score
    const result = misconceptions.length && covered === 0 ? 'incorrect' : classifyScore(score);

    return {
      result,
      score: Math.round(score * 100) / 100,
      missing_points: missing,
      misconceptions,
      feedback: this._feedback(result, points, missing, misconceptions),
    };
  }

  _feedback(result, points, missing, misconceptions) {
    if (misconceptions.length) {
      return `انتبه: ${misconceptions[0]}`;
    }
    if (result === 'correct') {
      return `أشرت إلى ${points.join(' و')}، وهي العناصر الأساسية المطلوبة.`;
    }
    if (result === 'mostly_correct') {
      return `إجابة جيدة. كان ينقصها ذكر: ${missing.join('، ')}.`;
    }
    if (result === 'partially_correct') {
      return `ذكرت جانبًا من الفكرة، لكن ينقصك: ${missing.join('، ')}. تذكّر أن العناصر الأساسية هي: ${points.join('، ')}.`;
    }
    return `الإجابة لا تتناول جوهر السؤال. الفكرة الأساسية تتعلق بـ: ${points.join('، ')}.`;
  }
}

export class WorkersAiEvaluator {
  constructor(ai, model) {
    this.ai = ai;
    this.model = model || '@cf/meta/llama-3.1-8b-instruct';
    this.fallback = new HeuristicEvaluator();
  }
  async evaluate(item, answer) {
    try {
      const prompt = [
        'أنت مقيّم تعليمي صارم ودقيق لدروس الفلسفة على منصة محبة الحكمة.',
        'قيّم إجابة التلميذ اعتمادًا فقط على النقاط المتوقعة أدناه. لا تضف معرفة خارجية ولا تصحح بما يخالفها.',
        '',
        `السؤال: ${item.question}`,
        `النقاط المتوقعة: ${(item.expectedPoints || []).join(' | ')}`,
        `إجابة التلميذ: ${answer}`,
        '',
        'أعد JSON فقط بالشكل:',
        '{"result":"correct|mostly_correct|partially_correct|incorrect|unclear","score":0.0,"missing_points":[],"misconceptions":[],"feedback":"جملة أو جملتان بالعربية الفصحى"}',
      ].join('\n');
      const res = await this.ai.run(this.model, {
        messages: [
          { role: 'system', content: 'أجب دائمًا بـ JSON صالح فقط، دون أي نص إضافي.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
      });
      const text = (res && (res.response || res.result)) || '';
      const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
      // Sanitize: trust but clamp.
      const score = Math.max(0, Math.min(1, Number(parsed.score) || 0));
      return {
        result: ['correct', 'mostly_correct', 'partially_correct', 'incorrect', 'unclear']
          .includes(parsed.result) ? parsed.result : classifyScore(score),
        score,
        missing_points: Array.isArray(parsed.missing_points) ? parsed.missing_points : [],
        misconceptions: Array.isArray(parsed.misconceptions) ? parsed.misconceptions : [],
        feedback: String(parsed.feedback || ''),
      };
    } catch {
      // AI unavailable or returned bad JSON -> deterministic heuristic fallback.
      return this.fallback.evaluate(item, answer);
    }
  }
}

/** Factory: pick the evaluator for the current environment. */
export function buildEvaluator(env) {
  if (env.AI) return new WorkersAiEvaluator(env.AI, env.AI_MODEL);
  return new HeuristicEvaluator();
}
