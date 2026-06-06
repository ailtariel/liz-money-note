<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from '@/i18n';
import { useAccountStore } from '@/modules/accounts/account.store';
import { formatMinorUnits } from '@/modules/shared/money';
import MobilePage from '@/components/shared/MobilePage.vue';
import { accountTypeIcon, accountTypeLabel } from '@/components/shared/financeDisplay';

const { t } = useI18n();
const accountStore = useAccountStore();

const accounts = computed(() => accountStore.accounts);
const baseCurrency = computed(() => accounts.value[0]?.currency ?? 'AED');
const totalAssets = computed(() =>
  accounts.value
    .filter((account) => account.isIncludedInAssets && !account.isArchived)
    .reduce((sum, account) => sum + account.currentBalance, 0)
);

onMounted(() => accountStore.load());
</script>

<template>
  <MobilePage :title="t('nav.assets')">
    <div class="d-flex flex-column ga-4">
      <v-card class="asset-hero pa-5 text-white">
        <div class="text-body-2 opacity-80">{{ t('assets.total') }}</div>
        <div class="text-h4 font-weight-bold mt-2">{{ formatMinorUnits(totalAssets, baseCurrency) }}</div>
        <div class="text-caption opacity-80 mt-1">{{ t('assets.included') }}</div>
      </v-card>

      <v-card v-for="account in accounts" :key="account.id" class="soft-card pa-4">
        <div class="d-flex align-center ga-3">
          <v-avatar :color="account.isIncludedInAssets ? 'primary' : 'secondary'" variant="tonal">
            <v-icon :icon="accountTypeIcon(account.type)" />
          </v-avatar>
          <div class="flex-grow-1">
            <div class="text-subtitle-1 font-weight-bold">{{ account.name }}</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ accountTypeLabel(account.type, t) }} · {{ account.currency }}
            </div>
          </div>
          <div class="text-right">
            <div class="font-weight-bold">{{ formatMinorUnits(account.currentBalance, account.currency) }}</div>
            <div class="text-caption text-medium-emphasis">
              {{ account.isIncludedInAssets ? t('assets.included') : t('assets.excluded') }}
            </div>
          </div>
        </div>
      </v-card>
    </div>
  </MobilePage>
</template>

<style scoped>
.asset-hero {
  background: linear-gradient(135deg, #0f766e, #2563eb);
}
</style>
