import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { SnackbarQueueMessage } from 'vuetify';

type SnackQueueColor = 'success' | 'error' | 'warning' | 'primary';

interface SnackQueueOptions {
  color?: SnackQueueColor;
  timeout?: number;
}

const defaultTimeout = 3000;
const errorTimeout = 5000;

export const useSnackQueueStore = defineStore('snackQueue', () => {
  const queue = ref<SnackbarQueueMessage[]>([]);

  function notify(text: string, options: SnackQueueOptions = {}) {
    queue.value.push({
      text,
      color: options.color ?? 'primary',
      timeout: options.timeout ?? defaultTimeout
    });
  }

  function success(text: string, options: Omit<SnackQueueOptions, 'color'> = {}) {
    notify(text, { ...options, color: 'success' });
  }

  function error(text: string, options: Omit<SnackQueueOptions, 'color'> = {}) {
    notify(text, {
      timeout: errorTimeout,
      ...options,
      color: 'error'
    });
  }

  function warning(text: string, options: Omit<SnackQueueOptions, 'color'> = {}) {
    notify(text, { ...options, color: 'warning' });
  }

  function info(text: string, options: Omit<SnackQueueOptions, 'color'> = {}) {
    notify(text, { ...options, color: 'primary' });
  }

  function clear() {
    queue.value = [];
  }

  return {
    queue,
    notify,
    success,
    error,
    warning,
    info,
    clear
  };
});
