<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type { TransactionType } from '@/modules/transactions/transaction.types';
import { formatMinorUnits, parseMoneyToMinorUnits } from '@/modules/shared/money';
import { todayIsoDate } from '@/modules/shared/date';
import MobilePage from '@/components/shared/MobilePage.vue';
import { transactionTypeOptions } from '@/components/shared/financeDisplay';

const { t } = useI18n();
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

const form = reactive({
  bookId: null as number | null,
  type: 'expense' as TransactionType,
  amount: '',
  accountId: null as number | null,
  targetAccountId: null as number | null,
  date: todayIsoDate(),
  time: '12:35',
  note: '',
  tagIds: [] as number[],
  category: 'food'
});

const typeOptions = computed(() => transactionTypeOptions(t));
const categories = computed(() => [
  { value: 'food', title: t('category.food'), icon: '$food' },
  { value: 'shopping', title: t('category.shopping'), icon: '$shopping' },
  { value: 'transport', title: t('category.transport'), icon: '$transport' },
  { value: 'daily', title: t('category.daily'), icon: '$daily' },
  { value: 'entertainment', title: t('category.entertainment'), icon: '$entertainment' },
  { value: 'more', title: t('category.more'), icon: '$more' }
]);

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

const displayAmount = computed(() => form.amount || t('transaction.amountPlaceholder'));

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

function appendAmount(value: string) {
  if (value === '.' && form.amount.includes('.')) {
    return;
  }

  if (form.amount.includes('.') && form.amount.split('.')[1].length >= 2) {
    return;
  }

  form.amount = `${form.amount}${value}`;
}

function backspaceAmount() {
  form.amount = form.amount.slice(0, -1);
}

function toggleTag(tagId: number) {
  form.tagIds = form.tagIds.includes(tagId)
    ? form.tagIds.filter((id) => id !== tagId)
    : [...form.tagIds, tagId];
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
      note: form.note || categories.value.find((item) => item.value === form.category)?.title || null,
      tagIds: form.tagIds
    });
    await accountStore.load();
    emit('saved');
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('transaction.saveFailed');
  }
}

onMounted(async () => {
  await Promise.all([bookStore.load(), accountStore.load(), tagStore.load()]);
  form.bookId = bookStore.activeBooks[0]?.id ?? null;
  form.accountId = accountStore.activeAccounts[0]?.id ?? null;
});
</script>

<template>
  <MobilePage
    :title="t('nav.newTransaction')"
    back-action="emit"
    content-class="editor-content editor-page-content"
    :has-footer="false"
    show-back
    @back="emit('close')"
  >
    <template #actions>
      <v-btn prepend-icon="$calendar" variant="text">
        {{ t('transaction.template') }}
      </v-btn>
    </template>

    <v-form class="d-flex flex-column ga-4" @submit.prevent="submit">
      <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

      <v-card class="soft-card pa-1">
        <v-tabs v-model="form.type" grow hide-slider selected-class="editor-tab-active">
          <v-tab v-for="item in typeOptions" :key="item.value" :prepend-icon="item.icon" :value="item.value">
            {{ item.title }}
          </v-tab>
        </v-tabs>
      </v-card>

      <v-card class="soft-card pa-5 amount-card">
        <div class="text-body-2 text-medium-emphasis">
          {{ t('transaction.amount') }} ({{ selectedAccount?.currency ?? 'AED' }})
        </div>
        <div class="d-flex align-center">
          <div class="amount-display">{{ displayAmount }}</div>
          <v-spacer />
          <v-btn icon="$chartDonut" variant="tonal" />
        </div>
        <div class="calculator-grid mt-4">
          <v-btn v-for="key in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0']" :key="key" variant="tonal" @click="appendAmount(key)">
            {{ key }}
          </v-btn>
          <v-btn icon="$close" variant="tonal" @click="backspaceAmount" />
        </div>
      </v-card>

      <v-card class="soft-card pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-4">{{ t('transaction.category') }}</div>
        <v-slide-group v-model="form.category" show-arrows="desktop">
          <v-slide-group-item
            v-for="category in categories"
            :key="category.value"
            v-slot="{ isSelected, toggle }"
            :value="category.value"
          >
            <button class="category-option" type="button" @click="toggle">
              <span :class="['category-icon', isSelected ? 'category-icon-active' : '']">
                <v-icon :icon="category.icon" />
              </span>
              <span :class="['text-body-2', isSelected ? 'text-primary font-weight-bold' : 'text-medium-emphasis']">
                {{ category.title }}
              </span>
            </button>
          </v-slide-group-item>
        </v-slide-group>
      </v-card>

      <v-card class="soft-card">
        <v-list class="bg-transparent">
          <v-list-item @click="accountSheetOpen = true">
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="$account" />
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold">{{ t('transaction.account') }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ selectedAccount?.name || '-' }}
              <span v-if="selectedAccount"> · {{ t('account.balance') }} {{ formatMinorUnits(selectedAccount.currentBalance, selectedAccount.currency) }}</span>
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
            <v-list-item-title class="font-weight-bold">{{ t('transaction.book') }}</v-list-item-title>
            <v-list-item-subtitle>{{ selectedBook?.name || '-' }}</v-list-item-subtitle>
            <template #append><v-icon icon="$next" /></template>
          </v-list-item>

          <template v-if="form.type === 'transfer'">
            <v-divider />
            <v-select
              v-model="form.targetAccountId"
              :items="targetAccounts"
              class="px-4 pt-4"
              item-title="name"
              item-value="id"
              :label="t('transaction.toAccount')"
            />
          </template>
        </v-list>
      </v-card>

      <v-card class="soft-card pa-4">
        <div class="text-subtitle-1 font-weight-bold mb-3">
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
          <v-chip prepend-icon="$add" variant="outlined">{{ t('transaction.addTag') }}</v-chip>
        </div>
      </v-card>

      <v-card class="soft-card">
        <v-list class="bg-transparent">
          <v-list-item>
            <template #prepend><v-icon icon="$calendar" /></template>
            <v-list-item-title>{{ t('common.date') }}</v-list-item-title>
            <template #append>
              <input v-model="form.date" class="plain-date-input" type="date" />
            </template>
          </v-list-item>
          <v-divider />
          <v-list-item>
            <template #prepend><v-icon icon="$clock" /></template>
            <v-list-item-title>{{ t('common.time') }}</v-list-item-title>
            <template #append>
              <input v-model="form.time" class="plain-date-input" type="time" />
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

    <div class="save-bar">
      <v-btn block color="primary" size="x-large" @click="submit">
        {{ t('common.save') }}
      </v-btn>
    </div>

    <v-bottom-sheet v-model="accountSheetOpen">
      <v-card class="pa-4">
        <div class="text-h6 font-weight-bold mb-3">{{ t('transaction.account') }}</div>
        <v-list class="bg-transparent">
          <v-list-item
            v-for="account in accountStore.activeAccounts"
            :key="account.id"
            :active="form.accountId === account.id"
            @click="form.accountId = account.id; accountSheetOpen = false"
          >
            <v-list-item-title>{{ account.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ formatMinorUnits(account.currentBalance, account.currency) }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="bookSheetOpen">
      <v-card class="pa-4">
        <div class="text-h6 font-weight-bold mb-3">{{ t('transaction.book') }}</div>
        <v-list class="bg-transparent">
          <v-list-item
            v-for="book in bookStore.activeBooks"
            :key="book.id"
            :active="form.bookId === book.id"
            :title="book.name"
            :subtitle="book.description || ''"
            @click="form.bookId = book.id; bookSheetOpen = false"
          />
        </v-list>
      </v-card>
    </v-bottom-sheet>
  </MobilePage>
</template>

<style scoped>
.editor-tab-active {
  background: rgba(var(--v-theme-primary), 0.1);
}

.amount-card {
  min-height: 150px;
}

.amount-display {
  color: rgb(var(--v-theme-primary));
  font-size: 4rem;
  font-weight: 800;
  line-height: 1.1;
}

.calculator-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.category-option {
  display: flex;
  width: 74px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.category-icon {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 50%;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.category-icon-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.plain-date-input {
  max-width: 150px;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  text-align: right;
}

.save-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10;
  width: min(100vw, 430px);
  margin: 0 auto;
  padding: 14px 18px calc(16px + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(246, 248, 247, 0), rgb(var(--v-theme-background)) 28%);
}
</style>
