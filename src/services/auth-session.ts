import type { AuthUser } from '@/stores/auth';

const STORAGE_KEY = 'vue-skeleton:auth';

export interface AuthSession {
  token: string;
  user: AuthUser | null;
}

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_KEY);
}
