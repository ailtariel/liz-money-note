import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { en, zhHans } from 'vuetify/locale';
import {
  mdiArrowDown,
  mdiArrowLeftRight,
  mdiArrowUp,
  mdiBankOutline,
  mdiBookOpenVariantOutline,
  mdiCalendarBlankOutline,
  mdiCarOutline,
  mdiCash,
  mdiChartDonut,
  mdiChartPie,
  mdiCheck,
  mdiClockOutline,
  mdiClose,
  mdiCoffeeOutline,
  mdiCreditCardOutline,
  mdiDatabaseOutline,
  mdiDotsGrid,
  mdiDownloadOutline,
  mdiFilterVariant,
  mdiFoodForkDrink,
  mdiFormatListBulletedSquare,
  mdiHomeOutline,
  mdiInformationOutline,
  mdiMagnify,
  mdiPaletteOutline,
  mdiPlus,
  mdiRestore,
  mdiShoppingOutline,
  mdiTagOutline,
  mdiTranslate,
  mdiTuneVariant,
  mdiUploadOutline,
  mdiWalletOutline,
  mdiWechat,
  mdiAccountCircleOutline,
  mdiLoginVariant,
  mdiLogoutVariant,
  mdiMoonWaxingCrescent,
  mdiViewDashboardOutline,
  mdiWeatherSunny
} from '@mdi/js';
import { getInitialLocale, Locale } from '@/i18n';
import type { RuntimeAppConfig } from '@/types/runtime-config';

export function createAppVuetify(config: RuntimeAppConfig) {
  return createVuetify({
    defaults: {
      VAppBar: {
        flat: true
      },
      VBtn: {
        rounded: 'xl',
        class: 'text-none'
      },
      VCard: {
        rounded: 'xl',
        elevation: 0
      },
      VChip: {
        rounded: 'xl'
      },
      VTextField: {
        variant: 'outlined',
        color: 'primary'
      },
      VTextarea: {
        variant: 'outlined',
        color: 'primary'
      },
      VSelect: {
        variant: 'outlined',
        color: 'primary'
      },
      VFileInput: {
        variant: 'outlined',
        color: 'primary'
      },
      VBottomSheet: {
        contentClass: 'rounded-t-xl overflow-hidden'
      }
    },
    locale: {
      locale: getInitialLocale(),
      fallback: Locale.zhCn,
      messages: {
        [Locale.zhCn]: zhHans,
        [Locale.en]: en
      }
    },
    theme: {
      defaultTheme: config.vuetify?.default_theme ?? 'light',
      themes: {
        light: {
          colors: {
            primary: '#0f766e',
            secondary: '#2563eb',
            background: '#F6F8F7',
            surface: '#ffffff',
            success: '#059669',
            error: '#dc2626',
            warning: '#d97706'
          }
        },
        dark: {
          colors: {
            primary: '#5eead4',
            secondary: '#93c5fd',
            background: '#101918',
            surface: '#17211f',
            success: '#34d399',
            error: '#f87171',
            warning: '#fbbf24'
          }
        }
      }
    },
    icons: {
      defaultSet: 'mdi',
      aliases: {
        ...aliases,
        login: mdiLoginVariant,
        logout: mdiLogoutVariant,
        dashboard: mdiViewDashboardOutline,
        info: mdiInformationOutline,
        themeLight: mdiWeatherSunny,
        themeDark: mdiMoonWaxingCrescent,
        profile: mdiAccountCircleOutline,
        transactions: mdiFormatListBulletedSquare,
        stats: mdiChartPie,
        assets: mdiWalletOutline,
        wallet: mdiWalletOutline,
        more: mdiDotsGrid,
        add: mdiPlus,
        search: mdiMagnify,
        filter: mdiFilterVariant,
        book: mdiBookOpenVariantOutline,
        account: mdiCreditCardOutline,
        tag: mdiTagOutline,
        recurring: mdiCalendarBlankOutline,
        clock: mdiClockOutline,
        data: mdiDatabaseOutline,
        income: mdiArrowUp,
        expense: mdiArrowDown,
        transfer: mdiArrowLeftRight,
        food: mdiFoodForkDrink,
        shopping: mdiShoppingOutline,
        transport: mdiCarOutline,
        car: mdiCarOutline,
        daily: mdiHomeOutline,
        entertainment: mdiPaletteOutline,
        salary: mdiCash,
        coffee: mdiCoffeeOutline,
        cash: mdiCash,
        bank: mdiBankOutline,
        wechat: mdiWechat,
        upload: mdiUploadOutline,
        download: mdiDownloadOutline,
        restore: mdiRestore,
        language: mdiTranslate,
        tune: mdiTuneVariant,
        check: mdiCheck,
        close: mdiClose,
        chartDonut: mdiChartDonut
      },
      sets: {
        mdi
      }
    }
  });
}
