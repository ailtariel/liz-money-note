import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  isCurrencyCode,
  normalizeCurrencyCode,
  type CurrencyCode
} from '@/modules/shared/money';
import { getSetting, setSetting } from '@/modules/settings/settings.repository';
import {
  addCurrency as addCurrencyRecord,
  listCurrencies
} from './currency.repository';

const defaultCurrencyKey = 'default_currency';
const fallbackCurrency: CurrencyCode = 'CNY';

export const useCurrencyStore = defineStore('currency', () => {
  const currency = ref<CurrencyCode>(fallbackCurrency);
  const currencies = ref<CurrencyCode[]>([]);
  const loaded = ref(false);
  let loadPromise: Promise<void> | null = null;

  async function load(force = false) {
    if (loaded.value && !force) {
      return;
    }

    if (loadPromise) {
      return loadPromise;
    }

    loadPromise = (async () => {
      const [storedCurrency, storedCurrencies] = await Promise.all([
        getSetting(defaultCurrencyKey),
        listCurrencies()
      ]);
      currencies.value = storedCurrencies;

      if (storedCurrency && currencies.value.includes(storedCurrency)) {
        currency.value = storedCurrency;
      } else {
        currency.value = fallbackCurrency;
        await setSetting(defaultCurrencyKey, fallbackCurrency);
      }

      loaded.value = true;
    })();

    try {
      await loadPromise;
    } finally {
      loadPromise = null;
    }
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
      throw new Error('Currency must be a known 3-letter ISO 4217 code.');
    }

    await addCurrencyRecord(normalized);
    currencies.value = await listCurrencies();
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
