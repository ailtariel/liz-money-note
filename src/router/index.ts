import { createRouter, createWebHistory } from 'vue-router';
import { i18n } from '@/i18n';
import { getAppConfig } from '@/core/app-config';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/components/layouts/default-layout.vue'),
      redirect: 'transactions',
      children: [
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('@/modules/transactions/Transactions.vue'),
          meta: {
            titleKey: 'nav.transactions',
            bottomNav: true
          }
        },
        {
          path: 'stats',
          name: 'stats',
          component: () => import('@/modules/statistics/Statistics.vue'),
          meta: {
            titleKey: 'nav.stats',
            bottomNav: true
          }
        },
        {
          path: 'assets',
          name: 'assets',
          component: () => import('@/modules/accounts/Assets.vue'),
          meta: {
            titleKey: 'nav.assets',
            bottomNav: true
          }
        },
        {
          path: 'more',
          name: 'more',
          component: () => import('@/components/More.vue'),
          meta: {
            titleKey: 'nav.more',
            bottomNav: true
          }
        },
        {
          path: 'books',
          name: 'books',
          component: () => import('@/modules/books/Books.vue'),
          meta: {
            titleKey: 'nav.books'
          }
        },
        {
          path: 'accounts',
          name: 'accounts',
          component: () => import('@/modules/accounts/Accounts.vue'),
          meta: {
            titleKey: 'nav.accounts'
          }
        },
        {
          path: 'tags',
          name: 'tags',
          component: () => import('@/modules/tags/Tags.vue'),
          meta: {
            titleKey: 'nav.tags'
          }
        },
        {
          path: 'recurring',
          name: 'recurring',
          component: () => import('@/modules/recurring/Recurring.vue'),
          meta: {
            titleKey: 'nav.recurring'
          }
        },
        {
          path: 'data',
          name: 'data',
          component: () => import('@/modules/database/Data.vue'),
          meta: {
            titleKey: 'nav.data'
          }
        },
        {
          path: 'data/import',
          name: 'data-import',
          redirect: { name: 'data' }
        },
        {
          path: 'data/export',
          name: 'data-export',
          redirect: { name: 'data' }
        },
        {
          path: 'data/backup',
          name: 'data-backup',
          redirect: { name: 'data' }
        },
        {
          path: 'data/restore',
          name: 'data-restore',
          redirect: { name: 'data' }
        },
        {
          path: 'theme',
          name: 'theme',
          component: () => import('@/modules/theme/Theme.vue'),
          meta: {
            titleKey: 'more.theme'
          }
        },
        {
          path: 'currency',
          name: 'currency',
          component: () => import('@/modules/currency/Currency.vue'),
          meta: {
            titleKey: 'more.defaultCurrency'
          }
        },
        {
          path: 'system',
          name: 'system',
          component: () => import('@/modules/system/System.vue'),
          meta: {
            titleKey: 'more.system'
          }
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/components/About.vue'),
          meta: {
            titleKey: 'more.about'
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/components/NotFound.vue'),
      meta: {
        title: 'Not Found'
      }
    }
  ]
});

router.afterEach((to) => {
  const config = getAppConfig();
  const title =
    typeof to.meta.titleKey === 'string'
      ? i18n.global.t(to.meta.titleKey)
      : typeof to.meta.title === 'string'
        ? to.meta.title
        : config.app_title;
  document.title = `${title} | ${config.app_title}`;
});

export default router;
