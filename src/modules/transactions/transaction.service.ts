import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import {
  applyAccountBalanceDelta,
  getAccountById
} from '@/modules/accounts/account.repository';
import { isAccountLinkedToBook } from '@/modules/books/book.repository';
import {
  getTransactionById,
  insertTransaction,
  markTransactionDeleted,
  replaceTransactionTags,
  updateTransactionRecord
} from './transaction.repository';
import type { TransactionInput } from './transaction.types';

interface TransactionBalanceEffect {
  type: TransactionInput['type'];
  amount: number;
  accountId: number;
  targetAccountId?: number | null;
}

async function applyTransactionBalanceEffect(
  transaction: TransactionBalanceEffect,
  direction: 1 | -1,
  db: SQLiteDBConnection
) {
  if (transaction.type === 'income') {
    await applyAccountBalanceDelta(
      transaction.accountId,
      transaction.amount * direction,
      db
    );
    return;
  }

  if (transaction.type === 'expense') {
    await applyAccountBalanceDelta(
      transaction.accountId,
      -transaction.amount * direction,
      db
    );
    return;
  }

  await applyAccountBalanceDelta(
    transaction.accountId,
    -transaction.amount * direction,
    db
  );
  await applyAccountBalanceDelta(
    transaction.targetAccountId!,
    transaction.amount * direction,
    db
  );
}

async function validateTransactionInput(
  input: TransactionInput,
  db: SQLiteDBConnection
) {
  if (input.amount <= 0) {
    throw new Error('金额必须大于 0。');
  }

  const sourceAccount = await getAccountById(input.accountId, db);
  if (!sourceAccount) {
    throw new Error('账户不存在。');
  }

  if (!(await isAccountLinkedToBook(input.bookId, input.accountId, db))) {
    throw new Error('账户未关联到所选账本。');
  }

  if (sourceAccount.currency !== input.currency) {
    throw new Error('流水币种必须与账户币种一致。');
  }

  if (input.type !== 'transfer') {
    return {
      sourceAccount,
      targetAccount: null
    };
  }

  if (!input.targetAccountId) {
    throw new Error('转账必须选择转入账户。');
  }

  const targetAccount = await getAccountById(input.targetAccountId, db);
  if (!targetAccount) {
    throw new Error('转入账户不存在。');
  }

  if (!(await isAccountLinkedToBook(input.bookId, input.targetAccountId, db))) {
    throw new Error('转入账户未关联到所选账本。');
  }

  if (targetAccount.currency !== sourceAccount.currency) {
    throw new Error('不支持跨币种转账。');
  }

  return {
    sourceAccount,
    targetAccount
  };
}

export async function createTransaction(input: TransactionInput) {
  const db = await getDatabase();
  await validateTransactionInput(input, db);

  await db.beginTransaction();
  try {
    const transactionId = await insertTransaction(input, db);
    await applyTransactionBalanceEffect(input, 1, db);

    await db.commitTransaction();
    await persistDatabase();
    return transactionId;
  } catch (error) {
    try {
      await db.rollbackTransaction();
    } catch {
      // Preserve the original database error.
    }
    throw error;
  }
}

export async function updateTransaction(id: number, input: TransactionInput) {
  const db = await getDatabase();
  const transaction = await getTransactionById(id, db);

  if (!transaction || transaction.deletedAt) {
    return false;
  }

  await validateTransactionInput(input, db);

  await db.beginTransaction();
  try {
    await applyTransactionBalanceEffect(transaction, -1, db);
    await updateTransactionRecord(id, input, db);
    await replaceTransactionTags(id, input.tagIds ?? [], db);
    await applyTransactionBalanceEffect(input, 1, db);

    await db.commitTransaction();
    await persistDatabase();
    return true;
  } catch (error) {
    try {
      await db.rollbackTransaction();
    } catch {
      // Preserve the original database error.
    }
    throw error;
  }
}

export async function deleteTransaction(id: number) {
  const db = await getDatabase();
  const transaction = await getTransactionById(id, db);

  if (!transaction || transaction.deletedAt) {
    return;
  }

  await db.beginTransaction();
  try {
    await markTransactionDeleted(id, db);
    await applyTransactionBalanceEffect(transaction, -1, db);

    await db.commitTransaction();
    await persistDatabase();
  } catch (error) {
    try {
      await db.rollbackTransaction();
    } catch {
      // Preserve the original database error.
    }
    throw error;
  }
}
