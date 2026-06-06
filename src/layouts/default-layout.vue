<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@/i18n';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const navItems = computed(() => [
  { title: t('nav.transactions'), name: 'transactions', icon: '$transactions' },
  { title: t('nav.stats'), name: 'stats', icon: '$stats' },
  { title: t('nav.assets'), name: 'assets', icon: '$assets' },
  { title: t('nav.more'), name: 'more', icon: '$more' }
]);

const appBarHeight = 88;
const bottomNavHeight = 82;
const showBottomNav = computed(() => route.meta.bottomNav === true);
const showBack = computed(() => route.meta.bottomNav !== true);
const activeNav = computed(() => String(route.name ?? 'transactions'));
const pageTitle = computed(() =>
  typeof route.meta.titleKey === 'string' ? t(route.meta.titleKey) : ''
);
</script>

<template>
  <v-layout class="app-layout" full-height>
    <v-app-bar color="background" elevation="0" :height="appBarHeight">
      <div class="app-bar-content">
        <v-btn v-if="showBack" icon="$close" variant="text" @click="router.back()" />

        <v-app-bar-title class="mobile-title">
          {{ pageTitle }}
        </v-app-bar-title>

        <v-spacer />

        <template v-if="route.name === 'transactions'">
          <v-btn icon="$search" variant="text" />
        </template>

        <LanguageSwitcher v-if="route.name === 'more'" />
      </div>
    </v-app-bar>

    <v-main scrollable>
      <div class="app-main-content">
        <RouterView />
      </div>
    </v-main>

    <v-bottom-navigation
      v-if="showBottomNav"
      :model-value="activeNav"
      color="primary"
      grow
      :height="bottomNavHeight"
      mandatory
    >
      <v-btn
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        :value="item.name"
      >
        <v-icon :icon="item.icon" />
        <span>{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>
  </v-layout>
</template>

<style scoped>
.app-layout {
  background: rgb(var(--v-theme-background));
}

.app-bar-content {
  display: flex;
  width: min(100%, 430px);
  height: 100%;
  align-items: center;
  margin: 0 auto;
  padding: 0 18px;
}

.mobile-title {
  font-size: 1.625rem;
  font-weight: 800;
  letter-spacing: 0;
}

.app-main-content {
  width: min(100%, 430px);
  min-height: 100%;
  margin: 0 auto;
  padding: 16px 18px 24px;
}

@media (max-width: 360px) {
  .app-bar-content,
  .app-main-content {
    padding-right: 14px;
    padding-left: 14px;
  }
}
</style>
