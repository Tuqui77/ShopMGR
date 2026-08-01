import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Read tokens from Zustand persist storage (avoids circular dependency with store)
function getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
  try {
    const raw = localStorage.getItem('shopmgr-storage');
    if (!raw) return { accessToken: null, refreshToken: null };
    const parsed = JSON.parse(raw);
    return {
      accessToken: parsed?.state?.accessToken ?? null,
      refreshToken: parsed?.state?.refreshToken ?? null,
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

function updateStoredTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem('shopmgr-storage');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.state.accessToken = accessToken;
    parsed.state.refreshToken = refreshToken;
    localStorage.setItem('shopmgr-storage', JSON.stringify(parsed));
  } catch {
    // Ignore — will redirect to login on next request
  }
}

function clearStoredTokens() {
  localStorage.removeItem('shopmgr-storage');
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  const { accessToken } = getStoredTokens();
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

    // If a refresh is already in progress, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const { refreshToken } = getStoredTokens();

    if (!refreshToken) {
      isRefreshing = false;
      clearStoredTokens();
      window.location.replace('/login');
      return Promise.reject(error);
    }

    try {
      // Call refresh endpoint with a plain axios instance (no interceptors)
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${API_BASE_URL}/Auth/Refrescar`,
        null,
        { params: { refreshTokenRequest: refreshToken } },
      );

      updateStoredTokens(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearStoredTokens();
      window.location.replace('/login');
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);