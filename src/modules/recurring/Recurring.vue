<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useRecurringStore } from '@/modules/recurring/recurring.store';
import type { RepeatType } from '@/modules/recurring/recurring.types';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import {
  formatMinorUnits,
  parseMoneyToMinorUnits
} from '@/modules/shared/money';
import { todayIsoDate } from '@/modules/shared/date';
import {
  repeatTypeOptions,
  transactionTypeOptions
} from '@/components/shared/financeDisplay';

const { t } = useI18n();
const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const recurringStore = useRecurringStore();
const error = ref('');
const editingId = ref<number | null>(null);
const editorOpen = ref(false);

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
const typeOptions = computed(() => transactionTypeOptions(t));
const repeatOptions = computed(() => repeatTypeOptions(t));

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

function startCreate() {
  resetForm();
  editorOpen.value = true;
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
  editorOpen.value = true;
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

function accountName(id: number | null) {
  if (!id) {
    return '-';
  }

  return accountStore.accounts.find((account) => account.id === id)?.name ?? '-';
}

async function submit() {
  error.value = '';

  if (!form.bookId || !form.accountId || !selectedAccount.value) {
    error.value = t('transaction.needBookAccount');
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
    editorOpen.value = false;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('recurring.saveFailed');
  }
}

async function disable(eventId: number) {
  error.value = '';
  try {
    await recurringStore.disable(eventId);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('recurring.disableFailed');
  }
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
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <div class="text-body-medium text-medium-emphasis">
          {{ t('recurring.subtitle') }}
        </div>
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card
          v-for="event in recurringStore.events"
          :key="event.id"
          class="soft-card pa-4"
        >
          <div class="d-flex align-center ga-3">
            <v-avatar :color="event.isActive ? 'primary' : 'secondary'" variant="tonal">
              <v-icon icon="$recurring" />
            </v-avatar>
            <div class="flex-grow-1 min-w-0" @click="editEvent(event.id)">
              <div class="text-body-medium font-weight-bold text-truncate">
                {{ formatMinorUnits(event.amount, event.currency) }}
              </div>
              <div class="mt-1 text-label-medium text-medium-emphasis text-truncate">
                {{ accountName(event.accountId) }} &middot; {{ event.nextTriggerDate }}
              </div>
              <v-chip class="mt-2" size="small" variant="tonal">
                {{ repeatOptions.find((item) => item.value === event.repeatType)?.title }}
                / {{ event.repeatInterval }}
              </v-chip>
            </div>
            <div class="d-flex flex-column ga-1">
              <v-btn size="small" variant="text" @click="editEvent(event.id)">
                {{ t('common.edit') }}
              </v-btn>
              <v-btn
                :disabled="!event.isActive"
                size="small"
                variant="text"
                @click="disable(event.id)"
              >
                {{ t('common.disable') }}
              </v-btn>
            </div>
          </div>
        </v-card>
      </div>

      <v-bottom-sheet v-model="editorOpen">
        <v-card class="pa-4" color="surface">
          <div class="text-title-large font-weight-bold mb-4">
            {{ editingId ? t('common.edit') : t('common.add') }}
          </div>
          <v-form class="d-flex flex-column ga-3" @submit.prevent="submit">
            <v-tabs v-model="form.type" grow>
              <v-tab v-for="item in typeOptions" :key="item.value" :value="item.value">
                {{ item.title }}
              </v-tab>
            </v-tabs>
            <v-text-field v-model="form.amount" :label="t('transaction.amount')" />
            <v-select
              v-model="form.bookId"
              :items="bookStore.activeBooks"
              item-title="name"
              item-value="id"
              :label="t('transaction.book')"
            />
            <v-select
              v-model="form.accountId"
              :items="accountStore.activeAccounts"
              item-title="name"
              item-value="id"
              :label="t('transaction.account')"
            />
            <v-select
              v-if="form.type === 'transfer'"
              v-model="form.targetAccountId"
              :items="targetAccounts"
              item-title="name"
              item-value="id"
              :label="t('transaction.toAccount')"
            />
            <div class="d-flex ga-3">
              <v-select
                v-model="form.repeatType"
                :items="repeatOptions"
                :label="t('recurring.repeat')"
              />
              <v-text-field
                v-model.number="form.repeatInterval"
                :label="t('recurring.interval')"
                min="1"
                type="number"
              />
            </div>
            <v-text-field
              v-model="form.startDate"
              :label="t('recurring.startDate')"
              type="date"
            />
            <v-text-field
              v-model="form.endDate"
              :label="t('recurring.endDate')"
              type="date"
            />
            <v-text-field
              v-model="form.nextTriggerDate"
              :label="t('recurring.nextTrigger')"
              type="date"
            />
            <v-select
              v-model="form.tagIds"
              :items="tagStore.tags"
              chips
              item-title="name"
              item-value="id"
              :label="t('transaction.tags')"
              multiple
            />
            <v-textarea v-model="form.note" :label="t('common.note')" rows="2" />
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
