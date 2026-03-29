import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../../services/api';

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is created and defined', () => {
    expect(apiClient).toBeDefined();
  });

  it('has baseURL configured to /api', () => {
    expect(apiClient.defaults.baseURL).toBe('/api');
  });

  it('has Content-Type header set to application/json', () => {
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('has response interceptor configured', () => {
    expect(apiClient.interceptors.response).toBeDefined();
    expect(typeof apiClient.interceptors.response.use).toBe('function');
  });
});
