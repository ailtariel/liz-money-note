<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { themeColorSchemes, themeModes } from './theme.types';
import type { ThemeColorScheme, ThemeMode } from './theme.types';
import { useThemeStore } from './theme.store';

const { t } = useI18n();
const store = useThemeStore();
const error = ref('');

async function chooseColorScheme(value: ThemeColorScheme) {
  error.value = '';
  try {
    await store.setColorScheme(value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('theme.saveFailed');
  }
}

async function chooseMode(value: ThemeMode) {
  error.value = '';
  try {
    await store.setMode(value);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('theme.saveFailed');
  }
}

onMounted(async () => {
  error.value = '';
  try {
    await store.load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('theme.loadFailed');
  }
});
</script>

<template>
  <AppBarVue />

  <v-main>
    <v-container>
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="error" type="error" variant="tonal">{{ error }}</v-alert>

        <v-card class="soft-card">
          <div class="px-4 pt-4 text-subtitle-1 font-weight-bold">
            {{ t('theme.colorScheme.title') }}
          </div>
          <v-list class="bg-transparent">
            <v-list-item
              v-for="scheme in themeColorSchemes"
              :key="scheme"
              :active="store.colorScheme === scheme"
              @click="chooseColorScheme(scheme)"
            >
              <template #prepend>
                <v-avatar :color="scheme === 'green' ? '#0f766e' : '#ea580c'" variant="flat" />
              </template>
              <v-list-item-title>
                {{ t(`theme.colorScheme.${scheme}`) }}
              </v-list-item-title>
              <template #append>
                <v-icon v-if="store.colorScheme === scheme" icon="$check" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card class="soft-card">
          <div class="px-4 pt-4 text-subtitle-1 font-weight-bold">
            {{ t('theme.mode.title') }}
          </div>
          <v-list class="bg-transparent">
            <v-list-item
              v-for="mode in themeModes"
              :key="mode"
              :active="store.mode === mode"
              @click="chooseMode(mode)"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon :icon="mode === 'dark' ? '$themeDark' : '$themeLight'" />
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ t(`theme.mode.${mode}`) }}
              </v-list-item-title>
              <template #append>
                <v-icon v-if="store.mode === mode" icon="$check" />
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </div>
    </v-container>
  </v-main>
</template>
