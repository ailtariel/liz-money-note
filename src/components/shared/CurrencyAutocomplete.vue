<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import { currencyOptions, type CurrencyCode } from '@/modules/shared/money';

const props = defineProps<{
  modelValue: CurrencyCode | null;
  label: string;
  currencies?: CurrencyCode[];
  disabledCurrencies?: CurrencyCode[];
  autoFocus?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: CurrencyCode | null];
}>();

const { t } = useI18n();

const items = computed(() => {
  const allowedCodes = props.currencies ? new Set(props.currencies) : null;
  const disabledCodes = new Set(props.disabledCurrencies ?? []);

  return currencyOptions
    .filter((currency) => !allowedCodes || allowedCodes.has(currency.code))
    .map((currency) => {
      const currencyName = t(currency.name);
      const countryName = t(currency.country);

      return {
        code: currency.code,
        currencyName,
        countryName,
        searchText: `${currency.code} ${currencyName} ${countryName}`,
        disabled: disabledCodes.has(currency.code)
      };
    });
});

function filterCurrency(_: string, query: string, item?: { raw?: { searchText?: string } }) {
  return item?.raw?.searchText?.toLowerCase().includes(query.toLowerCase()) ?? false;
}
</script>

<template>
  <v-autocomplete
    :autofocus="autoFocus"
    clearable
    :custom-filter="filterCurrency"
    :items="items"
    :label="label"
    :model-value="modelValue"
    item-title="code"
    item-value="code"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item
        v-bind="itemProps"
        :disabled="item.disabled"
        :class="{ 'currency-item-selected': item.disabled }"
      >
        <template #prepend>
          <v-icon v-if="item.disabled" icon="$check" size="16" />
          <div v-else class="ms-12"></div>
        </template>
        <v-list-item-subtitle>
          {{ item.currencyName }} · {{ item.countryName }}
        </v-list-item-subtitle>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      {{ item.code }}
    </template>
  </v-autocomplete>
</template>

<style scoped>
.currency-item-selected {
  color: rgb(var(--v-theme-primary));
  opacity: 1;
}
</style>
