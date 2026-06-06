<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from 'vuetify';
import { getAppConfig } from '@/core/app-config';

const route = useRoute();
const theme = useTheme();
const appConfig = getAppConfig();

const isDark = computed(() => theme.global.name.value === 'dark');
const navItems = [
  { title: '流水', name: 'transactions' },
  { title: '账本', name: 'books' },
  { title: '账户', name: 'accounts' },
  { title: 'Tag', name: 'tags' },
  { title: '周期', name: 'recurring' },
  { title: '数据', name: 'data' }
];

function toggleTheme() {
  theme.global.name.value = isDark.value ? 'light' : 'dark';
}
</script>

<template>
  <v-layout class="app-shell">
    <v-app-bar color="surface" elevation="1">
      <v-container class="d-flex align-center ga-2">
        <div class="text-h6 font-weight-bold">{{ appConfig.app_title }}</div>
        <v-spacer />
        <v-btn
          v-for="item in navItems"
          :key="item.name"
          :to="{ name: item.name }"
          :active="route.name === item.name"
          :icon="false"
          variant="text"
        >
          {{ item.title }}
        </v-btn>
        <v-btn
          :icon="isDark ? '$themeLight' : '$themeDark'"
          variant="text"
          @click="toggleTheme"
        />
      </v-container>
    </v-app-bar>

    <v-main>
      <v-container class="py-8">
        <RouterView />
      </v-container>
    </v-main>
  </v-layout>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}
</style>
