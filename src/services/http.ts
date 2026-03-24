import axios from 'axios';
import { getAppConfig } from '@/config/runtime-config';
import { clearAuthSession, getAuthSession } from './auth-session';

const http = axios.create({
  timeout: 20000
});

http.interceptors.request.use((config) => {
  const appConfig = getAppConfig();
  const session = getAuthSession();

  config.baseURL = config.baseURL ?? appConfig.api_base_url ?? '/api';
  config.headers.set('X-Requested-With', 'XMLHttpRequest');

  if (session?.token) {
    config.headers.set('Authorization', `Bearer ${session.token}`);
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuthSession();
    }

    return Promise.reject(error);
  }
);

export default http;
