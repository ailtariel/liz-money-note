import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import type {
  Book,
  BookAccountConfigInput,
  BookAccountLink,
  BookInput
} from './book.types';

interface BookRow {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface BookTransactionDeleteRow {
  id: number;
  type: TransactionType;
  amount: number;
  accountId: number;
  targetAccountId: number | null;
  deletedAt: string | null;
}

interface BookTransactionDeleteDbRow {
  id: number;
  type: TransactionType;
  amount: number;
  account_id: number;
  target_account_id: number | null;
  deleted_at: string | null;
}

interface BookAccountDbRow {
  book_id: number;
  account_id: number;
  is_default: number;
  created_at: string;
  updated_at: string;
}

interface AccountIdRow {
  id: number;
}

function mapBook(row: BookRow): Book {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    isArchived: row.is_archived === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBookAccountLink(row: BookAccountDbRow): BookAccountLink {
  return {
    bookId: row.book_id,
    accountId: row.account_id,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function getFallbackAccountId(db: SQLiteDBConnection) {
  const activeResult = await db.query(
    `SELECT id FROM accounts
     WHERE is_archived = 0
     ORDER BY sort_order ASC, name ASC
     LIMIT 1`
  );
  const activeAccount = (activeResult.values ?? [])[0] as
    | AccountIdRow
    | undefined;

  if (activeAccount?.id) {
    return activeAccount.id;
  }

  const anyResult = await db.query(
    `SELECT id FROM accounts
     ORDER BY is_archived ASC, sort_order ASC, name ASC
     LIMIT 1`
  );
  const anyAccount = (anyResult.values ?? [])[0] as AccountIdRow | undefined;
  return anyAccount?.id ?? null;
}

export async function listBooks(
  includeArchived = false,
  db?: SQLiteDBConnection
) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query(
    `SELECT * FROM books
     WHERE (? = 1 OR is_archived = 0)
     ORDER BY is_archived ASC, sort_order ASC, name ASC`,
    [includeArchived ? 1 : 0]
  );
  return ((result.values ?? []) as BookRow[]).map(mapBook);
}

export async function createBook(input: BookInput, db?: SQLiteDBConnection) {
  const connection = db ?? (await getDatabase());
  const now = nowIso();
  const result = await connection.run(
    `INSERT INTO books (name, description, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      input.name.trim(),
      input.description ?? null,
      input.sortOrder ?? 0,
      now,
      now
    ]
  );
  const id = result.changes?.lastId ?? 0;
  await ensureBookHasDefaultAccount(id, connection);
  await persistDatabase();
  return id;
}

export async function updateBook(id: number, input: BookInput) {
  const db = await getDatabase();
  await db.run(
    `UPDATE books
     SET name = ?, description = ?, sort_order = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.name.trim(),
      input.description ?? null,
      input.sortOrder ?? 0,
      nowIso(),
      id
    ]
  );
  await persistDatabase();
}

export async function archiveBook(id: number) {
  const db = await getDatabase();
  await db.run(
    `UPDATE books SET is_archived = 1, updated_at = ? WHERE id = ?`,
    [nowIso(), id]
  );
  await persistDatabase();
}

export async function restoreBook(id: number) {
  const db = await getDatabase();
  await db.run(
    `UPDATE books SET is_archived = 0, updated_at = ? WHERE id = ?`,
    [nowIso(), id]
  );
  await persistDatabase();
}

export async function listBookTransactionsForDelete(
  bookId: number,
  db: SQLiteDBConnection
) {
  const result = await db.query(
    `SELECT id, type, amount, account_id, target_account_id, deleted_at
     FROM transactions
     WHERE book_id = ?`,
    [bookId]
  );

  return ((result.values ?? []) as BookTransactionDeleteDbRow[]).map((row) => ({
    id: row.id,
    type: row.type,
    amount: row.amount,
    accountId: row.account_id,
    targetAccountId: row.target_account_id,
    deletedAt: row.deleted_at
  }));
}

export async function deleteBookRows(bookId: number, db: SQLiteDBConnection) {
  await db.run(
    `DELETE FROM transaction_tags
     WHERE transaction_id IN (
       SELECT id FROM transactions WHERE book_id = ?
     )`,
    [bookId],
    false
  );
  await db.run('DELETE FROM transactions WHERE book_id = ?', [bookId], false);
  await db.run(
    `DELETE FROM recurring_event_tags
     WHERE recurring_event_id IN (
       SELECT id FROM recurring_events WHERE book_id = ?
     )`,
    [bookId],
    false
  );
  await db.run('DELETE FROM recurring_events WHERE book_id = ?', [bookId], false);
  await db.run('DELETE FROM book_accounts WHERE book_id = ?', [bookId], false);
  await db.run('DELETE FROM books WHERE id = ?', [bookId], false);
}

export async function listBookAccountLinks(
  bookId: number,
  db?: SQLiteDBConnection
) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query(
    `SELECT book_id, account_id, is_default, created_at, updated_at
     FROM book_accounts
     WHERE book_id = ?
     ORDER BY is_default DESC, account_id ASC`,
    [bookId]
  );
  return ((result.values ?? []) as BookAccountDbRow[]).map(mapBookAccountLink);
}

export async function getBookDefaultAccountId(
  bookId: number,
  db?: SQLiteDBConnection
) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query(
    `SELECT account_id
     FROM book_accounts
     WHERE book_id = ? AND is_default = 1
     LIMIT 1`,
    [bookId]
  );
  const row = (result.values ?? [])[0] as { account_id: number } | undefined;
  return row?.account_id ?? null;
}

export async function isAccountLinkedToBook(
  bookId: number,
  accountId: number,
  db?: SQLiteDBConnection
) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query(
    `SELECT COUNT(*) AS count
     FROM book_accounts
     WHERE book_id = ? AND account_id = ?`,
    [bookId, accountId]
  );
  return Number((result.values ?? [])[0]?.count ?? 0) > 0;
}

export async function setBookAccountLinks(
  bookId: number,
  input: BookAccountConfigInput,
  db?: SQLiteDBConnection
) {
  const accountIds = [...new Set(input.accountIds)];

  if (!accountIds.length) {
    throw new Error('Book must have at least one linked account.');
  }

  if (!accountIds.includes(input.defaultAccountId)) {
    throw new Error('Default account must be linked to the book.');
  }

  const connection = db ?? (await getDatabase());
  const now = nowIso();
  const ownsTransaction = !db;

  if (ownsTransaction) {
    await connection.beginTransaction();
  }
  try {
    await connection.run(
      'DELETE FROM book_accounts WHERE book_id = ?',
      [bookId],
      false
    );

    await connection.executeSet(
      accountIds.map((accountId) => ({
        statement: `INSERT INTO book_accounts (
          book_id, account_id, is_default, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?)`,
        values: [
          bookId,
          accountId,
          accountId === input.defaultAccountId ? 1 : 0,
          now,
          now
        ]
      })),
      false
    );

    if (ownsTransaction) {
      await connection.commitTransaction();
      await persistDatabase();
    }
  } catch (error) {
    if (ownsTransaction) {
      try {
        await connection.rollbackTransaction();
      } catch {
        // Preserve the original database error.
      }
    }
    throw error;
  }
}

export async function linkAccountToBook(
  bookId: number,
  accountId: number,
  options: { makeDefault?: boolean } = {},
  db?: SQLiteDBConnection
) {
  const connection = db ?? (await getDatabase());
  const now = nowIso();

  if (options.makeDefault) {
    await connection.run(
      `UPDATE book_accounts
       SET is_default = 0, updated_at = ?
       WHERE book_id = ?`,
      [now, bookId],
      false
    );
  }

  await connection.run(
    `INSERT INTO book_accounts (
      book_id, account_id, is_default, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(book_id, account_id) DO UPDATE SET
      is_default = CASE
        WHEN excluded.is_default = 1 THEN 1
        ELSE book_accounts.is_default
      END,
      updated_at = excluded.updated_at`,
    [bookId, accountId, options.makeDefault ? 1 : 0, now, now],
    false
  );

  if (!db) {
    await persistDatabase();
  }
}

export async function linkDefaultAccountToBook(
  bookId: number,
  accountId: number,
  db?: SQLiteDBConnection
) {
  await linkAccountToBook(bookId, accountId, { makeDefault: true }, db);
}

export async function ensureBookHasDefaultAccount(
  bookId: number,
  db?: SQLiteDBConnection
) {
  const connection = db ?? (await getDatabase());
  const links = await listBookAccountLinks(bookId, connection);
  const existingDefault = links.find((link) => link.isDefault);

  if (links.length && existingDefault) {
    return existingDefault.accountId;
  }

  const defaultAccountId =
    links[0]?.accountId ?? (await getFallbackAccountId(connection));

  if (!defaultAccountId) {
    throw new Error('Book must have a default account.');
  }

  await setBookAccountLinks(
    bookId,
    {
      accountIds: links.length
        ? links.map((link) => link.accountId)
        : [defaultAccountId],
      defaultAccountId
    },
    connection
  );

  return defaultAccountId;
}

export async function ensureDefaultBook() {
  const db = await getDatabase();
  const books = await listBooks(true, db);

  if (books.length > 0) {
    await ensureBookHasDefaultAccount(books[0].id, db);
    return books[0].id;
  }

  return createBook({ name: '默认账本' }, db);
}
