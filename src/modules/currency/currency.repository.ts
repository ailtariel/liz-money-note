import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';
import {
  defaultCurrencies,
  isCurrencyCode,
  normalizeCurrencyCode,
  type CurrencyCode
} from '@/modules/shared/money';

interface CurrencyRow {
  code: string;
}

export async function ensureDefaultCurrencies() {
  const db = await getDatabase();
  const now = nowIso();

  for (const currency of defaultCurrencies) {
    await db.run(
      `INSERT OR IGNORE INTO currencies (code, created_at, updated_at)
       VALUES (?, ?, ?)`,
      [currency, now, now]
    );
  }

  await persistDatabase();
}

export async function listCurrencies() {
  await ensureDefaultCurrencies();
  const db = await getDatabase();
  const result = await db.query('SELECT code FROM currencies ORDER BY code ASC');

  return (result.values ?? []).map((row) => {
    const currency = row as CurrencyRow;
    return currency.code as CurrencyCode;
  });
}

export async function addCurrency(code: string) {
  const normalized = normalizeCurrencyCode(code);

  if (!isCurrencyCode(normalized)) {
    throw new Error('Currency must be a known 3-letter ISO 4217 code.');
  }

  const db = await getDatabase();
  const now = nowIso();
  await db.run(
    `INSERT OR IGNORE INTO currencies (code, created_at, updated_at)
     VALUES (?, ?, ?)`,
    [normalized, now, now]
  );
  await persistDatabase();
}
