<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { mdiChevronRight } from '@mdi/js';
import { useI18n } from '@/i18n';
import { moreNavigationItems } from '@/components/shared/more-navigation';

const route = useRoute();
const { t } = useI18n();

const appBarHeight = 64;
const pageTitle = computed(() =>
  typeof route.meta.titleKey === 'string' ? t(route.meta.titleKey) : ''
);
const routeName = computed(() => route.name);
const routedMoreItems = computed(() =>
  moreNavigationItems.filter((item) => item.to)
);
const currentMoreItem = computed(() =>
  routedMoreItems.value.find((item) =>
    item.routeNames?.includes(routeName.value ?? '')
  )
);
const currentPageTitle = computed(() =>
  currentMoreItem.value ? t(currentMoreItem.value.titleKey) : pageTitle.value
);
const breadcrumbItems = computed(() => [
  {
    title: 'Home',
    to: { name: 'transactions' }
  },
  ...(currentMoreItem.value
    ? [
        {
          title: t('nav.more'),
          to: { name: 'more' }
        }
      ]
    : []),
  {
    title: currentPageTitle.value
  }
]);
</script>
<template>
  <v-app-bar color="background" elevation="0" :height="appBarHeight">
    <v-breadcrumbs
      class="app-bar-breadcrumbs ms-2"
      density="compact"
      :items="breadcrumbItems"
    >
      <template #divider>
        <v-icon :icon="mdiChevronRight" size="16" class="breadcrumb-divider" />
      </template>

      <template #item="{ item }">
        <v-breadcrumbs-item :to="item.to" :disabled="!item.to">
          <v-icon v-if="item.title === 'Home'" icon="$home" size="24" />
          <span v-else class="breadcrumb-page">{{ item.title }}</span>
        </v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>

    <v-spacer />
    <slot name="actions"></slot>
  </v-app-bar>
</template>

<style scoped>
.app-bar-breadcrumbs {
  min-width: 0;
  padding-inline: 4px;
}

.breadcrumb-page {
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.breadcrumb-divider {
  color: rgb(var(--v-theme-text-secondary));
}
</style>
