/**
 * helpers.js — test fixtures: in-memory schema + wired Bot + mock WhatsApp.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { SqliteAdapter } from '../src/sqlite-adapter.node.js';
import { LessonRepository, UserRepository } from '../src/repository.js';
import { ReviewRepository, SessionRepository } from '../src/review-repository.js';
import { HeuristicEvaluator } from '../src/evaluator.js';
import { Bot } from '../src/bot.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const MIGRATION = join(__dir, '..', 'migrations', '0001_init.sql');

/** Mock WhatsApp provider: records messages in memory + in whatsapp_events. */
export class MockWhatsApp {
  constructor(db = null) {
    this.db = db;
    this.sent = [];
  }
  async sendMessage(to, message) {
    this.sent.push({ to, message });
    if (this.db) {
      await this.db.run(
        'INSERT INTO whatsapp_events (direction, wa_id, body, kind) VALUES (?, ?, ?, ?)',
        ['out', to, message, 'mock']
      );
    }
  }
  async sendTemplateMessage(to, template, params) {
    this.sent.push({ to, message: `[template:${template}]`, params });
  }
  lastTo(to) {
    return this.sent.filter((m) => m.to === to).map((m) => m.message);
  }
}

/** Build a fully wired bot over a fresh in-memory sqlite database. */
export async function makeTestContext() {
  const adapter = new SqliteAdapter(':memory:');
  adapter.exec(readFileSync(MIGRATION, 'utf8'));

  const lessons = new LessonRepository(adapter);
  const users = new UserRepository(adapter);
  const reviews = new ReviewRepository(adapter);
  const sessions = new SessionRepository(adapter);
  await lessons.syncCatalog();

  const whatsapp = new MockWhatsApp(adapter);
  const bot = new Bot({
    lessons, users, reviews, sessions,
    evaluator: new HeuristicEvaluator(),
    siteUrl: 'https://mahabatlhikma.pages.dev',
  });

  /** Send a message as a learner; returns replies and dispatches to mock WA. */
  async function chat(waId, text, now) {
    const replies = await bot.handleMessage(waId, text, now);
    for (const r of replies) await whatsapp.sendMessage(waId, r);
    return replies;
  }

  return { adapter, lessons, users, reviews, sessions, whatsapp, bot, chat };
}

export const T0 = Date.UTC(2026, 0, 1, 12, 0, 0); // fixed clock for tests
export const DAY = 86400000;
