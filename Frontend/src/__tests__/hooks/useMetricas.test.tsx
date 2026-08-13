import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useMetricasMes, useComparativaMetricas, usePeriodosMetricas } from '../../hooks/useMetricas';
import { periodoAnterior } from '../../utils/periodos';

// ── Mocks ────────────────────────────────────────────────

const metricasServiceMock = vi.hoisted(() => ({
  obtener: vi.fn(),
  obtenerPeriodos: vi.fn(),
}));

vi.mock('../../services/metricas', () => ({
  metricasService: metricasServiceMock,
}));

// ── Fixtures ─────────────────────────────────────────────

const metricas = {
  ingresos: 150000,
  horasTrabajadas: 42,
  trabajosTerminados: 8,
  presupuestosCreados: 12,
  presupuestosAceptados: 6,
};

// ── Helpers ──────────────────────────────────────────────

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useMetricas (issue #118)', () => {
  let queryClient: QueryClient;
  let wrapper: (props: { children: ReactNode }) => ReturnType<typeof QueryClientProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    wrapper = makeWrapper(queryClient);
  });

  it('useMetricasMes(2026, 8): obtiene las métricas del mes y cachea con la key ["metricas", 2026, 8]', async () => {
    metricasServiceMock.obtener.mockResolvedValue(metricas);

    const { result } = renderHook(() => useMetricasMes(2026, 8), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(metricasServiceMock.obtener).toHaveBeenCalledWith(2026, 8);
    expect(result.current.data).toEqual(metricas);
    expect(queryClient.getQueryState(['metricas', 2026, 8])?.dataUpdatedAt).toBeGreaterThan(0);
  });

  it('useMetricasMes(undefined, undefined): deshabilitado y no llama al service', async () => {
    const { result } = renderHook(() => useMetricasMes(undefined, undefined), { wrapper });

    await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
    expect(metricasServiceMock.obtener).not.toHaveBeenCalled();
  });

  it('useComparativaMetricas: 2 llamadas paralelas (mes actual + mes anterior con rollover)', async () => {
    metricasServiceMock.obtener.mockResolvedValue(metricas);

    const now = new Date();
    const mesActual = now.getMonth() + 1;
    const anioActual = now.getFullYear();
    const anterior = periodoAnterior(anioActual, mesActual);

    const { result } = renderHook(() => useComparativaMetricas(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(metricasServiceMock.obtener).toHaveBeenCalledWith(anioActual, mesActual);
    expect(metricasServiceMock.obtener).toHaveBeenCalledWith(anterior.anio, anterior.mes);
    expect(result.current.actual).toEqual(metricas);
    expect(result.current.anterior).toEqual(metricas);
  });

  it('usePeriodosMetricas: obtiene los períodos con la key ["metricas", "periodos"]', async () => {
    metricasServiceMock.obtenerPeriodos.mockResolvedValue([{ anio: 2026, mes: 8 }]);

    const { result } = renderHook(() => usePeriodosMetricas(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(metricasServiceMock.obtenerPeriodos).toHaveBeenCalledTimes(1);
    expect(result.current.periodos).toEqual([{ anio: 2026, mes: 8 }]);
  });
});
