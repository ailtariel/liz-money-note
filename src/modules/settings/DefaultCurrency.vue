<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import {
  getCurrencyDisplayName,
  normalizeCurrencyCode,
  type CurrencyCode
} from '@/modules/shared/money';
import { useDefaultCurrencyStore } from './default-currency.store';

const { t, locale } = useI18n();
const store = useDefaultCurrencyStore();
const error = ref('');
const newCurrency = ref('');
const normalizedNewCurrency = computed(() => normalizeCurrencyCode(newCurrency.value));

function currencyName(currency: CurrencyCode) {
  return getCurrencyDisplayName(currency, String(locale.value));
}

async function chooseCurrency(value: CurrencyCode) {
  error.value = '';
  try {
    await store.setCurrency(value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.defaultCurrency.saveFailed');
  }
}

async function addCurrency() {
  error.value = '';
  try {
    await store.addCurrency(newCurrency.value);
    newCurrency.value = '';
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.currency.addFailed');
  }
}

onMounted(async () => {
  error.value = '';
  try {
    await store.load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.defaultCurrency.loadFailed');
  }
});
</script>

<template>
  <AppBarVue />

  <v-main>
    <v-container>
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card class="soft-card pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-2">
            {{ t('settings.currency.defaultCurrency') }}
          </div>
          <v-list class="bg-transparent">
            <v-list-item
              v-for="currency in store.currencies"
              :key="currency"
              :active="store.currency === currency"
              @click="chooseCurrency(currency)"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="$cash" />
                </v-avatar>
              </template>
              <v-list-item-title>{{ currency }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ currencyName(currency) }}
              </v-list-item-subtitle>
              <template #append>
                <v-icon v-if="store.currency === currency" icon="$check" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="soft-card pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-2">
            {{ t('settings.currency.addCurrency') }}
          </div>
          <v-form class="d-flex flex-column ga-3" @submit.prevent="addCurrency">
            <v-text-field
              v-model="newCurrency"
              :label="t('settings.currency.currencyCode')"
              maxlength="3"
              :hint="normalizedNewCurrency || t('settings.currency.currencyCodeHint')"
              persistent-hint
            />
            <v-btn
              :disabled="normalizedNewCurrency.length !== 3"
              color="primary"
              type="submit"
            >
              {{ t('common.add') }}
            </v-btn>
          </v-form>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>
