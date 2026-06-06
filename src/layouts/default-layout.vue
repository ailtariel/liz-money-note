<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from '@/i18n';

const route = useRoute();
const { t } = useI18n();

const navItems = computed(() => [
  { title: t('nav.transactions'), name: 'transactions', icon: '$transactions' },
  { title: t('nav.stats'), name: 'stats', icon: '$stats' },
  { title: t('nav.assets'), name: 'assets', icon: '$assets' },
  { title: t('nav.more'), name: 'more', icon: '$more' }
]);

const bottomNavHeight = 82;
const showBottomNav = computed(() => route.meta.bottomNav === true);
const activeNav = computed(() => String(route.name ?? 'transactions'));
</script>

<template>
  <div class="app-shell">
    <RouterView />

    <div v-if="showBottomNav" class="mobile-bottom-nav-host">
      <v-layout class="mobile-bottom-nav-layout">
        <v-bottom-navigation
          :model-value="activeNav"
          absolute
          class="mobile-bottom-nav"
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
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  height: 100dvh;
  min-height: 100vh;
  overflow: hidden;
}

.mobile-bottom-nav-host {
  position: fixed;
  bottom: 0;
  left: 50%;
  z-index: 1004;
  width: min(100vw, 430px);
  height: calc(var(--app-bottom-nav-height) + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  pointer-events: none;
}

.mobile-bottom-nav-layout {
  width: 100%;
  height: var(--app-bottom-nav-height);
}

.mobile-bottom-nav {
  top: auto !important;
  right: 0 !important;
  bottom: env(safe-area-inset-bottom) !important;
  left: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  height: var(--app-bottom-nav-height) !important;
  margin: 0 auto;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  box-shadow: 0 -12px 30px rgba(15, 23, 42, 0.08);
  pointer-events: auto;
  transform: none !important;
}

.mobile-bottom-nav :deep(.v-bottom-navigation__content) {
  align-items: stretch;
  height: var(--app-bottom-nav-height);
}
</style>
