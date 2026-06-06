import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { getSetting, setSetting } from '@/modules/settings/settings.repository';
import type { ThemeColorScheme, ThemeMode } from './theme.types';

const colorSchemeKey = 'theme_color_scheme';
const modeKey = 'theme_mode';

function isThemeColorScheme(value: string | null): value is ThemeColorScheme {
  return value === 'green' || value === 'orange';
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

export const useThemeStore = defineStore('theme', () => {
  const colorScheme = ref<ThemeColorScheme>('green');
  const mode = ref<ThemeMode>('system');
  const loaded = ref(false);

  const colorSchemeLabelKey = computed(() => `theme.colorScheme.${colorScheme.value}`);
  const modeLabelKey = computed(() => `theme.mode.${mode.value}`);

  async function load() {
    const [storedColorScheme, storedMode] = await Promise.all([
      getSetting(colorSchemeKey),
      getSetting(modeKey)
    ]);

    if (isThemeColorScheme(storedColorScheme)) {
      colorScheme.value = storedColorScheme;
    }

    if (isThemeMode(storedMode)) {
      mode.value = storedMode;
    }

    loaded.value = true;
  }

  async function setColorScheme(value: ThemeColorScheme) {
    colorScheme.value = value;
    await setSetting(colorSchemeKey, value);
  }

  async function setMode(value: ThemeMode) {
    mode.value = value;
    await setSetting(modeKey, value);
  }

  return {
    colorScheme,
    mode,
    loaded,
    colorSchemeLabelKey,
    modeLabelKey,
    load,
    setColorScheme,
    setMode
  };
});
