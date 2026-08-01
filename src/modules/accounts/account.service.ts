import { getDatabase, persistDatabase } from '@/modules/database/connection';
import {
  accountExists,
  countAccountRecurringEventReferences,
  countAccountTransactionReferences,
  deleteAccountRows,
  listAccountBookDeleteLinks
} from './account.repository';
import type { AccountDeleteResult } from './account.types';

export async function deleteAccount(id: number): Promise<AccountDeleteResult> {
  const db = await getDatabase();
  let transactionOpen = false;

  await db.beginTransaction();
  transactionOpen = true;

  try {
    if (!(await accountExists(id, db))) {
      throw new Error('Account not found.');
    }

    if ((await countAccountTransactionReferences(id, db)) > 0) {
      await db.rollbackTransaction();
      transactionOpen = false;
      return { deleted: false, reason: 'transaction_history' };
    }

    if ((await countAccountRecurringEventReferences(id, db)) > 0) {
      await db.rollbackTransaction();
      transactionOpen = false;
      return { deleted: false, reason: 'recurring_event' };
    }

    const links = await listAccountBookDeleteLinks(id, db);
    if (links.some((link) => link.replacementAccountId === null)) {
      await db.rollbackTransaction();
      transactionOpen = false;
      return { deleted: false, reason: 'book_replacement_required' };
    }

    await deleteAccountRows(id, links, db);
    await db.commitTransaction();
    transactionOpen = false;
    await persistDatabase();
    return { deleted: true };
  } catch (error) {
    if (transactionOpen) {
      try {
        await db.rollbackTransaction();
      } catch {
        // Preserve the original database error.
      }
    }
    throw error;
  }
}
