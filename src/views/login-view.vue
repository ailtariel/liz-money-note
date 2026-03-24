<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useAppConfig } from '@/composables/use-app-config';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const appConfig = useAppConfig();

async function handleLogin() {
  authStore.loginDemo();
  const redirect = typeof route.query.redirect === 'string'
    ? route.query.redirect
    : appConfig.default_route;
  await router.replace(redirect || '/');
}
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="6" lg="4">
        <v-card rounded="xl" variant="flat">
          <v-card-title class="text-h5">Login placeholder</v-card-title>
          <v-card-text class="d-flex flex-column ga-4">
            <div>
              Route guards are wired. Replace this button with your real login flow.
            </div>
            <v-btn block color="primary" size="large" @click="handleLogin">
              Sign in with demo session
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
