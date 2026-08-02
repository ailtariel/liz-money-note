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

type CalculatorOperator = '+' | '−' | '×' | '÷';

const keyboardRows = [
  ['1', '2', '3', '÷'],
  ['4', '5', '6', '×'],
  ['7', '8', '9', '−'],
  ['.', '0', 'backspace', '+']
] as const;
const calculatorOperator = ref<CalculatorOperator | null>(null);
const calculatorAccumulator = ref<number | null>(null);
const replaceAmountOnInput = ref(false);
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

const targetAccounts = computed(() =>
  linkedAccounts.value.filter(
    (account) =>
      account.id !== form.accountId &&
      account.currency === selectedAccount.value?.currency
  )
);

const displayAmount = computed(() => {
  const negative = form.amount.startsWith('-');
  const unsignedAmount = negative ? form.amount.slice(1) : form.amount;

  return `${negative ? '-' : ''}${formatMoneyInputDisplay(unsignedAmount)}`;
});
const displayCurrency = computed(
  () => selectedAccount.value?.currency ?? currencyStore.currency
);
const quickTags = computed(() => {
  const selectedTags = tagStore.tags.filter((tag) =>
    form.tagIds.includes(tag.id)
  );
  const recentTagOrder = new Map<number, number>();
  transactionStore.transactions.forEach((transaction) => {
    transaction.tagIds.forEach((tagId) => {
      if (!recentTagOrder.has(tagId)) {
        recentTagOrder.set(tagId, recentTagOrder.size);
      }
    });
  });
  const remainingTags = tagStore.tags
    .filter((tag) => !form.tagIds.includes(tag.id))
    .sort(
      (left, right) =>
        (recentTagOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
        (recentTagOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
    );

  return [...selectedTags, ...remainingTags].slice(0, 9);
});

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
  const negative = value.startsWith('-');
  const unsignedAmount = negative ? value.slice(1) : value;
  const maskedAmount = maskMoneyInput(unsignedAmount);

  form.amount = negative && maskedAmount ? `-${maskedAmount}` : maskedAmount;
}

function appendAmount(value: string) {
  if (replaceAmountOnInput.value) {
    form.amount = '';
    replaceAmountOnInput.value = false;
  }

  updateAmount(`${form.amount}${value}`);
}

function backspaceAmount() {
  if (replaceAmountOnInput.value) {
    calculatorOperator.value = null;
    calculatorAccumulator.value = null;
    replaceAmountOnInput.value = false;
  }

  updateAmount(form.amount.slice(0, -1));
}

function resetCalculator() {
  calculatorOperator.value = null;
  calculatorAccumulator.value = null;
  replaceAmountOnInput.value = false;
}

function calculateAmount(
  left: number,
  right: number,
  operator: CalculatorOperator
) {
  if (operator === '÷' && right === 0) {
    error.value = t('transaction.calculator.divideByZero');
    return null;
  }

  const result =
    operator === '+'
      ? left + right
      : operator === '−'
        ? left - right
        : operator === '×'
          ? left * right
          : left / right;
  const roundedResult =
    Math.sign(result) *
    (Math.round((Math.abs(result) + Number.EPSILON) * 100) / 100);

  return roundedResult;
}

function handleOperator(operator: CalculatorOperator) {
  error.value = '';
  const currentAmount = Number(form.amount || '0');

  if (
    calculatorOperator.value &&
    calculatorAccumulator.value !== null &&
    !replaceAmountOnInput.value
  ) {
    const result = calculateAmount(
      calculatorAccumulator.value,
      currentAmount,
      calculatorOperator.value
    );

    if (result === null) {
      return;
    }

    form.amount = result.toFixed(2);
    calculatorAccumulator.value = result;
  } else if (calculatorAccumulator.value === null) {
    calculatorAccumulator.value = currentAmount;
  }

  calculatorOperator.value = operator;
  replaceAmountOnInput.value = true;
}

function resolvePendingCalculation() {
  if (!calculatorOperator.value || calculatorAccumulator.value === null) {
    return true;
  }

  if (replaceAmountOnInput.value) {
    resetCalculator();
    return true;
  }

  const result = calculateAmount(
    calculatorAccumulator.value,
    Number(form.amount || '0'),
    calculatorOperator.value
  );

  if (result === null) {
    return false;
  }

  form.amount = result.toFixed(2);
  resetCalculator();
  return true;
}

function handleKeyboardKey(key: string) {
  if (saving.value) {
    return;
  }

  if (key === 'backspace') {
    backspaceAmount();
    return;
  }

  if (key === '+' || key === '−' || key === '×' || key === '÷') {
    handleOperator(key);
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

function resetForNextTransaction() {
  form.amount = '';
  form.note = '';
  form.tagIds = [];
  error.value = '';
  resetCalculator();
}

async function submit(continueEntry = false) {
  if (saving.value) {
    return;
  }

  error.value = '';

  if (!resolvePendingCalculation()) {
    return;
  }

  if (!form.bookId || !form.accountId || !selectedAccount.value) {
    error.value = t('transaction.needBookAccount');
    return;
  }

  try {
    // Transaction type owns the balance direction; calculator sign stays local to the expression.
    const transactionAmount = Math.abs(Number(form.amount || '0')).toFixed(2);
    const input: TransactionInput = {
      bookId: form.bookId,
      type: form.type,
      amount: parseMoneyToMinorUnits(transactionAmount),
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

    if (continueEntry && !props.transaction) {
      resetForNextTransaction();
      return;
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
      <v-btn
        :aria-label="t('common.close')"
        :disabled="saving"
        icon="$close"
        variant="text"
        @click="emit('close')"
      />
      <div class="editor-title text-title-large font-weight-bold">
        {{ editorTitle }}
      </div>
      <v-btn
        class="editor-book-button"
        color="surface-variant"
        :disabled="saving"
        prepend-icon="$book"
        variant="flat"
        @click="bookSheetOpen = true"
      >
        {{ selectedBook?.name || '-' }}
      </v-btn>
    </div>

    <div class="editor-type-region">
      <div class="editor-type-tabs" role="tablist">
        <button
          v-for="item in typeOptions"
          :key="item.value"
          class="editor-type-tab"
          :class="{ 'editor-type-tab-active': form.type === item.value }"
          :aria-selected="form.type === item.value"
          role="tab"
          type="button"
          @click="form.type = item.value"
        >
          <v-icon v-if="form.type === item.value" icon="$check" size="18" />
          <span>{{ item.title }}</span>
        </button>
      </div>
    </div>

    <div class="editor-body">
      <v-alert
        v-if="error"
        class="editor-error"
        closable
        type="error"
        variant="tonal"
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>

      <div class="core-inputs">
        <section class="amount-panel">
          <div class="amount-panel-top">
            <div class="amount-line">
              <span class="amount-currency">{{ displayCurrency }}</span>
              <span class="amount-value">{{ displayAmount }}</span>
            </div>
            <v-btn
              class="date-button"
              :disabled="saving"
              prepend-icon="$calendar"
              variant="text"
              @click="dateTimeSheetOpen = true"
            >
              {{ dateChipLabel }}
            </v-btn>
          </div>

          <v-btn
            v-if="form.type === 'transfer'"
            class="transfer-target-button"
            color="surface-variant"
            :disabled="!targetAccounts.length || saving"
            prepend-icon="$transfer"
            variant="flat"
            @click="targetAccountSheetOpen = true"
          >
            {{
              targetAccounts.find((account) => account.id === form.targetAccountId)
                ?.name || t('transaction.toAccount')
            }}
          </v-btn>
        </section>

        <section class="tag-panel" :aria-label="t('transaction.quickCategories')">
          <div class="tag-panel-header">
            <span class="font-weight-medium">
              {{ t('transaction.quickCategories') }}
            </span>
            <span class="text-label-small text-medium-emphasis">
              {{ t('transaction.recentlyUsed') }}
            </span>
          </div>
          <div class="tag-options-grid">
            <button
              v-for="tag in quickTags"
              :key="tag.id"
              class="tag-option"
              :class="{ 'tag-option-active': form.tagIds.includes(tag.id) }"
              :disabled="saving"
              type="button"
              @click="toggleTag(tag.id)"
            >
              <v-icon
                v-if="form.tagIds.includes(tag.id)"
                icon="$check"
                size="16"
              />
              <span>{{ tag.name }}</span>
            </button>
            <button
              class="tag-option tag-more"
              :disabled="saving"
              type="button"
              @click="tagSheetOpen = true"
            >
              {{ t('common.more') }}
            </button>
          </div>
        </section>

        <v-text-field
          v-model="form.note"
          class="note-field"
          density="compact"
          hide-details
          :label="t('common.note')"
          persistent-placeholder
          :placeholder="t('transaction.notePlaceholder')"
          variant="outlined"
        />
      </div>

      <div class="thumb-zone">
        <div class="inline-keyboard">
          <template v-for="row in keyboardRows" :key="row.join('-')">
            <button
              v-for="key in row"
              :key="key"
              class="keyboard-key"
              :class="{
                'keyboard-key-muted': ['+', '−', '×', '÷'].includes(key),
                'keyboard-key-active': calculatorOperator === key
              }"
              :aria-label="
                key === 'backspace'
                  ? t('transaction.calculator.backspace')
                  : undefined
              "
              :aria-pressed="['+', '−', '×', '÷'].includes(key) ? calculatorOperator === key : undefined"
              :disabled="saving"
              type="button"
              @click="handleKeyboardKey(key)"
            >
              <span>{{ key === 'backspace' ? '⌫' : key }}</span>
            </button>
          </template>
        </div>

        <div class="editor-actions" :class="{ 'editor-actions-single': isEditing }">
          <v-btn
            v-if="!isEditing"
            block
            color="primary"
            height="48"
            :loading="saving"
            rounded="pill"
            variant="outlined"
            @click="submit(true)"
          >
            {{ t('transaction.nextTransaction') }}
          </v-btn>
          <v-btn
            block
            color="primary"
            height="48"
            :loading="saving"
            rounded="pill"
            variant="flat"
            @click="submit()"
          >
            {{ t('transaction.saveTransaction') }}
          </v-btn>
        </div>
      </div>
    </div>

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
          {{ t('transaction.tags') }}
        </div>
        <div class="tag-sheet-options mb-4">
          <v-chip
            v-for="tag in tagStore.tags"
            :key="tag.id"
            :color="form.tagIds.includes(tag.id) ? 'primary' : undefined"
            :variant="form.tagIds.includes(tag.id) ? 'tonal' : 'outlined'"
            @click="toggleTag(tag.id)"
          >
            {{ tag.name }}
          </v-chip>
        </div>
        <v-divider class="mb-4" />
        <div class="text-title-medium font-weight-bold mb-3">
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
  height: 64px;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px;
  padding: 0 16px 0 8px;
}

.editor-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-book-button {
  width: 112px;
  min-width: 112px;
  max-width: 132px;
  height: 36px;
  padding-inline: 12px;
  color: rgb(var(--v-theme-on-surface));
}

.editor-book-button :deep(.v-btn__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-type-region {
  display: flex;
  height: 56px;
  padding: 4px 16px;
}

.editor-type-tabs {
  display: grid;
  width: 100%;
  height: 48px;
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
  gap: 6px;
  border: 0;
  border-inline-end: 1px solid rgb(var(--v-theme-outline));
  background: transparent;
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-weight: 600;
}

.editor-type-tab:last-child {
  border-inline-end: 0;
}

.editor-type-tab-active {
  background: rgb(var(--v-theme-accent));
  color: rgb(var(--v-theme-primary));
}

.editor-body {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  overflow: hidden;
  padding: 4px 16px 16px;
}

.editor-error {
  position: absolute;
  z-index: 2;
  top: 4px;
  right: 16px;
  left: 16px;
  box-shadow: var(--app-card-shadow);
}

.core-inputs,
.thumb-zone {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 10px;
}

.amount-panel {
  position: relative;
  display: flex;
  height: 206px;
  flex-direction: column;
  justify-content: center;
  padding: 14px 18px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 28px;
  background: rgb(var(--v-theme-surface));
  box-shadow: var(--app-card-shadow);
}

.amount-panel-top {
  display: flex;
  width: 100%;
  height: 112px;
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
  font-weight: 700;
}

.amount-value {
  overflow: hidden;
  color: rgb(var(--v-theme-primary));
  font-size: clamp(3rem, 15vw, 4rem);
  font-weight: 800;
  line-height: 1.125;
  text-overflow: ellipsis;
}

.date-button {
  width: 88px;
  min-width: 88px;
  height: 40px;
  flex-shrink: 0;
  padding-inline: 8px;
}

.transfer-target-button {
  position: absolute;
  bottom: 14px;
  left: 18px;
  max-width: calc(100% - 36px);
  height: 36px;
}

.tag-panel {
  display: flex;
  height: 140px;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  padding: 10px 12px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 24px;
  background: rgb(var(--v-theme-surface));
}

.tag-panel-header {
  display: flex;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
}

.tag-options-grid {
  display: grid;
  min-height: 86px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  grid-template-rows: repeat(2, 40px);
  gap: 6px;
}

.tag-option {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  overflow: hidden;
  padding: 0 8px;
  border: 1px solid rgb(var(--v-theme-outline));
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 0.875rem;
  font-weight: 500;
}

.tag-option span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-option-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-accent));
  color: rgb(var(--v-theme-primary));
}

.tag-more {
  color: rgb(var(--v-theme-on-surface));
}

.note-field {
  height: 56px;
  flex: 0 0 56px;
}

.inline-keyboard {
  display: grid;
  height: 280px;
  flex: 0 0 280px;
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
  font-size: 1.5rem;
  font-weight: 800;
  touch-action: manipulation;
}

.keyboard-key-muted {
  background: rgb(var(--v-theme-surface-variant));
  font-weight: 700;
}

.keyboard-key-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-accent));
  color: rgb(var(--v-theme-primary));
}

.editor-actions {
  display: grid;
  height: 48px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  filter: drop-shadow(0 8px 9px rgba(15, 23, 42, 0.14));
}

.editor-actions-single {
  grid-template-columns: 1fr;
}

.tag-sheet-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-height: 860px) {
  .editor-body,
  .core-inputs,
  .thumb-zone {
    gap: 6px;
  }

  .amount-panel {
    height: 150px;
  }

  .tag-panel {
    height: 126px;
    padding-block: 6px;
  }

  .tag-options-grid {
    min-height: 78px;
    grid-template-rows: repeat(2, 36px);
  }

  .inline-keyboard {
    height: 256px;
    flex-basis: 256px;
  }
}

@media (max-height: 760px) {
  .editor-header {
    height: 56px;
  }

  .editor-type-region {
    height: 52px;
    padding-block: 2px;
  }

  .editor-body,
  .core-inputs,
  .thumb-zone {
    gap: 6px;
  }

  .editor-body {
    padding-bottom: 10px;
  }

  .amount-panel {
    height: 150px;
    padding-block: 10px;
  }

  .tag-panel {
    height: 116px;
    padding-block: 4px;
  }

  .tag-options-grid {
    min-height: 72px;
    grid-template-rows: repeat(2, 33px);
  }

  .inline-keyboard {
    height: 224px;
    flex-basis: 224px;
    gap: 6px;
  }

  .keyboard-key {
    border-radius: 14px;
    font-size: 1.375rem;
  }
}

@media (max-width: 370px) {
  .editor-book-button {
    width: 92px;
    min-width: 92px;
  }

  .tag-option {
    padding-inline: 4px;
    font-size: 0.75rem;
  }
}
</style>
