<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { useSnackQueueStore } from '@/modules/snack-queue/snack-queue.store';
import { clearSystemCache } from './cache.service';

const { t } = useI18n();
const snackQueueStore = useSnackQueueStore();
const loading = ref(false);

async function clearCache() {
  loading.value = true;

  try {
    const result = await clearSystemCache();
    snackQueueStore.success(
      result.androidCacheCleared
        ? t('system.cache.clearDoneAndroid')
        : t('system.cache.clearDoneBrowser', { count: result.cacheStorageCount })
    );
  } catch (err) {
    snackQueueStore.error(
      err instanceof Error ? err.message : t('system.cache.clearFailed')
    );
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AppBarVue />

  <v-main>
    <v-container class="pa-4">
      <div class="d-flex flex-column ga-4">
        <v-card class="soft-card">
          <div class="px-4 pt-4 text-title-medium font-weight-bold">
            {{ t('system.cache.title') }}
          </div>
          <v-list>
            <v-list-item
              :disabled="loading"
              :subtitle="t('system.cache.subtitle')"
              :title="t('system.cache.clear')"
              @click="clearCache"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="$clearCache" />
                </v-avatar>
              </template>
              <template #append>
                <v-progress-circular
                  v-if="loading"
                  color="primary"
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
