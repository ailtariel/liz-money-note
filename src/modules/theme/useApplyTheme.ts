import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useTheme } from 'vuetify';
import { useThemeStore } from './theme.store';

export function useApplyTheme() {
  const vuetifyTheme = useTheme();
  const themeStore = useThemeStore();
  const prefersDark = ref(false);
  let mediaQuery: MediaQueryList | null = null;

  const activeThemeName = computed(() => {
    const dark =
      themeStore.mode === 'system'
        ? prefersDark.value
        : themeStore.mode === 'dark';
    const tone = dark ? 'Dark' : 'Light';
    return `${themeStore.colorScheme}${tone}`;
  });

  function updateSystemPreference(event?: MediaQueryListEvent) {
    prefersDark.value = event?.matches ?? mediaQuery?.matches ?? false;
  }

  watch(
    activeThemeName,
    (name) => {
      vuetifyTheme.change(name);
    },
    { immediate: true }
  );

  onMounted(async () => {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    updateSystemPreference();
    mediaQuery.addEventListener('change', updateSystemPreference);
    await themeStore.load();
  });

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', updateSystemPreference);
  });
}
