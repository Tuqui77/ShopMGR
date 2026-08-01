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
   * Issue #114: el refresh token viaja como cookie HttpOnly; el POST al refresh
   * se hace SIN body y SIN query params (el navegador adjunta la cookie sola).
   */
  function expectRefreshCall(postSpy: ReturnType<typeof vi.spyOn>) {
    const call = postSpy.mock.calls[0];
    expect(call[0]).toBe('/api/Auth/Refrescar');
    expect(call[1]).toBeUndefined();
    expect(call[2]).toBeUndefined();
  }

  beforeEach(() => {
    localStorage.clear();
    useStore.getState().logout();
    vi.restoreAllMocks();
    // El mock de location del setup es un vi.fn() plano: restoreAllMocks no lo
    // limpia, hay que hacerlo explícito para no heredar llamadas entre tests.
    vi.mocked(window.location.replace).mockClear();
    adapterCalls = [];
    failCount = 0;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('tras un refresh exitoso, memoria y localStorage quedan consistentes', async () => {
    useStore.getState().setTokens('old-access');
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue(
      makeAxiosResponse({ accessToken: 'new-access' }),
    );
    installFailAdapter(1);

    const response = await apiClient.get('/prueba');

    expect(response.data).toEqual({ resultado: 'ok' });
    // Store en memoria actualizado (solo accessToken)
    expect(useStore.getState().accessToken).toBe('new-access');
    // localStorage consistente (persist del store) — SOLO accessToken
    const persisted = JSON.parse(localStorage.getItem('shopmgr-storage') ?? '{}') as {
      state?: { accessToken?: unknown };
    };
    expect(persisted.state?.accessToken).toBe('new-access');
    expect(persisted.state).not.toHaveProperty('refreshToken');
    // Un solo refresh sin body y el reintento usa el token nuevo
    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy);
    expect(adapterCalls[0]).toBe('Bearer old-access');
    expect(adapterCalls[1]).toBe('Bearer new-access');
  });

  it('requests concurrentes con 401 disparan UN solo refresh', async () => {
    useStore.getState().setTokens('old-access');
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue(
      makeAxiosResponse({ accessToken: 'new-access' }),
    );
    installFailAdapter(2); // ambas requests iniciales fallan con 401

    const results = await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b')]);

    expect(results.every((r) => r.status === 'fulfilled')).toBe(true);
    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy);
    expect(useStore.getState().accessToken).toBe('new-access');
    // Los reintentos encolados usan el token nuevo
    expect(adapterCalls.slice(2).every((auth) => auth === 'Bearer new-access')).toBe(true);
  });

  it('un 401 adicional en un request re-intentado NO dispara otro refresh', async () => {
    useStore.getState().setTokens('old-access');
    const postSpy = vi.spyOn(axios, 'post').mockResolvedValue(
      makeAxiosResponse({ accessToken: 'new-access' }),
    );
    installFailAdapter(3); // 2 iniciales + 1 reintento vuelve a fallar con 401

    const results = await Promise.allSettled([apiClient.get('/a'), apiClient.get('/b')]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    // Sin doble refresh con token rotado: se refrescó una sola vez
    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy);
  });

  it('si el refresh falla, limpia el token y redirige a /login', async () => {
    useStore.getState().setTokens('old-access');
    const postSpy = vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh falló'));
    installFailAdapter(1);

    // El error del refresh se propaga al caller original
    await expect(apiClient.get('/prueba')).rejects.toThrow('refresh falló');

    expect(postSpy).toHaveBeenCalledTimes(1);
    expectRefreshCall(postSpy);
    expect(useStore.getState().accessToken).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });

  it('un 401 en el propio /Auth/Refrescar NO dispara otro refresh', async () => {
    useStore.getState().setTokens('old-access');
    const postSpy = vi.spyOn(axios, 'post').mockRejectedValue(new Error('no debería llamarse'));
    installFailAdapter(1);

    await expect(apiClient.post('/Auth/Refrescar')).rejects.toThrow('Unauthorized');

    expect(postSpy).not.toHaveBeenCalled();
    expect(useStore.getState().accessToken).toBe('old-access');
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});
