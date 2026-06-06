<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import type { Transaction } from '@/modules/transactions/transaction.types';
import type { TransactionListRow } from '@/modules/transactions/transaction-ui.types';
import type { Tag } from '@/modules/tags/tag.types';
import {
  formatShortDate,
  formatTime
} from '@/components/shared/financeDisplay';

import { formatMinorUnits } from '@/modules/shared/money';
import useTransaction from '@/modules/transactions/useTransactionDisplay';
import { useTagStore } from '@/modules/tags/tag.store';
import { useTransactionStore } from '@/modules/transactions/transaction.store';
import AmountText from '@/components/shared/AmountText.vue';

interface Props {
  item: TransactionListRow;
}
defineProps<Props>();
const emit = defineEmits(['openDetail']);

const { t } = useI18n();
const trans = useTransaction();
const tagStore = useTagStore();
const transactionStore = useTransactionStore();

const showBook = computed(() => !transactionStore.filters.bookId);
const showAccount = computed(() => !transactionStore.filters.accountId);

const getTransactionTags = (transaction: Transaction): Tag[] =>
  transaction.tagIds
    .map((tagId) => tagStore.tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag));

const openDetail = (transaction: Transaction) => {
  emit('openDetail', transaction);
};
</script>
<template>
  <div v-if="item.kind === 'date'" class="date-row">
    <div class="date-title">
      {{ formatShortDate(item.date, t) }}
    </div>
    <div class="date-summary text-medium-emphasis">
      <span v-if="item.income"
        >{{ t('transaction.income') }}
        {{ formatMinorUnits(item.income, item.currency) }}</span
      >
      <span v-if="item.expense" class="ml-2"
        >{{ t('transaction.expense') }}
        {{ formatMinorUnits(item.expense, item.currency) }}</span
      >
    </div>
  </div>
  <v-card
    v-else
    class="transaction-card soft-card"
    role="button"
    tabindex="0"
    @click="openDetail(item.transaction)"
    @keydown.enter="openDetail(item.transaction)"
  >
    <div class="transaction-content">
      <div class="transaction-icon-col">
        <v-avatar
          :color="trans.getColor(item.transaction)"
          size="36"
          variant="tonal"
        >
          <v-icon :icon="trans.getIcon(item.transaction)" size="20" />
        </v-avatar>
      </div>
      <div class="transaction-main min-w-0">
        <v-row class="transaction-row" no-gutters>
          <v-col class="min-w-0" cols="12">
            <div class="transaction-title text-truncate">
              {{ trans.getTitle(item.transaction) }}
            </div>
          </v-col>
        </v-row>
        <v-row class="transaction-row" no-gutters>
          <v-col class="transaction-subtitle text-medium-emphasis min-w-0">
            <span v-if="showBook" class="transaction-book text-truncate">
              {{ trans.getBookName(item.transaction.bookId) }}
            </span>
            <v-chip
              v-for="tag in getTransactionTags(item.transaction)"
              :key="tag.id"
              class="transaction-tag"
              :color="tag.color || 'primary'"
              size="x-small"
              variant="tonal"
            >
              {{ tag.name }}
            </v-chip>
          </v-col>
          <v-col class="transaction-amount-col" cols="auto">
            <AmountText
              class="transaction-amount"
              :amount="item.transaction.amount"
              :currency="item.transaction.currency"
              :signed="item.transaction.type !== 'transfer'"
              :type="
                item.transaction.type === 'income'
                  ? 'income'
                  : item.transaction.type === 'expense'
                    ? 'expense'
                    : 'neutral'
              "
            />
          </v-col>
        </v-row>
        <v-row class="transaction-row" no-gutters>
          <v-col class="transaction-third-line text-medium-emphasis min-w-0">
            {{ formatTime(item.transaction.occurredAt) }}
          </v-col>
          <v-col
            v-if="showAccount"
            class="transaction-account text-medium-emphasis text-truncate"
            cols="auto"
          >
            {{ trans.getAccountName(item.transaction.accountId) }}
          </v-col>
        </v-row>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1rem 0.875rem 0.625rem;
}

.date-title {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.45;
}

.date-summary {
  font-size: 0.75rem;
  line-height: 1.45;
}

.transaction-card {
  padding: 1rem 1rem 1.0625rem;
  margin-bottom: 0.75rem;
}

.transaction-content {
  display: flex;
  align-items: stretch;
  gap: 0.875rem;
}

.transaction-icon-col {
  display: flex;
  align-items: center;
}

.transaction-main {
  flex: 1 1 auto;
}

.transaction-row {
  align-items: center;
}

.transaction-title {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.45;
}

.transaction-subtitle {
  display: flex;
  min-height: 1.25rem;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.45;
}

.transaction-book {
  flex: 0 1 auto;
}

.transaction-tag {
  flex: 0 0 auto;
  max-width: 6rem;
}

.transaction-tag :deep(.v-chip__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-third-line {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.45;
}

.transaction-amount-col,
.transaction-account {
  min-width: 0;
  text-align: right;
}

.transaction-account {
  max-width: 9rem;
  font-size: 0.75rem;
  line-height: 1.45;
}

.transaction-amount {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
}
</style>
