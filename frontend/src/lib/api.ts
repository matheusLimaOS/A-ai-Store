import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const baseURL = import.meta.env.VITE_API_URL || '/api';

/** Same origin path or absolute URL as axios `baseURL`, for `fetch` (e.g. multipart). */
export function apiUrl(suffix: string) {
  const p = suffix.startsWith('/') ? suffix : `/${suffix}`;
  if (baseURL.startsWith('http')) return `${baseURL.replace(/\/$/, '')}${p}`;
  return `${baseURL.replace(/\/$/, '')}${p}`;
}

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

let refreshing = false;
let queue: Array<(t: string | null) => void> = [];

function subscribe(cb: (t: string | null) => void) {
  queue.push(cb);
}

function flush(token: string | null) {
  queue.forEach((cb) => cb(token));
  queue = [];
}

api.interceptors.request.use((config) => {
  const access = useAuthStore.getState().accessToken;
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError & { config?: InternalAxiosRequestConfig & { _retry?: boolean } }) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);
    if (error.response?.status !== 401) return Promise.reject(error);
    if (original.url?.includes('/auth/refresh')) return Promise.reject(error);

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return Promise.reject(error);

    if (refreshing) {
      return new Promise((resolve, reject) => {
        subscribe((token) => {
          if (!token) {
            reject(error);
            return;
          }
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    refreshing = true;
    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
      const access = data.data.accessToken as string;
      const newRefresh = data.data.refreshToken as string;
      useAuthStore.getState().setTokens(access, newRefresh);
      flush(access);
      original.headers.Authorization = `Bearer ${access}`;
      return api(original);
    } catch (e) {
      useAuthStore.getState().logout();
      flush(null);
      return Promise.reject(e);
    } finally {
      refreshing = false;
    }
  }
);

export type ApiListMeta = { total: number; page: number; limit: number; totalPages: number };
