<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useDefaultCurrencyStore } from '@/modules/settings/default-currency.store';
import type { AccountType } from '@/modules/accounts/account.types';
import {
  formatMinorUnits,
  parseMoneyToMinorUnits,
  type CurrencyCode
} from '@/modules/shared/money';
import {
  accountTypeIcon,
  accountTypeLabel
} from '@/components/shared/financeDisplay';

const { t } = useI18n();
const store = useAccountStore();
const defaultCurrencyStore = useDefaultCurrencyStore();
const error = ref('');
const editingId = ref<number | null>(null);
const editorOpen = ref(false);
const accountTypes: AccountType[] = [
  'cash',
  'bank_card',
  'credit_card',
  'alipay',
  'wechat',
  'other'
];
const form = reactive({
  name: '',
  type: 'cash' as AccountType,
  currency: 'AED' as CurrencyCode,
  initialBalance: '0',
  isIncludedInAssets: true
});

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.type = 'cash';
  form.currency = defaultCurrencyStore.currency;
  form.initialBalance = '0';
  form.isIncludedInAssets = true;
}

function startCreate() {
  resetForm();
  editorOpen.value = true;
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
  editorOpen.value = true;
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
    editorOpen.value = false;
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

onMounted(async () => {
  await Promise.all([store.load(), defaultCurrencyStore.load()]);
});
</script>

<template>
  <AppBarVue>
    <template #actions>
      <v-btn
        color="primary"
        icon="$add"
        size="small"
        variant="flat"
        @click="startCreate"
      />
    </template>
  </AppBarVue>

  <v-main>
    <v-container>
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card
          v-for="account in store.accounts"
          :key="account.id"
          class="account-card soft-card"
        >
          <div class="d-flex align-center ga-3">
            <v-avatar color="primary" size="36" variant="tonal">
              <v-icon :icon="accountTypeIcon(account.type)" size="20" />
            </v-avatar>
            <div class="flex-grow-1 min-w-0" @click="editAccount(account.id)">
              <div class="account-title text-truncate">{{ account.name }}</div>
              <div class="account-subtitle text-medium-emphasis text-truncate">
                {{ accountTypeLabel(account.type, t) }} &middot; {{ account.currency }}
              </div>
              <div class="account-amount mt-1">
                {{ formatMinorUnits(account.currentBalance, account.currency) }}
              </div>
            </div>
            <div class="d-flex flex-column ga-1">
              <v-btn class="account-action" size="small" variant="text" @click="editAccount(account.id)">
                {{ t('common.edit') }}
              </v-btn>
              <v-btn
                class="account-action"
                :disabled="account.isArchived"
                size="small"
                variant="text"
                @click="archive(account.id)"
              >
                {{ t('common.archive') }}
              </v-btn>
            </div>
          </div>
        </v-card>
      </div>

      <v-bottom-sheet v-model="editorOpen">
        <v-card class="pa-4">
          <div class="text-h6 font-weight-bold mb-4">
            {{ editingId ? t('common.edit') : t('common.add') }}
          </div>
          <v-form class="d-flex flex-column ga-3" @submit.prevent="submit">
            <v-text-field v-model="form.name" :label="t('common.name')" required />
            <v-slide-group v-model="form.type">
              <v-slide-group-item
                v-for="type in accountTypes"
                :key="type"
                v-slot="{ isSelected, toggle }"
                :value="type"
              >
                <v-chip
                  class="mr-2"
                  :prepend-icon="accountTypeIcon(type)"
                  :variant="isSelected ? 'flat' : 'tonal'"
                  @click="toggle"
                >
                  {{ accountTypeLabel(type, t) }}
                </v-chip>
              </v-slide-group-item>
            </v-slide-group>
            <v-select
              v-model="form.currency"
              :items="defaultCurrencyStore.currencies"
              :label="t('data.currency')"
            />
            <v-text-field
              v-model="form.initialBalance"
              :label="t('account.initialBalance')"
            />
            <v-switch
              v-model="form.isIncludedInAssets"
              color="primary"
              :label="t('account.includeInAssets')"
            />
            <div class="d-flex ga-2">
              <v-btn color="primary" type="submit">
                {{ editingId ? t('common.save') : t('common.add') }}
              </v-btn>
              <v-btn variant="text" @click="editorOpen = false">
                {{ t('common.cancel') }}
              </v-btn>
            </div>
          </v-form>
        </v-card>
      </v-bottom-sheet>
    </v-container>
  </v-main>
</template>

<style scoped>
.account-card {
  padding: 1rem;
}

.account-title {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.45;
}

.account-subtitle {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.45;
}

.account-amount {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
}

.account-action {
  font-size: 0.75rem;
}
</style>
