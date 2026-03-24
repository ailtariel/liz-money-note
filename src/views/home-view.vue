<script setup lang="ts">
import { computed } from 'vue';
import { useAppConfig } from '@/composables/use-app-config';

const appConfig = useAppConfig();

const configItems = computed(() => [
  ['api_base_url', appConfig.api_base_url],
  ['default_route', appConfig.default_route],
  ['enable_route_guard', String(appConfig.enable_route_guard)],
  ['default_theme', appConfig.vuetify?.default_theme ?? 'light']
]);
</script>

<template>
  <div class="d-flex flex-column ga-6">
    <section>
      <div class="text-overline">Starter</div>
      <h1 class="text-h3 font-weight-bold mb-3">Vue, Vite, Vuetify, Router</h1>
      <p class="text-body-1 text-medium-emphasis">
        This skeleton keeps runtime config, routing, state, request bootstrap,
        and container delivery in one place so new projects start from a stable baseline.
      </p>
    </section>

    <v-row>
      <v-col cols="12" md="7">
        <v-card rounded="xl" variant="flat" color="surface">
          <v-card-title>Included foundation</v-card-title>
          <v-card-text class="d-flex flex-column ga-3">
            <div>Runtime config merge: <code>default config + config-dev.json + APP_*</code></div>
            <div>Pinia store bootstrap and auth-session placeholder</div>
            <div>Axios instance with runtime base URL and 401 handling</div>
            <div>Vuetify theme defaults and route-based app shell</div>
            <div>Docker + Nginx + entrypoint runtime env injection</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card rounded="xl" variant="outlined">
          <v-card-title>Resolved runtime config</v-card-title>
          <v-list density="compact">
            <v-list-item
              v-for="[label, value] in configItems"
              :key="label"
              :title="label"
              :subtitle="String(value)"
            />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
