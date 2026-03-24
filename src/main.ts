import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { appConfigKey, loadAppConfig } from "@/config/runtime-config";
import { registerPlugins } from "@/plugins";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import "./styles/main.scss";

async function bootstrap() {
  const config = await loadAppConfig();
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.provide(appConfigKey, config);
  registerPlugins(app, config);
  app.use(router);

  const authStore = useAuthStore();
  authStore.hydrate();

  await router.isReady();
  app.mount("#app");
}

bootstrap();
