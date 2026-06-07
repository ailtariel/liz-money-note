<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { clearSystemCache } from './cache.service';

const { t } = useI18n();
const loading = ref(false);
const error = ref('');
const message = ref('');

async function clearCache() {
  loading.value = true;
  error.value = '';
  message.value = '';

  try {
    const result = await clearSystemCache();
    message.value = result.androidCacheCleared
      ? t('system.cache.clearDoneAndroid')
      : t('system.cache.clearDoneBrowser', { count: result.cacheStorageCount });
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('system.cache.clearFailed');
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
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>
        <v-alert v-if="message" type="success" variant="tonal">{{ message }}</v-alert>

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
