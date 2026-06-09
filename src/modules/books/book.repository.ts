import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import type { Book, BookInput } from './book.types';

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

export async function listBooks(includeArchived = false, db?: SQLiteDBConnection) {
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
    [input.name.trim(), input.description ?? null, input.sortOrder ?? 0, now, now]
  );
  await persistDatabase();
  return result.changes?.lastId ?? 0;
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
  await db.run('DELETE FROM books WHERE id = ?', [bookId], false);
}

export async function ensureDefaultBook() {
  const db = await getDatabase();
  const books = await listBooks(true, db);

  if (books.length > 0) {
    return books[0].id;
  }

  return createBook({ name: '默认账本' }, db);
}
