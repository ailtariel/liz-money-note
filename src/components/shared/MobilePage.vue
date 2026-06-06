<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    contentClass?: string;
    showBack?: boolean;
  }>(),
  {
    title: '',
    contentClass: '',
    showBack: false
  }
);
</script>

<template>
  <div class="mobile-page">
    <v-app-bar class="mobile-app-bar" color="background" elevation="0">
      <v-btn v-if="showBack" icon="$close" variant="text" @click="$router.back()" />
      <v-app-bar-title v-if="title" class="mobile-title">
        {{ title }}
      </v-app-bar-title>
      <slot name="actions" />
    </v-app-bar>

    <div :class="['mobile-page-content', contentClass]">
      <slot />
    </div>
  </div>
</template>
