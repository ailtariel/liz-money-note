export type CurrencyCode = string;

export interface CurrencyOption {
  code: CurrencyCode;
  name: string;
  country: string;
}

export const defaultCurrencies: CurrencyCode[] = ['CNY', 'USD', 'AED'];
export const currencies = defaultCurrencies;

export const currencyOptions: CurrencyOption[] = [
  { code: 'CNY', name: 'country.china.currency', country: 'country.china.name' },
  { code: 'USD', name: 'country.unitedStates.currency', country: 'country.unitedStates.name' },
  { code: 'AED', name: 'country.unitedArabEmirates.currency', country: 'country.unitedArabEmirates.name' },
  { code: 'EUR', name: 'country.eurozone.currency', country: 'country.eurozone.name' },
  { code: 'GBP', name: 'country.unitedKingdom.currency', country: 'country.unitedKingdom.name' },
  { code: 'JPY', name: 'country.japan.currency', country: 'country.japan.name' },
  { code: 'HKD', name: 'country.hongKong.currency', country: 'country.hongKong.name' },
  { code: 'SGD', name: 'country.singapore.currency', country: 'country.singapore.name' },
  { code: 'AUD', name: 'country.australia.currency', country: 'country.australia.name' },
  { code: 'CAD', name: 'country.canada.currency', country: 'country.canada.name' },
  { code: 'CHF', name: 'country.switzerland.currency', country: 'country.switzerland.name' },
  { code: 'NZD', name: 'country.newZealand.currency', country: 'country.newZealand.name' },
  { code: 'KRW', name: 'country.southKorea.currency', country: 'country.southKorea.name' },
  { code: 'THB', name: 'country.thailand.currency', country: 'country.thailand.name' },
  { code: 'MYR', name: 'country.malaysia.currency', country: 'country.malaysia.name' },
  { code: 'IDR', name: 'country.indonesia.currency', country: 'country.indonesia.name' },
  { code: 'PHP', name: 'country.philippines.currency', country: 'country.philippines.name' },
  { code: 'INR', name: 'country.india.currency', country: 'country.india.name' },
  { code: 'SAR', name: 'country.saudiArabia.currency', country: 'country.saudiArabia.name' },
  { code: 'QAR', name: 'country.qatar.currency', country: 'country.qatar.name' },
  { code: 'KWD', name: 'country.kuwait.currency', country: 'country.kuwait.name' },
  { code: 'BHD', name: 'country.bahrain.currency', country: 'country.bahrain.name' },
  { code: 'OMR', name: 'country.oman.currency', country: 'country.oman.name' },
  { code: 'TRY', name: 'country.turkey.currency', country: 'country.turkey.name' },
  { code: 'BRL', name: 'country.brazil.currency', country: 'country.brazil.name' },
  { code: 'MXN', name: 'country.mexico.currency', country: 'country.mexico.name' },
  { code: 'ZAR', name: 'country.southAfrica.currency', country: 'country.southAfrica.name' },
  { code: 'SEK', name: 'country.sweden.currency', country: 'country.sweden.name' },
  { code: 'NOK', name: 'country.norway.currency', country: 'country.norway.name' },
  { code: 'DKK', name: 'country.denmark.currency', country: 'country.denmark.name' }
];

export const currencyOptionCodes = currencyOptions.map((currency) => currency.code);

export function normalizeCurrencyCode(value: string) {
  return value.trim().toUpperCase();
}

export function isCurrencyCode(value: string): value is CurrencyCode {
  const normalized = normalizeCurrencyCode(value);

  return currencyOptionCodes.includes(normalized);
}

export function getCurrencyDisplayName(currency: CurrencyCode, locale?: string) {
  try {
    const displayNames = new Intl.DisplayNames(locale ? [locale] : undefined, {
      type: 'currency'
    });
    return displayNames.of(currency) ?? currency;
  } catch {
    return currency;
  }
}

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
