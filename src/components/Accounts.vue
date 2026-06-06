<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useAccountStore } from '@/modules/accounts/account.store';
import type { AccountType } from '@/modules/accounts/account.types';
import { currencies, formatMinorUnits, parseMoneyToMinorUnits, type CurrencyCode } from '@/modules/shared/money';
import { accountTypeIcon, accountTypeLabel } from '@/components/shared/financeDisplay';

const { t } = useI18n();
const store = useAccountStore();
const error = ref('');
const editingId = ref<number | null>(null);
const accountTypes: AccountType[] = ['cash', 'bank_card', 'credit_card', 'alipay', 'wechat', 'other'];
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
    error.value = err instanceof Error ? err.message : t('account.saveFailed');
  }
}

async function archive(accountId: number) {
  error.value = '';
  try {
    await store.archive(accountId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('account.archiveFailed');
  }
}

onMounted(() => store.load());
</script>

<template>
  <div class="d-flex flex-column ga-4">
    <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

      <v-card class="soft-card pa-4">
        <v-form class="d-flex flex-column ga-3" @submit.prevent="submit">
          <v-text-field v-model="form.name" :label="t('common.name')" required />
          <v-slide-group v-model="form.type">
            <v-slide-group-item v-for="type in accountTypes" :key="type" v-slot="{ isSelected, toggle }" :value="type">
              <v-chip class="mr-2" :prepend-icon="accountTypeIcon(type)" :variant="isSelected ? 'flat' : 'tonal'" @click="toggle">
                {{ accountTypeLabel(type, t) }}
              </v-chip>
            </v-slide-group-item>
          </v-slide-group>
          <v-select v-model="form.currency" :items="currencies" :label="t('data.currency')" />
          <v-text-field v-model="form.initialBalance" :label="t('account.initialBalance')" />
          <v-switch v-model="form.isIncludedInAssets" color="primary" :label="t('account.includeInAssets')" />
          <div class="d-flex ga-2">
            <v-btn color="primary" type="submit">
              {{ editingId ? t('common.save') : t('common.add') }}
            </v-btn>
            <v-btn v-if="editingId" variant="text" @click="resetForm">
              {{ t('common.cancel') }}
            </v-btn>
          </div>
        </v-form>
      </v-card>

      <v-card v-for="account in store.accounts" :key="account.id" class="soft-card pa-4">
        <div class="d-flex align-center ga-3">
          <v-avatar color="primary" variant="tonal">
            <v-icon :icon="accountTypeIcon(account.type)" />
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-subtitle-1 font-weight-bold">{{ account.name }}</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ accountTypeLabel(account.type, t) }} · {{ account.currency }}
            </div>
            <div class="font-weight-bold mt-1">{{ formatMinorUnits(account.currentBalance, account.currency) }}</div>
          </div>
          <div class="d-flex flex-column ga-1">
            <v-btn size="small" variant="text" @click="editAccount(account.id)">{{ t('common.edit') }}</v-btn>
            <v-btn :disabled="account.isArchived" size="small" variant="text" @click="archive(account.id)">
              {{ t('common.archive') }}
            </v-btn>
          </div>
        </div>
      </v-card>
  </div>
</template>
