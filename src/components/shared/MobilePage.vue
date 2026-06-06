<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
const emit = defineEmits<{
  back: [];
}>();

withDefaults(
  defineProps<{
    title?: string;
    contentClass?: string;
    showBack?: boolean;
    backAction?: 'router' | 'emit';
    hasFooter?: boolean;
  }>(),
  {
    title: '',
    contentClass: '',
    showBack: false,
    backAction: 'router',
    hasFooter: true
  }
);

const appHeaderHeight = 88;

function handleBack(backAction: 'router' | 'emit') {
  if (backAction === 'emit') {
    emit('back');
    return;
  }

  router.back();
}
</script>

<template>
  <div :class="['mobile-page', hasFooter ? 'mobile-page--with-footer' : 'mobile-page--without-footer']">
    <v-app-bar
      class="mobile-app-bar"
      color="background"
      elevation="0"
      :height="appHeaderHeight"
    >
      <v-btn v-if="showBack" icon="$close" variant="text" @click="handleBack(backAction)" />
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
