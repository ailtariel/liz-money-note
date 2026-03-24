<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const userSummary = computed(() =>
  authStore.user
    ? `${authStore.user.name} (${authStore.user.role})`
    : 'Anonymous'
);
</script>

<template>
  <v-card rounded="xl" variant="flat">
    <v-card-title>Protected route example</v-card-title>
    <v-card-text class="d-flex flex-column ga-3">
      <div>
        This page demonstrates route meta with <code>requiresAuth</code>.
      </div>
      <div>Current session: {{ userSummary }}</div>
      <div>Replace the demo login action with your real SSO or token flow.</div>
    </v-card-text>
  </v-card>
</template>
