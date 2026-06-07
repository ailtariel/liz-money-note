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
    titleKey: 'more.basicData',
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
      }
    ]
  },
  {
    titleKey: 'more.data',
    items: [
      {
        titleKey: 'more.import',
        icon: '$upload',
        to: { name: 'data-import' },
        routeNames: ['data-import']
      },
      {
        titleKey: 'more.export',
        icon: '$download',
        to: { name: 'data-export' },
        routeNames: ['data-export']
      },
      {
        titleKey: 'more.backup',
        icon: '$data',
        to: { name: 'data-backup' },
        routeNames: ['data-backup']
      },
      {
        titleKey: 'more.restore',
        icon: '$restore',
        to: { name: 'data-restore' },
        routeNames: ['data-restore']
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
        titleKey: 'more.defaultCurrency',
        icon: '$cash',
        to: { name: 'currency' },
        routeNames: ['currency']
      },
      { titleKey: 'more.about', icon: '$info' }
    ]
  }
];

export const moreNavigationItems = moreNavigationSections.flatMap(
  (section) => section.items
);
