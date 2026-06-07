<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as echarts from 'echarts/core';
import type { ECharts } from 'echarts';
import type { CurrencyCode } from '@/modules/shared/money';
import {
  buildTrendChartOption,
  registerStatisticsCharts
} from '../useStatisticsCharts';
import type { TrendPoint } from '../useStatisticsCharts';

const props = defineProps<{
  currency: CurrencyCode;
  emptyLabel: string;
  expenseLabel: string;
  incomeLabel: string;
  title: string;
  trend: TrendPoint[];
}>();

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
  () => [props.trend, props.currency, props.incomeLabel, props.expenseLabel],
  async () => {
    await nextTick();
    renderChart();
  },
  { deep: true }
);

function renderChart() {
  if (!chartEl.value || !props.trend.length) {
    chart.value?.dispose();
    chart.value = null;
    return;
  }

  chart.value ??= echarts.init(chartEl.value);
  chart.value.setOption(
    buildTrendChartOption(
      props.trend,
      props.currency,
      props.incomeLabel,
      props.expenseLabel
    ),
    true
  );
}

function resizeChart() {
  chart.value?.resize();
}
</script>

<template>
  <v-card class="soft-card pa-4">
    <div class="mb-4 text-title-medium font-weight-bold">
      {{ title }}
    </div>
    <div v-if="!trend.length" class="text-label-medium text-medium-emphasis">
      {{ emptyLabel }}
    </div>
    <div v-else ref="chartEl" class="line-chart" />
  </v-card>
</template>

<style scoped>
.line-chart {
  width: 100%;
  height: 224px;
}
</style>
