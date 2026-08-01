import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';
import type { Account, AccountInput, AccountType } from './account.types';
import type { CurrencyCode } from '@/modules/shared/money';

interface AccountRow {
  id: number;
  name: string;
  type: AccountType;
  currency: CurrencyCode;
  initial_balance: number;
  current_balance: number;
  is_included_in_assets: number;
  is_archived: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface CountRow {
  count: number;
}

interface AccountBookDeleteLinkRow {
  book_id: number;
  is_default: number;
  replacement_account_id: number | null;
}

export interface AccountBookDeleteLink {
  bookId: number;
  isDefault: boolean;
  replacementAccountId: number | null;
}

function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    initialBalance: row.initial_balance,
    currentBalance: row.current_balance,
    isIncludedInAssets: row.is_included_in_assets === 1,
    isArchived: row.is_archived === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listAccounts(includeArchived = false, db?: SQLiteDBConnection) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query(
    `SELECT * FROM accounts
     WHERE (? = 1 OR is_archived = 0)
     ORDER BY is_archived ASC, sort_order ASC, name ASC`,
    [includeArchived ? 1 : 0]
  );
  return ((result.values ?? []) as AccountRow[]).map(mapAccount);
}

export async function getAccountById(id: number, db?: SQLiteDBConnection) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query('SELECT * FROM accounts WHERE id = ?', [id]);
  const row = (result.values ?? [])[0] as AccountRow | undefined;
  return row ? mapAccount(row) : null;
}

export async function createAccount(input: AccountInput) {
  const db = await getDatabase();
  const now = nowIso();
  await db.run(
    `INSERT INTO accounts (
      name, type, currency, initial_balance, current_balance,
      is_included_in_assets, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name.trim(),
      input.type,
      input.currency,
      input.initialBalance,
      input.initialBalance,
      input.isIncludedInAssets === false ? 0 : 1,
      input.sortOrder ?? 0,
      now,
      now
    ]
  );
  await persistDatabase();
}

export async function updateAccount(id: number, input: AccountInput) {
  const db = await getDatabase();
  await db.run(
    `UPDATE accounts
     SET name = ?, type = ?, currency = ?, initial_balance = ?,
         is_included_in_assets = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.type,
      input.currency,
      input.initialBalance,
      input.isIncludedInAssets === false ? 0 : 1,
      input.sortOrder ?? 0,
      nowIso(),
      id
    ]
  );
  await persistDatabase();
}

export async function restoreAccount(id: number) {
  const db = await getDatabase();
  await db.run(
    `UPDATE accounts SET is_archived = 0, updated_at = ? WHERE id = ?`,
    [nowIso(), id]
  );
  await persistDatabase();
}

export async function accountExists(id: number, db: SQLiteDBConnection) {
  const result = await db.query(
    'SELECT COUNT(*) AS count FROM accounts WHERE id = ?',
    [id]
  );
  return Number(((result.values ?? [])[0] as CountRow | undefined)?.count ?? 0) > 0;
}

export async function countAccountTransactionReferences(
  id: number,
  db: SQLiteDBConnection
) {
  const result = await db.query(
    `SELECT COUNT(*) AS count
     FROM transactions
     WHERE account_id = ? OR target_account_id = ?`,
    [id, id]
  );
  return Number(((result.values ?? [])[0] as CountRow | undefined)?.count ?? 0);
}

export async function countAccountRecurringEventReferences(
  id: number,
  db: SQLiteDBConnection
) {
  const result = await db.query(
    `SELECT COUNT(*) AS count
     FROM recurring_events
     WHERE account_id = ? OR target_account_id = ?`,
    [id, id]
  );
  return Number(((result.values ?? [])[0] as CountRow | undefined)?.count ?? 0);
}

export async function listAccountBookDeleteLinks(
  id: number,
  db: SQLiteDBConnection
) {
  const result = await db.query(
    `SELECT ba.book_id, ba.is_default,
            (
              SELECT ba2.account_id
              FROM book_accounts ba2
              INNER JOIN accounts a2 ON a2.id = ba2.account_id
              WHERE ba2.book_id = ba.book_id
                AND ba2.account_id != ?
                AND a2.is_archived = 0
              ORDER BY a2.sort_order ASC, a2.name ASC, a2.id ASC
              LIMIT 1
            ) AS replacement_account_id
     FROM book_accounts ba
     WHERE ba.account_id = ?
     ORDER BY ba.book_id ASC`,
    [id, id]
  );

  return ((result.values ?? []) as AccountBookDeleteLinkRow[]).map((row) => ({
    bookId: row.book_id,
    isDefault: row.is_default === 1,
    replacementAccountId: row.replacement_account_id ?? null
  }));
}

export async function deleteAccountRows(
  id: number,
  links: AccountBookDeleteLink[],
  db: SQLiteDBConnection
) {
  const now = nowIso();

  for (const link of links) {
    if (!link.isDefault) {
      continue;
    }

    await db.run(
      `UPDATE book_accounts
       SET is_default = 0, updated_at = ?
       WHERE book_id = ? AND account_id = ?`,
      [now, link.bookId, id],
      false
    );
    await db.run(
      `UPDATE book_accounts
       SET is_default = 1, updated_at = ?
       WHERE book_id = ? AND account_id = ?`,
      [now, link.bookId, link.replacementAccountId],
      false
    );
  }

  await db.run('DELETE FROM book_accounts WHERE account_id = ?', [id], false);
  await db.run('DELETE FROM accounts WHERE id = ?', [id], false);
}

export async function applyAccountBalanceDelta(
  id: number,
  delta: number,
  db: SQLiteDBConnection
) {
  await db.run(
    `UPDATE accounts
     SET current_balance = current_balance + ?, updated_at = ?
     WHERE id = ?`,
    [delta, nowIso(), id],
    false
  );
}
