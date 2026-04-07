CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_subscribed INTEGER DEFAULT 0,
  subscription_expires_at TEXT,
  daily_free_count INTEGER DEFAULT 0,
  last_reset_date TEXT DEFAULT (date('now'))
);
