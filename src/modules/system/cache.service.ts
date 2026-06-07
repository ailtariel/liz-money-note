import { Capacitor, registerPlugin } from '@capacitor/core';

const configCacheKeys = ['__APP_CONFIG__', '__APP_RUNTIME_ENV__'];

type SystemCachePlugin = {
  clearCache: () => Promise<void>;
};

const SystemCache = registerPlugin<SystemCachePlugin>('SystemCache');

async function clearCacheStorage() {
  if (!('caches' in globalThis)) {
    return 0;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  return cacheNames.length;
}

function clearSessionConfigCache() {
  configCacheKeys.forEach((key) => {
    sessionStorage.removeItem(key);
  });
}

async function clearAndroidCache() {
  if (Capacitor.getPlatform() !== 'android') {
    return false;
  }

  await SystemCache.clearCache();
  return true;
}

export type ClearCacheResult = {
  cacheStorageCount: number;
  androidCacheCleared: boolean;
};

export async function clearSystemCache(): Promise<ClearCacheResult> {
  const [cacheStorageCount, androidCacheCleared] = await Promise.all([
    clearCacheStorage(),
    clearAndroidCache()
  ]);

  clearSessionConfigCache();

  return {
    cacheStorageCount,
    androidCacheCleared
  };
}
