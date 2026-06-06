<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import { parseMoneyToMinorUnits } from '@/modules/shared/money';
import { todayIsoDate } from '@/modules/shared/date';

const router = useRouter();
const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();
const error = ref('');

const form = reactive({
  bookId: null as number | null,
  type: 'expense' as TransactionType,
  amount: '',
  accountId: null as number | null,
  targetAccountId: null as number | null,
  occurredAt: todayIsoDate(),
  note: '',
  tagIds: [] as number[]
});

const selectedAccount = computed(() =>
  accountStore.activeAccounts.find((account) => account.id === form.accountId)
);

const targetAccounts = computed(() =>
  accountStore.activeAccounts.filter(
    (account) =>
      account.id !== form.accountId &&
      account.currency === selectedAccount.value?.currency
  )
);

const typeOptions = [
  { title: '收入', value: 'income' },
  { title: '支出', value: 'expense' },
  { title: '转账', value: 'transfer' }
];

watch(
  () => form.accountId,
  () => {
    form.targetAccountId = null;
  }
);

watch(
  () => form.type,
  () => {
    if (form.type !== 'transfer') {
      form.targetAccountId = null;
    }
  }
);

async function submit() {
  error.value = '';

  if (!form.bookId || !form.accountId || !selectedAccount.value) {
    error.value = '请选择账本和账户。';
    return;
  }

  try {
    await transactionStore.create({
      bookId: form.bookId,
      type: form.type,
      amount: parseMoneyToMinorUnits(form.amount),
      currency: selectedAccount.value.currency,
      accountId: form.accountId,
      targetAccountId: form.type === 'transfer' ? form.targetAccountId : null,
      occurredAt: form.occurredAt,
      note: form.note || null,
      tagIds: form.tagIds
    });
    await router.push({ name: 'transactions' });
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存流水失败。';
  }
}

onMounted(async () => {
  await Promise.all([bookStore.load(), accountStore.load(), tagStore.load()]);
  form.bookId = bookStore.activeBooks[0]?.id ?? null;
  form.accountId = accountStore.activeAccounts[0]?.id ?? null;
});
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <div>
      <h1 class="text-h5">新增流水</h1>
      <div class="text-body-2 text-medium-emphasis">创建收入、支出或同币种转账</div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-form class="d-flex flex-column ga-2" max-width="680" @submit.prevent="submit">
      <v-select
        v-model="form.type"
        :items="typeOptions"
        label="类型"
        variant="outlined"
      />
      <v-select
        v-model="form.bookId"
        :items="bookStore.activeBooks"
        item-title="name"
        item-value="id"
        label="账本"
        variant="outlined"
      />
      <v-select
        v-model="form.accountId"
        :items="accountStore.activeAccounts"
        item-title="name"
        item-value="id"
        :label="form.type === 'transfer' ? '转出账户' : '账户'"
        variant="outlined"
      />
      <v-select
        v-if="form.type === 'transfer'"
        v-model="form.targetAccountId"
        :items="targetAccounts"
        item-title="name"
        item-value="id"
        label="转入账户"
        variant="outlined"
      />
      <v-text-field v-model="form.amount" label="金额" required variant="outlined" />
      <v-text-field
        v-model="form.occurredAt"
        label="发生日期"
        type="date"
        variant="outlined"
      />
      <v-select
        v-model="form.tagIds"
        :items="tagStore.tags"
        chips
        item-title="name"
        item-value="id"
        label="Tag"
        multiple
        variant="outlined"
      />
      <v-textarea v-model="form.note" label="备注" rows="3" variant="outlined" />
      <div class="d-flex ga-2">
        <v-btn color="primary" type="submit">保存</v-btn>
        <v-btn :to="{ name: 'transactions' }" variant="text">取消</v-btn>
      </div>
    </v-form>
  </div>
</template>
