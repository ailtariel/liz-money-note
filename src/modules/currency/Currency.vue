<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import CurrencyAutocomplete from '@/components/shared/CurrencyAutocomplete.vue';
import ExchangeRateSettings from '@/modules/exchange-rate/ExchangeRateSettings.vue';
import {
  currencyOptions,
  type CurrencyCode
} from '@/modules/shared/money';
import { useExchangeRateStore } from '@/modules/exchange-rate/exchange-rate.store';
import { useCurrencyStore } from './currency.store';

const { t } = useI18n();
const store = useCurrencyStore();
const exchangeRateStore = useExchangeRateStore();
const error = ref('');
const newCurrency = ref<CurrencyCode | null>(null);

function currencyName(currency: CurrencyCode) {
  const option = currencyOptions.find((item) => item.code === currency);
  return option ? t(option.name) : currency;
}

function currencyCountry(currency: CurrencyCode) {
  const option = currencyOptions.find((item) => item.code === currency);
  return option ? t(option.country) : '';
}

async function chooseCurrency(value: CurrencyCode) {
  error.value = '';
  try {
    await store.setCurrency(value);
    await exchangeRateStore.refreshOnline(store.currencies, store.currency, true);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.defaultCurrency.saveFailed');
  }
}

async function addCurrency() {
  error.value = '';
  if (!newCurrency.value) {
    return;
  }

  try {
    await store.addCurrency(newCurrency.value);
    await exchangeRateStore.refreshOnline(store.currencies, store.currency, true);
    newCurrency.value = null;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.currency.addFailed');
  }
}

onMounted(async () => {
  error.value = '';
  try {
    await store.load();
    await exchangeRateStore.load(store.currencies, store.currency);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.defaultCurrency.loadFailed');
  }
});
</script>

<template>
  <AppBarVue />

  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card class="soft-card pa-6">
          <div class="mb-4 text-title-large font-weight-bold">
            {{ t('settings.currency.defaultCurrency') }}
          </div>
          <v-list>
            <v-list-item
              v-for="currency in store.currencies"
              :key="currency"
              :active="store.currency === currency"
              class="currency-option px-4"
              :class="{ 'currency-option-active': store.currency === currency }"
              @click="chooseCurrency(currency)"
            >
              <template #prepend>
                <v-avatar class="me-4" color="primary" size="56" variant="tonal">
                  <v-icon icon="$cash" />
                </v-avatar>
              </template>
              <v-list-item-title class="text-title-large font-weight-bold">{{ currency }}</v-list-item-title>
              <v-list-item-subtitle class="mt-1 text-body-medium text-medium-emphasis">
                {{ currencyName(currency) }} · {{ currencyCountry(currency) }}
              </v-list-item-subtitle>
              <template #append>
                <v-avatar
                  v-if="store.currency === currency"
                  class="currency-check"
                  color="primary"
                  size="32"
                >
                  <v-icon icon="$check" size="20" />
                </v-avatar>
                <span v-else class="currency-radio" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="soft-card pa-6">
          <div class="mb-4 text-title-large font-weight-bold">
            {{ t('settings.currency.addCurrency') }}
          </div>
          <v-form class="d-flex flex-column ga-3" @submit.prevent="addCurrency">
            <CurrencyAutocomplete
              v-model="newCurrency"
              :disabled-currencies="store.currencies"
              :label="t('settings.currency.currencyCode')"
            />
            <v-btn
              :disabled="!newCurrency || store.currencies.includes(newCurrency)"
              color="primary"
              type="submit"
            >
              {{ t('common.add') }}
            </v-btn>
          </v-form>
        </v-card>

        <ExchangeRateSettings
          :currencies="store.currencies"
          :target-currency="store.currency"
        />
      </div>
    </v-container>
  </v-main>
</template>

<style scoped>
.currency-option {
  min-height: 5rem;
}

.currency-option-active {
  background: rgb(var(--v-theme-accent));
}

.currency-check {
  color: rgb(var(--v-theme-on-primary));
}

.currency-radio {
  width: 1.75rem;
  height: 1.75rem;
  border: 3px solid rgba(var(--v-theme-on-surface), 0.35);
  border-radius: 50%;
}
</style>
