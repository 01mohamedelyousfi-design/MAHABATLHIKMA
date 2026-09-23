/**
 * review-repository.js — ReviewRepository + SessionRepository.
 * Same adapter contract as repository.js (D1 in prod, node:sqlite in tests).
 */

import { newCard } from './fsrs.js';

const DAY = 86400000;

export class ReviewRepository {
  constructor(db) { this.db = db; }

  /** Does this user already have a review program for this lesson? */
  async hasProgram(userId, lessonId) {
    const row = await this.db.first(
      'SELECT COUNT(*) AS n FROM review_items WHERE user_id = ? AND lesson_id = ?',
      [userId, lessonId]
    );
    return (row && row.n > 0) || false;
  }

  /** Next review time for one lesson of one user (null if none). */
  async nextReviewForLesson(userId, lessonId) {
    const row = await this.db.first(
      'SELECT MIN(next_review_at) AS nxt FROM review_items WHERE user_id = ? AND lesson_id = ?',
      [userId, lessonId]
    );
    return row ? row.nxt : null;
  }

  /**
   * Create review items for (user, lesson) from the QuestionGenerator output.
   * New items are introduced gradually: the first one is due immediately,
   * the rest are spread over the following days (1 item/day for new material).
   */
  async createProgram(userId, lessonId, items, now = Date.now()) {
    let created = 0;
    let firstDue = null;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const card = newCard(now);
      const due = now + i * DAY; // gradual introduction
      const res = await this.db.run(
        `INSERT INTO review_items
           (user_id, lesson_id, concept_id, question, question_type, expected_points,
            fsrs_state, difficulty, stability, last_review_at, next_review_at,
            review_count, lapses, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?)
         ON CONFLICT(user_id, lesson_id, question) DO NOTHING`,
        [
          userId, lessonId, item.conceptId, item.question, item.type,
          JSON.stringify(item.expectedPoints),
          card.state, card.difficulty, card.stability, card.lastReviewAt, due, now,
        ]
      );
      if (res.changes > 0) {
        created++;
        if (firstDue === null) firstDue = due;
      }
    }
    return { created, firstDue };
  }

  /** Due review items for a user, oldest first (overdue before new). */
  async dueItems(userId, now, limit = 4) {
    return await this.db.all(
      `SELECT * FROM review_items
       WHERE user_id = ? AND next_review_at <= ?
       ORDER BY next_review_at ASC
       LIMIT ?`,
      [userId, now, limit]
    );
  }

  async getItem(userId, itemId) {
    return await this.db.first(
      'SELECT * FROM review_items WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );
  }

  /** Persist FSRS state after a review. */
  async applyReview(itemId, card) {
    await this.db.run(
      `UPDATE review_items
       SET fsrs_state = ?, difficulty = ?, stability = ?, last_review_at = ?,
           next_review_at = ?, review_count = ?, lapses = ?
       WHERE id = ?`,
      [card.state, card.difficulty, card.stability, card.lastReviewAt,
       card.nextReviewAt, card.reviewCount, card.lapses, itemId]
    );
  }

  async addEvent(userId, itemId, answer, evaluation, now = Date.now()) {
    await this.db.run(
      `INSERT INTO review_events (user_id, review_item_id, answer, evaluation, score, feedback, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, itemId, answer, JSON.stringify(evaluation), evaluation.score || 0,
       evaluation.feedback || '', now]
    );
  }

  /** All review items of a user joined with concept names (for memory bars). */
  async memoryByConcept(userId) {
    return await this.db.all(
      `SELECT ri.id, ri.lesson_id, ri.concept_id, ri.stability, ri.review_count,
              ri.lapses, ri.next_review_at, ri.last_review_at,
              COALESCE(lc.name, ri.concept_id) AS concept_name
       FROM review_items ri
       LEFT JOIN lesson_concepts lc ON lc.id = ri.lesson_id || ':' || ri.concept_id
       WHERE ri.user_id = ?`,
      [userId]
    );
  }

  async nextReviewAt(userId) {
    const row = await this.db.first(
      'SELECT MIN(next_review_at) AS nxt FROM review_items WHERE user_id = ?',
      [userId]
    );
    return row ? row.nxt : null;
  }

  /** Users with any due item (used by the cron job). */
  async usersWithDue(now) {
    return await this.db.all(
      `SELECT DISTINCT u.id, u.whatsapp_id FROM review_items ri
       JOIN users u ON u.id = ri.user_id
       WHERE ri.next_review_at <= ?`,
      [now]
    );
  }
}

export class SessionRepository {
  constructor(db) { this.db = db; }

  async openSession(userId) {
    return await this.db.first(
      `SELECT * FROM sessions WHERE user_id = ? AND status = 'open'
       ORDER BY id DESC LIMIT 1`,
      [userId]
    );
  }

  async create(userId, kind, { lessonId = null, itemIds = [], payload = null } = {}, now = Date.now()) {
    const r = await this.db.run(
      `INSERT INTO sessions (user_id, kind, lesson_id, item_ids, current_index, status, payload, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 'open', ?, ?, ?)`,
      [userId, kind, lessonId, JSON.stringify(itemIds),
       payload ? JSON.stringify(payload) : null, now, now]
    );
    return r.lastId;
  }

  async update(sessionId, fields, now = Date.now()) {
    const sets = [];
    const params = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      params.push(typeof v === 'object' && v !== null ? JSON.stringify(v) : v);
    }
    sets.push('updated_at = ?');
    params.push(now, sessionId);
    await this.db.run(`UPDATE sessions SET ${sets.join(', ')} WHERE id = ?`, params);
  }

  async close(sessionId, status = 'done', now = Date.now()) {
    await this.db.run(
      `UPDATE sessions SET status = ?, updated_at = ? WHERE id = ?`,
      [status, now, sessionId]
    );
  }
}
