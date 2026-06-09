import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { todayIsoDate } from '@/modules/shared/date';
import { getAccountById } from '@/modules/accounts/account.repository';
import { applyAccountBalanceDelta } from '@/modules/accounts/account.repository';
import { isAccountLinkedToBook } from '@/modules/books/book.repository';
import { insertTransaction } from '@/modules/transactions/transaction.repository';
import {
  listDueRecurringEvents,
  updateRecurringSchedule
} from './recurring.repository';
import type { RecurringEvent, RepeatType } from './recurring.types';

function addMonthsClamped(date: Date, months: number) {
  const day = date.getUTCDate();
  const result = new Date(date);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function calculateNextTriggerDate(
  currentDate: string,
  repeatType: RepeatType,
  repeatInterval: number
) {
  const date = new Date(`${currentDate.slice(0, 10)}T00:00:00.000Z`);

  if (repeatType === 'daily') {
    date.setUTCDate(date.getUTCDate() + repeatInterval);
    return date.toISOString().slice(0, 10);
  }

  if (repeatType === 'weekly') {
    date.setUTCDate(date.getUTCDate() + repeatInterval * 7);
    return date.toISOString().slice(0, 10);
  }

  if (repeatType === 'monthly') {
    return addMonthsClamped(date, repeatInterval).toISOString().slice(0, 10);
  }

  return addMonthsClamped(date, repeatInterval * 12).toISOString().slice(0, 10);
}

function getNextSchedule(event: RecurringEvent) {
  const nextDate = calculateNextTriggerDate(
    event.nextTriggerDate,
    event.repeatType,
    event.repeatInterval
  );
  const isActive = !event.endDate || nextDate <= event.endDate;
  return {
    nextDate: isActive ? nextDate : null,
    isActive
  };
}

export async function loadDueRecurringEvents() {
  return listDueRecurringEvents();
}

export async function approveRecurringEvent(event: RecurringEvent) {
  const db = await getDatabase();
  const sourceAccount = await getAccountById(event.accountId, db);

  if (!sourceAccount) {
    throw new Error('周期事件账户不存在。');
  }

  if (!(await isAccountLinkedToBook(event.bookId, event.accountId, db))) {
    throw new Error('周期事件账户未关联到所选账本。');
  }

  if (event.type === 'transfer') {
    if (!event.targetAccountId) {
      throw new Error('转账周期事件缺少转入账户。');
    }

    const targetAccount = await getAccountById(event.targetAccountId, db);
    if (!targetAccount || targetAccount.currency !== sourceAccount.currency) {
      throw new Error('转账周期事件必须使用同币种账户。');
    }

    if (!(await isAccountLinkedToBook(event.bookId, event.targetAccountId, db))) {
      throw new Error('周期事件转入账户未关联到所选账本。');
    }
  }

  const schedule = getNextSchedule(event);

  await db.beginTransaction();
  try {
    await insertTransaction(
      {
        bookId: event.bookId,
        type: event.type,
        amount: event.amount,
        currency: event.currency,
        accountId: event.accountId,
        targetAccountId: event.targetAccountId,
        occurredAt: todayIsoDate(),
        note: event.note,
        tagIds: event.tagIds,
        recurringEventId: event.id
      },
      db
    );

    if (event.type === 'income') {
      await applyAccountBalanceDelta(event.accountId, event.amount, db);
    } else if (event.type === 'expense') {
      await applyAccountBalanceDelta(event.accountId, -event.amount, db);
    } else {
      await applyAccountBalanceDelta(event.accountId, -event.amount, db);
      await applyAccountBalanceDelta(event.targetAccountId!, event.amount, db);
    }

    await updateRecurringSchedule(
      event.id,
      schedule.nextDate,
      schedule.isActive,
      db,
      false
    );
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

export async function skipRecurringEvent(event: RecurringEvent) {
  const db = await getDatabase();
  const schedule = getNextSchedule(event);
  await updateRecurringSchedule(event.id, schedule.nextDate, schedule.isActive, db);
  await persistDatabase();
}
