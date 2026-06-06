# 账本软件基础数据设计方案

## 设计目标

本设计用于第一版本地优先账本软件。应用基于 Web 开发并打包为 Android APK，数据存储使用 SQLite，不包含用户系统。

核心约束：

- `books` 作为基础分类，不再设计二级分类或收支分类。
- `tags` 用于灵活标记流水和周期事件。
- 流水类型固定为收入、支出、转账。
- 金额支持人民币、美元、阿联酋迪拉姆。
- 不支持跨币种转账。
- 周期性收支只作为规则配置，不自动写入流水；每次打开 App 时显式提示用户手动批准。

## 核心实体

### 账本

账本是业务上的基础分类，例如日常生活、旅行、家庭、工作报销。每条流水必须归属一个账本。

```sql
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 账户

账户用于表达钱从哪里收入、从哪里支出、从哪里转出和转入。

```sql
CREATE TABLE accounts (
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
  CHECK (currency IN ('CNY', 'USD', 'AED'))
);
```

金额统一使用最小货币单位保存为整数，避免浮点误差：

| 显示金额 | 数据库存储 |
| --- | --- |
| 12.34 CNY | 1234 |
| 12.34 USD | 1234 |
| 12.34 AED | 1234 |

### Tag

Tag 用于标记流水和周期事件，例如早餐、报销、旅行、必要支出。Tag 不承担账本分类职责。

```sql
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 流水

流水统一存储收入、支出和转账。

```sql
CREATE TABLE transactions (
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
  CHECK (currency IN ('CNY', 'USD', 'AED')),
  CHECK (amount > 0)
);
```

字段规则：

| 类型 | account_id | target_account_id | 说明 |
| --- | --- | --- | --- |
| income | 收入账户 | 空 | 金额进入账户 |
| expense | 支出账户 | 空 | 金额从账户支出 |
| transfer | 转出账户 | 转入账户 | 同币种账户之间转账 |

`recurring_event_id` 用于追踪某条流水是否由周期事件批准生成。

### 流水 Tag 关联

流水和 Tag 是多对多关系。一条流水可以有多个 Tag，一个 Tag 可以关联多条流水。

```sql
CREATE TABLE transaction_tags (
  transaction_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,

  PRIMARY KEY (transaction_id, tag_id),

  FOREIGN KEY (transaction_id) REFERENCES transactions(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### 周期事件

周期事件用于配置定期收入、支出或转账规则。周期事件本身不是流水，只有用户批准后才生成流水。

```sql
CREATE TABLE recurring_events (
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
  CHECK (currency IN ('CNY', 'USD', 'AED')),
  CHECK (amount > 0),
  CHECK (repeat_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  CHECK (repeat_interval > 0)
);
```

`repeat_interval` 表达间隔数量：

| repeat_type | repeat_interval | 含义 |
| --- | --- | --- |
| daily | 1 | 每天 |
| weekly | 2 | 每两周 |
| monthly | 1 | 每月 |
| yearly | 1 | 每年 |

### 周期事件 Tag 关联

周期事件和 Tag 也是多对多关系。用户批准周期事件生成流水时，事件上的 Tag 应复制到新流水。

```sql
CREATE TABLE recurring_event_tags (
  recurring_event_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,

  PRIMARY KEY (recurring_event_id, tag_id),

  FOREIGN KEY (recurring_event_id) REFERENCES recurring_events(id),
  FOREIGN KEY (tag_id) REFERENCES tags(id)
);
```

### 设置

设置表用于保存全局偏好。第一版可以后置；如果希望导出数据库时同时保留用户偏好，可以纳入 SQLite。

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

可保存的值：

- 默认账本 ID
- 默认账户 ID
- 默认币种
- 主题模式
- 上次打开的账本 ID

## 推荐索引

```sql
CREATE INDEX idx_transactions_book_time
ON transactions(book_id, occurred_at DESC);

CREATE INDEX idx_transactions_type
ON transactions(type);

CREATE INDEX idx_transactions_account
ON transactions(account_id);

CREATE INDEX idx_transactions_target_account
ON transactions(target_account_id);

CREATE INDEX idx_transaction_tags_tag
ON transaction_tags(tag_id);

CREATE INDEX idx_recurring_events_trigger
ON recurring_events(is_active, next_trigger_date);

CREATE INDEX idx_recurring_event_tags_tag
ON recurring_event_tags(tag_id);
```

## 周期事件触发流程

每次用户打开 App 时查询应触发的周期事件：

```sql
SELECT *
FROM recurring_events
WHERE is_active = 1
  AND next_trigger_date <= date('now')
ORDER BY next_trigger_date ASC;
```

用户界面应显示待批准列表，并提供以下操作：

- 批准：生成一条 `transactions` 记录，复制事件 Tag，推进 `next_trigger_date`。
- 跳过本次：不生成流水，只推进 `next_trigger_date`。
- 稍后处理：不修改数据，下次打开或刷新时继续提示。
- 停用规则：将 `is_active` 设置为 `0`。

第一版不记录每次周期事件的执行历史。如果后续需要展示“某次已批准、已跳过、已延后”的历史，再新增 `recurring_event_occurrences` 表。

## 表关系

```text
books 1 - N transactions
books 1 - N recurring_events

accounts 1 - N transactions.account_id
accounts 1 - N transactions.target_account_id
accounts 1 - N recurring_events.account_id
accounts 1 - N recurring_events.target_account_id

transactions N - N tags
recurring_events N - N tags
```

## 第一版必需表

```text
books
accounts
tags
transactions
transaction_tags
recurring_events
recurring_event_tags
```

`settings` 为可选表。
