import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import {
  mdiAccountCircleOutline,
  mdiInformationOutline,
  mdiLoginVariant,
  mdiLogoutVariant,
  mdiMoonWaxingCrescent,
  mdiViewDashboardOutline,
  mdiWeatherSunny
} from '@mdi/js';
import type { RuntimeAppConfig } from '@/types/runtime-config';

export function createAppVuetify(config: RuntimeAppConfig) {
  return createVuetify({
    theme: {
      defaultTheme: config.vuetify?.default_theme ?? 'light',
      themes: {
        light: {
          colors: {
            primary: '#0f766e',
            secondary: '#164e63',
            background: '#f7fbfc',
            surface: '#ffffff'
          }
        },
        dark: {
          colors: {
            primary: '#67e8f9',
            secondary: '#22d3ee',
            background: '#0f172a',
            surface: '#111827'
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
        profile: mdiAccountCircleOutline
      },
      sets: {
        mdi
      }
    }
  });
}
