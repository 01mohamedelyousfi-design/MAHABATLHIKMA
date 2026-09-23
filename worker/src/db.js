/**
 * db.js — database adapters.
 *
 * The repository layer only depends on this tiny async interface:
 *   adapter.all(sql, params)   -> rows[]
 *   adapter.first(sql, params) -> row | null
 *   adapter.run(sql, params)   -> { changes, lastId }
 *
 * D1Adapter works with the Cloudflare D1 binding in production.
 * SqliteAdapter (node:sqlite, used by tests and local tooling) lives in
 * sqlite-adapter.node.js so the Worker bundle never imports Node APIs.
 */

export class D1Adapter {
  constructor(d1) { this.d1 = d1; }
  async all(sql, params = []) {
    const res = await this.d1.prepare(sql).bind(...params).all();
    return res.results || [];
  }
  async first(sql, params = []) {
    return (await this.d1.prepare(sql).bind(...params).first()) || null;
  }
  async run(sql, params = []) {
    const res = await this.d1.prepare(sql).bind(...params).run();
    const meta = res.meta || {};
    return { changes: meta.changes || 0, lastId: meta.last_row_id || 0 };
  }
}
