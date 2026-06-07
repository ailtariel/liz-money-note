import type { CurrencyCode } from '@/modules/shared/money';

export interface CurrencyRate {
  sourceCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number | null;
  isManual: boolean;
  provider: string | null;
  fetchedAt: string | null;
  updatedAt: string | null;
}

export interface CurrencyRateInput {
  sourceCurrency: CurrencyCode;
  targetCurrency: CurrencyCode;
  rate: number;
  isManual: boolean;
  provider?: string | null;
  fetchedAt?: string | null;
}
