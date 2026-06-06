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
import AmountText from '@/components/shared/AmountText.vue';

interface Props {
  item: TransactionListRow;
}
defineProps<Props>();
const emit = defineEmits(['openDetail']);

const { t } = useI18n();
const trans = useTransaction();

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
      <v-avatar
        :color="trans.getColor(item.transaction)"
        size="36"
        variant="tonal"
      >
        <v-icon :icon="trans.getIcon(item.transaction)" size="20" />
      </v-avatar>
      <div class="min-w-0 flex-grow-1">
        <div class="transaction-title text-truncate">
          {{ trans.getTitle(item.transaction) }}
        </div>
        <div class="transaction-subtitle text-medium-emphasis text-truncate">
          {{ trans.getAccountName(item.transaction.accountId) }} ·
          {{ trans.getBookName(item.transaction.bookId) }}
        </div>
        <div class="transaction-time text-medium-emphasis">
          {{ formatTime(item.transaction.occurredAt) }}
        </div>
      </div>
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
    </div>
  </v-card>
</template>

<style scoped>
.date-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
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
  align-items: center;
  gap: 0.875rem;
}

.transaction-title {
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1.45;
}

.transaction-subtitle {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  line-height: 1.45;
}

.transaction-time {
  margin-top: 0.125rem;
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
