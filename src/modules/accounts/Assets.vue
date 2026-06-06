<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useDefaultCurrencyStore } from '@/modules/settings/default-currency.store';
import { formatMinorUnits } from '@/modules/shared/money';
import { accountTypeIcon, accountTypeLabel } from '@/components/shared/financeDisplay';
import AppBarVue from '@/components/shared/app-bar.vue';

const { t } = useI18n();
const accountStore = useAccountStore();
const defaultCurrencyStore = useDefaultCurrencyStore();

const accounts = computed(() => accountStore.accounts);
const baseCurrency = computed(() => accounts.value[0]?.currency ?? defaultCurrencyStore.currency);
const totalAssets = computed(() =>
  accounts.value
    .filter((account) => account.isIncludedInAssets && !account.isArchived)
    .reduce((sum, account) => sum + account.currentBalance, 0)
);

onMounted(async () => {
  await Promise.all([accountStore.load(), defaultCurrencyStore.load()]);
});
</script>

<template>
  <AppBarVue />
  <v-main>
    <v-container>
      <div class="d-flex flex-column ga-4">
        <v-card class="asset-hero pa-5 text-white">
          <div class="asset-hero-label opacity-80">{{ t('assets.total') }}</div>
          <div class="asset-hero-amount mt-2">
            {{ formatMinorUnits(totalAssets, baseCurrency) }}
          </div>
          <div class="asset-hero-caption opacity-80 mt-1">{{ t('assets.included') }}</div>
        </v-card>

        <v-card v-for="account in accounts" :key="account.id" class="asset-card soft-card">
          <div class="d-flex align-center ga-3">
            <v-avatar
              :color="account.isIncludedInAssets ? 'primary' : 'secondary'"
              size="36"
              variant="tonal"
            >
              <v-icon :icon="accountTypeIcon(account.type)" size="20" />
            </v-avatar>
            <div class="flex-grow-1 min-w-0">
              <div class="asset-title text-truncate">{{ account.name }}</div>
              <div class="asset-subtitle text-medium-emphasis text-truncate">
                {{ accountTypeLabel(account.type, t) }} &middot; {{ account.currency }}
              </div>
            </div>
            <div class="asset-value-col text-right">
              <div class="asset-amount">
                {{ formatMinorUnits(account.currentBalance, account.currency) }}
              </div>
              <div class="asset-status text-medium-emphasis">
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
  color: rgb(var(--v-theme-summary-text));
  background: rgb(var(--v-theme-summary));
}

.asset-hero-label,
.asset-hero-caption {
  font-size: 0.75rem;
  line-height: 1.45;
}

.asset-hero-amount {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.3;
}

.asset-card {
  padding: 1rem;
}

.asset-title {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.45;
}

.asset-subtitle {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.45;
}

.asset-value-col {
  min-width: 0;
  max-width: 10rem;
}

.asset-amount {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  white-space: nowrap;
}

.asset-status {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  line-height: 1.45;
}
</style>
