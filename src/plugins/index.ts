import type { App } from "vue";
import type { RuntimeAppConfig } from "@/types/runtime-config";
import { createAppVuetify } from "./vuetify";

export function registerPlugins(app: App, config: RuntimeAppConfig) {
  app.use(createAppVuetify(config));
}
