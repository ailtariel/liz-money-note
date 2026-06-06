<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useRecurringStore } from '@/modules/recurring/recurring.store';
import type { RepeatType } from '@/modules/recurring/recurring.types';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import { parseMoneyToMinorUnits, formatMinorUnits } from '@/modules/shared/money';
import { todayIsoDate } from '@/modules/shared/date';

const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const recurringStore = useRecurringStore();
const error = ref('');
const editingId = ref<number | null>(null);

const form = reactive({
  bookId: null as number | null,
  type: 'expense' as TransactionType,
  amount: '',
  accountId: null as number | null,
  targetAccountId: null as number | null,
  repeatType: 'monthly' as RepeatType,
  repeatInterval: 1,
  startDate: todayIsoDate(),
  endDate: '',
  nextTriggerDate: todayIsoDate(),
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

const repeatOptions = [
  { title: '每天', value: 'daily' },
  { title: '每周', value: 'weekly' },
  { title: '每月', value: 'monthly' },
  { title: '每年', value: 'yearly' }
];

function resetForm() {
  editingId.value = null;
  form.bookId = bookStore.activeBooks[0]?.id ?? null;
  form.type = 'expense';
  form.amount = '';
  form.accountId = accountStore.activeAccounts[0]?.id ?? null;
  form.targetAccountId = null;
  form.repeatType = 'monthly';
  form.repeatInterval = 1;
  form.startDate = todayIsoDate();
  form.endDate = '';
  form.nextTriggerDate = todayIsoDate();
  form.note = '';
  form.tagIds = [];
}

function editEvent(eventId: number) {
  const event = recurringStore.events.find((item) => item.id === eventId);
  if (!event) {
    return;
  }

  editingId.value = event.id;
  form.bookId = event.bookId;
  form.type = event.type;
  form.amount = String(event.amount / 100);
  form.accountId = event.accountId;
  form.targetAccountId = event.targetAccountId;
  form.repeatType = event.repeatType;
  form.repeatInterval = event.repeatInterval;
  form.startDate = event.startDate;
  form.endDate = event.endDate ?? '';
  form.nextTriggerDate = event.nextTriggerDate;
  form.note = event.note ?? '';
  form.tagIds = [...event.tagIds];
}

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
    const input = {
      bookId: form.bookId,
      type: form.type,
      amount: parseMoneyToMinorUnits(form.amount),
      currency: selectedAccount.value.currency,
      accountId: form.accountId,
      targetAccountId: form.type === 'transfer' ? form.targetAccountId : null,
      repeatType: form.repeatType,
      repeatInterval: Number(form.repeatInterval),
      startDate: form.startDate,
      endDate: form.endDate || null,
      nextTriggerDate: form.nextTriggerDate,
      note: form.note || null,
      tagIds: form.tagIds
    };

    if (editingId.value) {
      await recurringStore.update(editingId.value, input);
    } else {
      await recurringStore.create(input);
    }

    resetForm();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存周期事件失败。';
  }
}

async function disable(eventId: number) {
  error.value = '';
  try {
    await recurringStore.disable(eventId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '停用周期事件失败。';
  }
}

function accountName(id: number | null) {
  if (!id) {
    return '-';
  }

  return accountStore.accounts.find((account) => account.id === id)?.name ?? '-';
}

onMounted(async () => {
  await Promise.all([
    bookStore.load(),
    accountStore.load(),
    tagStore.load(),
    recurringStore.load()
  ]);
  resetForm();
});
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <div>
      <h1 class="text-h5">周期事件</h1>
      <div class="text-body-2 text-medium-emphasis">配置提醒规则，批准后才生成流水</div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-form class="d-flex flex-column ga-2" max-width="720" @submit.prevent="submit">
      <div class="d-flex flex-wrap ga-3">
        <v-select
          v-model="form.type"
          :items="typeOptions"
          label="类型"
          max-width="160"
          variant="outlined"
        />
        <v-select
          v-model="form.bookId"
          :items="bookStore.activeBooks"
          item-title="name"
          item-value="id"
          label="账本"
          max-width="200"
          variant="outlined"
        />
        <v-select
          v-model="form.accountId"
          :items="accountStore.activeAccounts"
          item-title="name"
          item-value="id"
          :label="form.type === 'transfer' ? '转出账户' : '账户'"
          max-width="220"
          variant="outlined"
        />
        <v-select
          v-if="form.type === 'transfer'"
          v-model="form.targetAccountId"
          :items="targetAccounts"
          item-title="name"
          item-value="id"
          label="转入账户"
          max-width="220"
          variant="outlined"
        />
      </div>
      <div class="d-flex flex-wrap ga-3">
        <v-text-field v-model="form.amount" label="金额" max-width="160" variant="outlined" />
        <v-select
          v-model="form.repeatType"
          :items="repeatOptions"
          label="频率"
          max-width="160"
          variant="outlined"
        />
        <v-text-field
          v-model.number="form.repeatInterval"
          label="间隔"
          max-width="120"
          min="1"
          type="number"
          variant="outlined"
        />
      </div>
      <div class="d-flex flex-wrap ga-3">
        <v-text-field v-model="form.startDate" label="开始" max-width="170" type="date" variant="outlined" />
        <v-text-field v-model="form.endDate" label="结束" max-width="170" type="date" variant="outlined" />
        <v-text-field
          v-model="form.nextTriggerDate"
          label="下次触发"
          max-width="170"
          type="date"
          variant="outlined"
        />
      </div>
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
      <v-textarea v-model="form.note" label="备注" rows="2" variant="outlined" />
      <div class="d-flex ga-2">
        <v-btn color="primary" type="submit">
          {{ editingId ? '保存' : '新增' }}
        </v-btn>
        <v-btn v-if="editingId" variant="text" @click="resetForm">取消</v-btn>
      </div>
    </v-form>

    <v-table>
      <thead>
        <tr>
          <th>下次触发</th>
          <th>类型</th>
          <th>账户</th>
          <th>金额</th>
          <th>频率</th>
          <th>状态</th>
          <th class="text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="event in recurringStore.events" :key="event.id">
          <td>{{ event.nextTriggerDate }}</td>
          <td>{{ typeOptions.find((item) => item.value === event.type)?.title }}</td>
          <td>
            {{ accountName(event.accountId) }}
            <span v-if="event.targetAccountId">→ {{ accountName(event.targetAccountId) }}</span>
          </td>
          <td>{{ formatMinorUnits(event.amount, event.currency) }}</td>
          <td>
            {{ repeatOptions.find((item) => item.value === event.repeatType)?.title }}
            / {{ event.repeatInterval }}
          </td>
          <td>{{ event.isActive ? '启用' : '停用' }}</td>
          <td class="text-right">
            <v-btn size="small" variant="text" @click="editEvent(event.id)">编辑</v-btn>
            <v-btn
              :disabled="!event.isActive"
              size="small"
              variant="text"
              @click="disable(event.id)"
            >
              停用
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
