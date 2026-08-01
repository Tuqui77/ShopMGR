import axios from 'axios';
import { useStore } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Auto-refresh logic
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error || !token) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// Response interceptor: auto-refresh on 401, then retry
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // If not 401, or already retried, or is the refresh endpoint itself — reject
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/Auth/Refrescar')
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, queue this request. Se marca _retry
    // para que un segundo 401 tras el reintento no dispare otro refresh con un
    // refresh token ya rotado (issue #105).
    if (isRefreshing) {
      originalRequest._retry = true;
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken } = useStore.getState();

    if (!refreshToken) {
      isRefreshing = false;
      useStore.getState().logout();
      window.location.replace('/login');
      return Promise.reject(error);
    }

    try {
      // Call refresh endpoint with a plain axios instance (no interceptors).
      // Issue #106: el refresh token viaja en el BODY como string JSON, nunca en
      // query params. Content-Type explícito: sin él, axios enviaría el string
      // crudo (sin comillas) y `[FromBody] string` del backend rechazaría.
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${API_BASE_URL}/Auth/Refrescar`,
        refreshToken,
        { headers: { 'Content-Type': 'application/json' } },
      );

      // Persistir tokens vía el store: el middleware persist escribe en
      // localStorage, manteniendo memoria y storage consistentes (issue #105).
      useStore.getState().setTokens(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useStore.getState().logout();
      window.location.replace('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);