<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { formatMinorUnits } from '@/modules/shared/money';
import AmountText from '@/components/shared/AmountText.vue';
import MobilePage from '@/components/shared/MobilePage.vue';

const { t } = useI18n();
const transactionStore = useTransactionStore();
const tagStore = useTagStore();

const transactions = computed(() => transactionStore.transactions);
const baseCurrency = computed(() => transactions.value[0]?.currency ?? 'AED');
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
  await Promise.all([transactionStore.load(), tagStore.load()]);
});
</script>

<template>
  <MobilePage :title="t('nav.stats')">
    <div class="d-flex flex-column ga-4">
      <v-card class="soft-card pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('stats.monthlyFlow') }}</div>
        <div class="d-flex align-center justify-space-between mb-2">
          <span>{{ t('stats.received') }}</span>
          <AmountText :amount="income" :currency="baseCurrency" type="income" />
        </div>
        <v-progress-linear :model-value="(income / maxFlow) * 100" color="success" height="10" rounded />
        <div class="d-flex align-center justify-space-between mt-5 mb-2">
          <span>{{ t('stats.spent') }}</span>
          <AmountText :amount="expense" :currency="baseCurrency" type="expense" />
        </div>
        <v-progress-linear :model-value="(expense / maxFlow) * 100" color="error" height="10" rounded />
      </v-card>

      <v-card class="soft-card pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('stats.categoryShare') }}</div>
        <div v-if="!categoryShare.length" class="text-medium-emphasis">{{ t('common.empty') }}</div>
        <div v-for="item in categoryShare" :key="item.tag?.id ?? 0" class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <span>{{ item.tag?.name ?? t('category.more') }}</span>
            <span class="font-weight-bold">{{ formatMinorUnits(item.amount, baseCurrency) }}</span>
          </div>
          <v-progress-linear
            :model-value="(item.amount / Math.max(expense, 1)) * 100"
            :color="item.tag?.color || 'primary'"
            height="8"
            rounded
          />
        </div>
      </v-card>

      <v-card class="soft-card pa-5">
        <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('stats.monthTrend') }}</div>
        <div class="trend-chart">
          <div v-for="item in trend" :key="item.label" class="trend-item">
            <div class="trend-bar" :style="{ height: `${Math.max((item.value / Math.max(expense, 1)) * 110, 8)}px` }" />
            <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
          </div>
        </div>
      </v-card>
    </div>
  </MobilePage>
</template>

<style scoped>
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
  background: linear-gradient(180deg, #34d399, #0f766e);
}
</style>
