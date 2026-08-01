<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from '@/i18n';
import { useBookStore } from '@/modules/books/book.store';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useTagStore } from '@/modules/tags/tag.store';
import { useCurrencyStore } from '@/modules/currency/currency.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import type {
  Transaction,
  TransactionInput,
  TransactionType
} from '@/modules/transactions/transaction.types';
import {
  formatMoneyInputDisplay,
  formatMinorUnits,
  maskMoneyInput,
  parseMoneyToMinorUnits
} from '@/modules/shared/money';
import { todayIsoDate } from '@/modules/shared/date';
import { transactionTypeOptions } from '@/components/shared/financeDisplay';
import { getMostRecentLinkedAccountId } from '@/modules/transactions/transaction.repository';

const { t } = useI18n();
const props = defineProps<{
  transaction?: Transaction | null;
  initialBookId?: number | null;
}>();
const emit = defineEmits<{
  close: [];
  saved: [];
}>();
const bookStore = useBookStore();
const accountStore = useAccountStore();
const tagStore = useTagStore();
const currencyStore = useCurrencyStore();
const transactionStore = useTransactionStore();
const error = ref('');
const accountSheetOpen = ref(false);
const targetAccountSheetOpen = ref(false);
const bookSheetOpen = ref(false);
const dateTimeSheetOpen = ref(false);
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

const keyboardRows = [
  ['1', '2', '3', 'backspace'],
  ['4', '5', '6', '+'],
  ['7', '8', '9', '-'],
  ['.', '0', 'submit']
];
const isEditing = computed(() => Boolean(props.transaction));
const editorTitle = computed(() =>
  isEditing.value ? t('transaction.editTitle') : t('nav.newTransaction')
);
const saving = computed(() => transactionStore.mutating);
const typeOptions = computed(() => transactionTypeOptions(t));

const selectedAccount = computed(() =>
  accountStore.activeAccounts.find((account) => account.id === form.accountId)
);

const selectedBook = computed(() =>
  bookStore.activeBooks.find((book) => book.id === form.bookId)
);

const selectedBookAccountLinks = computed(() =>
  form.bookId ? (bookStore.bookAccountLinks[form.bookId] ?? []) : []
);

const linkedAccounts = computed(() => {
  const linkedIds = new Set(
    selectedBookAccountLinks.value.map((link) => link.accountId)
  );
  return accountStore.activeAccounts.filter((account) =>
    linkedIds.has(account.id)
  );
});

const selectedBookDefaultAccountId = computed(
  () =>
    selectedBookAccountLinks.value.find((link) => link.isDefault)?.accountId ??
    null
);

const showSourceAccountChip = computed(() => linkedAccounts.value.length > 1);

const targetAccounts = computed(() =>
  linkedAccounts.value.filter(
    (account) =>
      account.id !== form.accountId &&
      account.currency === selectedAccount.value?.currency
  )
);

const displayAmount = computed(() => formatMoneyInputDisplay(form.amount));
const displayCurrency = computed(
  () => selectedAccount.value?.currency ?? currencyStore.currency
);

const dateChipLabel = computed(() => {
  const today = todayIsoDate();

  if (form.date === today) {
    return t('common.today');
  }

  const currentYear = today.slice(0, 4);
  const selectedYear = form.date.slice(0, 4);

  return selectedYear === currentYear ? form.date.slice(5) : form.date;
});

watch(
  () => form.accountId,
  () => {
    form.targetAccountId = null;
    if (form.type === 'transfer') {
      form.targetAccountId = targetAccounts.value[0]?.id ?? null;
    }
  }
);

watch(
  () => form.bookId,
  async (bookId) => {
    if (!bookId) {
      form.accountId = null;
      return;
    }

    await bookStore.loadAccountLinks(bookId);
    const defaultAccountId = selectedBookDefaultAccountId.value;
    const currentAccountIsLinked = linkedAccounts.value.some(
      (account) => account.id === form.accountId
    );

    if (!currentAccountIsLinked) {
      form.accountId = defaultAccountId ?? linkedAccounts.value[0]?.id ?? null;
    }
  }
);

watch(
  () => form.type,
  () => {
    if (form.type !== 'transfer') {
      form.targetAccountId = null;
      return;
    }

    form.targetAccountId = targetAccounts.value[0]?.id ?? null;
  }
);

function updateAmount(value: string) {
  form.amount = maskMoneyInput(value);
}

function appendAmount(value: string) {
  updateAmount(`${form.amount}${value}`);
}

function backspaceAmount() {
  form.amount = form.amount.slice(0, -1);
}

function handleKeyboardKey(key: string) {
  if (saving.value) {
    return;
  }

  if (key === 'backspace') {
    backspaceAmount();
    return;
  }

  if (key === 'submit') {
    void submit();
    return;
  }

  if (key === '+') {
    form.type = 'income';
    return;
  }

  if (key === '-') {
    form.type = 'expense';
    return;
  }

  appendAmount(key);
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
  if (saving.value) {
    return;
  }

  error.value = '';

  if (!form.bookId || !form.accountId || !selectedAccount.value) {
    error.value = t('transaction.needBookAccount');
    return;
  }

  try {
    const input: TransactionInput = {
      bookId: form.bookId,
      type: form.type,
      amount: parseMoneyToMinorUnits(form.amount || '0'),
      currency: selectedAccount.value.currency,
      accountId: form.accountId,
      targetAccountId: form.type === 'transfer' ? form.targetAccountId : null,
      occurredAt: `${form.date} ${form.time}:00`,
      note: form.note || null,
      tagIds: form.tagIds
    };

    if (props.transaction) {
      const updated = await transactionStore.update(props.transaction.id, input);
      if (!updated) {
        error.value = t('transaction.notFound');
        return;
      }
    } else {
      const created = await transactionStore.create(input);
      if (!created) {
        return;
      }
    }

    emit('saved');
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : t('transaction.saveFailed');
  }
}

function getActiveBookId(bookId: number | null | undefined) {
  return bookStore.activeBooks.some((book) => book.id === bookId)
    ? (bookId ?? null)
    : null;
}

async function initializeCreateDefaults() {
  const currentBookId = getActiveBookId(props.initialBookId);
  const fallbackBookId =
    getActiveBookId(bookStore.activeLastOpenedBookId) ??
    getActiveBookId(bookStore.activeDefaultBookId) ??
    bookStore.activeBooks[0]?.id ??
    null;
  const recentBookIds = [...new Set([currentBookId, fallbackBookId])].filter(
    (bookId): bookId is number => bookId !== null
  );

  for (const bookId of recentBookIds) {
    const accountId = await getMostRecentLinkedAccountId(bookId);
    if (accountId) {
      await bookStore.loadAccountLinks(bookId);
      form.bookId = bookId;
      form.accountId = accountId;
      return;
    }
  }

  const selectedBookId = fallbackBookId ?? currentBookId;
  form.bookId = selectedBookId;
  if (!selectedBookId) {
    form.accountId = null;
    return;
  }

  await bookStore.loadAccountLinks(selectedBookId);
  form.accountId =
    selectedBookDefaultAccountId.value ?? linkedAccounts.value[0]?.id ?? null;
}

onMounted(async () => {
  await Promise.all([
    bookStore.load(),
    bookStore.loadPreferences(),
    accountStore.load(),
    tagStore.load(),
    currencyStore.load()
  ]);

  if (props.transaction) {
    await bookStore.loadAccountLinks(props.transaction.bookId);
    Object.assign(form, {
      bookId: props.transaction.bookId,
      type: props.transaction.type,
      amount: (props.transaction.amount / 100).toFixed(2),
      accountId: props.transaction.accountId,
      targetAccountId: null,
      date: props.transaction.occurredAt.slice(0, 10),
      time: props.transaction.occurredAt.slice(11, 16),
      note: props.transaction.note ?? '',
      tagIds: [...props.transaction.tagIds]
    });
    await nextTick();
    form.targetAccountId = props.transaction.targetAccountId;
    return;
  }

  await initializeCreateDefaults();
});
</script>

<template>
  <v-card class="transaction-editor h-100 d-flex flex-column" color="background" rounded="0">
    <div class="editor-header">
      <v-btn :disabled="saving" icon="$close" variant="text" @click="emit('close')" />
      <div class="text-title-large font-weight-bold">
        {{ editorTitle }}
      </div>
      <v-chip
        class="editor-book-chip"
        color="surface"
        prepend-icon="$book"
        variant="flat"
        @click="bookSheetOpen = true"
      >
        {{ selectedBook?.name || '-' }}
      </v-chip>
    </div>

    <div class="editor-body">
      <v-alert
        v-if="error"
        class="editor-error"
        type="error"
        variant="tonal"
      >
        {{ error }}
      </v-alert>

      <div class="editor-type-tabs">
        <button
          v-for="item in typeOptions"
          :key="item.value"
          class="editor-type-tab"
          :class="{ 'editor-type-tab-active': form.type === item.value }"
          type="button"
          @click="form.type = item.value"
        >
          <v-icon :icon="item.icon" size="20" />
          <span>{{ item.title }}</span>
        </button>
      </div>

      <section class="amount-panel">
        <div class="amount-panel-top">
          <div class="amount-line">
            <span class="amount-currency">{{ displayCurrency }}</span>
            <span class="amount-value">{{ displayAmount }}</span>
          </div>
          <v-chip
            class="date-chip"
            color="surface"
            prepend-icon="$calendar"
            variant="flat"
            @click="dateTimeSheetOpen = true"
          >
            {{ dateChipLabel }}
          </v-chip>
        </div>

        <div class="amount-controls">
          <v-chip
            v-if="showSourceAccountChip"
            color="surface"
            prepend-icon="$account"
            variant="flat"
            @click="accountSheetOpen = true"
          >
            {{ selectedAccount?.name || '-' }}
          </v-chip>
          <v-chip
            v-if="form.type === 'transfer' && targetAccounts.length"
            color="surface"
            prepend-icon="$transfer"
            variant="flat"
            @click="targetAccountSheetOpen = true"
          >
            {{
              targetAccounts.find((account) => account.id === form.targetAccountId)
                ?.name || t('transaction.toAccount')
            }}
          </v-chip>
        </div>
      </section>

      <section class="tag-panel">
        <button
          v-for="tag in tagStore.tags"
          :key="tag.id"
          class="tag-option"
          :class="{ 'tag-option-active': form.tagIds.includes(tag.id) }"
          type="button"
          @click="toggleTag(tag.id)"
        >
          {{ tag.name }}
        </button>
        <button class="tag-option tag-add" type="button" @click="tagSheetOpen = true">
          <v-icon icon="$add" size="18" />
          <span>{{ t('transaction.addTag') }}</span>
        </button>
      </section>

      <v-text-field
        v-model="form.note"
        class="note-field"
        density="compact"
        hide-details
        :placeholder="t('common.note')"
        variant="outlined"
      />

      <div class="inline-keyboard">
        <template v-for="row in keyboardRows" :key="row.join('-')">
          <button
            v-for="key in row"
            :key="key"
            class="keyboard-key"
            :class="{
              'keyboard-key-submit': key === 'submit',
              'keyboard-key-muted': key === 'backspace' || key === '+' || key === '-'
            }"
            :style="key === 'submit' ? { gridColumn: 'span 2' } : undefined"
            :aria-busy="key === 'submit' && saving"
            :disabled="saving"
            type="button"
            @click="handleKeyboardKey(key)"
          >
            <v-icon v-if="key === 'backspace'" icon="$close" size="24" />
            <v-progress-circular
              v-else-if="key === 'submit' && saving"
              indeterminate
              size="28"
              width="3"
            />
            <v-icon v-else-if="key === 'submit'" icon="$check" size="34" />
            <span v-else>{{ key }}</span>
          </button>
        </template>
      </div>
    </div>

    <v-bottom-sheet v-model="accountSheetOpen">
      <v-card class="pa-4" color="surface">
        <div class="text-title-large font-weight-bold mb-3">
          {{ t('transaction.account') }}
        </div>
        <v-list>
          <v-list-item
            v-for="account in linkedAccounts"
            :key="account.id"
            :active="form.accountId === account.id"
            @click="
              form.accountId = account.id;
              accountSheetOpen = false;
            "
          >
            <v-list-item-title>{{ account.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatMinorUnits(account.currentBalance, account.currency) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="targetAccountSheetOpen">
      <v-card class="pa-4" color="surface">
        <div class="text-title-large font-weight-bold mb-3">
          {{ t('transaction.toAccount') }}
        </div>
        <v-list>
          <v-list-item
            v-for="account in targetAccounts"
            :key="account.id"
            :active="form.targetAccountId === account.id"
            @click="
              form.targetAccountId = account.id;
              targetAccountSheetOpen = false;
            "
          >
            <v-list-item-title>{{ account.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ formatMinorUnits(account.currentBalance, account.currency) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="bookSheetOpen">
      <v-card class="pa-4" color="surface">
        <div class="text-title-large font-weight-bold mb-3">
          {{ t('transaction.book') }}
        </div>
        <v-list>
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

    <v-bottom-sheet v-model="dateTimeSheetOpen">
      <v-card class="pa-4" color="surface">
        <div class="text-title-large font-weight-bold mb-4">
          {{ t('transaction.occurredAt') }}
        </div>
        <div class="d-flex flex-column ga-3">
          <v-text-field
            v-model="form.date"
            :label="t('common.date')"
            type="date"
          />
          <v-text-field
            v-model="form.time"
            :label="t('common.time')"
            type="time"
          />
          <v-btn color="primary" variant="flat" @click="dateTimeSheetOpen = false">
            {{ t('common.confirm') }}
          </v-btn>
        </div>
      </v-card>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="tagSheetOpen">
      <v-card class="pa-4" color="surface">
        <div class="text-title-large font-weight-bold mb-3">
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
          <v-color-input
            v-model="tagForm.color"
            :label="t('common.color')"
            hide-actions
          />
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
  </v-card>
</template>

<style scoped>
.transaction-editor {
  height: 100dvh;
  overflow: hidden;
}

.editor-header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 8px;
}

.editor-book-chip {
  max-width: 132px;
}

.editor-book-chip :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-body {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 16px;
}

.editor-error {
  flex: 0 0 auto;
}

.editor-type-tabs {
  display: grid;
  flex: 0 0 48px;
  grid-template-columns: repeat(3, 1fr);
  overflow: hidden;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
}

.editor-type-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-weight: 600;
}

.editor-type-tab-active {
  background: rgb(var(--v-theme-accent));
  color: rgb(var(--v-theme-primary));
}

.amount-panel {
  flex: 0 0 auto;
  padding: 14px 16px 12px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 24px;
  background: rgb(var(--v-theme-surface));
}

.amount-panel-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.amount-line {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 10px;
  white-space: nowrap;
}

.amount-currency {
  color: rgb(var(--v-theme-on-surface));
  font-size: 1rem;
  font-weight: 600;
}

.amount-value {
  overflow: hidden;
  color: rgb(var(--v-theme-primary));
  font-size: clamp(2.5rem, 11vw, 4.5rem);
  font-weight: 800;
  line-height: 1;
  text-overflow: ellipsis;
}

.date-chip {
  flex-shrink: 0;
}

.amount-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 32px;
  margin-top: 8px;
}

.tag-panel {
  display: grid;
  flex: 1 1 auto;
  min-height: 112px;
  grid-auto-rows: minmax(34px, 1fr);
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  overflow: hidden;
  padding: 10px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 24px;
  background: rgb(var(--v-theme-surface));
}

.tag-option {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid transparent;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-primary));
  font: inherit;
  font-size: 0.875rem;
  font-weight: 700;
}

.tag-option-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-accent));
}

.tag-add {
  border-style: dashed;
  border-color: rgb(var(--v-theme-outline));
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.note-field {
  flex: 0 0 auto;
}

.inline-keyboard {
  display: grid;
  flex: 0 0 224px;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
}

.keyboard-key {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 1.75rem;
  font-weight: 800;
}

.keyboard-key-muted {
  background: rgb(var(--v-theme-surface-variant));
  font-weight: 700;
}

.keyboard-key-submit {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

@media (max-height: 740px) {
  .editor-header {
    padding-top: 6px;
  }

  .editor-body {
    gap: 6px;
    padding-bottom: 10px;
  }

  .amount-panel {
    padding: 10px 12px;
  }

  .tag-panel {
    min-height: 92px;
    gap: 6px;
    padding: 8px;
  }

  .inline-keyboard {
    flex-basis: 196px;
    gap: 6px;
  }

  .keyboard-key {
    border-radius: 14px;
    font-size: 1.5rem;
  }
}
</style>
