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

export function maskMoneyInput(value: string) {
  const normalized = value.replace(/[^\d.]/g, '');
  const [rawInteger = '', ...decimalParts] = normalized.split('.');
  const hasDecimal = decimalParts.length > 0;
  const integer = rawInteger.replace(/^0+(?=\d)/, '');
  const decimal = decimalParts.join('').slice(0, 2);

  if (!integer && !hasDecimal) {
    return '';
  }

  if (hasDecimal) {
    return `${integer || '0'}.${decimal}`;
  }

  return integer || '0';
}

export function formatMoneyInputDisplay(value: string) {
  const masked = maskMoneyInput(value);

  if (!masked) {
    return '0.00';
  }

  const [major, minor = ''] = masked.split('.');
  return `${major}.${minor.padEnd(2, '0')}`;
}

export function formatMinorUnits(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency
  }).format(amount / 100);
}
