<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useI18n } from '@/i18n';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import {
  formatMoneyInputDisplay,
  formatMinorUnits,
  maskMoneyInput,
  parseMoneyToMinorUnits
} from '@/modules/shared/money';
import { todayIsoDate } from '@/modules/shared/date';
import { transactionTypeOptions } from '@/components/shared/financeDisplay';
import NumericKeyboard from '@/components/shared/NumericKeyboard.vue';

const { t } = useI18n();
const { mobile } = useDisplay();
const emit = defineEmits<{
  close: [];
  saved: [];
}>();
const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();
const error = ref('');
const accountSheetOpen = ref(false);
const bookSheetOpen = ref(false);
const amountKeyboardOpen = ref(false);
const tagSheetOpen = ref(false);
const tagError = ref('');

const form = reactive({
  bookId: null as number | null,
  type: 'expense' as TransactionType,
  amount: '',
  accountId: null as number | null,
  targetAccountId: null as number | null,
  date: todayIsoDate(),
  time: '12:35',
  note: '',
  tagIds: [] as number[]
});
const tagForm = reactive({
  name: '',
  color: '#0f766e'
});

const typeOptions = computed(() => transactionTypeOptions(t));

const selectedAccount = computed(() =>
  accountStore.activeAccounts.find((account) => account.id === form.accountId)
);

const selectedBook = computed(() =>
  bookStore.activeBooks.find((book) => book.id === form.bookId)
);

const targetAccounts = computed(() =>
  accountStore.activeAccounts.filter(
    (account) =>
      account.id !== form.accountId &&
      account.currency === selectedAccount.value?.currency
  )
);

const displayAmount = computed(() => formatMoneyInputDisplay(form.amount));

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

function updateAmount(value: string) {
  form.amount = maskMoneyInput(value);
}

function openAmountKeyboard() {
  if (mobile.value) {
    amountKeyboardOpen.value = true;
  }
}

function appendAmount(value: string) {
  updateAmount(`${form.amount}${value}`);
}

function backspaceAmount() {
  form.amount = form.amount.slice(0, -1);
}

function toggleTag(tagId: number) {
  form.tagIds = form.tagIds.includes(tagId)
    ? form.tagIds.filter((id) => id !== tagId)
    : [...form.tagIds, tagId];
}

function resetTagForm() {
  tagError.value = '';
  tagForm.name = '';
  tagForm.color = '#0f766e';
}

async function submitTag() {
  const name = tagForm.name.trim();

  if (!name) {
    return;
  }

  tagError.value = '';
  try {
    await tagStore.create({
      name,
      color: tagForm.color || null
    });
    const createdTag = tagStore.tags.find((tag) => tag.name === name);

    if (createdTag && !form.tagIds.includes(createdTag.id)) {
      form.tagIds = [...form.tagIds, createdTag.id];
    }

    tagSheetOpen.value = false;
    resetTagForm();
  } catch (err) {
    tagError.value = err instanceof Error ? err.message : t('tag.saveFailed');
  }
}

async function submit() {
  error.value = '';

  if (!form.bookId || !form.accountId || !selectedAccount.value) {
    error.value = t('transaction.needBookAccount');
    return;
  }

  try {
    await transactionStore.create({
      bookId: form.bookId,
      type: form.type,
      amount: parseMoneyToMinorUnits(form.amount || '0'),
      currency: selectedAccount.value.currency,
      accountId: form.accountId,
      targetAccountId: form.type === 'transfer' ? form.targetAccountId : null,
      occurredAt: `${form.date} ${form.time}:00`,
      note: form.note || null,
      tagIds: form.tagIds
    });
    emit('saved');
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : t('transaction.saveFailed');
  }
}

onMounted(async () => {
  await Promise.all([bookStore.load(), accountStore.load(), tagStore.load()]);
  form.bookId = bookStore.activeBooks[0]?.id ?? null;
  form.accountId = accountStore.activeAccounts[0]?.id ?? null;
});
</script>

<template>
  <v-card class="h-100 d-flex flex-column" rounded="0">
    <v-toolbar color="background" elevation="0" height="88">
      <v-btn icon="$close" variant="text" @click="emit('close')" />
      <v-toolbar-title class="mobile-title">
        {{ t('nav.newTransaction') }}
      </v-toolbar-title>
    </v-toolbar>

    <v-card-text class="flex-grow-1 overflow-y-auto px-4 pb-4">
      <v-form class="d-flex flex-column ga-4" @submit.prevent="submit">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card class="soft-card pa-1">
          <v-tabs
            v-model="form.type"
            grow
            hide-slider
            selected-class="editor-tab-active"
          >
            <v-tab
              v-for="item in typeOptions"
              :key="item.value"
              :prepend-icon="item.icon"
              :value="item.value"
            >
              {{ item.title }}
            </v-tab>
          </v-tabs>
        </v-card>

        <v-card class="soft-card pa-5">
          <v-text-field
            :model-value="displayAmount"
            :label="t('transaction.amount')"
            class="amount-field"
            placeholder="0.00"
            inputmode="decimal"
            :readonly="mobile"
            :suffix="selectedAccount?.currency"
            clearable
            @click="openAmountKeyboard"
            @update:model-value="updateAmount(String($event ?? ''))"
          />
          <template v-if="form.type === 'transfer'">
            <v-select
              v-model="form.targetAccountId"
              :items="targetAccounts"
              item-title="name"
              item-value="id"
              :label="t('transaction.toAccount')"
            />
          </template>
        </v-card>

        <v-card class="soft-card pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-4">
            {{ t('transaction.tags') }} ({{ t('common.optional') }})
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="tag in tagStore.tags"
              :key="tag.id"
              :color="tag.color || 'primary'"
              :variant="form.tagIds.includes(tag.id) ? 'flat' : 'tonal'"
              @click="toggleTag(tag.id)"
            >
              {{ tag.name }}
            </v-chip>
            <v-chip
              prepend-icon="$add"
              variant="outlined"
              @click="tagSheetOpen = true"
            >
              {{ t('transaction.addTag') }}
            </v-chip>
          </div>
        </v-card>

        <v-card class="soft-card">
          <v-list class="bg-transparent">
            <v-list-item @click="accountSheetOpen = true">
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="$account" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">{{
                t('transaction.account')
              }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ selectedAccount?.name || '-' }}
                <span v-if="selectedAccount">
                  · {{ t('account.balance') }}
                  {{
                    formatMinorUnits(
                      selectedAccount.currentBalance,
                      selectedAccount.currency
                    )
                  }}</span
                >
              </v-list-item-subtitle>
              <template #append><v-icon icon="$next" /></template>
            </v-list-item>

            <v-divider />

            <v-list-item @click="bookSheetOpen = true">
              <template #prepend>
                <v-avatar color="secondary" variant="tonal">
                  <v-icon icon="$book" />
                </v-avatar>
              </template>
              <v-list-item-title class="font-weight-bold">{{
                t('transaction.book')
              }}</v-list-item-title>
              <v-list-item-subtitle>{{
                selectedBook?.name || '-'
              }}</v-list-item-subtitle>
              <template #append><v-icon icon="$next" /></template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="soft-card">
          <v-list class="bg-transparent">
            <v-list-item>
              <template #prepend><v-icon icon="$calendar" /></template>
              <v-list-item-title>{{ t('common.date') }}</v-list-item-title>
              <template #append>
                <input
                  v-model="form.date"
                  class="plain-date-input"
                  type="date"
                />
              </template>
            </v-list-item>
            <v-divider />
            <v-list-item>
              <template #prepend><v-icon icon="$clock" /></template>
              <v-list-item-title>{{ t('common.time') }}</v-list-item-title>
              <template #append>
                <input
                  v-model="form.time"
                  class="plain-date-input"
                  type="time"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="soft-card pa-4">
          <v-textarea
            v-model="form.note"
            :counter="200"
            hide-details
            :label="t('common.note')"
            rows="3"
          />
        </v-card>
      </v-form>
    </v-card-text>

    <v-card-actions class="pa-4 pt-2">
      <v-btn
        block
        color="primary"
        variant="flat"
        size="x-large"
        @click="submit"
      >
        {{ t('common.save') }}
      </v-btn>
    </v-card-actions>

    <v-bottom-sheet v-model="accountSheetOpen">
      <v-card class="pa-4">
        <div class="text-h6 font-weight-bold mb-3">
          {{ t('transaction.account') }}
        </div>
        <v-list class="bg-transparent">
          <v-list-item
            v-for="account in accountStore.activeAccounts"
            :key="account.id"
            :active="form.accountId === account.id"
            @click="
              form.accountId = account.id;
              accountSheetOpen = false;
            "
          >
            <v-list-item-title>{{ account.name }}</v-list-item-title>
            <v-list-item-subtitle>{{
              formatMinorUnits(account.currentBalance, account.currency)
            }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="bookSheetOpen">
      <v-card class="pa-4">
        <div class="text-h6 font-weight-bold mb-3">
          {{ t('transaction.book') }}
        </div>
        <v-list class="bg-transparent">
          <v-list-item
            v-for="book in bookStore.activeBooks"
            :key="book.id"
            :active="form.bookId === book.id"
            :title="book.name"
            :subtitle="book.description || ''"
            @click="
              form.bookId = book.id;
              bookSheetOpen = false;
            "
          />
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="tagSheetOpen">
      <v-card class="pa-4">
        <div class="text-h6 font-weight-bold mb-3">
          {{ t('transaction.addTag') }}
        </div>
        <v-alert v-if="tagError" class="mb-3" type="error" variant="tonal">
          {{ tagError }}
        </v-alert>
        <v-form class="d-flex flex-column ga-3" @submit.prevent="submitTag">
          <v-text-field
            v-model="tagForm.name"
            :label="t('common.name')"
            autofocus
            required
          />
          <v-text-field v-model="tagForm.color" :label="t('common.color')" />
          <div class="d-flex ga-2">
            <v-btn color="primary" type="submit">
              {{ t('common.add') }}
            </v-btn>
            <v-btn
              variant="text"
              @click="
                tagSheetOpen = false;
                resetTagForm();
              "
            >
              {{ t('common.cancel') }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="amountKeyboardOpen">
      <NumericKeyboard
        :confirm-label="t('common.confirm')"
        :display-value="displayAmount"
        :title="`${t('transaction.amount')} (${selectedAccount?.currency ?? 'AED'})`"
        @backspace="backspaceAmount"
        @confirm="amountKeyboardOpen = false"
        @input="appendAmount"
      />
    </v-bottom-sheet>
  </v-card>
</template>

<style scoped>
.mobile-title {
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: 0;
}

.editor-tab-active {
  background: rgba(var(--v-theme-primary), 0.1);
}

.amount-card {
  min-height: 150px;
}

.amount-field :deep(.v-field__input) {
  color: rgb(var(--v-theme-primary));
  font-weight: 400;
  line-height: 1.1;
}

.plain-date-input {
  max-width: 150px;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  text-align: right;
}
</style>
