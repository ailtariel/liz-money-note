import type { SQLiteDBConnection } from '@capacitor-community/sqlite';
import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso, todayIsoDate } from '@/modules/shared/date';
import type { CurrencyCode } from '@/modules/shared/money';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import { getAccountById } from '@/modules/accounts/account.repository';
import type {
  RecurringEvent,
  RecurringEventInput,
  RepeatType
} from './recurring.types';

interface RecurringRow {
  id: number;
  book_id: number;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  account_id: number;
  target_account_id: number | null;
  note: string | null;
  repeat_type: RepeatType;
  repeat_interval: number;
  start_date: string;
  end_date: string | null;
  next_trigger_date: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  tag_ids: string | null;
}

function mapRecurringEvent(row: RecurringRow): RecurringEvent {
  return {
    id: row.id,
    bookId: row.book_id,
    type: row.type,
    amount: row.amount,
    currency: row.currency,
    accountId: row.account_id,
    targetAccountId: row.target_account_id,
    note: row.note,
    repeatType: row.repeat_type,
    repeatInterval: row.repeat_interval,
    startDate: row.start_date,
    endDate: row.end_date,
    nextTriggerDate: row.next_trigger_date,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tagIds: row.tag_ids ? row.tag_ids.split(',').map(Number) : []
  };
}

async function replaceRecurringTags(
  recurringEventId: number,
  tagIds: number[],
  db: SQLiteDBConnection
) {
  await db.run(
    'DELETE FROM recurring_event_tags WHERE recurring_event_id = ?',
    [recurringEventId],
    false
  );

  if (tagIds.length === 0) {
    return;
  }

  await db.executeSet(
    tagIds.map((tagId) => ({
      statement:
        'INSERT OR IGNORE INTO recurring_event_tags (recurring_event_id, tag_id) VALUES (?, ?)',
      values: [recurringEventId, tagId]
    })),
    false
  );
}

async function validateRecurringInput(
  input: RecurringEventInput,
  db: SQLiteDBConnection
) {
  const sourceAccount = await getAccountById(input.accountId, db);

  if (!sourceAccount) {
    throw new Error('账户不存在。');
  }

  if (sourceAccount.currency !== input.currency) {
    throw new Error('周期事件币种必须与账户币种一致。');
  }

  if (input.type !== 'transfer') {
    return;
  }

  if (!input.targetAccountId) {
    throw new Error('转账周期事件必须选择转入账户。');
  }

  const targetAccount = await getAccountById(input.targetAccountId, db);
  if (!targetAccount || targetAccount.currency !== sourceAccount.currency) {
    throw new Error('转账周期事件必须使用同币种账户。');
  }
}

export async function listRecurringEvents(includeInactive = true) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT r.*, GROUP_CONCAT(ret.tag_id) AS tag_ids
     FROM recurring_events r
     LEFT JOIN recurring_event_tags ret ON ret.recurring_event_id = r.id
     WHERE (? = 1 OR r.is_active = 1)
     GROUP BY r.id
     ORDER BY r.is_active DESC, r.next_trigger_date ASC, r.id DESC`,
    [includeInactive ? 1 : 0]
  );
  return ((result.values ?? []) as RecurringRow[]).map(mapRecurringEvent);
}

export async function listDueRecurringEvents() {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT r.*, GROUP_CONCAT(ret.tag_id) AS tag_ids
     FROM recurring_events r
     LEFT JOIN recurring_event_tags ret ON ret.recurring_event_id = r.id
     WHERE r.is_active = 1 AND date(r.next_trigger_date) <= date(?)
     GROUP BY r.id
     ORDER BY r.next_trigger_date ASC`,
    [todayIsoDate()]
  );
  return ((result.values ?? []) as RecurringRow[]).map(mapRecurringEvent);
}

export async function createRecurringEvent(input: RecurringEventInput) {
  const db = await getDatabase();
  await validateRecurringInput(input, db);
  const now = nowIso();
  await db.beginTransaction();
  try {
    const result = await db.run(
      `INSERT INTO recurring_events (
        book_id, type, amount, currency, account_id, target_account_id,
        note, repeat_type, repeat_interval, start_date, end_date,
        next_trigger_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.bookId,
        input.type,
        input.amount,
        input.currency,
        input.accountId,
        input.targetAccountId ?? null,
        input.note ?? null,
        input.repeatType,
        input.repeatInterval,
        input.startDate,
        input.endDate ?? null,
        input.nextTriggerDate,
        now,
        now
      ],
      false
    );
    const id = result.changes?.lastId ?? 0;
    await replaceRecurringTags(id, input.tagIds ?? [], db);
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

export async function updateRecurringEvent(id: number, input: RecurringEventInput) {
  const db = await getDatabase();
  await validateRecurringInput(input, db);
  await db.beginTransaction();
  try {
    await db.run(
      `UPDATE recurring_events
       SET book_id = ?, type = ?, amount = ?, currency = ?, account_id = ?,
           target_account_id = ?, note = ?, repeat_type = ?,
           repeat_interval = ?, start_date = ?, end_date = ?,
           next_trigger_date = ?, updated_at = ?
       WHERE id = ?`,
      [
        input.bookId,
        input.type,
        input.amount,
        input.currency,
        input.accountId,
        input.targetAccountId ?? null,
        input.note ?? null,
        input.repeatType,
        input.repeatInterval,
        input.startDate,
        input.endDate ?? null,
        input.nextTriggerDate,
        nowIso(),
        id
      ],
      false
    );
    await replaceRecurringTags(id, input.tagIds ?? [], db);
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

export async function updateRecurringSchedule(
  id: number,
  nextTriggerDate: string | null,
  isActive: boolean,
  db: SQLiteDBConnection,
  useTransaction = true
) {
  await db.run(
    `UPDATE recurring_events
     SET next_trigger_date = COALESCE(?, next_trigger_date),
         is_active = ?,
         updated_at = ?
     WHERE id = ?`,
    [nextTriggerDate, isActive ? 1 : 0, nowIso(), id],
    useTransaction
  );
}

export async function disableRecurringEvent(id: number) {
  const db = await getDatabase();
  await updateRecurringSchedule(id, null, false, db);
  await persistDatabase();
}
