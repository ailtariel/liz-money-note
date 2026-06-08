<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/i18n';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import AppBarVue from '@/components/shared/app-bar.vue';
import { resetDatabaseToAssets } from '@/modules/database/connection';
import { useSnackQueueStore } from '@/modules/snack-queue/snack-queue.store';
import { clearSystemCache } from './cache.service';

const { t } = useI18n();
const snackQueueStore = useSnackQueueStore();
const cacheLoading = ref(false);
const resetLoading = ref(false);
const cacheConfirmDialog = ref(false);
const resetDatabaseConfirmDialog = ref(false);

function requestClearCache() {
  cacheConfirmDialog.value = true;
}

async function confirmClearCache() {
  cacheLoading.value = true;

  try {
    const result = await clearSystemCache();
    snackQueueStore.success(
      result.androidCacheCleared
        ? t('system.cache.clearDoneAndroid')
        : t('system.cache.clearDoneBrowser', {
            count: result.cacheStorageCount
          })
    );
  } catch (err) {
    snackQueueStore.error(
      err instanceof Error ? err.message : t('system.cache.clearFailed')
    );
  } finally {
    cacheLoading.value = false;
  }
}

function requestResetDatabase() {
  resetDatabaseConfirmDialog.value = true;
}

async function confirmResetDatabase() {
  resetLoading.value = true;

  try {
    await resetDatabaseToAssets();
    snackQueueStore.success(t('system.database.resetDone'));
    window.location.reload();
  } catch (err) {
    snackQueueStore.error(
      err instanceof Error ? err.message : t('system.database.resetFailed')
    );
    resetLoading.value = false;
  }
}
</script>

<template>
  <AppBarVue />

  <ConfirmationDialog
    v-model="cacheConfirmDialog"
    :title="t('system.cache.confirmTitle')"
    :message="t('system.cache.confirmMessage')"
    :confirm-text="t('system.cache.clear')"
    :cancel-text="t('common.cancel')"
    @confirm="confirmClearCache"
  />

  <ConfirmationDialog
    v-model="resetDatabaseConfirmDialog"
    :title="t('system.database.confirmTitle')"
    :message="t('system.database.confirmMessage')"
    :confirm-text="t('system.database.reset')"
    :cancel-text="t('common.cancel')"
    confirm-color="error"
    @confirm="confirmResetDatabase"
  />

  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <v-card class="soft-card">
          <div class="px-4 pt-4 text-title-medium font-weight-bold">
            {{ t('system.cache.title') }}
          </div>
          <v-list lines="three">
            <v-list-item
              class="align-start py-3"
              :disabled="cacheLoading || resetLoading"
              :title="t('system.cache.clear')"
              @click="requestClearCache"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="$clearCache" />
                </v-avatar>
              </template>
              <template #subtitle>
                <div class="text-body-small text-medium-emphasis text-wrap">
                  {{ t('system.cache.subtitle') }}
                </div>
              </template>
              <template #append>
                <v-progress-circular
                  v-if="cacheLoading"
                  color="primary"
                  indeterminate
                  size="24"
                  width="3"
                />
                <v-icon v-else icon="$next" />
              </template>
            </v-list-item>

            <v-list-item
              class="align-start py-3"
              :disabled="cacheLoading || resetLoading"
              :title="t('system.database.reset')"
              @click="requestResetDatabase"
            >
              <template #prepend>
                <v-avatar color="error" variant="tonal">
                  <v-icon icon="$restore" />
                </v-avatar>
              </template>
              <template #subtitle>
                <div class="text-body-small text-medium-emphasis text-wrap">
                  {{ t('system.database.subtitle') }}
                </div>
              </template>
              <template #append>
                <v-progress-circular
                  v-if="resetLoading"
                  color="error"
                  indeterminate
                  size="24"
                  width="3"
                />
                <v-icon v-else icon="$next" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>
