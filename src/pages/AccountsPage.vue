<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useAccountStore } from '@/modules/accounts/account.store';
import {
  accountTypeOptions,
  type AccountType
} from '@/modules/accounts/account.types';
import {
  currencies,
  formatMinorUnits,
  parseMoneyToMinorUnits,
  type CurrencyCode
} from '@/modules/shared/money';

const store = useAccountStore();
const error = ref('');
const editingId = ref<number | null>(null);
const form = reactive({
  name: '',
  type: 'cash' as AccountType,
  currency: 'CNY' as CurrencyCode,
  initialBalance: '0',
  isIncludedInAssets: true
});

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.type = 'cash';
  form.currency = 'CNY';
  form.initialBalance = '0';
  form.isIncludedInAssets = true;
}

function editAccount(accountId: number) {
  const account = store.accounts.find((item) => item.id === accountId);
  if (!account) {
    return;
  }

  editingId.value = account.id;
  form.name = account.name;
  form.type = account.type;
  form.currency = account.currency;
  form.initialBalance = String(account.initialBalance / 100);
  form.isIncludedInAssets = account.isIncludedInAssets;
}

async function submit() {
  error.value = '';
  try {
    const input = {
      name: form.name,
      type: form.type,
      currency: form.currency,
      initialBalance: parseMoneyToMinorUnits(form.initialBalance),
      isIncludedInAssets: form.isIncludedInAssets
    };

    if (editingId.value) {
      await store.update(editingId.value, input);
    } else {
      await store.create(input);
    }

    resetForm();
  } catch (err) {
    error.value = err instanceof Error ? err.message : '保存账户失败。';
  }
}

async function archive(accountId: number) {
  error.value = '';
  try {
    await store.archive(accountId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '归档账户失败。';
  }
}

onMounted(() => store.load());
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <div>
      <h1 class="text-h5">账户</h1>
      <div class="text-body-2 text-medium-emphasis">维护现金、银行卡和电子钱包余额</div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

    <v-form class="d-flex flex-wrap ga-3 align-start" @submit.prevent="submit">
      <v-text-field v-model="form.name" label="名称" max-width="220" required variant="outlined" />
      <v-select
        v-model="form.type"
        :items="accountTypeOptions"
        label="类型"
        max-width="180"
        variant="outlined"
      />
      <v-select
        v-model="form.currency"
        :items="currencies"
        label="币种"
        max-width="140"
        variant="outlined"
      />
      <v-text-field
        v-model="form.initialBalance"
        label="初始余额"
        max-width="160"
        variant="outlined"
      />
      <v-checkbox v-model="form.isIncludedInAssets" label="计入资产" />
      <v-btn color="primary" type="submit">
        {{ editingId ? '保存' : '新增' }}
      </v-btn>
      <v-btn v-if="editingId" variant="text" @click="resetForm">取消</v-btn>
    </v-form>

    <v-table>
      <thead>
        <tr>
          <th>名称</th>
          <th>类型</th>
          <th>币种</th>
          <th>当前余额</th>
          <th>状态</th>
          <th class="text-right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="account in store.accounts" :key="account.id">
          <td>{{ account.name }}</td>
          <td>{{ accountTypeOptions.find((item) => item.value === account.type)?.title }}</td>
          <td>{{ account.currency }}</td>
          <td>{{ formatMinorUnits(account.currentBalance, account.currency) }}</td>
          <td>{{ account.isArchived ? '已归档' : '启用' }}</td>
          <td class="text-right">
            <v-btn size="small" variant="text" @click="editAccount(account.id)">编辑</v-btn>
            <v-btn
              :disabled="account.isArchived"
              size="small"
              variant="text"
              @click="archive(account.id)"
            >
              归档
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
