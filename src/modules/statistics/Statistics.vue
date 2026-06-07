<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useCurrencyStore } from '@/modules/currency/currency.store';
import { useExchangeRateStore } from '@/modules/exchange-rate/exchange-rate.store';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import type { CurrencyCode } from '@/modules/shared/money';
import type {
  Transaction,
  TransactionType
} from '@/modules/transactions/transaction.types';
import AppBarVue from '@/components/shared/app-bar.vue';
import TransactionFilterListSheet from '@/modules/transactions/components/TransactionFilterListSheet.vue';
import TransactionDateFilterSheet from '@/modules/transactions/components/TransactionDateFilterSheet.vue';
import useTransaction from '@/modules/transactions/useTransactionDisplay';
import CategoryShareChart from './components/CategoryShareChart.vue';
import TrendLineChart from './components/TrendLineChart.vue';
import { formatStatisticsAmount } from './useStatisticsCharts';
import type {
  CategoryShareChartItem,
  CategoryShareMode,
  TrendPoint
} from './useStatisticsCharts';

type DateFilterMode = 'all' | 'month' | 'year' | 'custom';

interface ConvertedTransaction {
  transaction: Transaction;
  amount: number | null;
}

interface StatisticsFilters {
  bookId: number | null;
  accountId: number | null;
  dateFrom: string | null;
  dateTo: string | null;
  dateMode: DateFilterMode;
}

const { t } = useI18n();
const transactionStore = useTransactionStore();
const tagStore = useTagStore();
const currencyStore = useCurrencyStore();
const exchangeRateStore = useExchangeRateStore();
const bookStore = useBookStore();
const accountStore = useAccountStore();
const trans = useTransaction();

const selectedCurrency = ref<CurrencyCode>('CNY');
const categoryShareMode = ref<CategoryShareMode>('expense');
const bookFilterOpen = ref(false);
const currencyFilterOpen = ref(false);
const accountFilterOpen = ref(false);
const dateFilterOpen = ref(false);
const exchangeRateRefreshError = ref('');
const exchangeRateRefreshing = ref(false);

const filters = ref<StatisticsFilters>({
  bookId: null,
  accountId: null,
  dateFrom: null,
  dateTo: null,
  dateMode: 'all'
});

const bookFilterOptions = computed(() => [
  { title: t('common.allBooks'), value: null },
  ...bookStore.books.map((book) => ({
    title: book.name,
    value: book.id
  }))
]);
const currencyFilterOptions = computed(() =>
  currencyStore.currencies.map((currency) => ({
    title: currency,
    value: currency
  }))
);
const accountFilterOptions = computed(() => [
  { title: t('common.allAccounts'), value: null },
  ...accountStore.accounts.map((account) => ({
    title: `${account.name} · ${account.currency}`,
    value: account.id
  }))
]);
const summaryBookTitle = computed(() =>
  filters.value.bookId
    ? trans.getBookName(filters.value.bookId)
    : t('common.allBooks')
);
const rateMap = computed(() => {
  const map = new Map<CurrencyCode, number>();
  for (const rate of exchangeRateStore.rates) {
    if (rate.targetCurrency === selectedCurrency.value && rate.rate) {
      map.set(rate.sourceCurrency, rate.rate);
    }
  }
  return map;
});
const convertedTransactions = computed<ConvertedTransaction[]>(() =>
  transactionStore.transactions.map((transaction) => ({
    transaction,
    amount: convertAmount(transaction.amount, transaction.currency)
  }))
);
const missingExchangeCurrencies = computed(() => [
  ...new Set(
    convertedTransactions.value
      .filter((item) => item.amount === null)
      .map((item) => item.transaction.currency)
  )
]);
const shouldShowMissingExchangeWarning = computed(() =>
  Boolean(exchangeRateRefreshError.value) && missingExchangeCurrencies.value.length > 0
);
const income = computed(() => sumConvertedByType('income'));
const expense = computed(() => sumConvertedByType('expense'));
const balance = computed(() => income.value - expense.value);
const categoryShareTotal = computed(() =>
  categoryShareMode.value === 'income' ? income.value : expense.value
);
const categoryShareTotalLabel = computed(() =>
  categoryShareMode.value === 'income' ? t('stats.totalIncome') : t('stats.totalSpent')
);
const categoryShare = computed(() => {
  const totals = new Map<number, number>();

  for (const item of convertedTransactions.value) {
    if (item.transaction.type !== categoryShareMode.value || item.amount === null) {
      continue;
    }

    const tagId = item.transaction.tagIds[0] ?? 0;
    totals.set(tagId, (totals.get(tagId) ?? 0) + item.amount);
  }

  return [...totals.entries()]
    .map(([tagId, amount]) => ({
      key: tagId,
      tag: tagStore.tags.find((tag) => tag.id === tagId),
      amount,
      percentage: categoryShareTotal.value > 0
        ? (amount / categoryShareTotal.value) * 100
        : 0
    }))
    .sort((left, right) => right.amount - left.amount);
});
const categoryShareItems = computed<CategoryShareChartItem[]>(() =>
  categoryShare.value.map((item) => ({
    key: item.key,
    name: item.tag?.name ?? t('stats.untagged'),
    amount: item.amount,
    percentage: item.percentage
  }))
);
const trend = computed<TrendPoint[]>(() => buildTrendPoints());

const summaryItems = computed(() => [
  {
    key: 'income',
    name: t('transaction.income'),
    amount: income.value
  },
  {
    key: 'expense',
    name: t('transaction.expense'),
    amount: expense.value
  },
  {
    key: 'balance',
    name: t('transaction.balance'),
    amount: balance.value
  }
]);

onMounted(async () => {
  await Promise.all([
    bookStore.load(),
    accountStore.load(),
    tagStore.load(),
    currencyStore.load()
  ]);
  selectedCurrency.value = currencyStore.currency;
  await Promise.all([
    loadExchangeRates(),
    loadWithFilters()
  ]);
  await refreshMissingExchangeRates();
});

watch(selectedCurrency, async () => {
  await loadExchangeRates();
  await refreshMissingExchangeRates();
});

function convertAmount(amount: number, currency: CurrencyCode) {
  if (currency === selectedCurrency.value) {
    return amount;
  }

  const rate = rateMap.value.get(currency);
  return rate ? Math.round(amount * rate) : null;
}

function sumConvertedByType(type: TransactionType) {
  return convertedTransactions.value.reduce((sum, item) => {
    if (item.transaction.type !== type || item.amount === null) {
      return sum;
    }
    return sum + item.amount;
  }, 0);
}

function formatSummaryAmount(amount: number) {
  return formatStatisticsAmount(amount, selectedCurrency.value);
}

function filterLabel(kind: 'account' | 'date') {
  if (kind === 'account') {
    return filters.value.accountId
      ? trans.getAccountName(filters.value.accountId)
      : t('common.allAccounts');
  }

  if (kind === 'date') {
    if (!filters.value.dateFrom && !filters.value.dateTo) {
      return t('common.allPeriods');
    }

    if (filters.value.dateMode === 'month') {
      return t('common.thisMonth');
    }

    if (filters.value.dateMode === 'year') {
      return t('common.thisYear');
    }

    if (filters.value.dateFrom && filters.value.dateTo) {
      return `${filters.value.dateFrom} - ${filters.value.dateTo}`;
    }

    return t('common.allPeriods');
  }

  return t('common.allPeriods');
}

async function loadExchangeRates() {
  await exchangeRateStore.load(currencyStore.currencies, selectedCurrency.value);
}

async function loadWithFilters() {
  await transactionStore.load({
    bookId: filters.value.bookId,
    accountId: filters.value.accountId,
    dateFrom: filters.value.dateFrom,
    dateTo: filters.value.dateTo
  });
}

async function loadStatisticsData() {
  await loadWithFilters();
  await refreshMissingExchangeRates();
}

async function refreshMissingExchangeRates() {
  const missingCurrencies = missingExchangeCurrencies.value;
  if (!missingCurrencies.length) {
    exchangeRateRefreshError.value = '';
    return;
  }

  if (exchangeRateRefreshing.value) {
    return;
  }

  exchangeRateRefreshError.value = '';
  exchangeRateRefreshing.value = true;

  try {
    await exchangeRateStore.refreshOnline(
      currencyStore.currencies,
      selectedCurrency.value,
      true,
      missingCurrencies
    );
  } catch (err) {
    exchangeRateRefreshError.value =
      err instanceof Error ? err.message : t('exchangeRate.updateFailed');
  } finally {
    exchangeRateRefreshing.value = false;
  }
}

async function selectBook(value: number | string | null) {
  filters.value.bookId = typeof value === 'number' ? value : null;
  bookFilterOpen.value = false;
  await loadStatisticsData();
}

async function selectCurrency(value: number | string | null) {
  if (typeof value === 'string') {
    selectedCurrency.value = value;
  }
  currencyFilterOpen.value = false;
}

async function selectAccount(value: number | string | null) {
  filters.value.accountId = typeof value === 'number' ? value : null;
  accountFilterOpen.value = false;
  await loadStatisticsData();
}

async function applyDateFilters(range: {
  dateFrom: string | null;
  dateTo: string | null;
  mode: DateFilterMode;
}) {
  filters.value.dateFrom = range.dateFrom;
  filters.value.dateTo = range.dateTo;
  filters.value.dateMode = range.mode;
  dateFilterOpen.value = false;
  await loadStatisticsData();
}

function buildTrendPoints() {
  const groups = new Map<string, TrendPoint>();
  const useMonthlyGroups =
    filters.value.dateMode === 'year' ||
    filters.value.dateMode === 'all';

  for (const item of convertedTransactions.value) {
    if (
      item.amount === null ||
      (item.transaction.type !== 'income' && item.transaction.type !== 'expense')
    ) {
      continue;
    }

    const date = item.transaction.occurredAt.slice(0, 10);
    const key = useMonthlyGroups ? date.slice(0, 7) : date;
    const label = useMonthlyGroups ? key.slice(5) : key.slice(5);
    const point = groups.get(key) ?? { label, income: 0, expense: 0 };
    point[item.transaction.type] += item.amount;
    groups.set(key, point);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, point]) => point);
}

</script>

<template>
  <AppBarVue />
  <v-main>
    <v-container class="d-flex flex-column ga-4 pa-4">
      <div class="d-flex align-center justify-space-between ga-2">
        <v-card color="transparent" class="flex-grow-1 min-w-0">
          <v-btn
            class="justify-start px-2"
            variant="text"
            @click="bookFilterOpen = true"
          >
            <template #prepend>
              <v-avatar color="primary" size="36" variant="tonal">
                <v-icon icon="$book" />
              </v-avatar>
            </template>
            <span class="text-body-medium text-truncate">
              {{ summaryBookTitle }}
            </span>
            <template #append>
              <v-icon class="text-medium-emphasis" icon="$dropdown" size="18" />
            </template>
          </v-btn>
        </v-card>
        <v-btn
          class="currency-filter"
          color="surface"
          :loading="exchangeRateRefreshing"
          variant="flat"
          @click="currencyFilterOpen = true"
        >
          {{ selectedCurrency }}
          <v-icon class="ms-1 text-medium-emphasis" icon="$dropdown" size="18" />
        </v-btn>
      </div>

      <v-card class="summary-amount-card pa-5" color="summary">
        <template v-for="(item, idx) in summaryItems" :key="item.key">
          <v-row no-gutters>
            <v-col cols="3" class="text-body-medium">
              <span>{{ item.name }}</span>
            </v-col>
            <v-col>
              <span class="d-block text-title-small font-weight-bold statistics-amount">
                {{ formatSummaryAmount(item.amount) }}
              </span>
            </v-col>
          </v-row>
          <v-divider
            v-if="idx < summaryItems.length - 1"
            class="summary-divider my-3"
          />
        </template>
      </v-card>

      <div class="d-flex ga-2 overflow-x-auto pb-1">
        <v-chip
          class="flex-shrink-0 border"
          color="surface"
          prepend-icon="$account"
          variant="flat"
          @click="accountFilterOpen = true"
        >
          {{ filterLabel('account') }}
        </v-chip>
        <v-chip
          class="flex-shrink-0 border"
          color="surface"
          prepend-icon="$calendar"
          variant="flat"
          @click="dateFilterOpen = true"
        >
          {{ filterLabel('date') }}
        </v-chip>
      </div>

      <v-alert
        v-if="shouldShowMissingExchangeWarning"
        class="text-body-small"
        color="warning"
        density="comfortable"
        variant="tonal"
      >
        {{
          t('stats.missingExchangeRates', {
            currencies: missingExchangeCurrencies.join(', '),
            currency: selectedCurrency
          })
        }}
      </v-alert>

      <CategoryShareChart
        v-model:mode="categoryShareMode"
        :currency="selectedCurrency"
        :empty-label="t('common.empty')"
        :expense-label="t('transaction.expense')"
        :income-label="t('transaction.income')"
        :items="categoryShareItems"
        :title="t('stats.categoryShare')"
        :total-amount="categoryShareTotal"
        :total-label="categoryShareTotalLabel"
      />

      <TrendLineChart
        :currency="selectedCurrency"
        :empty-label="t('common.empty')"
        :expense-label="t('transaction.expense')"
        :income-label="t('transaction.income')"
        :title="t('stats.monthTrend')"
        :trend="trend"
      />

      <v-bottom-sheet v-model="bookFilterOpen">
        <TransactionFilterListSheet
          v-model="filters.bookId"
          :items="bookFilterOptions"
          :title="t('transaction.filters.book')"
          @select="selectBook"
        />
      </v-bottom-sheet>

      <v-bottom-sheet v-model="currencyFilterOpen">
        <TransactionFilterListSheet
          v-model="selectedCurrency"
          :items="currencyFilterOptions"
          :title="t('stats.currency')"
          @select="selectCurrency"
        />
      </v-bottom-sheet>

      <v-bottom-sheet v-model="accountFilterOpen">
        <TransactionFilterListSheet
          v-model="filters.accountId"
          :items="accountFilterOptions"
          :title="t('transaction.filters.account')"
          @select="selectAccount"
        />
      </v-bottom-sheet>

      <v-bottom-sheet v-model="dateFilterOpen">
        <TransactionDateFilterSheet
          :all-label="t('common.unlimited')"
          :confirm-label="t('common.confirm')"
          :custom-label="t('common.custom')"
          :date-from="filters.dateFrom ?? null"
          :date-to="filters.dateTo ?? null"
          :month-label="t('common.thisMonth')"
          :title="t('transaction.filters.month')"
          :year-label="t('common.thisYear')"
          @apply="applyDateFilters"
        />
      </v-bottom-sheet>
    </v-container>
  </v-main>
</template>

<style scoped>
.currency-filter {
  flex: 0 0 auto;
  min-width: 92px;
}

.summary-amount-card {
  color: rgb(var(--v-theme-on-primary));
  box-shadow: var(--app-card-shadow);
}

.summary-amount-card .statistics-amount {
  color: rgb(var(--v-theme-on-primary));
}

.summary-divider {
  border-top: 1px solid rgba(var(--v-theme-on-primary), 1);
  opacity: 0.3 !important;
}

</style>
