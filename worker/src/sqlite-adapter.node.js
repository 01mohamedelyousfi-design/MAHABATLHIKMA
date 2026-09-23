/**
 * sqlite-adapter.node.js — Node-only adapter used by tests and local tooling.
 * Uses the built-in node:sqlite DatabaseSync (Node >= 22.5). Never imported
 * by the Worker bundle.
 */
import { DatabaseSync } from 'node:sqlite';

export class SqliteAdapter {
  constructor(dbPath = ':memory:') {
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL;');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }
  async all(sql, params = []) {
    return this.db.prepare(sql).all(...params);
  }
  async first(sql, params = []) {
    return this.db.prepare(sql).get(...params) || null;
  }
  async run(sql, params = []) {
    const r = this.db.prepare(sql).run(...params);
    return { changes: r.changes, lastId: Number(r.lastInsertRowid) };
  }
  /** Convenience for tests: run raw DDL script. */
  exec(sql) { this.db.exec(sql); }
  close() { this.db.close(); }
}
