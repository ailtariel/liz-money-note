import { reactive } from 'vue';
import { useLocale } from 'vuetify';
import { Locale, saveLocale, useI18n } from '@/i18n';

export function useAppLocale() {
  const { current } = useLocale();
  const i18n = useI18n();

  function apply(locale: Locale) {
    current.value = locale;
    i18n.locale.value = locale;
    saveLocale(locale);
  }

  function init() {
    apply(i18n.locale.value as Locale);
  }

  return reactive({
    current,
    apply,
    init
  });
}
