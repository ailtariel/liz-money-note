import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { createIndexStatements, createTableStatements } from './schema';
import { nowIso } from '@/modules/shared/date';

interface IdRow {
  id: number;
}

interface AccountReferenceRow {
  account_id: number | null;
  target_account_id: number | null;
}

interface DefaultAccountRow {
  account_id: number | null;
}

async function ensureAtLeastOneAccount(db: SQLiteDBConnection) {
  const result = await db.query('SELECT COUNT(*) AS count FROM accounts');
  const count = Number((result.values ?? [])[0]?.count ?? 0);

  if (count > 0) {
    return;
  }

  const now = nowIso();
  await db.run(
    `INSERT INTO accounts (
      name, type, currency, initial_balance, current_balance,
      is_included_in_assets, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Default Account', 'cash', 'AED', 0, 0, 1, 0, now, now],
    false
  );
}

async function getFallbackAccountId(db: SQLiteDBConnection) {
  const result = await db.query(
    `SELECT id FROM accounts
     WHERE is_archived = 0
     ORDER BY sort_order ASC, name ASC
     LIMIT 1`
  );
  const activeAccount = (result.values ?? [])[0] as IdRow | undefined;

  if (activeAccount?.id) {
    return activeAccount.id;
  }

  const anyResult = await db.query(
    `SELECT id FROM accounts
     ORDER BY is_archived ASC, sort_order ASC, name ASC
     LIMIT 1`
  );
  const anyAccount = (anyResult.values ?? [])[0] as IdRow | undefined;
  return anyAccount?.id ?? null;
}

async function getBookAccountIdsFromTransactions(
  db: SQLiteDBConnection,
  bookId: number
) {
  const result = await db.query(
    `SELECT account_id, target_account_id
     FROM transactions
     WHERE book_id = ?`,
    [bookId]
  );
  const ids = new Set<number>();

  for (const row of (result.values ?? []) as AccountReferenceRow[]) {
    if (row.account_id) {
      ids.add(row.account_id);
    }

    if (row.target_account_id) {
      ids.add(row.target_account_id);
    }
  }

  return [...ids];
}

async function getBookDefaultAccountId(
  db: SQLiteDBConnection,
  bookId: number
) {
  const result = await db.query(
    `SELECT account_id
     FROM transactions
     WHERE book_id = ? AND deleted_at IS NULL
     ORDER BY occurred_at DESC, id DESC
     LIMIT 1`,
    [bookId]
  );
  const row = (result.values ?? [])[0] as DefaultAccountRow | undefined;
  return row?.account_id ?? null;
}

async function hasBookAccountLinks(db: SQLiteDBConnection, bookId: number) {
  const result = await db.query(
    'SELECT COUNT(*) AS count FROM book_accounts WHERE book_id = ?',
    [bookId]
  );
  return Number((result.values ?? [])[0]?.count ?? 0) > 0;
}

async function backfillBookAccounts(db: SQLiteDBConnection) {
  await ensureAtLeastOneAccount(db);

  const fallbackAccountId = await getFallbackAccountId(db);
  if (!fallbackAccountId) {
    return;
  }

  const booksResult = await db.query('SELECT id FROM books ORDER BY id ASC');
  const now = nowIso();

  for (const book of (booksResult.values ?? []) as IdRow[]) {
    if (await hasBookAccountLinks(db, book.id)) {
      continue;
    }

    const accountIds = await getBookAccountIdsFromTransactions(db, book.id);
    const defaultAccountId =
      (await getBookDefaultAccountId(db, book.id)) ??
      accountIds[0] ??
      fallbackAccountId;
    const linkedAccountIds = accountIds.includes(defaultAccountId)
      ? accountIds
      : [defaultAccountId, ...accountIds];

    for (const accountId of linkedAccountIds) {
      await db.run(
        `INSERT OR IGNORE INTO book_accounts (
          book_id, account_id, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)`,
        [book.id, accountId, accountId === defaultAccountId ? 1 : 0, now, now],
        false
      );
    }

    await db.run(
      `UPDATE book_accounts
       SET is_default = CASE WHEN account_id = ? THEN 1 ELSE 0 END,
           updated_at = ?
       WHERE book_id = ?`,
      [defaultAccountId, now, book.id],
      false
    );
  }
}

export async function runMigrations(db: SQLiteDBConnection) {
  await db.execute(createTableStatements);
  await backfillBookAccounts(db);
  await db.execute(createIndexStatements);
}
