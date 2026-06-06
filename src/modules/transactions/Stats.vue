<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useDefaultCurrencyStore } from '@/modules/settings/default-currency.store';
import { formatMinorUnits } from '@/modules/shared/money';
import AmountText from '@/components/shared/AmountText.vue';
import AppBarVue from '@/components/shared/app-bar.vue';

const { t } = useI18n();
const transactionStore = useTransactionStore();
const tagStore = useTagStore();
const defaultCurrencyStore = useDefaultCurrencyStore();

const transactions = computed(() => transactionStore.transactions);
const baseCurrency = computed(
  () => transactions.value[0]?.currency ?? defaultCurrencyStore.currency
);
const income = computed(() =>
  transactions.value
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
);
const expense = computed(() =>
  transactions.value
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
);
const maxFlow = computed(() => Math.max(income.value, expense.value, 1));

const categoryShare = computed(() => {
  const totals = new Map<number, number>();

  for (const transaction of transactions.value.filter((item) => item.type === 'expense')) {
    const tagId = transaction.tagIds[0] ?? 0;
    totals.set(tagId, (totals.get(tagId) ?? 0) + transaction.amount);
  }

  return [...totals.entries()]
    .map(([tagId, amount]) => ({
      tag: tagStore.tags.find((tag) => tag.id === tagId),
      amount
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5);
});

const trend = computed(() => [
  { label: 'Jan', value: Math.round(expense.value * 0.42) },
  { label: 'Feb', value: Math.round(expense.value * 0.58) },
  { label: 'Mar', value: Math.round(expense.value * 0.51) },
  { label: 'Apr', value: Math.round(expense.value * 0.86) },
  { label: 'May', value: expense.value }
]);

onMounted(async () => {
  await Promise.all([
    transactionStore.load(),
    tagStore.load(),
    defaultCurrencyStore.load()
  ]);
});
</script>

<template>
  <AppBarVue />
  <v-main>
    <v-container>
      <div class="d-flex flex-column ga-4">
        <v-card class="stats-card soft-card">
          <div class="stats-card-title mb-4">{{ t('stats.monthlyFlow') }}</div>
          <div class="stats-flow-row d-flex align-center justify-space-between mb-2">
            <span>{{ t('stats.received') }}</span>
            <AmountText
              class="stats-amount"
              :amount="income"
              :currency="baseCurrency"
              type="income"
            />
          </div>
          <v-progress-linear
            :model-value="(income / maxFlow) * 100"
            color="success"
            height="10"
            rounded
          />
          <div class="stats-flow-row d-flex align-center justify-space-between mt-5 mb-2">
            <span>{{ t('stats.spent') }}</span>
            <AmountText
              class="stats-amount"
              :amount="expense"
              :currency="baseCurrency"
              type="expense"
            />
          </div>
          <v-progress-linear
            :model-value="(expense / maxFlow) * 100"
            color="error"
            height="10"
            rounded
          />
        </v-card>

        <v-card class="stats-card soft-card">
          <div class="stats-card-title mb-4">{{ t('stats.categoryShare') }}</div>
          <div v-if="!categoryShare.length" class="stats-empty text-medium-emphasis">
            {{ t('common.empty') }}
          </div>
          <div v-for="item in categoryShare" :key="item.tag?.id ?? 0" class="mb-4">
            <div class="stats-category-row d-flex align-center justify-space-between mb-1">
              <span class="text-truncate">{{ item.tag?.name ?? t('category.more') }}</span>
              <span class="stats-amount">{{ formatMinorUnits(item.amount, baseCurrency) }}</span>
            </div>
            <v-progress-linear
              :model-value="(item.amount / Math.max(expense, 1)) * 100"
              :color="item.tag?.color || 'primary'"
              height="8"
              rounded
            />
          </div>
        </v-card>

        <v-card class="stats-card soft-card">
          <div class="stats-card-title mb-4">{{ t('stats.monthTrend') }}</div>
          <div class="trend-chart">
            <div v-for="item in trend" :key="item.label" class="trend-item">
              <div
                class="trend-bar"
                :style="{ height: `${Math.max((item.value / Math.max(expense, 1)) * 110, 8)}px` }"
              />
              <div class="trend-label text-medium-emphasis">{{ item.label }}</div>
            </div>
          </div>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>

<style scoped>
.stats-card {
  padding: 1rem;
}

.stats-card-title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.45;
}

.stats-flow-row,
.stats-category-row,
.stats-empty,
.trend-label {
  font-size: 0.75rem;
  line-height: 1.45;
}

.stats-category-row {
  gap: 0.75rem;
}

.stats-amount {
  flex: 0 0 auto;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  align-items: end;
  min-height: 150px;
  gap: 12px;
}

.trend-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.trend-bar {
  width: 100%;
  max-width: 34px;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgb(var(--v-theme-income)),
    rgb(var(--v-theme-primary))
  );
}
</style>
