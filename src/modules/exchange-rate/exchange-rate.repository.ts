import { getDatabase, persistDatabase } from '@/modules/database/connection';
import { nowIso } from '@/modules/shared/date';
import type { CurrencyCode } from '@/modules/shared/money';
import type { CurrencyRate, CurrencyRateInput } from './exchange-rate.types';

interface CurrencyRateRow {
  source_currency: string;
  target_currency: string;
  rate: number;
  is_manual: number;
  provider: string | null;
  fetched_at: string | null;
  updated_at: string;
}

function mapCurrencyRate(row: CurrencyRateRow): CurrencyRate {
  return {
    sourceCurrency: row.source_currency as CurrencyCode,
    targetCurrency: row.target_currency as CurrencyCode,
    rate: Number(row.rate),
    isManual: Boolean(row.is_manual),
    provider: row.provider,
    fetchedAt: row.fetched_at,
    updatedAt: row.updated_at
  };
}

export async function listCurrencyRates(targetCurrency: CurrencyCode) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT source_currency, target_currency, rate, is_manual, provider, fetched_at, updated_at
       FROM currency_rates
      WHERE target_currency = ?
      ORDER BY source_currency ASC`,
    [targetCurrency]
  );

  return ((result.values ?? []) as CurrencyRateRow[]).map(mapCurrencyRate);
}

export async function getLatestFetchedAt(targetCurrency: CurrencyCode) {
  const db = await getDatabase();
  const result = await db.query(
    `SELECT MAX(fetched_at) AS fetched_at
       FROM currency_rates
      WHERE target_currency = ? AND is_manual = 0`,
    [targetCurrency]
  );
  const row = (result.values ?? [])[0] as { fetched_at?: string | null } | undefined;
  return row?.fetched_at ?? null;
}

export async function upsertCurrencyRate(input: CurrencyRateInput) {
  const db = await getDatabase();
  const now = nowIso();
  await db.run(
    `INSERT INTO currency_rates (
       source_currency, target_currency, rate, is_manual, provider, fetched_at, updated_at
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(source_currency, target_currency) DO UPDATE SET
       rate = excluded.rate,
       is_manual = excluded.is_manual,
       provider = excluded.provider,
       fetched_at = excluded.fetched_at,
       updated_at = excluded.updated_at`,
    [
      input.sourceCurrency,
      input.targetCurrency,
      input.rate,
      input.isManual ? 1 : 0,
      input.provider ?? null,
      input.fetchedAt ?? null,
      now
    ]
  );
  await persistDatabase();
}

export async function upsertAutoCurrencyRates(inputs: CurrencyRateInput[]) {
  for (const input of inputs) {
    const db = await getDatabase();
    const existing = await db.query(
      `SELECT is_manual
         FROM currency_rates
        WHERE source_currency = ? AND target_currency = ?
        LIMIT 1`,
      [input.sourceCurrency, input.targetCurrency]
    );
    const row = (existing.values ?? [])[0] as { is_manual?: number } | undefined;

    if (row?.is_manual) {
      continue;
    }

    await upsertCurrencyRate({
      ...input,
      isManual: false
    });
  }
}
