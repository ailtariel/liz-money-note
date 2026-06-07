export const createTableStatements = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  initial_balance INTEGER NOT NULL DEFAULT 0,
  current_balance INTEGER NOT NULL DEFAULT 0,
  is_included_in_assets INTEGER NOT NULL DEFAULT 1,
  is_archived INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  CHECK (type IN ('cash', 'bank_card', 'credit_card', 'alipay', 'wechat', 'other')),
  CHECK (currency GLOB '[A-Z][A-Z][A-Z]')
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  target_account_id INTEGER,
  occurred_at TEXT NOT NULL,
  note TEXT,
  recurring_event_id INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,

  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (target_account_id) REFERENCES accounts(id),
  FOREIGN KEY (recurring_event_id) REFERENCES recurring_events(id),

  CHECK (type IN ('income', 'expense', 'transfer')),
  CHECK (currency GLOB '[A-Z][A-Z][A-Z]'),
  CHECK (amount > 0)
);

CREATE TABLE IF NOT EXISTS transaction_tags (
  transaction_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,

  PRIMARY KEY (transaction_id, tag_id),

  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE IF NOT EXISTS recurring_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  account_id INTEGER NOT NULL,
  target_account_id INTEGER,
  note TEXT,
  repeat_type TEXT NOT NULL,
  repeat_interval INTEGER NOT NULL DEFAULT 1,
  start_date TEXT NOT NULL,
  end_date TEXT,
  next_trigger_date TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (account_id) REFERENCES accounts(id),
  FOREIGN KEY (target_account_id) REFERENCES accounts(id),

  CHECK (type IN ('income', 'expense', 'transfer')),
  CHECK (currency GLOB '[A-Z][A-Z][A-Z]'),
  CHECK (amount > 0),
  CHECK (repeat_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  CHECK (repeat_interval > 0)
);

CREATE TABLE IF NOT EXISTS recurring_event_tags (
  recurring_event_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,

  PRIMARY KEY (recurring_event_id, tag_id),

  FOREIGN KEY (recurring_event_id) REFERENCES recurring_events(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const createIndexStatements = `
CREATE INDEX IF NOT EXISTS idx_transactions_book_time
ON transactions(book_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type
ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_transactions_account
ON transactions(account_id);

CREATE INDEX IF NOT EXISTS idx_transactions_target_account
ON transactions(target_account_id);

CREATE INDEX IF NOT EXISTS idx_transaction_tags_tag
ON transaction_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_recurring_events_trigger
ON recurring_events(is_active, next_trigger_date);

CREATE INDEX IF NOT EXISTS idx_recurring_event_tags_tag
ON recurring_event_tags(tag_id);
`;
