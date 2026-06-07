import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { CurrencyCode } from '@/modules/shared/money';
import {
  getLatestFetchedAt,
  listCurrencyRates,
  upsertAutoCurrencyRates,
  upsertCurrencyRate
} from './exchange-rate.repository';
import { fetchRatesToTarget } from './exchange-rate.service';
import type { CurrencyRate } from './exchange-rate.types';

const refreshIntervalMs = 24 * 60 * 60 * 1000;

function isStale(value: string | null) {
  if (!value) {
    return true;
  }

  return Date.now() - new Date(value).getTime() >= refreshIntervalMs;
}

export const useExchangeRateStore = defineStore('exchangeRate', () => {
  const rates = ref<CurrencyRate[]>([]);
  const loading = ref(false);
  const error = ref('');

  const updatedAt = computed(() =>
    rates.value
      .map((rate) => rate.fetchedAt ?? rate.updatedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null
  );

  function mergeConfiguredCurrencies(
    currencies: CurrencyCode[],
    targetCurrency: CurrencyCode,
    storedRates: CurrencyRate[]
  ) {
    return currencies
      .filter((currency) => currency !== targetCurrency)
      .map((currency) => {
        const storedRate = storedRates.find(
          (rate) =>
            rate.sourceCurrency === currency && rate.targetCurrency === targetCurrency
        );

        return storedRate ?? {
          sourceCurrency: currency,
          targetCurrency,
          rate: null,
          isManual: false,
          provider: null,
          fetchedAt: null,
          updatedAt: null
        };
      });
  }

  async function load(currencies: CurrencyCode[], targetCurrency: CurrencyCode) {
    const storedRates = await listCurrencyRates(targetCurrency);
    rates.value = mergeConfiguredCurrencies(currencies, targetCurrency, storedRates);
  }

  async function refreshOnline(
    currencies: CurrencyCode[],
    targetCurrency: CurrencyCode,
    force = false,
    sourceCurrencyFilter: CurrencyCode[] | null = null
  ) {
    const sourceCurrencies = [
      ...new Set(
        (sourceCurrencyFilter ?? currencies)
          .filter((currency) => currency !== targetCurrency)
      )
    ];
    if (sourceCurrencies.length === 0) {
      rates.value = [];
      return;
    }

    const latestFetchedAt = await getLatestFetchedAt(targetCurrency);
    if (!force && !isStale(latestFetchedAt)) {
      await load(currencies, targetCurrency);
      return;
    }

    loading.value = true;
    error.value = '';
    try {
      const fetchedRates = await fetchRatesToTarget(sourceCurrencies, targetCurrency);
      await upsertAutoCurrencyRates(fetchedRates);
      await load(currencies, targetCurrency);
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update exchange rates.';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function setManualRate(
    sourceCurrency: CurrencyCode,
    targetCurrency: CurrencyCode,
    rate: number,
    currencies: CurrencyCode[]
  ) {
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error('Exchange rate must be greater than 0.');
    }

    await upsertCurrencyRate({
      sourceCurrency,
      targetCurrency,
      rate,
      isManual: true,
      provider: null,
      fetchedAt: null
    });
    await load(currencies, targetCurrency);
  }

  return {
    rates,
    loading,
    error,
    updatedAt,
    load,
    refreshOnline,
    setManualRate
  };
});
