<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useTheme } from 'vuetify';
import { getAppConfig } from '@/core/app-config';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const theme = useTheme();
const appConfig = getAppConfig();
const authStore = useAuthStore();

const showAbout = computed(() => appConfig.feature_flags?.show_about !== false);
const isDark = computed(() => theme.global.name.value === 'dark');

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
          :to="{ name: 'home' }"
          :active="route.name === 'home'"
          :icon="false"
          prepend-icon="$dashboard"
          variant="text"
        >
          Home
        </v-btn>
        <v-btn
          :to="{ name: 'dashboard' }"
          :active="route.name === 'dashboard'"
          :icon="false"
          prepend-icon="$profile"
          variant="text"
        >
          Dashboard
        </v-btn>
        <v-btn
          v-if="showAbout"
          :to="{ name: 'about' }"
          :active="route.name === 'about'"
          :icon="false"
          prepend-icon="$info"
          variant="text"
        >
          About
        </v-btn>
        <v-btn
          :icon="isDark ? '$themeLight' : '$themeDark'"
          variant="text"
          @click="toggleTheme"
        />
        <v-btn
          v-if="!authStore.isAuthenticated"
          :to="{ name: 'login' }"
          prepend-icon="$login"
          variant="tonal"
        >
          Login
        </v-btn>
        <v-btn
          v-else
          prepend-icon="$logout"
          variant="tonal"
          @click="authStore.logout()"
        >
          Logout
        </v-btn>
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
