import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  defaultCurrencies,
  isCurrencyCode,
  normalizeCurrencyCode,
  type CurrencyCode
} from '@/modules/shared/money';
import { getSetting, setSetting } from './settings.repository';

const defaultCurrencyKey = 'default_currency';
const configuredCurrenciesKey = 'configured_currencies';
const fallbackCurrency: CurrencyCode = 'AED';

function parseCurrencies(value: string | null) {
  if (!value) {
    return [...defaultCurrencies];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [...defaultCurrencies];
    }

    const configured = parsed
      .map((currency) => normalizeCurrencyCode(String(currency)))
      .filter(isCurrencyCode);
    return [...new Set([...defaultCurrencies, ...configured])];
  } catch {
    return [...defaultCurrencies];
  }
}

export const useDefaultCurrencyStore = defineStore('defaultCurrency', () => {
  const currency = ref<CurrencyCode>(fallbackCurrency);
  const currencies = ref<CurrencyCode[]>([...defaultCurrencies]);
  const loaded = ref(false);

  async function load() {
    const [storedCurrency, storedCurrencies] = await Promise.all([
      getSetting(defaultCurrencyKey),
      getSetting(configuredCurrenciesKey)
    ]);
    currencies.value = parseCurrencies(storedCurrencies);

    if (storedCurrency && currencies.value.includes(storedCurrency)) {
      currency.value = storedCurrency;
    } else if (!currencies.value.includes(currency.value)) {
      currency.value = fallbackCurrency;
    }

    loaded.value = true;
  }

  async function setCurrency(value: CurrencyCode) {
    const normalized = normalizeCurrencyCode(value);
    if (!currencies.value.includes(normalized)) {
      throw new Error('Currency is not configured.');
    }

    currency.value = normalized;
    await setSetting(defaultCurrencyKey, normalized);
  }

  async function addCurrency(value: string) {
    const normalized = normalizeCurrencyCode(value);

    if (!isCurrencyCode(normalized)) {
      throw new Error('Currency must be a valid 3-letter ISO 4217 code.');
    }

    if (currencies.value.includes(normalized)) {
      return;
    }

    currencies.value = [...currencies.value, normalized].sort();
    await setSetting(configuredCurrenciesKey, JSON.stringify(currencies.value));
  }

  return {
    currency,
    currencies,
    loaded,
    load,
    setCurrency,
    addCurrency
  };
});
