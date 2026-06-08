import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { applyAccountBalanceDelta } from '@/modules/accounts/account.repository';
import { insertTransaction } from '@/modules/transactions/transaction.repository';
import { nowIso } from '@/modules/shared/date';
import type { CurrencyCode } from '@/modules/shared/money';
import type {
  ImportBatchResult,
  ImportDuplicateSummary,
  ImportFileResult,
  ImportTextOptions,
  ImportTextFile,
  ParsedImportFile,
  ParsedImportTransaction
} from './import.types';
import { parseTextImportFile } from './text-import.parser';

interface IdRow {
  id: number;
}

interface DuplicateTransactionRow {
  type: ParsedImportTransaction['type'];
  amount: number;
  currency: CurrencyCode;
  occurred_at: string;
  note: string | null;
  category: string | null;
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
    [name, 'Imported from text data.', 0, now, now],
    false
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
    [name, 'other', currency, 0, 0, 1, 0, now, now],
    false
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
    [normalized, null, 0, now, now],
    false
  );
  return result.changes?.lastId ?? 0;
}

function duplicateKey(
  parsedFile: Pick<ParsedImportFile, 'bookName' | 'accountName' | 'currency'>,
  transaction: Pick<
    ParsedImportTransaction,
    'type' | 'amount' | 'occurredAt' | 'note' | 'category'
  >
) {
  return [
    parsedFile.bookName,
    parsedFile.accountName,
    parsedFile.currency,
    transaction.type,
    transaction.amount,
    transaction.occurredAt,
    transaction.note ?? '',
    transaction.category.trim()
  ].join('\u001f');
}

async function getExistingDuplicateKeys(
  parsedFile: ParsedImportFile,
  db: SQLiteDBConnection
) {
  const result = await db.query(
    `SELECT t.type, t.amount, t.currency, t.occurred_at, t.note, tag.name AS category
     FROM transactions t
     INNER JOIN books b ON b.id = t.book_id
     INNER JOIN accounts a ON a.id = t.account_id
     LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
     LEFT JOIN tags tag ON tag.id = tt.tag_id
     WHERE t.deleted_at IS NULL
       AND b.name = ?
       AND a.name = ?
       AND a.currency = ?
       AND t.currency = ?`,
    [
      parsedFile.bookName,
      parsedFile.accountName,
      parsedFile.currency,
      parsedFile.currency
    ]
  );

  return new Set(
    ((result.values ?? []) as DuplicateTransactionRow[])
      .filter((row) => row.category)
      .map((row) =>
        duplicateKey(parsedFile, {
          type: row.type,
          amount: row.amount,
          occurredAt: row.occurred_at,
          note: row.note,
          category: row.category!
        })
      )
  );
}

async function filterDuplicateTransactions(
  parsedFiles: ParsedImportFile[],
  db: SQLiteDBConnection
) {
  const seenKeys = new Set<string>();
  const duplicateRowsByIndex: number[] = [];
  const files: ParsedImportFile[] = [];

  for (const [index, parsedFile] of parsedFiles.entries()) {
    const existingKeys = await getExistingDuplicateKeys(parsedFile, db);
    const transactions: ParsedImportTransaction[] = [];
    let duplicateRows = 0;

    for (const transaction of parsedFile.transactions) {
      const key = duplicateKey(parsedFile, transaction);
      if (existingKeys.has(key) || seenKeys.has(key)) {
        duplicateRows += 1;
        continue;
      }

      seenKeys.add(key);
      transactions.push(transaction);
    }

    duplicateRowsByIndex[index] = duplicateRows;
    files.push({
      ...parsedFile,
      transactions
    });
  }

  return {
    files,
    duplicateRowsByIndex
  };
}

async function summarizeDuplicates(
  parsedFiles: ParsedImportFile[],
  db: SQLiteDBConnection
): Promise<ImportDuplicateSummary> {
  const { duplicateRowsByIndex } = await filterDuplicateTransactions(parsedFiles, db);
  const files = parsedFiles
    .map((file, index) => ({
      fileName: file.fileName,
      duplicateRows: duplicateRowsByIndex[index] ?? 0
    }))
    .filter((file) => file.duplicateRows > 0);

  return {
    files,
    duplicateRows: files.reduce((sum, file) => sum + file.duplicateRows, 0)
  };
}

async function importParsedFile(
  parsedFile: ParsedImportFile,
  db: SQLiteDBConnection,
  duplicateRows: number
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
      duplicateRows,
      issueCount: parsedFile.issues.length,
      issues: parsedFile.issues
    };
  } catch (error) {
    try {
      await db.rollbackTransaction();
    } catch {
      // Preserve the original database error.
    }
    throw error;
  }
}

export async function importTextFiles(
  files: ImportTextFile[],
  options: ImportTextOptions = {}
): Promise<ImportBatchResult> {
  const db = await getDatabase();
  const results: ImportFileResult[] = [];
  let parsedFiles = files.map(parseTextImportFile);
  let duplicateRowsByIndex: number[] = [];

  if (options.duplicateStrategy === 'ignore') {
    const filtered = await filterDuplicateTransactions(parsedFiles, db);
    parsedFiles = filtered.files;
    duplicateRowsByIndex = filtered.duplicateRowsByIndex;
  }

  for (const [index, parsed] of parsedFiles.entries()) {
    results.push(
      await importParsedFile(
        parsed,
        db,
        duplicateRowsByIndex[index] ?? 0
      )
    );
  }

  await persistDatabase();

  return {
    files: results,
    importedRows: results.reduce((sum, file) => sum + file.importedRows, 0),
    skippedRows: results.reduce((sum, file) => sum + file.skippedRows, 0),
    duplicateRows: results.reduce((sum, file) => sum + file.duplicateRows, 0),
    issueCount: results.reduce((sum, file) => sum + file.issueCount, 0)
  };
}

export function parseImportPreview(file: ImportTextFile) {
  return parseTextImportFile(file);
}

export async function getImportDuplicateSummary(files: ImportTextFile[]) {
  const db = await getDatabase();
  return summarizeDuplicates(files.map(parseTextImportFile), db);
}
