<script setup lang="ts">
import { computed } from 'vue';
import type { Transaction } from '@/modules/transactions/transaction.types';
import { useI18n } from '@/i18n';
import useTransaction from '@/modules/transactions/useTransactionDisplay';
import { useTagStore } from '@/modules/tags/tag.store';
import type { Tag } from '@/modules/tags/tag.types';
import AmountText from '@/components/shared/AmountText.vue';

interface Props {
  transaction: Transaction | null;
}
const props = defineProps<Props>();
const emit = defineEmits(['close']);

const { t } = useI18n();
const trans = useTransaction();
const tagStore = useTagStore();

const selectedTags = computed(() =>
  props.transaction
    ? props.transaction.tagIds
        .map((id) => tagStore.tags.find((tag) => tag.id === id))
        .filter((tag): tag is Tag => Boolean(tag))
    : []
);

const removeTransaction = async () => {
  if (props.transaction?.id) {
    await trans.removeTransaction(props?.transaction.id);
  }
  emit('close');
};
</script>
<template>
  <v-card v-if="transaction" class="pa-4">
    <div class="d-flex align-center mb-4">
      <div class="text-h6 font-weight-bold">
        {{ t('transaction.detail') }}
      </div>
      <v-spacer />
      <v-btn icon="$close" variant="text" @click="$emit('close')" />
    </div>
    <div class="text-center mb-4">
      <div class="text-caption text-medium-emphasis">
        {{ t('transaction.amount') }}
      </div>
      <div class="text-h4 font-weight-bold">
        <AmountText
          :amount="transaction.amount"
          :currency="transaction.currency"
          :signed="transaction.type !== 'transfer'"
          :type="
            transaction.type === 'income'
              ? 'income'
              : transaction.type === 'expense'
                ? 'expense'
                : 'neutral'
          "
        />
      </div>
    </div>
    <v-list class="bg-transparent">
      <v-list-item
        :title="t('transaction.category')"
        :subtitle="trans.getTitle(transaction)"
      />
      <v-list-item
        :title="t('transaction.account')"
        :subtitle="trans.getAccountName(transaction.accountId)"
      />
      <v-list-item
        :title="t('transaction.book')"
        :subtitle="trans.getBookName(transaction.bookId)"
      />
      <v-list-item
        :title="t('transaction.occurredAt')"
        :subtitle="transaction.occurredAt"
      />
      <v-list-item
        :title="t('common.note')"
        :subtitle="transaction.note || '-'"
      />
    </v-list>
    <div v-if="selectedTags.length" class="d-flex flex-wrap ga-2 mt-2">
      <v-chip
        v-for="tag in selectedTags"
        :key="tag.id"
        :color="tag.color || undefined"
        variant="tonal"
      >
        {{ tag.name }}
      </v-chip>
    </div>
    <div class="d-flex ga-2 mt-5">
      <v-btn block variant="tonal">{{ t('common.edit') }}</v-btn>
      <v-btn block variant="tonal">{{ t('common.copy') }}</v-btn>
      <v-btn block color="error" variant="tonal" @click="removeTransaction">
        {{ t('common.delete') }}
      </v-btn>
    </div>
  </v-card>
</template>
