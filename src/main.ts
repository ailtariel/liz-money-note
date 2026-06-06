import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import { loadAppConfig } from "@/core/app-config";
import { getDatabase } from "@/modules/database/connection";
import { ensureDefaultBook } from "@/modules/books/book.repository";
import { registerPlugins } from "@/plugins";
import router from "@/router";
import "./styles/main.scss";

async function bootstrap() {
  await window.__APP_CONFIG_READY__;

  const config = loadAppConfig();
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  registerPlugins(app, config);
  app.use(router);

  await getDatabase();
  await ensureDefaultBook();

  await router.isReady();
  app.mount("#app");
}

bootstrap();
