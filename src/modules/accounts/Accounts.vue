<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from '@/i18n';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import AppBarVue from '@/components/shared/app-bar.vue';
import CurrencyAutocomplete from '@/components/shared/CurrencyAutocomplete.vue';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useCurrencyStore } from '@/modules/currency/currency.store';
import type {
  AccountDeleteBlockReason,
  AccountType
} from '@/modules/accounts/account.types';
import { useSnackQueueStore } from '@/modules/snack-queue/snack-queue.store';
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
const currencyStore = useCurrencyStore();
const snackQueueStore = useSnackQueueStore();
const error = ref('');
const editingId = ref<number | null>(null);
const editorOpen = ref(false);
const deleteConfirmOpen = ref(false);
const pendingDeleteAccountId = ref<number | null>(null);
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
const pendingDeleteAccount = computed(() =>
  store.accounts.find((account) => account.id === pendingDeleteAccountId.value)
);

function resetForm() {
  editingId.value = null;
  form.name = '';
  form.type = 'cash';
  form.currency = currencyStore.currency;
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

function requestDelete(accountId: number) {
  if (store.deletingAccountId !== null) {
    return;
  }

  pendingDeleteAccountId.value = accountId;
  deleteConfirmOpen.value = true;
}

function deleteBlockMessage(reason: AccountDeleteBlockReason) {
  const keyByReason = {
    transaction_history: 'account.deleteBlockedTransactions',
    recurring_event: 'account.deleteBlockedRecurring',
    book_replacement_required: 'account.deleteBlockedBookReplacement'
  } as const;
  return t(keyByReason[reason]);
}

async function confirmDelete() {
  if (!pendingDeleteAccountId.value || store.deletingAccountId !== null) {
    return;
  }

  try {
    const result = await store.remove(pendingDeleteAccountId.value);
    if (!result) {
      return;
    }

    if (!result.deleted) {
      snackQueueStore.error(deleteBlockMessage(result.reason));
      return;
    }

    pendingDeleteAccountId.value = null;
    snackQueueStore.success(t('account.deleted'));
  } catch (err) {
    snackQueueStore.error(
      err instanceof Error ? err.message : t('account.deleteFailed')
    );
  }
}

async function restore(accountId: number) {
  try {
    await store.restore(accountId);
    snackQueueStore.success(t('account.restored'));
  } catch (err) {
    snackQueueStore.error(
      err instanceof Error ? err.message : t('account.restoreFailed')
    );
  }
}

onMounted(async () => {
  await Promise.all([store.load(), currencyStore.load()]);
});
</script>

<template>
  <ConfirmationDialog
    v-model="deleteConfirmOpen"
    :title="t('account.deleteConfirmTitle')"
    :message="t('account.deleteConfirmMessage', { name: pendingDeleteAccount?.name ?? '' })"
    :confirm-text="t('common.delete')"
    :cancel-text="t('common.cancel')"
    confirm-color="error"
    @cancel="pendingDeleteAccountId = null"
    @confirm="confirmDelete"
  />

  <AppBarVue>
    <template #actions>
      <v-btn
        :aria-label="t('account.addAction')"
        color="primary"
        icon="$add"
        size="small"
        variant="flat"
        @click="startCreate"
      />
    </template>
  </AppBarVue>

  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-progress-linear
          v-if="store.loading && !store.accounts.length"
          color="primary"
          indeterminate
          rounded
        />

        <v-empty-state
          v-else-if="!store.accounts.length"
          icon="$account"
          :title="t('account.empty')"
        />

        <v-card
          v-for="account in store.accounts"
          :key="account.id"
          class="soft-card"
        >
          <v-card-item>
            <template #prepend>
              <v-avatar color="primary" size="40" variant="tonal">
                <v-icon :icon="accountTypeIcon(account.type)" size="22" />
              </v-avatar>
            </template>

            <v-card-title class="text-body-large font-weight-bold">
              {{ account.name }}
            </v-card-title>
            <v-card-subtitle>
              {{ accountTypeLabel(account.type, t) }} &middot; {{ account.currency }}
            </v-card-subtitle>

            <template v-if="account.isArchived" #append>
              <v-chip color="secondary" size="small" variant="tonal">
                {{ t('account.legacyArchived') }}
              </v-chip>
            </template>
          </v-card-item>

          <v-card-text class="pt-2">
            <div class="text-label-medium text-medium-emphasis">
              {{ t('account.balance') }}
            </div>
            <div class="mt-1 text-title-large font-weight-bold">
              {{ formatMinorUnits(account.currentBalance, account.currency) }}
            </div>
            <v-chip
              class="mt-3"
              :color="account.isIncludedInAssets ? 'primary' : 'secondary'"
              size="small"
              variant="tonal"
            >
              {{ account.isIncludedInAssets ? t('assets.included') : t('assets.excluded') }}
            </v-chip>
          </v-card-text>

          <v-divider />
          <v-card-actions class="px-4 py-2">
            <v-btn
              :disabled="account.isArchived || store.deletingAccountId !== null"
              size="small"
              variant="text"
              @click="editAccount(account.id)"
            >
              {{ t('common.edit') }}
            </v-btn>
            <v-btn
              v-if="account.isArchived"
              :disabled="store.deletingAccountId !== null"
              size="small"
              variant="text"
              @click="restore(account.id)"
            >
              {{ t('common.restore') }}
            </v-btn>
            <v-spacer />
            <v-btn
              color="error"
              :disabled="store.deletingAccountId !== null"
              :loading="store.deletingAccountId === account.id"
              size="small"
              variant="text"
              @click="requestDelete(account.id)"
            >
              {{ t('common.delete') }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <v-bottom-sheet v-model="editorOpen">
        <v-card color="surface" rounded="t-xl">
          <v-card-title class="px-4 pt-4 text-title-large font-weight-bold">
            {{ editingId ? t('account.editTitle') : t('account.addTitle') }}
          </v-card-title>
          <v-card-text class="px-4">
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
              <CurrencyAutocomplete
                v-model="form.currency"
                :currencies="currencyStore.currencies"
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
              <v-card-actions class="px-0 pb-0">
              <v-btn color="primary" type="submit">
                {{ editingId ? t('common.save') : t('common.add') }}
              </v-btn>
              <v-btn variant="text" @click="editorOpen = false">
                {{ t('common.cancel') }}
              </v-btn>
              </v-card-actions>
            </v-form>
          </v-card-text>
        </v-card>
      </v-bottom-sheet>
    </v-container>
  </v-main>
</template>
