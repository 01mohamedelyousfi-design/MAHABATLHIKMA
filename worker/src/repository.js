/**
 * repository.js — LessonRepository + UserRepository.
 *
 * All persistence goes through the adapter interface from db.js, so the same
 * code runs on Cloudflare D1 and on node:sqlite in tests.
 */

import { LESSON_CATALOG } from './catalog-data.js';
import { LESSON_SEEDS } from './lesson-seeds.js';

export class LessonRepository {
  constructor(db) { this.db = db; }

  /** Canonical catalog (bundled at build time from the website). */
  listCatalog() { return LESSON_CATALOG.filter((l) => l); }
  getCatalogLesson(id) { return LESSON_CATALOG.find((l) => l.id === id) || null; }

  /**
   * Upsert the catalog into the lessons / lesson_concepts tables.
   * Stable IDs mean content changes update metadata in place without
   * breaking existing review programs.
   */
  async syncCatalog() {
    for (const l of LESSON_CATALOG) {
      await this.db.run(
        `INSERT INTO lessons (id, title, url, level, module, content_hash, active)
         VALUES (?, ?, ?, ?, ?, ?, 1)
         ON CONFLICT(id) DO UPDATE SET title=excluded.title, url=excluded.url,
           level=excluded.level, module=excluded.module`,
        [l.id, l.title, l.url, l.level, l.module, l.id + ':' + l.title]
      );
      const seed = LESSON_SEEDS[l.id];
      if (seed) {
        for (const c of seed.concepts) {
          await this.db.run(
            `INSERT INTO lesson_concepts (id, lesson_id, name, description)
             VALUES (?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description`,
            [`${l.id}:${c.id}`, l.id, c.name, c.description]
          );
        }
      }
    }
  }

  /** Review item blueprints (QuestionGenerator output) for a lesson. */
  getSeedItems(lessonId) {
    const seed = LESSON_SEEDS[lessonId];
    return seed ? seed.items : [];
  }
  getConcept(lessonId, conceptId) {
    const seed = LESSON_SEEDS[lessonId];
    return seed ? seed.concepts.find((c) => c.id === conceptId) || null : null;
  }
  listConcepts(lessonId) {
    const seed = LESSON_SEEDS[lessonId];
    return seed ? seed.concepts : [];
  }
}

export class UserRepository {
  constructor(db) { this.db = db; }

  async getOrCreate(whatsappId, now = Date.now()) {
    let user = await this.db.first('SELECT * FROM users WHERE whatsapp_id = ?', [whatsappId]);
    if (!user) {
      const r = await this.db.run(
        'INSERT INTO users (whatsapp_id, created_at, last_seen_at) VALUES (?, ?, ?)',
        [whatsappId, now, now]
      );
      await this.db.run(
        `INSERT INTO user_settings (user_id) VALUES (?) ON CONFLICT(user_id) DO NOTHING`,
        [r.lastId]
      );
      user = await this.db.first('SELECT * FROM users WHERE id = ?', [r.lastId]);
      user._isNew = true;
    } else {
      await this.db.run('UPDATE users SET last_seen_at = ? WHERE id = ?', [now, user.id]);
    }
    return user;
  }

  async getSettings(userId) {
    return await this.db.first('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
  }

  async setReviewTime(userId, hhmm) {
    await this.db.run(
      'UPDATE user_settings SET preferred_review_time = ? WHERE user_id = ?',
      [hhmm, userId]
    );
  }

  async setNotifications(userId, enabled) {
    await this.db.run(
      'UPDATE user_settings SET notifications_enabled = ? WHERE user_id = ?',
      [enabled ? 1 : 0, userId]
    );
  }

  /** Hard-delete all personal data (right to be forgotten). */
  async deleteAll(userId) {
    await this.db.run('DELETE FROM review_events WHERE user_id = ?', [userId]);
    await this.db.run('DELETE FROM sessions WHERE user_id = ?', [userId]);
    await this.db.run('DELETE FROM review_items WHERE user_id = ?', [userId]);
    await this.db.run('DELETE FROM user_settings WHERE user_id = ?', [userId]);
    await this.db.run('DELETE FROM users WHERE id = ?', [userId]);
  }
}
