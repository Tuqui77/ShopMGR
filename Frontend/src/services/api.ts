import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Read token from Zustand persist storage (avoids circular dependency with store)
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('shopmgr-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Separate client for file uploads (multipart/form-data)
export const uploadClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Request interceptor: attach Bearer token to every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 by clearing token and redirecting to login
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear token from persist storage
      localStorage.removeItem('shopmgr-storage');
      // Redirect to login (use replace to avoid back-button loop)
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);