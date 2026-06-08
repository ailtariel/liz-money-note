/// <reference types="vite/client" />

declare const __APP_BUILD_TIMESTAMP__: string;
declare const __APP_VERSION__: string;
declare const __DB_NAME__: string;
declare const __DB_ENCRYPTION_MODE__: string;
declare const __DB_VERSION__: number;

interface Window {
  __APP_CONFIG_READY__?: Promise<void>;
}
