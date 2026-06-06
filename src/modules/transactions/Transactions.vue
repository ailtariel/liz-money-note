<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import type { Tag } from '@/modules/tags/tag.types';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type {
  Transaction,
  TransactionType
} from '@/modules/transactions/transaction.types';
import { formatMinorUnits } from '@/modules/shared/money';
import TransactionEditor from '@/modules/transactions/TransactionEditor.vue';
import { transactionTypeOptions } from '@/components/shared/financeDisplay';
import AppBarVue from '@/components/shared/app-bar.vue';
import TransactionItemVue from './components/TransactionItem.vue';
import TransactionDetailVue from './components/TransactionDetail.vue';
import TransactionFilterListSheet from './components/TransactionFilterListSheet.vue';
import TransactionTagFilterSheet from './components/TransactionTagFilterSheet.vue';
import TransactionDateFilterSheet from './components/TransactionDateFilterSheet.vue';
import useTransaction from './useTransactionDisplay';
import type { TransactionListRow } from './transaction-ui.types';

type DateFilterMode = 'month' | 'year' | 'custom';

const { t } = useI18n();
const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();
const trans = useTransaction();
const bookFilterOpen = ref(false);
const accountFilterOpen = ref(false);
const typeFilterOpen = ref(false);
const tagFilterOpen = ref(false);
const dateFilterOpen = ref(false);
const searchOpen = ref(false);
const detailSheetOpen = ref(false);
const searchDraft = ref('');

const selectedTransaction = ref<Transaction | null>(null);

const filters = reactive({
  bookId: null as number | null,
  accountId: null as number | null,
  type: null as TransactionType | null,
  tagIds: [] as number[],
  dateFrom: null as string | null,
  dateTo: null as string | null,
  dateMode: 'month' as DateFilterMode,
  search: null as string | null
});

const typeOptions = computed(() => transactionTypeOptions(t));
const bookFilterOptions = computed(() => [
  { title: t('common.allBooks'), value: null },
  ...bookStore.books.map((book) => ({
    title: book.name,
    value: book.id
  }))
]);
const accountFilterOptions = computed(() => [
  { title: t('common.allAccounts'), value: null },
  ...accountStore.accounts.map((account) => ({
    title: account.name,
    value: account.id
  }))
]);
const typeFilterOptions = computed(() => [
  { title: t('common.allTypes'), value: null },
  ...typeOptions.value
]);
const transactions = computed(() => transactionStore.transactions);
const baseCurrency = computed(
  () => accountStore.accounts[0]?.currency ?? 'AED'
);

const monthlyIncome = computed(() =>
  transactions.value
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
);

const monthlyExpense = computed(() =>
  transactions.value
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
);

const summaryBookTitle = computed(() =>
  filters.bookId ? trans.getBookName(filters.bookId) : t('common.allBooks')
);
const selectedTags = computed(() =>
  filters.tagIds
    .map((tagId) => tagStore.tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag))
);
const activeSearch = computed(() => filters.search?.trim() ?? '');

const listRows = computed<TransactionListRow[]>(() => {
  const rows: TransactionListRow[] = [];
  const grouped = new Map<string, Transaction[]>();

  for (const transaction of transactions.value) {
    const date = transaction.occurredAt.slice(0, 10);
    grouped.set(date, [...(grouped.get(date) ?? []), transaction]);
  }

  for (const [date, items] of grouped) {
    const currency = items[0]?.currency ?? baseCurrency.value;
    rows.push({
      kind: 'date',
      key: `date-${date}`,
      date,
      income: items
        .filter((transaction) => transaction.type === 'income')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      expense: items
        .filter((transaction) => transaction.type === 'expense')
        .reduce((sum, transaction) => sum + transaction.amount, 0),
      currency
    });

    rows.push(
      ...items.map((transaction) => ({
        kind: 'item' as const,
        key: `transaction-${transaction.id}`,
        transaction
      }))
    );
  }

  return rows;
});

function filterLabel(kind: 'account' | 'type' | 'tag' | 'date') {
  if (kind === 'account') {
    return filters.accountId
      ? trans.getAccountName(filters.accountId)
      : t('common.allAccounts');
  }

  if (kind === 'tag') {
    return filters.tagIds.length ? `Tag ${filters.tagIds.length}` : 'Tag';
  }

  if (kind === 'date') {
    if (filters.dateMode === 'month') {
      return t('common.thisMonth');
    }

    if (filters.dateMode === 'year') {
      return t('common.thisYear');
    }

    if (filters.dateFrom && filters.dateTo) {
      return `${filters.dateFrom} - ${filters.dateTo}`;
    }
    return t('common.thisMonth');
  }

  return filters.type
    ? (typeOptions.value.find((item) => item.value === filters.type)?.title ??
        t('common.allTypes'))
    : t('common.allTypes');
}

async function loadWithFilters() {
  await transactionStore.load({
    bookId: filters.bookId,
    accountId: filters.accountId,
    type: filters.type,
    tagIds: filters.tagIds,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    search: filters.search
  });
}

async function selectBook(value: number | string | null) {
  filters.bookId = typeof value === 'number' ? value : null;
  bookFilterOpen.value = false;
  await loadWithFilters();
}

async function selectAccount(value: number | string | null) {
  filters.accountId = typeof value === 'number' ? value : null;
  accountFilterOpen.value = false;
  await loadWithFilters();
}

async function selectType(value: number | string | null) {
  filters.type = typeof value === 'string' ? (value as TransactionType) : null;
  typeFilterOpen.value = false;
  await loadWithFilters();
}

async function applyTagFilters() {
  tagFilterOpen.value = false;
  await loadWithFilters();
}

async function applyDateFilters(range: {
  dateFrom: string | null;
  dateTo: string | null;
  mode: DateFilterMode;
}) {
  filters.dateFrom = range.dateFrom;
  filters.dateTo = range.dateTo;
  filters.dateMode = range.mode;
  dateFilterOpen.value = false;
  await loadWithFilters();
}

async function removeSelectedTag(tagId: number) {
  filters.tagIds = filters.tagIds.filter((id) => id !== tagId);
  await loadWithFilters();
}

async function clearSelectedTags() {
  filters.tagIds = [];
  await loadWithFilters();
}

function openSearch() {
  searchDraft.value = activeSearch.value;
  searchOpen.value = true;
}

async function applySearch() {
  const keyword = searchDraft.value.trim();
  filters.search = keyword || null;
  searchOpen.value = false;
  await loadWithFilters();
}

async function clearSearch() {
  searchDraft.value = '';
  filters.search = null;
  searchOpen.value = false;
  await loadWithFilters();
}

function openDetail(transaction: Transaction) {
  selectedTransaction.value = transaction;
  detailSheetOpen.value = true;
}

onMounted(async () => {
  await Promise.all([
    bookStore.load(),
    accountStore.load(),
    tagStore.load(),
    transactionStore.load()
  ]);
});

/*------------------------
    editor
------------------------*/
const editorOpen = ref(false);
function handleEditorSaved() {
  editorOpen.value = false;
}
</script>

<template>
  <AppBarVue>
    <template #actions>
      <v-btn
        color="primary"
        icon="$add"
        variant="flat"
        size="small"
        class="ma-2"
        @click="editorOpen = true"
      />
      <v-btn icon="$search" variant="text" @click="openSearch" />
      <v-chip
        v-if="activeSearch"
        class="search-keyword-chip"
        color="primary"
        size="small"
        variant="tonal"
        closable
        @click="openSearch"
        @click:close.stop="clearSearch"
      >
        {{ activeSearch }}
      </v-chip>
    </template>
  </AppBarVue>
  <v-dialog
    v-model="editorOpen"
    fullscreen
    persistent
    transition="dialog-bottom-transition"
  >
    <TransactionEditor
      v-if="editorOpen"
      @close="editorOpen = false"
      @saved="handleEditorSaved"
    />
  </v-dialog>
  <v-main>
    <v-container>
      <!-- <div class="summary-grid"> -->
      <v-card class="summary-book-card mb-2">
        <button
          class="summary-book"
          type="button"
          @click="bookFilterOpen = true"
        >
          <v-avatar
            class="summary-book-icon"
            color="success"
            size="48"
            variant="tonal"
          >
            <v-icon icon="$book" />
          </v-avatar>
          <div class="summary-book-name text-truncate">
            {{ summaryBookTitle }}
            <v-icon class="summary-book-arrow" icon="$dropdown" size="18" />
          </div>
        </button>
      </v-card>

      <v-card class="summary-amount-card">
        <div class="summary-amounts">
          <div class="summary-amount-block">
            <div class="summary-label">{{ t('transaction.income') }}</div>
            <div class="summary-amount amount-income">
              {{ formatMinorUnits(monthlyIncome, baseCurrency) }}
            </div>
          </div>
          <div class="summary-line"></div>
          <div class="summary-amount-block">
            <div class="summary-label">{{ t('transaction.expense') }}</div>
            <div class="summary-amount amount-expense">
              {{ formatMinorUnits(monthlyExpense, baseCurrency) }}
            </div>
          </div>
        </div>
      </v-card>
      <!-- </div> -->

      <div class="filter-row">
        <v-chip
          class="filter-chip"
          prepend-icon="$account"
          variant="flat"
          @click="accountFilterOpen = true"
        >
          {{ filterLabel('account') }}
        </v-chip>
        <v-chip
          class="filter-chip"
          prepend-icon="$filter"
          variant="flat"
          @click="typeFilterOpen = true"
        >
          {{ filterLabel('type') }}
        </v-chip>
        <v-chip
          class="filter-chip"
          prepend-icon="$tag"
          variant="flat"
          @click="tagFilterOpen = true"
        >
          {{ filterLabel('tag') }}
        </v-chip>
        <v-chip
          class="filter-chip"
          prepend-icon="$calendar"
          variant="flat"
          @click="dateFilterOpen = true"
        >
          {{ filterLabel('date') }}
        </v-chip>
      </div>

      <div v-if="selectedTags.length" class="selected-tag-row">
        <v-chip
          v-for="tag in selectedTags"
          :key="tag.id"
          color="primary"
          variant="outlined"
          closable
          @click:close="removeSelectedTag(tag.id)"
        >
          {{ tag.name }}
        </v-chip>
        <v-btn variant="text" color="primary" @click="clearSelectedTags">
          {{ t('common.clear') }}
        </v-btn>
      </div>

      <v-card v-if="!listRows.length" class="soft-card pa-6 text-center">
        <div class="text-body-1 font-weight-medium">
          {{ t('transaction.noRecords') }}
        </div>
      </v-card>

      <v-virtual-scroll v-else :items="listRows" class="transaction-scroll">
        <template #default="{ item }">
          <TransactionItemVue
            :item="item"
            @open-detail="openDetail"
          ></TransactionItemVue>
        </template>
      </v-virtual-scroll>

      <v-bottom-sheet v-model="bookFilterOpen">
        <TransactionFilterListSheet
          v-model="filters.bookId"
          :items="bookFilterOptions"
          :title="t('transaction.filters.book')"
          @select="selectBook"
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

      <v-bottom-sheet v-model="typeFilterOpen">
        <TransactionFilterListSheet
          v-model="filters.type"
          :items="typeFilterOptions"
          :title="t('transaction.filters.type')"
          @select="selectType"
        />
      </v-bottom-sheet>

      <v-bottom-sheet v-model="tagFilterOpen">
        <TransactionTagFilterSheet
          v-model="filters.tagIds"
          :clear-label="t('common.clear')"
          :confirm-label="t('common.confirm')"
          :tags="tagStore.tags"
          title="Tag"
          @apply="applyTagFilters"
        />
      </v-bottom-sheet>

      <v-bottom-sheet v-model="dateFilterOpen">
        <TransactionDateFilterSheet
          :confirm-label="t('common.confirm')"
          :custom-label="t('common.custom')"
          :date-from="filters.dateFrom"
          :date-to="filters.dateTo"
          :month-label="t('common.thisMonth')"
          :title="t('transaction.filters.month')"
          :year-label="t('common.thisYear')"
          @apply="applyDateFilters"
        />
      </v-bottom-sheet>

      <v-bottom-sheet v-model="searchOpen">
        <v-card class="search-sheet pa-4">
          <div class="search-sheet-title">
            {{ t('transaction.search.title') }}
          </div>
          <v-text-field
            v-model="searchDraft"
            autofocus
            clearable
            density="comfortable"
            hide-details
            prepend-inner-icon="$search"
            :label="t('transaction.search.placeholder')"
            @keydown.enter="applySearch"
          />
          <div class="search-sheet-actions">
            <v-btn variant="text" color="primary" @click="clearSearch">
              {{ t('common.clear') }}
            </v-btn>
            <v-btn color="primary" variant="flat" @click="applySearch">
              {{ t('common.confirm') }}
            </v-btn>
          </div>
        </v-card>
      </v-bottom-sheet>

      <v-bottom-sheet v-model="detailSheetOpen">
        <TransactionDetailVue
          :transaction="selectedTransaction"
          @close="detailSheetOpen = false"
        />
      </v-bottom-sheet>
    </v-container>
  </v-main>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr);
  gap: 1rem;
}

.summary-book-card {
  background-color: transparent;
}
.summary-amount-card {
  min-height: 7.75rem;
  padding: 1.25rem;
  background: rgb(var(--v-theme-surface));
}

.summary-amount-card {
  color: #ffffff;
  background: linear-gradient(135deg, #34d399 0%, #059669 45%, #047857 100%);
}

.summary-amount-card .amount-income,
.summary-amount-card .amount-expense {
  color: #ffffff;
}

.summary-book {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.875rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.summary-book-icon {
  flex: 0 0 auto;
}

.summary-book-name {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.35;
}

.summary-book-arrow {
  flex: 0 0 auto;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.summary-amounts {
  display: flex;
  height: 100%;
  min-width: 0;
  flex-direction: column;
  justify-content: center;
  gap: 0.625rem;
}

.summary-amount-block {
  min-width: 0;
}

.summary-label {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
}

.summary-amount {
  overflow: hidden;
  margin-top: 0.25rem;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-line {
  border-top: 1px solid rgba(255, 255, 255, 0.24);
}

.filter-row {
  display: flex;
  justify-content: space-between;
  gap: 0.625rem;
  overflow-x: auto;
  padding: 1.25rem 0 0.875rem;
}

.filter-chip {
  flex: 0 0 auto;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  box-shadow: 0 0.375rem 1.125rem rgba(15, 23, 42, 0.08);
}

.search-keyword-chip {
  max-width: 8rem;
}

.search-keyword-chip :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.625rem;
  align-items: center;
  padding-bottom: 0.875rem;
}

.search-sheet {
  border-radius: 1rem 1rem 0 0;
}

.search-sheet-title {
  margin-bottom: 1rem;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
}

.search-sheet-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1rem;
}

.transaction-scroll {
  height: auto;
  min-height: 0;
}
</style>
