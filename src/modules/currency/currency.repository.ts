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

let defaultCurrenciesPromise: Promise<void> | null = null;
let defaultCurrenciesEnsured = false;

export async function ensureDefaultCurrencies() {
  if (defaultCurrenciesEnsured) {
    return;
  }

  if (defaultCurrenciesPromise) {
    return defaultCurrenciesPromise;
  }

  defaultCurrenciesPromise = ensureDefaultCurrenciesOnce()
    .then(() => {
      defaultCurrenciesEnsured = true;
    })
    .finally(() => {
      defaultCurrenciesPromise = null;
    });
  return defaultCurrenciesPromise;
}

async function ensureDefaultCurrenciesOnce() {
  const db = await getDatabase();
  const existingResult = await db.query(
    `SELECT code FROM currencies
     WHERE code IN (${defaultCurrencies.map(() => '?').join(', ')})`,
    [...defaultCurrencies]
  );
  const existingCurrencies = new Set(
    ((existingResult.values ?? []) as CurrencyRow[]).map((row) => row.code)
  );
  const missingCurrencies = defaultCurrencies.filter(
    (currency) => !existingCurrencies.has(currency)
  );

  if (missingCurrencies.length === 0) {
    return;
  }

  const now = nowIso();

  for (const currency of missingCurrencies) {
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
