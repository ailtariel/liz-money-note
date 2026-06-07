<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from '@/i18n';
import { moreNavigationItems } from '@/components/shared/more-navigation';

const route = useRoute();
const { t } = useI18n();

const navItems = computed(() => [
  { title: t('nav.transactions'), name: 'transactions', icon: '$transactions' },
  { title: t('nav.stats'), name: 'stats', icon: '$stats' },
  { title: t('nav.assets'), name: 'assets', icon: '$assets' },
  { title: t('nav.more'), name: 'more', icon: '$more' }
]);

const bottomNavHeight = 82;
const moreRouteNames = computed(() =>
  moreNavigationItems.flatMap((item) => item.routeNames ?? [])
);
const isMoreRoute = computed(() =>
  moreRouteNames.value.includes(String(route.name ?? ''))
);
const showBottomNav = computed(() => route.meta.bottomNav === true || isMoreRoute.value);
const activeNav = computed(() =>
  isMoreRoute.value ? 'more' : String(route.name ?? 'transactions')
);
</script>
<template>
  <v-bottom-navigation
    v-if="showBottomNav"
    :model-value="activeNav"
    bg-color="surface"
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
</template>

<style scoped>
.v-bottom-navigation :deep(.v-btn--selected) {
  background: rgb(var(--v-theme-accent));
  color: rgb(var(--v-theme-primary));
}
</style>
