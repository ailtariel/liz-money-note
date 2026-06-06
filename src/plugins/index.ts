import type { App } from "vue";
import type { RuntimeAppConfig } from "@/types/runtime-config";
import { i18n } from "@/i18n";
import { createAppVuetify } from "./vuetify";

export function registerPlugins(app: App, config: RuntimeAppConfig) {
  app.use(i18n);
  app.use(createAppVuetify(config));
}
