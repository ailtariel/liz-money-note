<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useCurrencyStore } from '@/modules/currency/currency.store';
import { formatMinorUnits } from '@/modules/shared/money';
import { accountTypeIcon, accountTypeLabel } from '@/components/shared/financeDisplay';
import AppBarVue from '@/components/shared/app-bar.vue';

const { t } = useI18n();
const accountStore = useAccountStore();
const currencyStore = useCurrencyStore();

const accounts = computed(() => accountStore.accounts);
const baseCurrency = computed(() => accounts.value[0]?.currency ?? currencyStore.currency);
const totalAssets = computed(() =>
  accounts.value
    .filter((account) => account.isIncludedInAssets && !account.isArchived)
    .reduce((sum, account) => sum + account.currentBalance, 0)
);

onMounted(async () => {
  await Promise.all([accountStore.load(), currencyStore.load()]);
});
</script>

<template>
  <AppBarVue />
  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <v-card class="asset-hero pa-5" color="summary">
          <div class="text-label-medium opacity-80">{{ t('assets.total') }}</div>
          <div class="mt-2 text-headline-small font-weight-bold">
            {{ formatMinorUnits(totalAssets, baseCurrency) }}
          </div>
          <div class="mt-1 text-label-medium opacity-80">{{ t('assets.included') }}</div>
        </v-card>

        <v-card v-for="account in accounts" :key="account.id" class="soft-card pa-4">
          <div class="d-flex align-center ga-3">
            <v-avatar
              :color="account.isIncludedInAssets ? 'primary' : 'secondary'"
              size="36"
              variant="tonal"
            >
              <v-icon :icon="accountTypeIcon(account.type)" size="20" />
            </v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="text-body-medium text-truncate">{{ account.name }}</div>
              <div class="mt-1 text-label-medium text-medium-emphasis text-truncate">
                {{ accountTypeLabel(account.type, t) }} &middot; {{ account.currency }}
              </div>
            </div>
            <div class="asset-value-col text-right">
              <div class="text-body-medium font-weight-bold text-no-wrap">
                {{ formatMinorUnits(account.currentBalance, account.currency) }}
              </div>
              <div class="mt-1 text-label-medium text-medium-emphasis">
                {{ account.isIncludedInAssets ? t('assets.included') : t('assets.excluded') }}
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>

<style scoped>
.asset-hero {
  color: rgb(var(--v-theme-on-primary));
}

.asset-value-col {
  min-width: 0;
  max-width: 10rem;
}
</style>
