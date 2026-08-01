import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { Capacitor } from '@capacitor/core';
import { getAppConfig } from '@/core/app-config';
import { checkAppUpdate, installAppUpdate } from '@/shared/lib/app-update';
import type { AppUpdateManifest } from '@/shared/lib/app-update/types';

export const useAppUpdateStore = defineStore('appUpdate', () => {
  const config = getAppConfig();
  const currentVersion = ref(__APP_VERSION__);
  const latestVersion = ref(__APP_VERSION__);
  const manifest = ref<AppUpdateManifest | null>(null);
  const lastCheckedAt = ref<string | null>(null);
  const checking = ref(false);
  const installing = ref(false);
  const enabled = computed(
    () =>
      Capacitor.getPlatform() === 'android' &&
      config.feature_flags.enable_app_update === true
  );
  const hasUpdate = computed(() => enabled.value && Boolean(manifest.value));

  function clearUpdateState() {
    manifest.value = null;
    latestVersion.value = currentVersion.value;
  }

  async function check() {
    if (!enabled.value) {
      clearUpdateState();
      return;
    }

    const manifestUrl =
      typeof config.update_manifest_url === 'string'
        ? config.update_manifest_url.trim()
        : '';

    if (!manifestUrl) {
      clearUpdateState();
      return;
    }

    checking.value = true;
    try {
      const result = await checkAppUpdate(manifestUrl, currentVersion.value);
      lastCheckedAt.value = new Date().toISOString();
      latestVersion.value = result.latestVersion;
      manifest.value = result.hasUpdate ? result.manifest : null;
      return result;
    } finally {
      checking.value = false;
    }
  }

  async function install() {
    if (!enabled.value) {
      throw new Error('App updates are disabled for this platform or build.');
    }

    if (!manifest.value) {
      throw new Error('No app update is available.');
    }

    installing.value = true;
    try {
      await installAppUpdate(manifest.value);
    } finally {
      installing.value = false;
    }
  }

  return {
    currentVersion,
    latestVersion,
    manifest,
    lastCheckedAt,
    checking,
    installing,
    enabled,
    hasUpdate,
    check,
    install
  };
});
