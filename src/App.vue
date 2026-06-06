<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import { useAppLocale } from '@/composables/useAppLocale';
import { useAccountStore } from '@/modules/accounts/account.store';
import { useRecurringStore } from '@/modules/recurring/recurring.store';
import AmountText from '@/components/shared/AmountText.vue';

const { t } = useI18n();
const appLocale = useAppLocale();
const recurringStore = useRecurringStore();
const accountStore = useAccountStore();
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
  await recurringStore.loadDue();
  sheetOpen.value = dueEvents.value.length > 0;
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
  appLocale.init();
  await accountStore.load();
  await refreshDueSheet();
});
</script>

<template>
  <v-app>
    <RouterView />

    <v-bottom-sheet v-model="sheetOpen">
      <v-card class="pa-4">
        <div class="d-flex align-center mb-3">
          <div class="text-h6 font-weight-bold">{{ t('recurring.dueTitle') }}</div>
          <v-spacer />
          <v-btn icon="$close" variant="text" @click="sheetOpen = false" />
        </div>

        <v-alert v-if="error" class="mb-4" type="error" variant="tonal">
          {{ error }}
        </v-alert>

        <v-list class="bg-transparent" lines="two">
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
  </v-app>
</template>
