import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';

interface SettingRow {
  value: string;
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
