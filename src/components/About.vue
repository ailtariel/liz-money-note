<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { useAppUpdateStore } from '@/modules/app-update/app-update.store';
import { useSnackQueueStore } from '@/modules/snack-queue/snack-queue.store';

const { t } = useI18n();
const appUpdateStore = useAppUpdateStore();
const snackQueueStore = useSnackQueueStore();
const releaseUrl = computed(
  () =>
    appUpdateStore.manifest?.downloadUrl ??
    appUpdateStore.manifest?.releaseUrl ??
    ''
);

const updateButtonText = computed(() =>
  appUpdateStore.hasUpdate
    ? t('about.updateVersion', { version: appUpdateStore.latestVersion })
    : t('about.checkUpdate')
);
const actionLoading = computed(
  () => appUpdateStore.checking || appUpdateStore.installing
);

async function checkUpdate() {
  try {
    const result = await appUpdateStore.check();
    if (result?.hasUpdate) {
      snackQueueStore.info(
        t('about.updateAvailable', { version: result.latestVersion })
      );
      return;
    }

    snackQueueStore.success(t('about.noUpdate'));
  } catch (err) {
    console.error('Manual app update check failed.', err);
    snackQueueStore.error(t('about.checkFailed'));
  }
}

async function installUpdate() {
  try {
    await appUpdateStore.install();
  } catch (err) {
    console.error('App update installation failed.', err);
    snackQueueStore.error(t('about.installFailed'));
  }
}

async function handleUpdateAction() {
  if (appUpdateStore.hasUpdate) {
    await installUpdate();
    return;
  }

  await checkUpdate();
}
</script>

<template>
  <AppBarVue />
  <v-main>
    <v-container class="pa-4">
      <v-card class="soft-card">
        <v-card-text class="d-flex flex-column ga-3">
          <div class="d-flex align-center ga-3">
            <span>{{ t('about.currentVersion') }}</span>
            <span class="font-weight-bold">{{
              appUpdateStore.currentVersion
            }}</span>
          </div>

          <v-alert v-if="appUpdateStore.hasUpdate" type="info" variant="tonal">
            {{
              t('about.updateAvailable', {
                version: appUpdateStore.latestVersion
              })
            }}
          </v-alert>

          <v-btn
            v-if="appUpdateStore.enabled"
            color="primary"
            variant="tonal"
            :loading="actionLoading"
            :disabled="appUpdateStore.hasUpdate && !releaseUrl"
            @click="handleUpdateAction"
          >
            {{ updateButtonText }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>
