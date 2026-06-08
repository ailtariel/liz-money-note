import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import {
  applyAccountBalanceDelta,
  getAccountById
} from '@/modules/accounts/account.repository';
import { insertTransaction } from './transaction.repository';
import {
  getTransactionById,
  markTransactionDeleted
} from './transaction.repository';
import type { TransactionInput } from './transaction.types';

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

    if (input.type === 'income') {
      await applyAccountBalanceDelta(input.accountId, input.amount, db);
    } else if (input.type === 'expense') {
      await applyAccountBalanceDelta(input.accountId, -input.amount, db);
    } else {
      await applyAccountBalanceDelta(input.accountId, -input.amount, db);
      await applyAccountBalanceDelta(input.targetAccountId!, input.amount, db);
    }

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

export async function deleteTransaction(id: number) {
  const db = await getDatabase();
  const transaction = await getTransactionById(id, db);

  if (!transaction || transaction.deletedAt) {
    return;
  }

  await db.beginTransaction();
  try {
    await markTransactionDeleted(id, db);

    if (transaction.type === 'income') {
      await applyAccountBalanceDelta(transaction.accountId, -transaction.amount, db);
    } else if (transaction.type === 'expense') {
      await applyAccountBalanceDelta(transaction.accountId, transaction.amount, db);
    } else {
      await applyAccountBalanceDelta(transaction.accountId, transaction.amount, db);
      await applyAccountBalanceDelta(
        transaction.targetAccountId!,
        -transaction.amount,
        db
      );
    }

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
