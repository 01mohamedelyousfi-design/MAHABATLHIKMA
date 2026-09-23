-- MahabatLhikma Memory Companion — D1 schema (SQLite dialect)
-- All access is server-side. Phone numbers (whatsapp_id) are sensitive.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  whatsapp_id   TEXT NOT NULL UNIQUE,
  created_at    INTEGER NOT NULL,
  last_seen_at  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id           TEXT PRIMARY KEY,          -- stable catalog id, e.g. 'person-identity'
  title        TEXT NOT NULL,
  url          TEXT NOT NULL,
  level        TEXT,
  module       TEXT,
  content_hash TEXT,
  active       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS lesson_concepts (
  id          TEXT PRIMARY KEY,           -- '<lesson_id>:<concept_id>'
  lesson_id   TEXT NOT NULL REFERENCES lessons(id),
  name        TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS review_items (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  lesson_id      TEXT NOT NULL REFERENCES lessons(id),
  concept_id     TEXT NOT NULL,
  question       TEXT NOT NULL,
  question_type  TEXT NOT NULL,
  expected_points TEXT NOT NULL,          -- JSON array
  -- FSRS state
  fsrs_state     TEXT NOT NULL DEFAULT 'new',
  difficulty     REAL NOT NULL DEFAULT 0,
  stability      REAL NOT NULL DEFAULT 0,
  last_review_at INTEGER,
  next_review_at INTEGER NOT NULL,
  review_count   INTEGER NOT NULL DEFAULT 0,
  lapses         INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL,
  UNIQUE (user_id, lesson_id, question)   -- no duplicate review programs
);
CREATE INDEX IF NOT EXISTS idx_review_items_due ON review_items (user_id, next_review_at);

CREATE TABLE IF NOT EXISTS review_events (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id),
  review_item_id INTEGER NOT NULL REFERENCES review_items(id),
  answer         TEXT NOT NULL,
  evaluation     TEXT NOT NULL,           -- JSON: {result, score, missing_points, misconceptions, feedback}
  score          REAL NOT NULL,
  feedback       TEXT,
  created_at     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_review_events_item ON review_events (review_item_id);

CREATE TABLE IF NOT EXISTS sessions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id),
  kind          TEXT NOT NULL,            -- 'review' | 'choose_lesson' | 'confirm_delete'
  lesson_id     TEXT,
  item_ids      TEXT,                     -- JSON array of review_item ids
  current_index INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'open',   -- 'open' | 'done' | 'expired'
  payload       TEXT,                     -- JSON scratch (e.g. candidate lesson ids)
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_open ON sessions (user_id, status);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                INTEGER PRIMARY KEY REFERENCES users(id),
  preferred_review_time  TEXT NOT NULL DEFAULT '19:30',
  timezone               TEXT NOT NULL DEFAULT 'Africa/Casablanca',
  daily_review_limit     INTEGER NOT NULL DEFAULT 4,
  notifications_enabled  INTEGER NOT NULL DEFAULT 1,
  last_reminder_date     TEXT             -- local date 'YYYY-MM-DD' of last reminder
);

CREATE TABLE IF NOT EXISTS whatsapp_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  direction  TEXT NOT NULL,               -- 'in' | 'out' | 'error'
  wa_id      TEXT,
  body       TEXT,
  kind       TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
