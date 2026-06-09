import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { Capacitor } from '@capacitor/core';

export type AppPlatform = 'web' | 'android' | 'ios';

function getCurrentPlatform(): AppPlatform {
  const platform = Capacitor.getPlatform();

  if (platform === 'android' || platform === 'ios') {
    return platform;
  }

  return 'web';
}

export const useSystemStore = defineStore('system', () => {
  const platform = ref<AppPlatform>(getCurrentPlatform());
  const isAndroid = computed(() => platform.value === 'android');
  const isIos = computed(() => platform.value === 'ios');
  const isWeb = computed(() => platform.value === 'web');
  const isNative = computed(() => isAndroid.value || isIos.value);

  function refreshPlatform() {
    platform.value = getCurrentPlatform();
  }

  return {
    platform,
    isAndroid,
    isIos,
    isWeb,
    isNative,
    refreshPlatform
  };
});
