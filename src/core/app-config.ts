import type { RuntimeAppConfig } from '@/types/runtime-config';

const CONFIG_STORAGE_KEY = '__APP_CONFIG__';
const RUNTIME_ENV_STORAGE_KEY = '__APP_RUNTIME_ENV__';

const defaultConfig: RuntimeAppConfig = {
  app_title: 'Liz Money Note',
  api_base_url: '/api',
  update_manifest_url:
    'https://api.github.com/repos/ailtariel/liz-money-note/releases/latest',
  default_route: '/',
  enable_route_guard: true,
  feature_flags: {
    show_about: true
  },
  vuetify: {
    default_theme: 'greenLight'
  }
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeAppConfig;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return (override as T) ?? base;
  }

  const output: Record<string, unknown> = { ...base };

  Object.entries(override).forEach(([key, value]) => {
    const current = output[key];

    if (isPlainObject(current) && isPlainObject(value)) {
      output[key] = deepMerge(current, value);
      return;
    }

    output[key] = value;
  });

  return output as T;
}

function toSnakeCase(value: string) {
  return value.toLowerCase();
}

function setDeepValue(
  target: Record<string, unknown>,
  path: string[],
  value: unknown
) {
  let cursor = target;

  path.forEach((segment, index) => {
    if (index === path.length - 1) {
      cursor[segment] = value;
      return;
    }

    if (!isPlainObject(cursor[segment])) {
      cursor[segment] = {};
    }

    cursor = cursor[segment] as Record<string, unknown>;
  });
}

function convertValue(value: unknown) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return undefined;
  }

  if (
    (raw.startsWith('{') && raw.endsWith('}')) ||
    (raw.startsWith('[') && raw.endsWith(']'))
  ) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);

  return raw;
}

function normalizeRuntimeEnv(
  source: Record<string, unknown>
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  Object.entries(source).forEach(([key, value]) => {
    if (!key.startsWith('APP_')) {
      return;
    }

    const segments = key
      .replace(/^APP_/, '')
      .split('__')
      .map((segment) => toSnakeCase(segment));

    setDeepValue(output, segments, convertValue(value));
  });

  return output;
}

function cacheConfig(config: RuntimeAppConfig) {
  sessionStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  window.__APP_CONFIG__ = config;
  document.title = config.app_title;
}

function getStoredRuntimeEnv(): Record<string, unknown> {
  const cached = sessionStorage.getItem(RUNTIME_ENV_STORAGE_KEY);
  if (!cached) {
    return {};
  }

  try {
    return JSON.parse(cached) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getStoredConfig(): RuntimeAppConfig | null {
  const cached = sessionStorage.getItem(CONFIG_STORAGE_KEY);
  if (!cached) {
    return null;
  }

  try {
    const parsed = JSON.parse(cached) as RuntimeAppConfig;
    window.__APP_CONFIG__ = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function loadAppConfig(): RuntimeAppConfig {
  const runtimeEnv = getStoredRuntimeEnv();
  const config = deepMerge(defaultConfig, normalizeRuntimeEnv(runtimeEnv));

  cacheConfig(config);
  return config;
}

export function getAppConfig(): RuntimeAppConfig {
  if (window.__APP_CONFIG__) {
    return window.__APP_CONFIG__;
  }

  return getStoredConfig() ?? loadAppConfig();
}
