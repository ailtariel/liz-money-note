import type { RouteLocationRaw, RouteRecordName } from 'vue-router';

export type MoreNavigationItem = {
  titleKey: string;
  icon: string;
  to?: RouteLocationRaw;
  routeNames?: RouteRecordName[];
};

export type MoreNavigationSection = {
  titleKey: string;
  items: MoreNavigationItem[];
};

export const moreNavigationSections: MoreNavigationSection[] = [
  {
    titleKey: 'more.features',
    items: [
      {
        titleKey: 'nav.books',
        icon: '$book',
        to: { name: 'books' },
        routeNames: ['books']
      },
      {
        titleKey: 'nav.accounts',
        icon: '$account',
        to: { name: 'accounts' },
        routeNames: ['accounts']
      },
      {
        titleKey: 'more.defaultCurrency',
        icon: '$cash',
        to: { name: 'currency' },
        routeNames: ['currency']
      },
      {
        titleKey: 'nav.tags',
        icon: '$tag',
        to: { name: 'tags' },
        routeNames: ['tags']
      },
      {
        titleKey: 'nav.recurring',
        icon: '$recurring',
        to: { name: 'recurring' },
        routeNames: ['recurring']
      },
      {
        titleKey: 'nav.data',
        icon: '$data',
        to: { name: 'data' },
        routeNames: [
          'data',
          'data-import',
          'data-export',
          'data-backup',
          'data-restore'
        ]
      }
    ]
  },
  {
    titleKey: 'more.settings',
    items: [
      {
        titleKey: 'more.theme',
        icon: '$themeDark',
        to: { name: 'theme' },
        routeNames: ['theme']
      },
      {
        titleKey: 'more.system',
        icon: '$system',
        to: { name: 'system' },
        routeNames: ['system']
      },
      {
        titleKey: 'more.about',
        icon: '$info',
        to: { name: 'about' },
        routeNames: ['about']
      }
    ]
  }
];

export const moreNavigationItems = moreNavigationSections.flatMap(
  (section) => section.items
);
