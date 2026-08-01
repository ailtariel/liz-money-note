import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';

interface SettingRow {
  value: string;
}

const defaultBookKey = 'default_book_id';
const lastOpenedBookKey = 'last_opened_book_id';

function parsePositiveId(value: string | null) {
  if (!value) {
    return null;
  }

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getSetting(key: string) {
  const db = await getDatabase();
  const result = await db.query('SELECT value FROM settings WHERE key = ?', [key]);
  const row = (result.values ?? [])[0] as SettingRow | undefined;
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  const db = await getDatabase();
  await db.run(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value, nowIso()]
  );
  await persistDatabase();
}

export async function deleteSetting(key: string) {
  const db = await getDatabase();
  await db.run('DELETE FROM settings WHERE key = ?', [key]);
  await persistDatabase();
}

export async function getDefaultBookId() {
  return parsePositiveId(await getSetting(defaultBookKey));
}

export async function setDefaultBookId(bookId: number | null) {
  if (bookId === null) {
    await deleteSetting(defaultBookKey);
    return;
  }

  await setSetting(defaultBookKey, String(bookId));
}

export async function getLastOpenedBookId() {
  return parsePositiveId(await getSetting(lastOpenedBookKey));
}

export async function setLastOpenedBookId(bookId: number | null) {
  if (bookId === null) {
    await deleteSetting(lastOpenedBookKey);
    return;
  }

  await setSetting(lastOpenedBookKey, String(bookId));
}
