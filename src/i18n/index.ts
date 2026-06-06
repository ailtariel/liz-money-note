import { createI18n, useI18n } from 'vue-i18n';
import en from './messages/en';
import zhCn from './messages/zh-cn';

export enum Locale {
  zhCn = 'zh-cn',
  en = 'en'
}

const storageKey = 'liz-money-note-locale';

function normalizeLocale(value: string | null | undefined): Locale | null {
  const lower = value?.toLowerCase();

  if (!lower) {
    return null;
  }

  if (lower === Locale.zhCn || lower.startsWith('zh')) {
    return Locale.zhCn;
  }

  if (lower === Locale.en || lower.startsWith('en')) {
    return Locale.en;
  }

  return null;
}

export function getInitialLocale() {
  return (
    normalizeLocale(localStorage.getItem(storageKey)) ??
    normalizeLocale(navigator.language) ??
    Locale.zhCn
  );
}

export function saveLocale(locale: Locale) {
  localStorage.setItem(storageKey, locale);
}

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: getInitialLocale(),
  fallbackLocale: Locale.zhCn,
  messages: {
    [Locale.zhCn]: zhCn,
    [Locale.en]: en
  }
});

export { useI18n };
