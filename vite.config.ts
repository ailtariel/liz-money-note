import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv, mergeConfig, type PluginOption, type UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import viteCompression from "vite-plugin-compression";
import generateEnvTemplate from "./scripts/generate-env-template";

function createPlugins(mode: string, command: "serve" | "build"): PluginOption[] {
  const plugins: PluginOption[] = [
    vue(),
    vuetify({
      autoImport: true,
    }),
    generateEnvTemplate(),
  ];

  if (command === "build") {
    plugins.push(
      viteCompression({
        algorithm: "gzip",
        deleteOriginFile: false,
      }),
    );
  }

  return plugins;
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const authTarget = env.VITE_AUTH_PROXY_TARGET || env.VITE_API_PROXY_TARGET;
  const authIsHttps = authTarget?.toLowerCase().startsWith("https");

  const config: Record<string, UserConfig> = {
    default: {
      plugins: createPlugins(mode, command),
      define: {
        __APP_BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
      },
      resolve: {
        alias: {
          "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
      },
      base: env.BASE_URL || "/",
      build: {
        outDir: "dist",
        rollupOptions: {
          input: {
            main: "index.html",
          },
        },
      },
      server: {
        port: Number(env.VITE_PORT || 8000),
        watch: {
          ignored: ["**/dist/**", "**/android/**", "**/.gradle/**", "**/docs/**"],
        },
        proxy: {
          "/api": {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
            secure: false,
          },
          "/login": {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
            secure: false,
            xfwd: authIsHttps,
            cookieDomainRewrite: authIsHttps ? "localhost" : undefined,
          },
          "/logout": {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
            secure: false,
            xfwd: authIsHttps,
            cookieDomainRewrite: authIsHttps ? "localhost" : undefined,
          },
          "/callback": {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
            secure: false,
            xfwd: authIsHttps,
            cookieDomainRewrite: authIsHttps ? "localhost" : undefined,
          },
          "/user": {
            target: env.VITE_API_PROXY_TARGET,
            changeOrigin: true,
            secure: false,
            xfwd: authIsHttps,
            cookieDomainRewrite: authIsHttps ? "localhost" : undefined,
          },
        },
      },
      preview: {
        port: Number(env.VITE_PREVIEW_PORT || 5174),
      },
    },
    development: {},
    production: {},
  };

  return mergeConfig(config.default, config[mode] || {});
});
