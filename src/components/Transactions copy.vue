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
import AmountText from '@/components/shared/AmountText.vue';
import MobilePage from '@/components/shared/MobilePage.vue';
import TransactionEditor from '@/components/TransactionEditor.vue';
import {
  formatShortDate,
  formatTime,
  transactionTypeOptions
} from '@/components/shared/financeDisplay';

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
const error = ref('');
const filterSheetOpen = ref(false);
const detailSheetOpen = ref(false);
const editorOpen = ref(false);
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

const selectedTags = computed(() =>
  selectedTransaction.value
    ? selectedTransaction.value.tagIds
        .map((id) => tagStore.tags.find((tag) => tag.id === id))
        .filter(Boolean)
    : []
);

function accountName(id: number | null) {
  if (!id) {
    return '-';
  }

  return (
    accountStore.accounts.find((account) => account.id === id)?.name ?? '-'
  );
}

function bookName(id: number) {
  return bookStore.books.find((book) => book.id === id)?.name ?? '-';
}

function primaryTag(transaction: Transaction) {
  return tagStore.tags.find((tag) => transaction.tagIds.includes(tag.id));
}

function transactionIcon(transaction: Transaction) {
  const tag = primaryTag(transaction)?.name.toLowerCase() ?? '';

  if (tag.includes('car') || tag.includes('车') || tag.includes('交通')) {
    return '$car';
  }

  if (tag.includes('shop') || tag.includes('购')) {
    return '$shopping';
  }

  if (transaction.type === 'income') {
    return '$salary';
  }

  return '$food';
}

function transactionColor(transaction: Transaction) {
  if (transaction.type === 'income') {
    return 'success';
  }

  if (transaction.type === 'transfer') {
    return 'secondary';
  }

  return 'error';
}

function transactionTitle(transaction: Transaction) {
  return (
    transaction.note ||
    primaryTag(transaction)?.name ||
    typeOptions.value.find((item) => item.value === transaction.type)?.title ||
    '-'
  );
}

function filterLabel(kind: 'book' | 'account' | 'type') {
  if (kind === 'book') {
    return filters.bookId ? bookName(filters.bookId) : t('common.allBooks');
  }

  if (kind === 'account') {
    return filters.accountId
      ? accountName(filters.accountId)
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

async function removeSelected() {
  if (!selectedTransaction.value) {
    return;
  }

  error.value = '';
  try {
    await transactionStore.remove(selectedTransaction.value.id);
    await accountStore.load();
    detailSheetOpen.value = false;
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : t('transaction.deleteFailed');
  }
}

async function handleEditorSaved() {
  editorOpen.value = false;
  await Promise.all([accountStore.load(), transactionStore.load()]);
}

onMounted(async () => {
  await Promise.all([
    bookStore.load(),
    accountStore.load(),
    tagStore.load(),
    transactionStore.load()
  ]);
});
</script>

<template>
  <MobilePage :title="t('nav.transactions')">
    <template #actions>
      <v-btn icon="$search" variant="text" />
      <v-btn icon="$filter" variant="text" @click="filterSheetOpen = true" />
    </template>

    <div class="d-flex flex-column ga-4">
      <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

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
          <div v-if="item.kind === 'date'" class="date-row">
            <div class="font-weight-bold">
              {{ formatShortDate(item.date, t) }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              <span v-if="item.income"
                >{{ t('transaction.income') }}
                {{ formatMinorUnits(item.income, item.currency) }}</span
              >
              <span v-if="item.expense" class="ml-2"
                >{{ t('transaction.expense') }}
                {{ formatMinorUnits(item.expense, item.currency) }}</span
              >
            </div>
          </div>

          <v-card
            v-else
            class="transaction-card soft-card"
            role="button"
            tabindex="0"
            @click="openDetail(item.transaction)"
            @keydown.enter="openDetail(item.transaction)"
          >
            <div class="d-flex align-center ga-3">
              <v-avatar
                :color="transactionColor(item.transaction)"
                size="52"
                variant="tonal"
              >
                <v-icon :icon="transactionIcon(item.transaction)" />
              </v-avatar>
              <div class="min-w-0 flex-grow-1">
                <div class="text-subtitle-1 font-weight-bold text-truncate">
                  {{ transactionTitle(item.transaction) }}
                </div>
                <div class="text-body-2 text-medium-emphasis text-truncate">
                  {{ accountName(item.transaction.accountId) }} ·
                  {{ bookName(item.transaction.bookId) }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ formatTime(item.transaction.occurredAt) }}
                </div>
              </div>
              <AmountText
                :amount="item.transaction.amount"
                :currency="item.transaction.currency"
                :signed="item.transaction.type !== 'transfer'"
                :type="
                  item.transaction.type === 'income'
                    ? 'income'
                    : item.transaction.type === 'expense'
                      ? 'expense'
                      : 'neutral'
                "
              />
            </div>
          </v-card>
        </template>
      </v-virtual-scroll>
    </div>

    <!-- <Teleport to="body"> -->
    <v-fab
      class="transaction-fab"
      color="primary"
      icon="$add"
      location="bottom end"
      @click="editorOpen = true"
    />
    <!-- </Teleport> -->

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
      <v-card v-if="selectedTransaction" class="pa-4">
        <div class="d-flex align-center mb-4">
          <div class="text-h6 font-weight-bold">
            {{ t('transaction.detail') }}
          </div>
          <v-spacer />
          <v-btn
            icon="$close"
            variant="text"
            @click="detailSheetOpen = false"
          />
        </div>
        <div class="text-center mb-4">
          <div class="text-caption text-medium-emphasis">
            {{ t('transaction.amount') }}
          </div>
          <div class="text-h4 font-weight-bold">
            <AmountText
              :amount="selectedTransaction.amount"
              :currency="selectedTransaction.currency"
              :signed="selectedTransaction.type !== 'transfer'"
              :type="
                selectedTransaction.type === 'income'
                  ? 'income'
                  : selectedTransaction.type === 'expense'
                    ? 'expense'
                    : 'neutral'
              "
            />
          </div>
        </div>
        <v-list class="bg-transparent">
          <v-list-item
            :title="t('transaction.category')"
            :subtitle="transactionTitle(selectedTransaction)"
          />
          <v-list-item
            :title="t('transaction.account')"
            :subtitle="accountName(selectedTransaction.accountId)"
          />
          <v-list-item
            :title="t('transaction.book')"
            :subtitle="bookName(selectedTransaction.bookId)"
          />
          <v-list-item
            :title="t('transaction.occurredAt')"
            :subtitle="selectedTransaction.occurredAt"
          />
          <v-list-item
            :title="t('common.note')"
            :subtitle="selectedTransaction.note || '-'"
          />
        </v-list>
        <div v-if="selectedTags.length" class="d-flex flex-wrap ga-2 mt-2">
          <v-chip
            v-for="tag in selectedTags"
            :key="tag!.id"
            :color="tag!.color || undefined"
            variant="tonal"
          >
            {{ tag!.name }}
          </v-chip>
        </div>
        <div class="d-flex ga-2 mt-5">
          <v-btn block variant="tonal">{{ t('common.edit') }}</v-btn>
          <v-btn block variant="tonal">{{ t('common.copy') }}</v-btn>
          <v-btn block color="error" variant="tonal" @click="removeSelected">
            {{ t('common.delete') }}
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>
  </MobilePage>
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

.transaction-fab {
  right: calc(max((100vw - 430px) / 2, 0px) + 22px) !important;
  bottom: calc(
    var(--app-bottom-nav-height) + env(safe-area-inset-bottom) + 22px
  ) !important;
  left: auto !important;
  z-index: 1005;
}
</style>
