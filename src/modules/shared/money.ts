export type CurrencyCode = 'CNY' | 'USD' | 'AED';

export const currencies: CurrencyCode[] = ['CNY', 'USD', 'AED'];

export function parseMoneyToMinorUnits(value: string | number) {
  const normalized = String(value).trim();

  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) {
    throw new Error('Amount must be a positive number with up to 2 decimals.');
  }

  const [major, minor = ''] = normalized.split('.');
  return Number(major) * 100 + Number(minor.padEnd(2, '0'));
}

export function formatMinorUnits(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency
  }).format(amount / 100);
}
