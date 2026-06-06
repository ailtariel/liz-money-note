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

export async function archiveAccount(id: number) {
  const db = await getDatabase();
  await db.run(
    `UPDATE accounts SET is_archived = 1, updated_at = ? WHERE id = ?`,
    [nowIso(), id]
  );
  await persistDatabase();
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
    [delta, nowIso(), id]
  );
}
