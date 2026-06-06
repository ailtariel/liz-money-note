import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
  type ResponseType
} from 'axios';
import { getAppConfig } from '@/core/app-config';
import { clearAuthSession, getAuthSession } from '@/modules/auth/auth-session';

export interface StandardResponse<T = unknown> {
  code: string;
  data: T;
  message?: string;
  success?: boolean;
}

export type ApiResponse<T = unknown> = StandardResponse<T> | T;

export interface ApiRequestConfig extends AxiosRequestConfig {
  rawResponse?: boolean;
}

export interface ApiRequestOptions<TBody = unknown> {
  url: string;
  data?: TBody;
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
  responseType?: ResponseType;
  config?: ApiRequestConfig;
}

export type RawApiResponse<T = unknown> = AxiosResponse<ApiResponse<T>>;

export class ApiRequestError<T = unknown> extends Error {
  status?: number;
  code?: string;
  data?: T;
  response?: RawApiResponse<T>;
  cause?: unknown;

  constructor(message: string, options: Partial<ApiRequestError<T>> = {}) {
    super(message);
    this.name = 'ApiRequestError';
    Object.assign(this, options);
  }
}

const SUCCESS_CODE = '000000';

function isStandardResponse<T = unknown>(
  payload: unknown
): payload is StandardResponse<T> {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      'code' in payload &&
      'data' in payload
  );
}

function normalizeSuccessResponse<T>(
  response: RawApiResponse<T>,
  rawResponse?: boolean
) {
  const payload = response.data;

  if (isStandardResponse<T>(payload)) {
    payload.success = payload.code === SUCCESS_CODE;

    if (payload.code !== SUCCESS_CODE) {
      throw new ApiRequestError<T>(payload.message || 'Request failed', {
        status: response.status,
        code: payload.code,
        data: payload.data,
        response: response as AxiosResponse<StandardResponse<T>>
      });
    }

    return rawResponse
      ? response
      : payload.data;
  }

  return rawResponse ? response : payload;
}

function normalizeError(error: AxiosError<StandardResponse<unknown>>) {
  const response = error.response;
  const payload = response?.data;

  if (response?.status === 401) {
    clearAuthSession();
  }

  if (isStandardResponse(payload)) {
    return new ApiRequestError(payload.message || 'Request failed', {
      status: response?.status,
      code: payload.code,
      data: payload.data,
      response,
      cause: error
    });
  }

  return new ApiRequestError(error.message || 'Request failed', {
    status: response?.status,
    data: payload,
    response,
    cause: error
  });
}

function createApiClient(): AxiosInstance {
  const instance = axios.create({
    timeout: 20000
  });

  instance.interceptors.request.use((config) => {
    const appConfig = getAppConfig();
    const session = getAuthSession();

    config.baseURL = config.baseURL ?? appConfig.api_base_url ?? '/api';
    config.headers.set('X-Requested-With', 'XMLHttpRequest');

    if (session?.token) {
      config.headers.set('Authorization', `Bearer ${session.token}`);
    }

    return config;
  });

  return instance;
}

class ApiClient {
  readonly request: AxiosInstance;

  constructor(instance?: AxiosInstance) {
    this.request = instance ?? createApiClient();
  }

  private async send<TResponse = unknown, TBody = unknown>(
    method: Method,
    options: ApiRequestOptions<TBody>
  ): Promise<TResponse | RawApiResponse<TResponse>> {
    const { url, data, params, headers, responseType, config } = options;

    try {
      const response = await this.request.request<ApiResponse<TResponse>>({
        method,
        url,
        data,
        params,
        headers,
        responseType,
        ...config
      });

      return normalizeSuccessResponse<TResponse>(response, config?.rawResponse);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw normalizeError(error);
      }

      throw error;
    }
  }

  get<TResponse = unknown>(
    url: string,
    options: Omit<ApiRequestOptions<never>, 'url' | 'data'> = {}
  ) {
    return this.send<TResponse>('GET', { url, ...options });
  }

  delete<TResponse = unknown>(
    url: string,
    options: Omit<ApiRequestOptions<never>, 'url' | 'data'> = {}
  ) {
    return this.send<TResponse>('DELETE', { url, ...options });
  }

  post<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    options: Omit<ApiRequestOptions<TBody>, 'url' | 'data'> = {}
  ) {
    return this.send<TResponse, TBody>('POST', { url, data, ...options });
  }

  postForm<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    options: Omit<ApiRequestOptions<TBody>, 'url' | 'data'> = {}
  ) {
    return this.send<TResponse, TBody>('POST', { url, data, ...options });
  }

  put<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    options: Omit<ApiRequestOptions<TBody>, 'url' | 'data'> = {}
  ) {
    return this.send<TResponse, TBody>('PUT', { url, data, ...options });
  }

  patch<TResponse = unknown, TBody = unknown>(
    url: string,
    data?: TBody,
    options: Omit<ApiRequestOptions<TBody>, 'url' | 'data'> = {}
  ) {
    return this.send<TResponse, TBody>('PATCH', { url, data, ...options });
  }
}

const api = new ApiClient();

export { ApiClient, createApiClient, isStandardResponse, SUCCESS_CODE };
export default api;
