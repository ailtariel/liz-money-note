<script setup lang="ts">
import { useI18n } from '@/i18n';
import type { Transaction } from '@/modules/transactions/transaction.types';
import type { TransactionListRow } from '@/modules/transactions/transaction-ui.types';
import {
  formatShortDate,
  formatTime
} from '@/components/shared/financeDisplay';

import { formatMinorUnits } from '@/modules/shared/money';
import useTransaction from '@/modules/transactions/useTransactionDisplay';

interface Props {
  item: TransactionListRow;
}
defineProps<Props>();
const emit = defineEmits(['openDetail']);

const { t } = useI18n();
const trans = useTransaction();

// actions
const openDetail = (transaction: Transaction) => {
  emit('openDetail', transaction);
};
</script>
<template>
  <div v-if="item.kind === 'date'" class="date-row">
    <div class="font-weight-bold">
      {{ formatShortDate(item.date, t) }}
    </div>
    <div class="text-body-2 text-medium-emphasis">
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
    <div class="d-flex align-center ga-3">
      <v-avatar
        :color="trans.getColor(item.transaction)"
        size="52"
        variant="tonal"
      >
        <v-icon :icon="trans.getIcon(item.transaction)" />
      </v-avatar>
      <div class="min-w-0 flex-grow-1">
        <div class="text-subtitle-1 font-weight-bold text-truncate">
          {{ trans.getTitle(item.transaction) }}
        </div>
        <div class="text-body-2 text-medium-emphasis text-truncate">
          {{ trans.getAccountName(item.transaction.accountId) }} ·
          {{ trans.getBookName(item.transaction.bookId) }}
        </div>
        <div class="text-body-2 text-medium-emphasis">
          {{ formatTime(item.transaction.occurredAt) }}
        </div>
      </div>
      <AmountText
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
    </div>
  </v-card>
</template>
