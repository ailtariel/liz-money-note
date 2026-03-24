import { createRouter, createWebHistory } from 'vue-router';
import { getAppConfig } from '@/config/runtime-config';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/default-layout.vue'),
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/home-view.vue'),
          meta: {
            title: 'Home'
          }
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/dashboard-view.vue'),
          meta: {
            title: 'Dashboard',
            requiresAuth: true
          }
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('@/views/about-view.vue'),
          meta: {
            title: 'About'
          }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/login-view.vue'),
      meta: {
        title: 'Login',
        guestOnly: true
      }
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

router.beforeEach((to) => {
  const config = getAppConfig();
  const authStore = useAuthStore();

  if (!authStore.hydrated) {
    authStore.hydrate();
  }

  if (
    config.enable_route_guard &&
    to.meta.requiresAuth &&
    !authStore.isAuthenticated
  ) {
    return {
      name: 'login',
      query: {
        redirect: to.fullPath
      }
    };
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return config.default_route || '/';
  }

  return true;
});

router.afterEach((to) => {
  const config = getAppConfig();
  const title =
    typeof to.meta.title === 'string' ? to.meta.title : config.app_title;
  document.title = `${title} | ${config.app_title}`;
});

export default router;
