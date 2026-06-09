<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useAppLocale } from '@/modules/shared/useAppLocale';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useRecurringStore } from '@/modules/recurring/recurring.store';
import { useSnackQueueStore } from '@/modules/snack-queue/snack-queue.store';
import { useAppUpdateStore } from '@/modules/app-update/app-update.store';
import { useApplyTheme } from '@/modules/theme/useApplyTheme';
import { useSystemStore } from '@/app/system.store';
import {
  loadSystemDatabaseState,
  loadSystemDueRecurringEvents,
  refreshSystemExchangeRates
} from '@/shared/lib/core/db';
import { useCronJobManager } from '@/shared/lib/cron-job-manager';
import AmountText from '@/components/shared/AmountText.vue';

const { t } = useI18n();
const appLocale = useAppLocale();
useApplyTheme();
const cronJobManager = useCronJobManager();
const recurringStore = useRecurringStore();
const accountStore = useAccountStore();
const snackQueueStore = useSnackQueueStore();
const appUpdateStore = useAppUpdateStore();
const systemStore = useSystemStore();
const sheetOpen = ref(false);
const error = ref('');

const dueEvents = computed(() => recurringStore.dueEvents);

function accountName(id: number | null) {
  if (!id) {
    return '-';
  }

  return accountStore.accounts.find((account) => account.id === id)?.name ?? '-';
}

async function refreshDueSheet() {
  sheetOpen.value = (await loadSystemDueRecurringEvents()) > 0;
}

async function refreshExchangeRates(force = false) {
  await refreshSystemExchangeRates(force);
}

async function checkAppUpdate() {
  try {
    await appUpdateStore.check();
  } catch (err) {
    console.error('Failed to check app update.', err);
  }
}

async function approve(index: number) {
  error.value = '';
  try {
    await recurringStore.approve(dueEvents.value[index]);
    await accountStore.load();
    sheetOpen.value = dueEvents.value.length > 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('recurring.approveFailed');
  }
}

async function skip(index: number) {
  error.value = '';
  try {
    await recurringStore.skip(dueEvents.value[index]);
    sheetOpen.value = dueEvents.value.length > 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('recurring.skipFailed');
  }
}

async function disable(index: number) {
  error.value = '';
  try {
    await recurringStore.disable(dueEvents.value[index].id);
    sheetOpen.value = dueEvents.value.length > 0;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('recurring.disableFailed');
  }
}

onMounted(async () => {
  systemStore.refreshPlatform();
  appLocale.init();
  await loadSystemDatabaseState();

  try {
    await refreshExchangeRates();
  } catch (err) {
    console.error('Failed to update exchange rates.', err);
  }

  cronJobManager.addJob({
    id: 'exchange-rate-refresh',
    name: 'Exchange rate refresh',
    interval: 24 * 60 * 60 * 1000,
    execute: () => refreshExchangeRates()
  });

  cronJobManager.addJob({
    id: 'app-update-check',
    name: 'App update check',
    interval: 60 * 60 * 1000,
    immediate: true,
    maxRetries: 1,
    execute: () => checkAppUpdate()
  });

  await refreshDueSheet();
});
</script>

<template>
  <v-app>
    <RouterView />

    <v-bottom-sheet v-model="sheetOpen">
      <v-card class="pa-4" color="surface">
        <div class="d-flex align-center mb-3">
          <div class="text-title-large font-weight-bold">{{ t('recurring.dueTitle') }}</div>
          <v-spacer />
          <v-btn icon="$close" variant="text" @click="sheetOpen = false" />
        </div>

        <v-alert v-if="error" class="mb-4" type="error" variant="tonal">
          {{ error }}
        </v-alert>

        <v-list lines="two">
          <v-list-item v-for="(event, index) in dueEvents" :key="event.id" class="px-0">
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon icon="$recurring" />
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold">
              <AmountText :amount="event.amount" :currency="event.currency" />
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ event.nextTriggerDate }} · {{ accountName(event.accountId) }}
              <span v-if="event.targetAccountId"> → {{ accountName(event.targetAccountId) }}</span>
            </v-list-item-subtitle>
            <template #append>
              <div class="d-flex ga-1">
                <v-btn size="small" variant="tonal" @click="approve(index)">
                  {{ t('common.approve') }}
                </v-btn>
                <v-btn size="small" variant="text" @click="skip(index)">
                  {{ t('common.skip') }}
                </v-btn>
                <v-btn size="small" variant="text" @click="disable(index)">
                  {{ t('common.disable') }}
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>
    </v-bottom-sheet>

    <v-snackbar-queue
      v-model="snackQueueStore.queue"
      closable
      location="bottom"
      timer="bottom"
      :total-visible="2"
    />
  </v-app>
</template>
