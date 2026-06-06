import { ref } from 'vue';
import { defineStore } from 'pinia';
import {
  currencies,
  type CurrencyCode
} from '@/modules/shared/money';
import { getSetting, setSetting } from './settings.repository';

const defaultCurrencyKey = 'default_currency';
const fallbackCurrency: CurrencyCode = 'AED';

function isCurrencyCode(value: string | null): value is CurrencyCode {
  return currencies.includes(value as CurrencyCode);
}

export const useDefaultCurrencyStore = defineStore('defaultCurrency', () => {
  const currency = ref<CurrencyCode>(fallbackCurrency);
  const loaded = ref(false);

  async function load() {
    const storedCurrency = await getSetting(defaultCurrencyKey);

    if (isCurrencyCode(storedCurrency)) {
      currency.value = storedCurrency;
    }

    loaded.value = true;
  }

  async function setCurrency(value: CurrencyCode) {
    currency.value = value;
    await setSetting(defaultCurrencyKey, value);
  }

  return {
    currency,
    loaded,
    load,
    setCurrency
  };
});
