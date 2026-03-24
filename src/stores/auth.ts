import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { clearAuthSession, getAuthSession, setAuthSession } from '@/services/auth-session';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<AuthUser | null>(null);
  const hydrated = ref(false);
  const isAuthenticated = computed(() => Boolean(token.value));

  function hydrate() {
    const session = getAuthSession();
    token.value = session?.token ?? null;
    user.value = session?.user ?? null;
    hydrated.value = true;
  }

  function loginDemo() {
    token.value = 'demo-access-token';
    user.value = {
      id: 'demo-user',
      name: 'Demo User',
      role: 'admin'
    };

    setAuthSession({
      token: token.value,
      user: user.value
    });
  }

  function logout() {
    token.value = null;
    user.value = null;
    clearAuthSession();
  }

  return {
    token,
    user,
    hydrated,
    isAuthenticated,
    hydrate,
    loginDemo,
    logout
  };
});
