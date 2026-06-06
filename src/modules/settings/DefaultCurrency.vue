<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import {
  currencies,
  type CurrencyCode
} from '@/modules/shared/money';
import { useDefaultCurrencyStore } from './default-currency.store';

const { t } = useI18n();
const store = useDefaultCurrencyStore();
const error = ref('');

async function chooseCurrency(value: CurrencyCode) {
  error.value = '';
  try {
    await store.setCurrency(value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('settings.defaultCurrency.saveFailed');
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

        <v-card class="soft-card">
          <v-list class="bg-transparent">
            <v-list-item
              v-for="currency in currencies"
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
                {{ t(`settings.defaultCurrency.${currency}`) }}
              </v-list-item-subtitle>
              <template #append>
                <v-icon v-if="store.currency === currency" icon="$check" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>
