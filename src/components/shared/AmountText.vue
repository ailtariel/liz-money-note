<script setup lang="ts">
import { computed } from 'vue';
import { formatMinorUnits, type CurrencyCode } from '@/modules/shared/money';

const props = defineProps<{
  amount: number;
  currency: CurrencyCode;
  type?: 'income' | 'expense' | 'neutral';
  signed?: boolean;
}>();

const colorClass = computed(() => {
  if (props.type === 'income') {
    return 'amount-income';
  }

  if (props.type === 'expense') {
    return 'amount-expense';
  }

  return 'amount-neutral';
});

const text = computed(() => {
  const prefix =
    props.signed && props.type === 'income'
      ? '+ '
      : props.signed && props.type === 'expense'
        ? '- '
        : '';

  return `${prefix}${formatMinorUnits(props.amount, props.currency)}`;
});
</script>

<template>
  <span :class="colorClass">{{ text }}</span>
</template>
