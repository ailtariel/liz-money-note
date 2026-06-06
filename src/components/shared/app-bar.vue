<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from '@/i18n';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const appBarHeight = 64;
const showBack = computed(() => route.meta.bottomNav !== true);
const pageTitle = computed(() =>
  typeof route.meta.titleKey === 'string' ? t(route.meta.titleKey) : ''
);
</script>
<template>
  <v-app-bar color="background" elevation="0" :height="appBarHeight">
    <v-btn
      v-if="showBack"
      icon="$close"
      variant="text"
      @click="router.back()"
    />

    <v-app-bar-title class="mobile-title">
      {{ pageTitle }}
    </v-app-bar-title>

    <v-spacer />
    <slot name="actions"></slot>
  </v-app-bar>
</template>

<style scoped>
.mobile-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: 0;
}
</style>
