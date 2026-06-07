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
  <div
    v-if="item.kind === 'date'"
    class="d-flex align-center justify-space-between ga-8 px-3 pt-4 pb-2"
  >
    <div class="text-body-medium font-weight-bold">
      {{ formatShortDate(item.date, t) }}
    </div>
    <div class="text-label-medium text-medium-emphasis">
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
    class="soft-card mb-3 pa-4"
    role="button"
    tabindex="0"
    @click="openDetail(item.transaction)"
    @keydown.enter="openDetail(item.transaction)"
  >
    <div class="d-flex align-stretch ga-3">
      <div class="d-flex align-center">
        <v-avatar
          :color="trans.getColor(item.transaction)"
          size="36"
          variant="tonal"
        >
          <v-icon :icon="trans.getIcon(item.transaction)" size="20" />
        </v-avatar>
      </div>
      <div class="flex-grow-1 min-w-0">
        <v-row class="align-center" no-gutters>
          <v-col class="min-w-0" cols="12">
            <div class="text-title-small text-truncate">
              {{ trans.getTitle(item.transaction) }}
            </div>
          </v-col>
        </v-row>
        <v-row class="align-center" no-gutters>
          <v-col
            class="transaction-subtitle d-flex align-center ga-1 mt-1 text-label-medium text-medium-emphasis min-w-0"
          >
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
              class="transaction-amount text-body-medium"
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
        <v-row class="align-center" no-gutters>
          <v-col class="mt-1 text-label-medium text-medium-emphasis min-w-0">
            {{ formatTime(item.transaction.occurredAt) }}
          </v-col>
          <v-col
            v-if="showAccount"
            class="text-label-medium text-medium-emphasis text-truncate"
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
.transaction-subtitle {
  min-height: 1.25rem;
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

.transaction-amount-col,
.transaction-account {
  min-width: 0;
  text-align: right;
}

.transaction-amount {
  font-weight: 600;
  white-space: nowrap;
}
</style>
