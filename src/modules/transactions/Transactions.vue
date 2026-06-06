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
import { formatMinorUnits } from '@/modules/shared/money';
import TransactionEditor from '@/modules/transactions/TransactionEditor.vue';
import { transactionTypeOptions } from '@/components/shared/financeDisplay';
import AppBarVue from '@/components/shared/app-bar.vue';
import TransactionItemVue from './components/TransactionItem.vue';
import TransactionDetailVue from './components/TransactionDetail.vue';
import useTransaction from './useTransactionDisplay';

type TransactionListRow =
  | {
      kind: 'date';
      key: string;
      date: string;
      income: number;
      expense: number;
      currency: Transaction['currency'];
    }
  | { kind: 'item'; key: string; transaction: Transaction };

const { t } = useI18n();
const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();
const trans = useTransaction();
const filterSheetOpen = ref(false);
const detailSheetOpen = ref(false);

const selectedTransaction = ref<Transaction | null>(null);

const filters = reactive({
  bookId: null as number | null,
  accountId: null as number | null,
  type: null as TransactionType | null
});

const typeOptions = computed(() => transactionTypeOptions(t));
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

const monthlyBalance = computed(
  () => monthlyIncome.value - monthlyExpense.value
);

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

function filterLabel(kind: 'book' | 'account' | 'type') {
  if (kind === 'book') {
    return filters.bookId
      ? trans.getBookName(filters.bookId)
      : t('common.allBooks');
  }

  if (kind === 'account') {
    return filters.accountId
      ? trans.getAccountName(filters.accountId)
      : t('common.allAccounts');
  }

  return filters.type
    ? (typeOptions.value.find((item) => item.value === filters.type)?.title ??
        t('common.allTypes'))
    : t('common.allTypes');
}

async function applyFilters() {
  await transactionStore.load({
    bookId: filters.bookId,
    accountId: filters.accountId,
    type: filters.type
  });
  filterSheetOpen.value = false;
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
        @click="editorOpen = true"
      />
      <v-btn icon="$search" variant="text" />
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
  <v-container>
    <div class="d-flex flex-column ga-4">
      <v-card class="overview-card pa-5 text-white">
        <v-row gap="0">
          <v-col cols="4">
            <div class="text-body-2 opacity-80">
              {{ t('transaction.income') }}
            </div>
            <div class="text-subtitle-1 font-weight-bold mt-1">
              {{ formatMinorUnits(monthlyIncome, baseCurrency) }}
            </div>
            <div class="text-caption opacity-80">
              {{ t('common.thisMonth') }}
            </div>
          </v-col>
          <v-col class="overview-divider" cols="4">
            <div class="text-body-2 opacity-80">
              {{ t('transaction.expense') }}
            </div>
            <div class="text-subtitle-1 font-weight-bold mt-1">
              {{ formatMinorUnits(monthlyExpense, baseCurrency) }}
            </div>
            <div class="text-caption opacity-80">
              {{ t('common.thisMonth') }}
            </div>
          </v-col>
          <v-col class="overview-divider" cols="4">
            <div class="text-body-2 opacity-80">
              {{ t('transaction.balance') }}
            </div>
            <div class="text-subtitle-1 font-weight-bold mt-1">
              {{ formatMinorUnits(monthlyBalance, baseCurrency) }}
            </div>
            <div class="text-caption opacity-80">
              {{ t('common.thisMonth') }}
            </div>
          </v-col>
        </v-row>
      </v-card>

      <v-chip-group class="filter-chips">
        <v-chip prepend-icon="$book" @click="filterSheetOpen = true">
          {{ filterLabel('book') }}
        </v-chip>
        <v-chip prepend-icon="$account" @click="filterSheetOpen = true">
          {{ filterLabel('account') }}
        </v-chip>
        <v-chip prepend-icon="$filter" @click="filterSheetOpen = true">
          {{ filterLabel('type') }}
        </v-chip>
        <v-chip prepend-icon="$calendar">
          {{ t('common.thisMonth') }}
        </v-chip>
      </v-chip-group>

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

      <v-bottom-sheet v-model="filterSheetOpen">
        <v-card class="pa-4">
          <div class="text-h6 font-weight-bold mb-4">
            {{ t('transaction.filters.title') }}
          </div>
          <v-select
            v-model="filters.bookId"
            :items="bookStore.books"
            clearable
            item-title="name"
            item-value="id"
            :label="t('transaction.filters.book')"
          />
          <v-select
            v-model="filters.accountId"
            :items="accountStore.accounts"
            clearable
            item-title="name"
            item-value="id"
            :label="t('transaction.filters.account')"
          />
          <v-select
            v-model="filters.type"
            :items="typeOptions"
            clearable
            :label="t('transaction.filters.type')"
          />
          <v-btn block color="primary" @click="applyFilters">
            {{ t('common.confirm') }}
          </v-btn>
        </v-card>
      </v-bottom-sheet>

      <v-bottom-sheet v-model="detailSheetOpen">
        <TransactionDetailVue
          :transaction="selectedTransaction"
          @close="detailSheetOpen = false"
        />
      </v-bottom-sheet>
    </div>
  </v-container>
</template>

<style scoped>
.overview-card {
  background: linear-gradient(135deg, #34d399 0%, #059669 45%, #047857 100%);
}

.overview-divider {
  border-left: 1px solid rgba(255, 255, 255, 0.28);
}

.filter-chips {
  overflow-x: auto;
}

.transaction-scroll {
  height: auto;
  min-height: 0;
}

.date-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 8px;
}

.transaction-card {
  padding: 16px;
  margin-bottom: 10px;
}
</style>
