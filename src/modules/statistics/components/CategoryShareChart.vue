<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts/core';
import type { ECharts } from 'echarts';
import type { CurrencyCode } from '@/modules/shared/money';
import {
  buildCategoryShareChartOption,
  formatStatisticsAmount,
  formatStatisticsPercent,
  getCategoryColor,
  registerStatisticsCharts
} from '../useStatisticsCharts';
import type {
  CategoryShareChartItem,
  CategoryShareMode
} from '../useStatisticsCharts';

const props = defineProps<{
  currency: CurrencyCode;
  emptyLabel: string;
  expenseLabel: string;
  incomeLabel: string;
  items: CategoryShareChartItem[];
  title: string;
  totalAmount: number;
  totalLabel: string;
}>();

const mode = defineModel<CategoryShareMode>('mode', { required: true });

const chartEl = ref<HTMLElement | null>(null);
const chart = ref<ECharts | null>(null);

registerStatisticsCharts();

onMounted(async () => {
  await nextTick();
  renderChart();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  chart.value?.dispose();
});

watch(
  () => [props.items, props.currency],
  async () => {
    await nextTick();
    renderChart();
  },
  { deep: true }
);

function renderChart() {
  if (!chartEl.value || !props.items.length) {
    chart.value?.dispose();
    chart.value = null;
    return;
  }

  chart.value ??= echarts.init(chartEl.value);
  chart.value.setOption(
    buildCategoryShareChartOption(props.items, props.currency),
    true
  );
}

function resizeChart() {
  chart.value?.resize();
}
</script>

<template>
  <v-card class="soft-card pa-4">
    <div class="mb-4 d-flex align-center justify-space-between ga-3">
      <div class="text-title-medium font-weight-bold">
        {{ title }} ({{ currency }})
      </div>
      <v-btn-toggle
        v-model="mode"
        class="category-mode-toggle text-body-small"
        color="primary"
        density="compact"
        mandatory
        variant="text"
        border
      >
        <v-btn value="expense">
          {{ expenseLabel }}
        </v-btn>
        <v-btn value="income">
          {{ incomeLabel }}
        </v-btn>
      </v-btn-toggle>
    </div>

    <div v-if="!items.length" class="text-label-medium text-medium-emphasis">
      {{ emptyLabel }}
    </div>

    <template v-else>
      <div ref="chartEl" class="pie-chart" />
      <div class="category-total text-center mb-4">
        <div class="text-label-medium text-medium-emphasis">
          {{ totalLabel }}
        </div>
        <div class="text-title-medium font-weight-bold">
          {{ formatStatisticsAmount(totalAmount, currency) }}
        </div>
      </div>

      <div v-for="(item, index) in items" :key="item.key" class="category-row">
        <div class="d-flex align-center ga-3 min-w-0">
          <span
            class="category-dot"
            :style="{ backgroundColor: getCategoryColor(index) }"
          />
          <span class="text-body-medium text-truncate">
            {{ item.name }}
          </span>
        </div>
        <div class="category-amount">
          {{ formatStatisticsAmount(item.amount, currency) }}
        </div>
        <div class="category-percent">
          {{ formatStatisticsPercent(item.percentage) }}
        </div>
      </div>
    </template>
  </v-card>
</template>

<style scoped>
.pie-chart {
  width: 100%;
  height: 280px;
}

.category-total {
  color: rgb(var(--v-theme-on-surface));
}

.category-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto 52px;
  align-items: center;
  gap: 0.75rem;
  padding-block: 0.625rem;
}

.category-dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.category-amount,
.category-percent {
  font-size: 0.875rem;
  white-space: nowrap;
}

.category-percent {
  text-align: right;
  color: rgba(var(--v-theme-on-surface), 0.68);
}
</style>
