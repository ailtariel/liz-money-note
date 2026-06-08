import { fileURLToPath, URL } from "node:url";
import { spawnSync } from "node:child_process";
import { defineConfig, loadEnv, mergeConfig, type PluginOption, type UserConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vuetify from "vite-plugin-vuetify";
import generateEnvTemplate from "./scripts/generate-env-template";

function runDatabaseInitializer(mode: string, profile: "build" | "dev") {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "scripts/generate-empty-database.mjs",
      `--mode=${mode}`,
      `--profile=${profile}`,
    ],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error(`Database initialization failed for ${profile}.`);
  }
}

function generateDatabaseAssets(mode: string, command: "serve" | "build"): PluginOption {
  return {
    name: "generate-database-assets",
    buildStart() {
      if (command !== "build") {
        return;
      }

      runDatabaseInitializer(mode, "build");
    },
    configureServer(server) {
      runDatabaseInitializer(mode, "dev");

      const envFiles = [
        ".env",
        ".env.local",
        `.env.${mode}`,
        `.env.${mode}.local`,
        "src/modules/database/schema.ts",
      ].map((file) => fileURLToPath(new URL(file, import.meta.url)));

      server.watcher.add(envFiles);
      server.watcher.on("change", (changedFile) => {
        if (!envFiles.includes(changedFile)) {
          return;
        }

        runDatabaseInitializer(mode, "dev");
        server.ws.send({ type: "full-reload" });
      });
    },
  };
}

function createPlugins(mode: string, command: "serve" | "build"): PluginOption[] {
  const plugins: PluginOption[] = [
    generateDatabaseAssets(mode, command),
    vue(),
    vuetify({
      autoImport: true,
    }),
    generateEnvTemplate(),
  ];

  return plugins;
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const authTarget = env.VITE_AUTH_PROXY_TARGET || env.VITE_API_PROXY_TARGET;
  const authIsHttps = authTarget?.toLowerCase().startsWith("https");
  const databaseName = env.DB_NAME || "liz_money_note";
  const databaseEncryptionMode = env.DB_ENCRYPTION_MODE || "no-encryption";
  const databaseVersion = Number(env.DB_VERSION || 1);

  const config: Record<string, UserConfig> = {
    default: {
      plugins: createPlugins(mode, command),
      define: {
        __APP_BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
        __DB_NAME__: JSON.stringify(databaseName),
        __DB_ENCRYPTION_MODE__: JSON.stringify(databaseEncryptionMode),
        __DB_VERSION__: JSON.stringify(databaseVersion),
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
