<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from '@/i18n';
import AppBarVue from '@/components/shared/app-bar.vue';
import { moreNavigationSections } from '@/components/shared/more-navigation';

const { t } = useI18n();

const sections = computed(() =>
  moreNavigationSections.map((section) => ({
    title: t(section.titleKey),
    items: section.items.map((item) => ({
      title: t(item.titleKey),
      icon: item.icon,
      to: item.to
    }))
  }))
);
</script>

<template>
  <AppBarVue>
    <template #actions>
      <LanguageSwitcher />
    </template>
  </AppBarVue>
  <v-main>
    <v-container>
      <div class="d-flex flex-column ga-5">
        <v-card v-for="section in sections" :key="section.title" class="soft-card">
          <div class="px-4 pt-4 text-subtitle-1 font-weight-bold">
            {{ section.title }}
          </div>
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
    </v-container>
  </v-main>
</template>
