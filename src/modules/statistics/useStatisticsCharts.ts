import * as echarts from 'echarts/core';
import { LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TooltipComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import type { CurrencyCode } from '@/modules/shared/money';

export type CategoryShareMode = 'expense' | 'income';

export interface CategoryShareChartItem {
  key: number | string;
  name: string;
  amount: number;
  percentage: number;
}

export interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}

export const defaultChartColors = [
  '#5470C6',
  '#91CC75',
  '#FAC858',
  '#EE6666',
  '#73C0DE',
  '#3BA272',
  '#FC8452',
  '#9A60B4',
  '#EA7CCC'
];

export function registerStatisticsCharts() {
  echarts.use([
    CanvasRenderer,
    GridComponent,
    LegendComponent,
    LineChart,
    PieChart,
    TooltipComponent
  ]);
}

export function formatStatisticsAmount(amount: number, currency: CurrencyCode) {
  return `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount / 100)}`;
}

export function formatStatisticsPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function getCategoryColor(index: number) {
  return defaultChartColors[index % defaultChartColors.length];
}

export function getThemeColor(name: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(`--v-theme-${name}`)
    .trim();
  return value ? `rgb(${value})` : '#111827';
}

export function buildCategoryShareChartOption(
  items: CategoryShareChartItem[],
  currency: CurrencyCode
): EChartsOption {
  return {
    color: defaultChartColors,
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const item = items[Number(params.dataIndex)];
        return `${params.name}<br/>${formatStatisticsAmount(item?.amount ?? 0, currency)} - ${formatStatisticsPercent(item?.percentage ?? 0)}`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: '78%',
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'inside',
          formatter: (params) => {
            const percentage = Number(params.percent ?? 0);
            const item = items[Number(params.dataIndex)];
            return percentage >= 3
              ? `${item?.name ?? params.name}\n${percentage.toFixed(1)}%`
              : '';
          },
          align: 'center',
          // color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          lineHeight: 16
        },
        labelLine: {
          show: false
        },
        data: items.map((item, index) => ({
          name: item.name,
          value: item.amount,
          itemStyle: {
            color: getCategoryColor(index)
          }
        }))
      }
    ]
  };
}

export function buildTrendChartOption(
  trend: TrendPoint[],
  currency: CurrencyCode,
  incomeLabel: string,
  expenseLabel: string
): EChartsOption {
  return {
    color: [getThemeColor('income'), getThemeColor('expense')],
    grid: {
      left: 8,
      right: 8,
      top: 24,
      bottom: 8,
      containLabel: true
    },
    legend: {
      top: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: getThemeColor('on-surface')
      }
    },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => formatStatisticsAmount(Number(value), currency)
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trend.map((item) => item.label),
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `${Math.round(value / 100)}`
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(148, 163, 184, 0.22)'
        }
      }
    },
    series: [
      {
        name: incomeLabel,
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: trend.map((item) => item.income)
      },
      {
        name: expenseLabel,
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: trend.map((item) => item.expense)
      }
    ]
  };
}
