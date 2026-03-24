/// <reference types="vite/client" />

declare const __APP_BUILD_TIMESTAMP__: string;

interface Window {
  __APP_CONFIG_READY__?: Promise<void>;
}
