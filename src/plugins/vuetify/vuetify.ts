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
        color: 'background',
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
        density: 'comfortable',
        color: 'primary',
        rounded: 'lg',
        style: {
          fontSize: '0.875rem'
        }
      },
      VTextarea: {
        variant: 'outlined',
        density: 'comfortable',
        color: 'primary',
        rounded: 'lg',
        style: {
          fontSize: '0.875rem'
        }
      },
      VSelect: {
        variant: 'outlined',
        density: 'comfortable',
        color: 'primary',
        rounded: 'lg',
        style: {
          fontSize: '0.875rem'
        }
      },
      VFileInput: {
        variant: 'outlined',
        density: 'comfortable',
        color: 'primary',
        rounded: 'lg',
        style: {
          fontSize: '0.875rem'
        }
      },
      VList: {
        bgColor: 'transparent'
      },
      VListItem: {
        rounded: 'lg'
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
            'background': '#F4F8F6',
            'surface': '#FFFFFF',
            'surface-variant': '#F0F6F3',
            'primary': '#0F766E',
            'secondary': '#14B8A6',
            'accent': '#DFF5EF',
            'outline': '#DDEBE6',
            'on-background': '#111827',
            'on-surface': '#111827',
            'on-primary': '#FFFFFF',
            'on-secondary': '#062F2B',
            'summary': '#10B981',
            'income': '#059669',
            'expense': '#DC2626',
            'success': '#059669',
            'error': '#DC2626',
            'warning': '#D97706'
          }
        },
        greenDark: {
          dark: true,
          colors: {
            'background': '#071412',
            'surface': '#10201D',
            'surface-variant': '#172A26',
            'primary': '#2DD4BF',
            'secondary': '#5EEAD4',
            'accent': '#134E4A',
            'outline': '#21413B',
            'on-background': '#F9FAFB',
            'on-surface': '#F9FAFB',
            'on-primary': '#042F2E',
            'on-secondary': '#042F2E',
            'summary': '#0F766E',
            'income': '#34D399',
            'expense': '#F87171',
            'success': '#34D399',
            'error': '#F87171',
            'warning': '#FBBF24'
          }
        },
        orangeLight: {
          dark: false,
          colors: {
            'background': '#F8F5EF',
            'surface': '#FFFFFF',
            'surface-variant': '#FFF7ED',
            'primary': '#F97316',
            'secondary': '#FDBA74',
            'accent': '#FFEDD5',
            'outline': '#F1E7D8',
            'on-background': '#111827',
            'on-surface': '#111827',
            'on-primary': '#FFFFFF',
            'on-secondary': '#431407',
            'summary': '#FDBA74',
            'income': '#059669',
            'expense': '#DC2626',
            'success': '#059669',
            'error': '#DC2626',
            'warning': '#D97706'
          }
        },
        orangeDark: {
          dark: true,
          colors: {
            'background': '#17120D',
            'surface': '#241A12',
            'surface-variant': '#2B2118',
            'primary': '#FB923C',
            'secondary': '#FDBA74',
            'accent': '#431407',
            'outline': '#3A2A1E',
            'on-background': '#F9FAFB',
            'on-surface': '#F9FAFB',
            'on-primary': '#431407',
            'on-secondary': '#431407',
            'summary': '#EA580C',
            'income': '#34D399',
            'expense': '#F87171',
            'success': '#34D399',
            'error': '#F87171',
            'warning': '#FBBF24'
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
        calendar: mdiCalendarBlankOutline,
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
