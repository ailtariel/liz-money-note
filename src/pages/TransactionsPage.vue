<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { VDataTable, VDateInput } from 'vuetify/components';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import { formatMinorUnits } from '@/modules/shared/money';

type TableHeader = {
  title: string;
  key: string;
  align?: 'start' | 'end' | 'center';
  sortable?: boolean;
  nowrap?: boolean;
};

const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();
const error = ref('');

const filters = reactive({
  bookId: null as number | null,
  accountId: null as number | null,
  type: null as TransactionType | null,
  tagId: null as number | null,
  dateFrom: null as Date | null,
  dateTo: null as Date | null
});

const typeOptions = [
  { title: '收入', value: 'income' },
  { title: '支出', value: 'expense' },
  { title: '转账', value: 'transfer' }
];

const headers: TableHeader[] = [
  { title: '日期', key: 'occurredAt', sortable: false, nowrap: true },
  { title: '类型', key: 'type', sortable: false, nowrap: true },
  { title: '账本', key: 'bookId', sortable: false },
  { title: '账户', key: 'accountId', sortable: false },
  { title: '金额', key: 'amount', align: 'end', sortable: false, nowrap: true },
  { title: 'Tag', key: 'tagIds', sortable: false },
  { title: '操作', key: 'actions', align: 'end', sortable: false, nowrap: true }
];

const mobileHeaders: TableHeader[] = [
  { title: '日期', key: 'occurredAt', sortable: false, nowrap: true },
  { title: '类型', key: 'type', sortable: false, nowrap: true },
  { title: '账户', key: 'accountId', sortable: false },
  { title: '金额', key: 'amount', align: 'end', sortable: false, nowrap: true },
  { title: '操作', key: 'actions', align: 'end', sortable: false, nowrap: true }
];

const transactions = computed(() => transactionStore.transactions);

function toIsoDate(date: Date | null) {
  if (!date) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function accountName(id: number | null) {
  if (!id) {
    return '-';
  }

  return accountStore.accounts.find((account) => account.id === id)?.name ?? '-';
}

function bookName(id: number) {
  return bookStore.books.find((book) => book.id === id)?.name ?? '-';
}

function tagNames(ids: number[]) {
  return ids
    .map((id) => tagStore.tags.find((tag) => tag.id === id)?.name)
    .filter(Boolean)
    .join(', ');
}

async function applyFilters() {
  await transactionStore.load({
    bookId: filters.bookId,
    accountId: filters.accountId,
    type: filters.type,
    tagId: filters.tagId,
    dateFrom: toIsoDate(filters.dateFrom),
    dateTo: toIsoDate(filters.dateTo)
  });
}

async function remove(id: number) {
  error.value = '';
  try {
    await transactionStore.remove(id);
    await accountStore.load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '删除流水失败。';
  }
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
  <div class="d-flex flex-column ga-6">
    <div class="d-flex align-center">
      <div>
        <h1 class="text-h5">流水</h1>
        <div class="text-body-2 text-medium-emphasis">按时间倒序查看和筛选记录</div>
      </div>
      <v-spacer />
      <v-btn :to="{ name: 'transaction-new' }" color="primary">新增流水</v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-form class="d-flex flex-column flex-sm-row flex-sm-wrap ga-3 align-sm-start" @submit.prevent="applyFilters">
      <v-select
        v-model="filters.bookId"
        :items="bookStore.books"
        clearable
        item-title="name"
        item-value="id"
        label="账本"
        max-width="180"
        width="100%"
        density="comfortable"
        hide-details
        variant="outlined"
      />
      <v-select
        v-model="filters.accountId"
        :items="accountStore.accounts"
        clearable
        item-title="name"
        item-value="id"
        label="账户"
        max-width="180"
        width="100%"
        density="comfortable"
        hide-details
        variant="outlined"
      />
      <v-select
        v-model="filters.type"
        :items="typeOptions"
        clearable
        label="类型"
        max-width="150"
        width="100%"
        density="comfortable"
        hide-details
        variant="outlined"
      />
      <v-select
        v-model="filters.tagId"
        :items="tagStore.tags"
        clearable
        item-title="name"
        item-value="id"
        label="Tag"
        max-width="160"
        width="100%"
        density="comfortable"
        hide-details
        variant="outlined"
      />
      <v-date-input
        v-model="filters.dateFrom"
        label="开始"
        max-width="160"
        width="100%"
        clearable
        density="comfortable"
        hide-details
        ok-text="确定"
        cancel-text="取消"
        variant="outlined"
      />
      <v-date-input
        v-model="filters.dateTo"
        label="结束"
        max-width="160"
        width="100%"
        clearable
        density="comfortable"
        hide-details
        ok-text="确定"
        cancel-text="取消"
        variant="outlined"
      />
      <v-btn block class="flex-sm-grow-0" type="submit" variant="tonal">筛选</v-btn>
    </v-form>

    <v-data-table
      :headers="$vuetify.display.xs ? mobileHeaders : headers"
      :items="transactions"
      density="comfortable"
      hover
      item-value="id"
      mobile-breakpoint="sm"
      no-data-text="暂无流水"
    >
      <template #item.occurredAt="{ item }">
        {{ item.occurredAt.slice(0, 10) }}
      </template>
      <template #item.type="{ item }">
        {{ typeOptions.find((option) => option.value === item.type)?.title }}
      </template>
      <template #item.bookId="{ item }">
        {{ bookName(item.bookId) }}
      </template>
      <template #item.accountId="{ item }">
        {{ accountName(item.accountId) }}
        <span v-if="item.targetAccountId">
          → {{ accountName(item.targetAccountId) }}
        </span>
      </template>
      <template #item.amount="{ item }">
        {{ formatMinorUnits(item.amount, item.currency) }}
      </template>
      <template #item.tagIds="{ item }">
        {{ tagNames(item.tagIds) || '-' }}
      </template>
      <template #item.actions="{ item }">
        <v-btn size="small" variant="text" @click="remove(item.id)">删除</v-btn>
      </template>
    </v-data-table>
  </div>
</template>
