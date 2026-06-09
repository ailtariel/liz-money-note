import { applyAccountBalanceDelta } from '@/modules/accounts/account.repository';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import {
  deleteBookRows,
  listBookTransactionsForDelete
} from './book.repository';

export async function deleteBook(id: number) {
  const db = await getDatabase();
  const transactions = await listBookTransactionsForDelete(id, db);

  await db.beginTransaction();
  try {
    for (const transaction of transactions) {
      if (transaction.deletedAt) {
        continue;
      }

      if (transaction.type === 'income') {
        await applyAccountBalanceDelta(
          transaction.accountId,
          -transaction.amount,
          db
        );
      } else if (transaction.type === 'expense') {
        await applyAccountBalanceDelta(
          transaction.accountId,
          transaction.amount,
          db
        );
      } else {
        await applyAccountBalanceDelta(
          transaction.accountId,
          transaction.amount,
          db
        );
        await applyAccountBalanceDelta(
          transaction.targetAccountId!,
          -transaction.amount,
          db
        );
      }
    }

    await deleteBookRows(id, db);
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
