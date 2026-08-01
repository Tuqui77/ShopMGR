import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../../services/api';
import { useStore } from '../../store';

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

describe('apiClient auto-refresh (issue #105: consistencia store ↔ localStorage)', () => {
  const originalAdapter = apiClient.defaults.adapter;
  let adapterCalls: string[] = [];
  let failCount = 0;

  /** Construye una AxiosResponse válida (evita `as unknown as` en los mocks). */
  function makeAxiosResponse(data: unknown): AxiosResponse {
    return {
      data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: new AxiosHeaders() } as InternalAxiosRequestConfig,
    };
  }

  /**
   * Adapter custom (API pública de axios): falla con 401 las primeras `failures`
   * llamadas y resuelve 200 el resto. Registra el header Authorization de cada
   * llamada para verificar que los reintentos usan el token nuevo.
   */
  function installFailAdapter(failures: number) {
    failCount = failures;
    adapterCalls = [];
    apiClient.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      const auth = config.headers.Authorization;
      adapterCalls.push(typeof auth === 'string' ? auth : '');
      if (adapterCalls.length <= failCount) {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: {},
        });
      }
      return { data: { resultado: 'ok' }, status: 200, statusText: 'OK', headers: {}, config };
    };
  }

  /**
   * Issue #106: verifica que la llamada al refresh usa el refresh token como
   * body (string JSON) y que NO envía query params (`refreshTokenRequest`).
   */
  function expectRefreshCall(postSpy: ReturnType<typeof vi.spyOn>, token: string) {
    const call = postSpy.mock.calls[0];
    expect(call[0]).toBe('/api/Auth/Refrescar');
    expect(call[1]).toBe(token);
    expect(call[2]).not.toHaveProperty('params');
  }

  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.restoreAllMocks();
    adapterCalls = [];
    failCount = 0;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('tras un refresh exitoso, memoria y localStorage quedan consistentes', async () => {
    useStore.getState().setTokens('old-access', 'old-refresh');
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue(
      makeAxiosResponse({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    );
    installFailAdapter(1);

    const response = await apiClient.get('/prueba');

    expect(response.data).toEqual({ resultado: 'ok' });
    // Store en memoria actualizado
    expect(useStore.getState().accessToken).toBe('new-access');
    expect(useStore.getState().refreshToken).toBe('new-refresh');
    // localStorage consistente (persist del store)
    const persisted = JSON.parse(localStorage.getItem('shopmgr-storage') ?? '{}') as {
      state?: { accessToken?: unknown; refreshToken?: unknown };
    };
    expect(persisted.state?.accessToken).toBe('new-access');
    expect(persisted.state?.refreshToken).toBe('new-refresh');
    // Un solo refresh y el reintento usa el token nuevo
    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy, 'old-refresh');
    expect(adapterCalls[0]).toBe('Bearer old-access');
    expect(adapterCalls[1]).toBe('Bearer new-access');
  });

  it('requests concurrentes con 401 disparan UN solo refresh', async () => {
    useStore.getState().setTokens('old-access', 'old-refresh');
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue(
      makeAxiosResponse({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    );
    installFailAdapter(2); // ambas requests iniciales fallan con 401

    const results = await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b')]);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy, 'old-refresh');
    expect(useStore.getState().accessToken).toBe('new-access');
    // Los reintentos encolados usan el token nuevo
    expect(adapterCalls.slice(2).every((auth) => auth === 'Bearer new-access')).toBe(true);
  });

  it('un 401 adicional en un request re-intentado NO dispara otro refresh', async () => {
    useStore.getState().setTokens('old-access', 'old-refresh');
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue(
      makeAxiosResponse({ accessToken: 'new-access', refreshToken: 'new-refresh' }),
    );
    installFailAdapter(3); // 2 iniciales + 1 reintento vuelve a fallar con 401

    const results = await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b')]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    // Sin doble refresh con token rotado: se refrescó una sola vez
    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy, 'old-refresh');
  });

  it('si el refresh falla, limpia tokens y redirige a /login', async () => {
    useStore.getState().setTokens('old-access', 'old-refresh');
    const postSpy = vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh falló'));
    installFailAdapter(1);

    // El error del refresh se propaga al caller original
    await expect(apiClient.get('/prueba')).rejects.toThrow('refresh falló');

    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy, 'old-refresh');
    expect(useStore.getState().accessToken).toBeNull();
    expect(useStore.getState().refreshToken).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });
});
