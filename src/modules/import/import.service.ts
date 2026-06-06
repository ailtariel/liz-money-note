import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { applyAccountBalanceDelta } from '@/modules/accounts/account.repository';
import { insertTransaction } from '@/modules/transactions/transaction.repository';
import { nowIso } from '@/modules/shared/date';
import type { CurrencyCode } from '@/modules/shared/money';
import type {
  ImportBatchResult,
  ImportFileResult,
  ImportTextFile,
  ParsedImportFile
} from './import.types';
import { parseTextImportFile } from './text-import.parser';

interface IdRow {
  id: number;
}

async function findBookId(name: string, db: SQLiteDBConnection) {
  const result = await db.query('SELECT id FROM books WHERE name = ? LIMIT 1', [
    name
  ]);
  return ((result.values ?? [])[0] as IdRow | undefined)?.id ?? null;
}

async function ensureBook(name: string, db: SQLiteDBConnection) {
  const existingId = await findBookId(name, db);
  if (existingId) {
    return existingId;
  }

  const now = nowIso();
  const result = await db.run(
    `INSERT INTO books (name, description, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [name, 'Imported from text data.', 0, now, now]
  );
  return result.changes?.lastId ?? 0;
}

async function findAccountId(
  name: string,
  currency: CurrencyCode,
  db: SQLiteDBConnection
) {
  const result = await db.query(
    'SELECT id FROM accounts WHERE name = ? AND currency = ? LIMIT 1',
    [name, currency]
  );
  return ((result.values ?? [])[0] as IdRow | undefined)?.id ?? null;
}

async function ensureImportAccount(
  name: string,
  currency: CurrencyCode,
  db: SQLiteDBConnection
) {
  const existingId = await findAccountId(name, currency, db);
  if (existingId) {
    return existingId;
  }

  const now = nowIso();
  const result = await db.run(
    `INSERT INTO accounts (
      name, type, currency, initial_balance, current_balance,
      is_included_in_assets, sort_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, 'other', currency, 0, 0, 1, 0, now, now]
  );
  return result.changes?.lastId ?? 0;
}

async function ensureTag(name: string, db: SQLiteDBConnection) {
  const normalized = name.trim() || '未分类';
  const existing = await db.query('SELECT id FROM tags WHERE name = ? LIMIT 1', [
    normalized
  ]);
  const existingId = ((existing.values ?? [])[0] as IdRow | undefined)?.id;

  if (existingId) {
    return existingId;
  }

  const now = nowIso();
  const result = await db.run(
    `INSERT INTO tags (name, color, sort_order, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [normalized, null, 0, now, now]
  );
  return result.changes?.lastId ?? 0;
}

async function importParsedFile(
  parsedFile: ParsedImportFile,
  db: SQLiteDBConnection
): Promise<ImportFileResult> {
  await db.beginTransaction();

  try {
    const bookId = await ensureBook(parsedFile.bookName, db);
    const accountId = await ensureImportAccount(
      parsedFile.accountName,
      parsedFile.currency,
      db
    );
    const tagIds = new Map<string, number>();

    for (const transaction of parsedFile.transactions) {
      if (!tagIds.has(transaction.category)) {
        tagIds.set(transaction.category, await ensureTag(transaction.category, db));
      }

      await insertTransaction(
        {
          bookId,
          type: transaction.type,
          amount: transaction.amount,
          currency: parsedFile.currency,
          accountId,
          occurredAt: transaction.occurredAt,
          note: transaction.note,
          tagIds: [tagIds.get(transaction.category)!]
        },
        db
      );

      await applyAccountBalanceDelta(
        accountId,
        transaction.type === 'income' ? transaction.amount : -transaction.amount,
        db
      );
    }

    await db.commitTransaction();

    return {
      fileName: parsedFile.fileName,
      bookName: parsedFile.bookName,
      accountName: parsedFile.accountName,
      currency: parsedFile.currency,
      importedRows: parsedFile.transactions.length,
      skippedRows: parsedFile.skippedRows,
      issueCount: parsedFile.issues.length,
      issues: parsedFile.issues
    };
  } catch (error) {
    await db.rollbackTransaction();
    throw error;
  }
}

export async function importTextFiles(
  files: ImportTextFile[]
): Promise<ImportBatchResult> {
  const db = await getDatabase();
  const results: ImportFileResult[] = [];

  for (const file of files) {
    const parsed = parseTextImportFile(file);
    results.push(await importParsedFile(parsed, db));
  }

  await persistDatabase();

  return {
    files: results,
    importedRows: results.reduce((sum, file) => sum + file.importedRows, 0),
    skippedRows: results.reduce((sum, file) => sum + file.skippedRows, 0),
    issueCount: results.reduce((sum, file) => sum + file.issueCount, 0)
  };
}

export function parseImportPreview(file: ImportTextFile) {
  return parseTextImportFile(file);
}
