<script setup lang="ts">
import { computed } from 'vue';
import { Locale } from '@/i18n';
import { useAppLocale } from '@/composables/useAppLocale';
import { useI18n } from '@/i18n';

const { t } = useI18n();
const appLocale = useAppLocale();

const languages = computed(() => [
  { value: Locale.zhCn, title: t('language.zhCn') },
  { value: Locale.en, title: t('language.en') }
]);
</script>

<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn v-bind="props" icon="$language" variant="text" />
    </template>
    <v-list density="comfortable">
      <v-list-item
        v-for="language in languages"
        :key="language.value"
        :active="appLocale.current === language.value"
        :title="language.title"
        @click="appLocale.apply(language.value)"
      />
    </v-list>
  </v-menu>
</template>
