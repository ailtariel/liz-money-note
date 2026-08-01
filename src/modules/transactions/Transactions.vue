<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type {
  Transaction,
  TransactionType
} from '@/modules/transactions/transaction.types';
import type { CurrencyCode } from '@/modules/shared/money';
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

type DateFilterMode = 'all' | 'month' | 'year' | 'custom';

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
const editorTransaction = ref<Transaction | null>(null);
const editorInitialBookId = ref<number | null>(null);

const filters = reactive({
  bookId: null as number | null,
  accountId: null as number | null,
  type: null as TransactionType | null,
  tagIds: [] as number[],
  dateFrom: null as string | null,
  dateTo: null as string | null,
  dateMode: 'all' as DateFilterMode,
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
    title: `${account.name}（${account.currency}）`,
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

function formatSummaryAmount(amount: number, currency: CurrencyCode) {
  return `${currency} ${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount / 100)}`;
}

const summaryBookTitle = computed(() =>
  filters.bookId ? trans.getBookName(filters.bookId) : t('common.allBooks')
);
const selectedTags = computed(() => trans.getTags(filters.tagIds));
const activeSearch = computed(() => filters.search?.trim() ?? '');

const listRows = computed<TransactionListRow[]>(() => {
  const rows: TransactionListRow[] = [];
  const grouped = new Map<
    string,
    {
      transactions: Transaction[];
      income: number;
      expense: number;
      currency: CurrencyCode;
    }
  >();

  for (const transaction of transactions.value) {
    const date = transaction.occurredAt.slice(0, 10);
    let group = grouped.get(date);

    if (!group) {
      group = {
        transactions: [],
        income: 0,
        expense: 0,
        currency: transaction.currency
      };
      grouped.set(date, group);
    }

    group.transactions.push(transaction);
    if (transaction.type === 'income') {
      group.income += transaction.amount;
    } else if (transaction.type === 'expense') {
      group.expense += transaction.amount;
    }
  }

  for (const [date, group] of grouped) {
    rows.push({
      kind: 'date',
      key: `date-${date}`,
      date,
      income: group.income,
      expense: group.expense,
      currency: group.currency
    });

    rows.push(
      ...group.transactions.map((transaction) => ({
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
    if (!filters.dateFrom && !filters.dateTo) {
      return t('common.allPeriods');
    }

    if (filters.dateMode === 'month') {
      return t('common.thisMonth');
    }

    if (filters.dateMode === 'year') {
      return t('common.thisYear');
    }

    if (filters.dateFrom && filters.dateTo) {
      return `${filters.dateFrom} - ${filters.dateTo}`;
    }
    return t('common.allPeriods');
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
  if (filters.bookId) {
    await bookStore.rememberLastOpened(filters.bookId);
  }
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

function openCreateEditor() {
  editorTransaction.value = null;
  editorInitialBookId.value = filters.bookId;
  editorOpen.value = true;
}

function openEditEditor(transaction: Transaction) {
  detailSheetOpen.value = false;
  editorTransaction.value = transaction;
  editorOpen.value = true;
}

function closeEditor() {
  editorOpen.value = false;
  editorTransaction.value = null;
  editorInitialBookId.value = null;
}

onMounted(async () => {
  await Promise.all([
    bookStore.load(),
    bookStore.loadPreferences(),
    accountStore.load(),
    tagStore.load()
  ]);
  filters.bookId = bookStore.activeDefaultBookId;
  await loadWithFilters();
});

const summaryItems = computed(() => {
  const totals = new Map<
    CurrencyCode,
    Record<'income' | 'expense', number>
  >();

  for (const transaction of transactions.value) {
    const currencyTotals = totals.get(transaction.currency) ?? {
      income: 0,
      expense: 0
    };

    if (transaction.type === 'income' || transaction.type === 'expense') {
      currencyTotals[transaction.type] += transaction.amount;
    }
    totals.set(transaction.currency, currencyTotals);
  }

  if (!totals.size) {
    totals.set(baseCurrency.value, { income: 0, expense: 0 });
  }

  const statistics = (type: 'income' | 'expense') =>
    [...totals].map(([currency, values]) => ({
      currency,
      amount: values[type]
    }));

  return [
    {
      key: 'income',
      name: 'transaction.income',
      statistics: statistics('income')
    },
    {
      key: 'expense',
      name: 'transaction.expense',
      statistics: statistics('expense')
    }
  ];
});

/*------------------------
    editor
------------------------*/
const editorOpen = ref(false);
function handleEditorSaved() {
  closeEditor();
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
        @click="openCreateEditor"
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
      :initial-book-id="editorInitialBookId"
      :transaction="editorTransaction"
      @close="closeEditor"
      @saved="handleEditorSaved"
    />
  </v-dialog>
  <v-main>
    <v-container class="d-flex flex-column ga-4 pa-4">
      <v-card class="" color="transparent">
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
          <span class="text-body-medium">
            {{ summaryBookTitle }}
          </span>
          <template #append>
            <v-icon class="text-medium-emphasis" icon="$dropdown" size="18" />
          </template>
        </v-btn>
      </v-card>
      <v-card class="summary-amount-card pa-5" color="summary">
        <template v-for="(item, idx) in summaryItems">
          <v-row no-gutters class="">
            <v-col cols="2" class="text-body-medium">
              <span class="d-sm-inline-block">{{ t(item.name) }}</span>
            </v-col>
            <v-col class="">
              <span
                v-for="s in item.statistics"
                :key="`${item.key}-${s.currency}`"
                class="d-block text-title-small font-weight-bold statistics-amount"
              >
                {{ formatSummaryAmount(s.amount, s.currency) }}
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
          prepend-icon="$filter"
          variant="flat"
          @click="typeFilterOpen = true"
        >
          {{ filterLabel('type') }}
        </v-chip>
        <v-chip
          class="flex-shrink-0 border"
          color="surface"
          prepend-icon="$tag"
          variant="flat"
          @click="tagFilterOpen = true"
        >
          {{ filterLabel('tag') }}
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

      <div
        v-if="selectedTags.length"
        class="d-flex flex-wrap ga-2 align-center pb-1"
      >
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

      <v-progress-linear
        v-if="transactionStore.loading"
        :aria-label="t('common.loading')"
        color="primary"
        indeterminate
        rounded
      />

      <v-card
        v-if="!transactionStore.loading && !listRows.length"
        class="soft-card pa-6 text-center"
      >
        <div class="text-body-large font-weight-medium">
          {{ t('transaction.noRecords') }}
        </div>
      </v-card>

      <v-virtual-scroll
        v-if="listRows.length"
        v-memo="[listRows, transactionStore.loading]"
        :aria-busy="transactionStore.loading"
        :items="listRows"
        item-height="98"
        item-key="key"
        height="520"
      >
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
          :all-label="t('common.unlimited')"
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
        <v-card class="pa-4" color="surface">
          <div class="mb-4 text-title-large font-weight-bold">
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
          <div class="d-flex justify-end ga-3 pt-4">
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
          @edit="openEditEditor"
        />
      </v-bottom-sheet>
    </v-container>
  </v-main>
</template>

<style scoped>
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

.search-keyword-chip {
  max-width: 8rem;
}

.search-keyword-chip :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
