<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import { formatMinorUnits } from '@/modules/shared/money';

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
  dateFrom: '',
  dateTo: ''
});

const typeOptions = [
  { title: '收入', value: 'income' },
  { title: '支出', value: 'expense' },
  { title: '转账', value: 'transfer' }
];

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
    dateFrom: filters.dateFrom || null,
    dateTo: filters.dateTo || null
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

    <div class="d-flex flex-wrap ga-3 align-start">
      <v-select
        v-model="filters.bookId"
        :items="bookStore.books"
        clearable
        item-title="name"
        item-value="id"
        label="账本"
        max-width="180"
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
        variant="outlined"
      />
      <v-select
        v-model="filters.type"
        :items="typeOptions"
        clearable
        label="类型"
        max-width="150"
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
        variant="outlined"
      />
      <v-text-field
        v-model="filters.dateFrom"
        label="开始"
        max-width="160"
        type="date"
        variant="outlined"
      />
      <v-text-field
        v-model="filters.dateTo"
        label="结束"
        max-width="160"
        type="date"
        variant="outlined"
      />
      <v-btn variant="tonal" @click="applyFilters">筛选</v-btn>
    </div>

    <v-table>
      <thead>
        <tr>
          <th>日期</th>
          <th>类型</th>
          <th>账本</th>
          <th>账户</th>
          <th>金额</th>
          <th>Tag</th>
          <th class="text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="transaction in transactionStore.transactions" :key="transaction.id">
          <td>{{ transaction.occurredAt.slice(0, 10) }}</td>
          <td>{{ typeOptions.find((item) => item.value === transaction.type)?.title }}</td>
          <td>{{ bookName(transaction.bookId) }}</td>
          <td>
            {{ accountName(transaction.accountId) }}
            <span v-if="transaction.targetAccountId">
              → {{ accountName(transaction.targetAccountId) }}
            </span>
          </td>
          <td>{{ formatMinorUnits(transaction.amount, transaction.currency) }}</td>
          <td>{{ tagNames(transaction.tagIds) || '-' }}</td>
          <td class="text-right">
            <v-btn size="small" variant="text" @click="remove(transaction.id)">删除</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
