import { nowIso } from '@/modules/shared/date';
import type { CurrencyCode } from '@/modules/shared/money';
import type { CurrencyRateInput } from './exchange-rate.types';

const provider = 'frankfurter';
const apiBaseUrl = 'https://api.frankfurter.dev/v2/rates';

interface FrankfurterRate {
  base: string;
  quote: string;
  rate: number;
}

export async function fetchRatesToTarget(
  sourceCurrencies: CurrencyCode[],
  targetCurrency: CurrencyCode
): Promise<CurrencyRateInput[]> {
  const sources = sourceCurrencies.filter((currency) => currency !== targetCurrency);

  if (sources.length === 0) {
    return [];
  }

  const url = new URL(apiBaseUrl);
  url.searchParams.set('base', targetCurrency);
  url.searchParams.set('quotes', sources.join(','));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as FrankfurterRate[];
  const fetchedAt = nowIso();

  return data.map((item) => {
    if (item.rate <= 0) {
      throw new Error(`Invalid exchange rate for ${item.quote}.`);
    }

    return {
      sourceCurrency: item.quote as CurrencyCode,
      targetCurrency: item.base as CurrencyCode,
      rate: 1 / item.rate,
      isManual: false,
      provider,
      fetchedAt
    };
  });
}
