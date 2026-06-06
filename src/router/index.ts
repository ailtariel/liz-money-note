import { createRouter, createWebHistory } from 'vue-router';
import { getAppConfig } from '@/core/app-config';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/default-layout.vue'),
      children: [
        {
          path: '',
          name: 'transactions',
          component: () => import('@/pages/TransactionsPage.vue'),
          meta: {
            title: '流水'
          }
        },
        {
          path: 'transactions/new',
          name: 'transaction-new',
          component: () => import('@/pages/TransactionEditorPage.vue'),
          meta: {
            title: '新增流水'
          }
        },
        {
          path: 'books',
          name: 'books',
          component: () => import('@/pages/BooksPage.vue'),
          meta: {
            title: '账本'
          }
        },
        {
          path: 'accounts',
          name: 'accounts',
          component: () => import('@/pages/AccountsPage.vue'),
          meta: {
            title: '账户'
          }
        },
        {
          path: 'tags',
          name: 'tags',
          component: () => import('@/pages/TagsPage.vue'),
          meta: {
            title: 'Tag'
          }
        },
        {
          path: 'recurring',
          name: 'recurring',
          component: () => import('@/pages/RecurringEventsPage.vue'),
          meta: {
            title: '周期事件'
          }
        },
        {
          path: 'data',
          name: 'data',
          component: () => import('@/pages/DataSettingsPage.vue'),
          meta: {
            title: '数据'
          }
        }
      ]
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/not-found-view.vue'),
      meta: {
        title: 'Not Found'
      }
    }
  ]
});

router.afterEach((to) => {
  const config = getAppConfig();
  const title =
    typeof to.meta.title === 'string' ? to.meta.title : config.app_title;
  document.title = `${title} | ${config.app_title}`;
});

export default router;
