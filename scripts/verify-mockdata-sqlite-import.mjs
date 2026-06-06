import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlitePath =
  process.env.SQLITE3_PATH ?? 'C:\\Software\\SQLite\\sqlite3.exe';
const parserModuleUrl = pathToFileURL(
  path.join(rootDir, 'src/modules/import/text-import.parser.ts')
).href;
const schemaModuleUrl = pathToFileURL(
  path.join(rootDir, 'src/modules/database/schema.ts')
).href;

const { parseTextImportFile } = await import(parserModuleUrl);
const { createTableStatements, createIndexStatements } = await import(
  schemaModuleUrl
);

function sqlString(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function runSqlite(dbPath, input) {
  const result = spawnSync(sqlitePath, [dbPath], {
    input,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'sqlite3 failed.');
  }

  return result.stdout.trim();
}

const mockDir = path.join(rootDir, '.mockdata');
const files = (await readdir(mockDir)).filter((fileName) =>
  /\.(csv|txt)$/i.test(fileName)
);
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'liz-money-note-'));
const dbPath = path.join(tempDir, 'mock-import.db');

try {
  const statements = [createTableStatements, createIndexStatements, 'BEGIN;'];
  const tagIds = new Map();
  let bookId = 1;
  let accountId = 1;
  let tagId = 1;
  let transactionId = 1;
  let expectedTransactions = 0;

  for (const fileName of files) {
    const content = await readFile(path.join(mockDir, fileName), 'utf8');
    const parsed = parseTextImportFile({
      fileName,
      content
    });

    if (parsed.issues.length > 0) {
      throw new Error(`${fileName} has parser issues.`);
    }

    statements.push(
      `INSERT INTO books (id, name, description, sort_order, is_archived, created_at, updated_at)
       VALUES (${bookId}, ${sqlString(parsed.bookName)}, 'Imported mock data.', 0, 0, datetime('now'), datetime('now'));`
    );
    statements.push(
      `INSERT INTO accounts (
        id, name, type, currency, initial_balance, current_balance,
        is_included_in_assets, is_archived, sort_order, created_at, updated_at
      ) VALUES (
        ${accountId}, ${sqlString(parsed.accountName)}, 'other',
        ${sqlString(parsed.currency)}, 0, 0, 1, 0, 0, datetime('now'), datetime('now')
      );`
    );

    for (const transaction of parsed.transactions) {
      if (!tagIds.has(transaction.category)) {
        tagIds.set(transaction.category, tagId);
        statements.push(
          `INSERT INTO tags (id, name, color, sort_order, created_at, updated_at)
           VALUES (${tagId}, ${sqlString(transaction.category)}, NULL, 0, datetime('now'), datetime('now'));`
        );
        tagId += 1;
      }

      statements.push(
        `INSERT INTO transactions (
          id, book_id, type, amount, currency, account_id, target_account_id,
          occurred_at, note, recurring_event_id, created_at, updated_at, deleted_at
        ) VALUES (
          ${transactionId}, ${bookId}, ${sqlString(transaction.type)},
          ${transaction.amount}, ${sqlString(parsed.currency)}, ${accountId}, NULL,
          ${sqlString(transaction.occurredAt)}, ${sqlString(transaction.note)}, NULL,
          datetime('now'), datetime('now'), NULL
        );`
      );
      statements.push(
        `INSERT INTO transaction_tags (transaction_id, tag_id)
         VALUES (${transactionId}, ${tagIds.get(transaction.category)});`
      );
      statements.push(
        `UPDATE accounts
         SET current_balance = current_balance ${
           transaction.type === 'income' ? '+' : '-'
         } ${transaction.amount}
         WHERE id = ${accountId};`
      );
      transactionId += 1;
      expectedTransactions += 1;
    }

    bookId += 1;
    accountId += 1;
  }

  statements.push('COMMIT;');
  runSqlite(dbPath, statements.join('\n'));

  const summary = runSqlite(
    dbPath,
    `
    SELECT 'books=' || COUNT(*) FROM books;
    SELECT 'accounts=' || COUNT(*) FROM accounts;
    SELECT 'tags=' || COUNT(*) FROM tags;
    SELECT 'transactions=' || COUNT(*) FROM transactions;
    SELECT 'balance_mismatches=' || COUNT(*)
    FROM accounts a
    WHERE a.current_balance != COALESCE((
      SELECT SUM(CASE t.type WHEN 'income' THEN t.amount ELSE -t.amount END)
      FROM transactions t
      WHERE t.account_id = a.id AND t.deleted_at IS NULL
    ), 0);
    `
  );

  if (!summary.includes(`transactions=${expectedTransactions}`)) {
    throw new Error(`Expected ${expectedTransactions} transactions.\n${summary}`);
  }

  if (!summary.includes('balance_mismatches=0')) {
    throw new Error(`Account balances do not match transactions.\n${summary}`);
  }

  console.log(summary);
  console.log(`SQLite import verification passed: ${dbPath}`);
} finally {
  await rm(tempDir, {
    recursive: true,
    force: true
  });
}
