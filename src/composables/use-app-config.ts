import { inject } from 'vue';
import { appConfigKey, getAppConfig } from '@/config/runtime-config';

export function useAppConfig() {
  return inject(appConfigKey, getAppConfig());
}
