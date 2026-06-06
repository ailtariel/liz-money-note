<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { useI18n } from '@/i18n';

const { t } = useI18n();

type MoreItem = {
  title: string;
  icon: string;
  to?: RouteLocationRaw;
};

const sections = computed<Array<{ title: string; items: MoreItem[] }>>(() => [
  {
    title: t('more.basicData'),
    items: [
      { title: t('nav.books'), icon: '$book', to: { name: 'books' } },
      { title: t('nav.accounts'), icon: '$account', to: { name: 'accounts' } },
      { title: t('nav.tags'), icon: '$tag', to: { name: 'tags' } },
      { title: t('nav.recurring'), icon: '$recurring', to: { name: 'recurring' } }
    ]
  },
  {
    title: t('more.data'),
    items: [
      { title: t('more.import'), icon: '$upload', to: { name: 'data' } },
      { title: t('more.export'), icon: '$download', to: { name: 'data' } },
      { title: t('more.backup'), icon: '$data', to: { name: 'data' } },
      { title: t('more.restore'), icon: '$restore', to: { name: 'data' } }
    ]
  },
  {
    title: t('more.settings'),
    items: [
      { title: t('more.theme'), icon: '$themeDark' },
      { title: t('more.defaultCurrency'), icon: '$cash' },
      { title: t('more.about'), icon: '$info' }
    ]
  }
]);
</script>

<template>
  <div class="d-flex flex-column ga-5">
    <v-card v-for="section in sections" :key="section.title" class="soft-card">
        <div class="px-4 pt-4 text-subtitle-1 font-weight-bold">{{ section.title }}</div>
        <v-list class="bg-transparent">
          <v-list-item
            v-for="item in section.items"
            :key="item.title"
            :to="item.to"
            :title="item.title"
          >
            <template #prepend>
              <v-avatar color="primary" variant="tonal">
                <v-icon :icon="item.icon" />
              </v-avatar>
            </template>
            <template #append>
              <v-icon icon="$next" />
            </template>
          </v-list-item>
        </v-list>
    </v-card>
  </div>
</template>
