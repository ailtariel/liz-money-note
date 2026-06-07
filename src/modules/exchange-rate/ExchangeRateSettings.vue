<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import type { CurrencyCode } from '@/modules/shared/money';
import { useExchangeRateStore } from './exchange-rate.store';

const props = defineProps<{
  currencies: CurrencyCode[];
  targetCurrency: CurrencyCode;
}>();

const { t } = useI18n();
const exchangeRateStore = useExchangeRateStore();
const manualRates = reactive<Record<string, string>>({});
const error = ref('');

const formattedUpdatedAt = computed(() => {
  if (!exchangeRateStore.updatedAt) {
    return '';
  }

  const parsed = new Date(exchangeRateStore.updatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return exchangeRateStore.updatedAt.slice(0, 19);
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hour = String(parsed.getHours()).padStart(2, '0');
  const minute = String(parsed.getMinutes()).padStart(2, '0');
  const second = String(parsed.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
});

function formatRate(value: number | null) {
  return value === null ? '' : value.toFixed(2);
}

async function loadRates() {
  await exchangeRateStore.load(props.currencies, props.targetCurrency);
}

async function refreshRates() {
  error.value = '';
  try {
    await exchangeRateStore.refreshOnline(
      props.currencies,
      props.targetCurrency,
      true
    );
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('exchangeRate.updateFailed');
  }
}

async function saveManualRate(sourceCurrency: CurrencyCode) {
  const value = Number(manualRates[sourceCurrency]);
  error.value = '';
  try {
    await exchangeRateStore.setManualRate(
      sourceCurrency,
      props.targetCurrency,
      value,
      props.currencies
    );
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('exchangeRate.saveFailed');
  }
}

watch(
  () => [props.currencies.join(','), props.targetCurrency],
  () => {
    void loadRates();
  },
  { immediate: true }
);

watch(
  () => exchangeRateStore.rates,
  (rates) => {
    for (const rate of rates) {
      manualRates[rate.sourceCurrency] = formatRate(rate.rate);
    }
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <v-card class="soft-card pa-6">
    <div class="d-flex align-center justify-space-between ga-4 mb-4">
      <div class="text-title-large font-weight-bold">
        {{ t('exchangeRate.title') }}
      </div>
      <v-btn
        :loading="exchangeRateStore.loading"
        prepend-icon="$restore"
        size="small"
        variant="tonal"
        @click="refreshRates"
      >
        {{ t('exchangeRate.updateNow') }}
      </v-btn>
    </div>

    <div class="d-flex flex-wrap ga-1 mb-5 text-body-medium text-medium-emphasis">
      <span>{{ t('exchangeRate.base', { currency: targetCurrency }) }}</span>
      <span v-if="formattedUpdatedAt">
        · {{ t('exchangeRate.updatedAt', { time: formattedUpdatedAt }) }}
      </span>
    </div>

    <v-alert
      v-if="error || exchangeRateStore.error"
      class="mb-3"
      type="warning"
      variant="tonal"
    >
      {{ error || exchangeRateStore.error }}
    </v-alert>

    <v-list v-if="exchangeRateStore.rates.length" class="pa-0">
      <v-list-item
        v-for="rate in exchangeRateStore.rates"
        :key="`${rate.sourceCurrency}-${rate.targetCurrency}`"
        class="exchange-item"
      >
        <div class="min-w-0">
          <div class="text-body-large font-weight-bold">
            {{ rate.sourceCurrency }} -> {{ rate.targetCurrency }}
          </div>
          <div class="mt-1 text-label-medium text-medium-emphasis">
            {{ rate.isManual ? t('exchangeRate.manual') : t('exchangeRate.auto') }}
          </div>
        </div>
        <template #append>
          <div class="d-flex align-center ga-3 exchange-actions">
            <v-text-field
              v-model="manualRates[rate.sourceCurrency]"
              class="exchange-input"
              density="compact"
              hide-details
              inputmode="decimal"
              variant="outlined"
            />
            <v-btn
              size="small"
              variant="tonal"
              @click="saveManualRate(rate.sourceCurrency)"
            >
              {{ t('common.save') }}
            </v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>

    <v-empty-state
      v-else
      :text="t('exchangeRate.empty')"
      icon="$cash"
    />
  </v-card>
</template>

<style scoped>
.exchange-item {
  min-height: 5rem;
  padding-inline: 0;
}

.exchange-item + .exchange-item {
  border-top: 1px dashed rgb(var(--v-theme-outline));
}

.exchange-input {
  width: 7rem;
}

@media (max-width: 420px) {
  .exchange-item :deep(.v-list-item__append) {
    margin-inline-start: 0.75rem;
  }

  .exchange-actions {
    gap: 0.5rem;
  }

  .exchange-input {
    width: 6rem;
  }
}
</style>
