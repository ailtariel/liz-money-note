import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { loadAppConfig } from "@/config/runtime-config";
import { registerPlugins } from "@/plugins";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import "./styles/main.scss";

async function bootstrap() {
  await window.__APP_CONFIG_READY__;

  const config = loadAppConfig();
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  registerPlugins(app, config);
  app.use(router);

  const authStore = useAuthStore();
  authStore.hydrate();

  await router.isReady();
  app.mount("#app");
}

bootstrap();
