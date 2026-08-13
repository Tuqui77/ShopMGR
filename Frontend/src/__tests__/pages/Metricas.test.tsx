import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Metricas } from '../../pages/Metricas';
import type { MetricasMes } from '../../types';

// ── Mocks ────────────────────────────────────────────────

const hooks = vi.hoisted(() => ({
  useMetricasMes: vi.fn(),
  usePeriodosMetricas: vi.fn(),
}));

vi.mock('../../hooks/useMetricas', () => ({
  useMetricasMes: hooks.useMetricasMes,
  usePeriodosMetricas: hooks.usePeriodosMetricas,
}));

// ── Fixtures ─────────────────────────────────────────────

const metricasConDatos = {
  ingresos: 150000,
  horasTrabajadas: 42,
  trabajosTerminados: 8,
  presupuestosCreados: 12,
  presupuestosAceptados: 6,
};

const metricasVacias = {
  ingresos: null,
  horasTrabajadas: null,
  trabajosTerminados: null,
  presupuestosCreados: null,
  presupuestosAceptados: null,
};

// ── Helpers ──────────────────────────────────────────────

/** Lee la URL actual de la MemoryRouter para assert de sincronización. */
function UrlProbe({ onSearch }: { onSearch: (search: string) => void }) {
  const location = useLocation();
  onSearch(location.search);
  return null;
}

function renderMetricas({ periodo, entry = `/metricas${periodo ? `?periodo=${periodo}` : ''}` }: { periodo?: string; entry?: string } = {}) {
  let search = '';
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <UrlProbe onSearch={(s) => { search = s; }} />
        <Metricas />
      </MemoryRouter>
    </QueryClientProvider>
  );

  return { getSearch: () => search };
}

function mockPeridos(periodos: { anio: number; mes: number }[], data: MetricasMes = metricasConDatos) {
  hooks.usePeriodosMetricas.mockReturnValue({ periodos, isLoading: false, isError: false });
  hooks.useMetricasMes.mockReturnValue({
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  });
}

describe('Metricas (issue #118 §4.1 — página /metricas)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza header con botón volver y título', () => {
    mockPeridos([{ anio: 2026, mes: 8 }]);
    renderMetricas({ periodo: '2026-08' });

    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Métricas' })).toBeInTheDocument();
  });

  it('responde al ?periodo de la URL: selects con el período, hero y grid con datos', async () => {
    // Periodos con ambos años para que el select tenga la opción 2025.
    mockPeridos([{ anio: 2026, mes: 8 }, { anio: 2025, mes: 7 }]);
    renderMetricas({ periodo: '2025-07' });

    expect(screen.getByLabelText('Año')).toHaveValue('2025');
    expect(screen.getByLabelText('Mes')).toHaveValue('7');

    // Hero + grid con valores reales (hero = 2 columnas moneda):
    expect(await screen.findAllByText(/\$\d+/)).toHaveLength(2);
    expect(screen.getByText('Horas trabajadas')).toBeInTheDocument();
    expect(screen.getByText('Trabajos terminados')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos creados')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos aceptados')).toBeInTheDocument();
  });

  it('el hero de /metricas NO navega (sin enlace "Ver historial", D3)', () => {
    mockPeridos([{ anio: 2026, mes: 8 }]);
    renderMetricas({ periodo: '2026-08' });

    expect(screen.queryByText('Ver historial')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Ver historial/ })).not.toBeInTheDocument();
  });

  it('sin ?periodo → sincroniza la URL al primer período con datos (replace)', async () => {
    mockPeridos([{ anio: 2026, mes: 8 }, { anio: 2026, mes: 7 }]);
    const { getSearch } = renderMetricas();

    await waitFor(() => expect(getSearch()).toContain('periodo=2026-08'));
  });

  it('empty (4.2): todas las métricas null → nota "Sin actividad registrada en …"', () => {
    mockPeridos([{ anio: 2026, mes: 8 }], metricasVacias);
    renderMetricas({ periodo: '2026-08' });

    expect(screen.getByText('Sin actividad registrada en Agosto 2026')).toBeInTheDocument();
  });

  it('error (4.1): "No pudimos cargar las métricas" + "Reintentar" dispara refetch', async () => {
    hooks.usePeriodosMetricas.mockReturnValue({ periodos: [{ anio: 2026, mes: 8 }], isLoading: false, isError: false });
    const refetch = vi.fn().mockResolvedValue(undefined);
    hooks.useMetricasMes.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch });

    renderMetricas({ periodo: '2026-08' });

    const boton = screen.getByRole('button', { name: 'Reintentar' });
    expect(screen.getByText('No pudimos cargar las métricas')).toBeInTheDocument();

    fireEvent.click(boton);

    await waitFor(() => expect(refetch).toHaveBeenCalled());
  });

  it('el selector queda deshabilitado mientras cargan los períodos', () => {
    hooks.usePeriodosMetricas.mockReturnValue({ periodos: [], isLoading: true, isError: false });
    hooks.useMetricasMes.mockReturnValue({ data: undefined, isLoading: false, isError: false, refetch: vi.fn() });

    renderMetricas();

    expect(screen.getByLabelText('Año')).toBeDisabled();
    expect(screen.getByLabelText('Mes')).toBeDisabled();
  });
});
