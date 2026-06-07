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
  mdiCogOutline,
  mdiClose,
  mdiCoffeeOutline,
  mdiCreditCardOutline,
  mdiDatabaseOutline,
  mdiDeleteSweepOutline,
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
      VAppBarTitle: {
        style: {
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: 0
        }
      },
      VBtn: {
        rounded: 'xl',
        class: 'text-none',
        style: {
          letterSpacing: 0
        }
      },
      VCard: {
        rounded: 'xl',
        elevation: 0
      },
      VChip: {
        rounded: 'xl',
        style: {
          fontSize: '0.75rem'
        }
      },
      VTextField: {
        variant: 'outlined',
        color: 'primary',
        style: {
          fontSize: '0.875rem'
        }
      },
      VTextarea: {
        variant: 'outlined',
        color: 'primary',
        style: {
          fontSize: '0.875rem'
        }
      },
      VSelect: {
        variant: 'outlined',
        color: 'primary',
        style: {
          fontSize: '0.875rem'
        }
      },
      VFileInput: {
        variant: 'outlined',
        color: 'primary',
        style: {
          fontSize: '0.875rem'
        }
      },
      VBottomNavigation: {
        style: {
          fontSize: '0.75rem'
        }
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
      defaultTheme: config.vuetify?.default_theme ?? 'greenLight',
      themes: {
        greenLight: {
          dark: false,
          colors: {
            background: '#F4F8F6',
            surface: '#FFFFFF',
            primary: '#0F766E',
            secondary: '#14B8A6',
            accent: '#DFF5EF',
            summary: '#10B981',
            'summary-text': '#FFFFFF',
            income: '#059669',
            expense: '#DC2626',
            success: '#059669',
            error: '#DC2626',
            'chip-bg': '#FFFFFF',
            'chip-text': '#111827',
            'nav-active-bg': '#DFF5EF',
            'nav-active-text': '#0F766E',
            'card-border': '#DDEBE6',
            'text-primary': '#111827',
            'text-secondary': '#6B7280',
            warning: '#d97706'
          }
        },
        greenDark: {
          dark: true,
          colors: {
            background: '#071412',
            surface: '#10201D',
            primary: '#2DD4BF',
            secondary: '#5EEAD4',
            accent: '#134E4A',
            summary: '#0F766E',
            'summary-text': '#ECFDF5',
            income: '#34D399',
            expense: '#F87171',
            success: '#34D399',
            error: '#F87171',
            'chip-bg': '#172A26',
            'chip-text': '#F9FAFB',
            'nav-active-bg': '#134E4A',
            'nav-active-text': '#5EEAD4',
            'card-border': '#21413B',
            'text-primary': '#F9FAFB',
            'text-secondary': '#CBD5E1',
            warning: '#fbbf24'
          }
        },
        orangeLight: {
          dark: false,
          colors: {
            background: '#F8F5EF',
            surface: '#FFFFFF',
            primary: '#F97316',
            secondary: '#FDBA74',
            accent: '#FFEDD5',
            summary: '#FDBA74',
            'summary-text': '#FFFFFF',
            income: '#059669',
            expense: '#DC2626',
            success: '#059669',
            error: '#DC2626',
            'chip-bg': '#FFFFFF',
            'chip-text': '#111827',
            'nav-active-bg': '#FFEDD5',
            'nav-active-text': '#EA580C',
            'card-border': '#F1E7D8',
            'text-primary': '#111827',
            'text-secondary': '#6B7280',
            warning: '#d97706'
          }
        },
        orangeDark: {
          dark: true,
          colors: {
            background: '#17120D',
            surface: '#241A12',
            primary: '#FB923C',
            secondary: '#FDBA74',
            accent: '#431407',
            summary: '#EA580C',
            'summary-text': '#FFF7ED',
            income: '#34D399',
            expense: '#F87171',
            success: '#34D399',
            error: '#F87171',
            'chip-bg': '#2B2118',
            'chip-text': '#F9FAFB',
            'nav-active-bg': '#431407',
            'nav-active-text': '#FDBA74',
            'card-border': '#3A2A1E',
            'text-primary': '#F9FAFB',
            'text-secondary': '#D1D5DB',
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
        home: mdiHomeOutline,
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
        system: mdiCogOutline,
        clearCache: mdiDeleteSweepOutline,
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
