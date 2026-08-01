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

    try {
      // El refresh token vive como cookie HttpOnly (issue #114): el navegador
      // lo adjunta solo en cada request al mismo origen (proxy nginx /api). El
      // endpoint ya no acepta body y no requiere withCredentials (mismo origen).
      // El 401 dispara refresh siempre: el frontend no sabe si la cookie existe.
      const { data } = await axios.post<{ accessToken: string }>(
        `${API_BASE_URL}/Auth/Refrescar`,
      );

      // Persistir el nuevo access token vía el store: el middleware persist
      // escribe en localStorage, manteniendo memoria y storage consistentes.
      useStore.getState().setTokens(data.accessToken);
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