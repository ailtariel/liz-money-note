import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';
import type {
  Transaction,
  TransactionFilters,
  TransactionInput,
  TransactionType
} from './transaction.types';
import type { CurrencyCode } from '@/modules/shared/money';

interface TransactionRow {
  id: number;
  book_id: number;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  account_id: number;
  target_account_id: number | null;
  occurred_at: string;
  note: string | null;
  recurring_event_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tag_ids: string | null;
}

function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    bookId: row.book_id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    accountId: row.account_id,
    targetAccountId: row.target_account_id,
    occurredAt: row.occurred_at,
    note: row.note,
    recurringEventId: row.recurring_event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    tagIds: row.tag_ids ? row.tag_ids.split(',').map(Number) : []
  };
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

export async function insertTransaction(
  input: TransactionInput,
  db: SQLiteDBConnection
) {
  const now = nowIso();
  const result = await db.run(
    `INSERT INTO transactions (
      book_id, type, amount, currency, account_id, target_account_id,
      occurred_at, note, recurring_event_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.bookId,
      input.type,
      input.amount,
      input.currency,
      input.accountId,
      input.targetAccountId ?? null,
      input.occurredAt,
      input.note ?? null,
      input.recurringEventId ?? null,
      now,
      now
    ],
    false
  );
  const id = result.changes?.lastId ?? 0;

  if ((input.tagIds ?? []).length > 0) {
    await db.executeSet(
      input.tagIds!.map((tagId) => ({
        statement:
          'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
        values: [id, tagId]
      })),
      false
    );
  }

  return id;
}

export async function updateTransactionRecord(
  id: number,
  input: TransactionInput,
  db: SQLiteDBConnection
) {
  await db.run(
    `UPDATE transactions
     SET book_id = ?, type = ?, amount = ?, currency = ?, account_id = ?,
         target_account_id = ?, occurred_at = ?, note = ?, updated_at = ?
     WHERE id = ? AND deleted_at IS NULL`,
    [
      input.bookId,
      input.type,
      input.amount,
      input.currency,
      input.accountId,
      input.targetAccountId ?? null,
      input.occurredAt,
      input.note ?? null,
      nowIso(),
      id
    ],
    false
  );
}

export async function replaceTransactionTags(
  id: number,
  tagIds: number[],
  db: SQLiteDBConnection
) {
  await db.run(
    'DELETE FROM transaction_tags WHERE transaction_id = ?',
    [id],
    false
  );

  if (tagIds.length > 0) {
    await db.executeSet(
      tagIds.map((tagId) => ({
        statement:
          'INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)',
        values: [id, tagId]
      })),
      false
    );
  }
}

export async function listTransactions(filters: TransactionFilters = {}) {
  const db = await getDatabase();
  const where = ['t.deleted_at IS NULL'];
  const values: Array<number | string> = [];

  if (filters.bookId) {
    where.push('t.book_id = ?');
    values.push(filters.bookId);
  }

  if (filters.accountId) {
    where.push('(t.account_id = ? OR t.target_account_id = ?)');
    values.push(filters.accountId, filters.accountId);
  }

  if (filters.type) {
    where.push('t.type = ?');
    values.push(filters.type);
  }

  if (filters.tagId) {
    where.push(`EXISTS (
      SELECT 1 FROM transaction_tags tt
      WHERE tt.transaction_id = t.id AND tt.tag_id = ?
    )`);
    values.push(filters.tagId);
  }

  if (filters.tagIds?.length) {
    const placeholders = filters.tagIds.map(() => '?').join(', ');
    where.push(`EXISTS (
      SELECT 1 FROM transaction_tags tt
      WHERE tt.transaction_id = t.id AND tt.tag_id IN (${placeholders})
    )`);
    values.push(...filters.tagIds);
  }

  if (filters.dateFrom) {
    where.push('date(t.occurred_at) >= date(?)');
    values.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    where.push('date(t.occurred_at) <= date(?)');
    values.push(filters.dateTo);
  }

  const search = filters.search?.trim();
  if (search) {
    const normalizedSearch = search.toLowerCase();
    const likeSearch = `%${escapeLike(normalizedSearch)}%`;
    const numericSearch = normalizedSearch.replace(/[^\d]/g, '');
    const searchWhere = [
      "LOWER(COALESCE(t.note, '')) LIKE ? ESCAPE '\\'",
      `LOWER(
        CASE t.type
          WHEN 'income' THEN 'income 收入'
          WHEN 'expense' THEN 'expense 支出'
          WHEN 'transfer' THEN 'transfer 转账'
          ELSE t.type
        END
      ) LIKE ? ESCAPE '\\'`,
      `EXISTS (
        SELECT 1
        FROM transaction_tags stt
        INNER JOIN tags st ON st.id = stt.tag_id
        WHERE stt.transaction_id = t.id
          AND LOWER(st.name) LIKE ? ESCAPE '\\'
      )`
    ];
    values.push(likeSearch, likeSearch, likeSearch);

    if (numericSearch) {
      searchWhere.push(
        "CAST(t.amount AS TEXT) LIKE ? ESCAPE '\\'",
        "printf('%.2f', t.amount / 100.0) LIKE ? ESCAPE '\\'"
      );
      values.push(
        `%${escapeLike(numericSearch)}%`,
        `%${escapeLike(normalizedSearch)}%`
      );
    }

    where.push(`(${searchWhere.join(' OR ')})`);
  }

  const result = await db.query(
    `SELECT t.*,
       GROUP_CONCAT(tt.tag_id) AS tag_ids
     FROM transactions t
     LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
     WHERE ${where.join(' AND ')}
     GROUP BY t.id
     ORDER BY t.occurred_at DESC, t.id DESC`,
    values
  );

  return ((result.values ?? []) as TransactionRow[]).map(mapTransaction);
}

export async function getMostRecentLinkedAccountId(bookId: number) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT t.account_id
     FROM transactions t
     INNER JOIN books b ON b.id = t.book_id AND b.is_archived = 0
     INNER JOIN accounts a ON a.id = t.account_id AND a.is_archived = 0
     INNER JOIN book_accounts ba
       ON ba.book_id = t.book_id AND ba.account_id = t.account_id
     WHERE t.book_id = ? AND t.deleted_at IS NULL
     ORDER BY t.occurred_at DESC, t.id DESC
     LIMIT 1`,
    [bookId]
  );
  const row = (result.values ?? [])[0] as { account_id: number } | undefined;
  return row?.account_id ?? null;
}

export async function getTransactionById(id: number, db?: SQLiteDBConnection) {
  const connection = db ?? (await getDatabase());
  const result = await connection.query(
    `SELECT t.*, GROUP_CONCAT(tt.tag_id) AS tag_ids
     FROM transactions t
     LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
     WHERE t.id = ?
     GROUP BY t.id`,
    [id]
  );
  const row = (result.values ?? [])[0] as TransactionRow | undefined;
  return row ? mapTransaction(row) : null;
}

export async function markTransactionDeleted(id: number, db: SQLiteDBConnection) {
  await db.run(
    `UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?`,
    [nowIso(), nowIso(), id],
    false
  );
}
