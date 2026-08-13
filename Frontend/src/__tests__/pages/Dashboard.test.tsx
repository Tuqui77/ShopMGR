import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '../../pages/Dashboard';
import { formatPeriodo } from '../../utils/periodos';

// ── Mocks ────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  useComparativaMetricas: vi.fn(),
  useTrabajosActivos: vi.fn(),
  useIniciarTrabajo: vi.fn(),
  usePresupuestosPorEstado: vi.fn(),
  useAceptarPresupuesto: vi.fn(),
  useRechazarPresupuesto: vi.fn(),
}));

vi.mock('../../hooks/useMetricas', () => ({
  useComparativaMetricas: mocks.useComparativaMetricas,
}));

vi.mock('../../hooks/useTrabajos', () => ({
  useTrabajosActivos: mocks.useTrabajosActivos,
  useIniciarTrabajo: mocks.useIniciarTrabajo,
}));

vi.mock('../../hooks/usePresupuestos', () => ({
  usePresupuestosPorEstado: mocks.usePresupuestosPorEstado,
  useAceptarPresupuesto: mocks.useAceptarPresupuesto,
  useRechazarPresupuesto: mocks.useRechazarPresupuesto,
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

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Dashboard comparativo (issue #118 §3.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useComparativaMetricas.mockReturnValue({
      actual: metricas,
      anterior: metricas,
      isLoading: false,
      isError: false,
    });
    mocks.useTrabajosActivos.mockReturnValue({ data: [], isLoading: false });
    mocks.useIniciarTrabajo.mockReturnValue({ mutate: vi.fn() });
    mocks.usePresupuestosPorEstado.mockReturnValue({ data: [], isLoading: false });
    mocks.useAceptarPresupuesto.mockReturnValue({ mutate: vi.fn() });
    mocks.useRechazarPresupuesto.mockReturnValue({ mutate: vi.fn() });
  });

  it('hero de ingresos es tappable (D3): link a /metricas?periodo=AAAA-MM', async () => {
    const now = new Date();
    const esperado = `/metricas?periodo=${formatPeriodo(now.getFullYear(), now.getMonth() + 1)}`;

    const { container } = renderDashboard();

    const enlace = await waitFor(() => {
      const link = container.querySelector('a[href^="/metricas"]') as HTMLAnchorElement;
      expect(link).not.toBeNull();
      return link;
    });
    expect(enlace.getAttribute('href')).toBe(esperado);
    expect(container.querySelectorAll('a[href^="/metricas"]')).toHaveLength(1);
  });

  it('grid 2x2 NO es tappable (D3): las cards secundarias no están dentro de links', async () => {
    renderDashboard();

    expect(await screen.findByText('Horas trabajadas')).toBeInTheDocument();
    expect(screen.getByText('Trabajos terminados')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos creados')).toBeInTheDocument();
    expect(screen.getByText('Presupuestos aceptados')).toBeInTheDocument();

    // La única card comparativa dentro de un link es el hero de ingresos.
    const links = Array.from(document.querySelectorAll('a'));
    const cardsEnLinks = links.filter((a) =>
      a.querySelector('.metric-value') !== null && a.textContent?.includes('Este mes')
    );
    expect(cardsEnLinks).toHaveLength(1);
    expect(cardsEnLinks[0]?.textContent).toContain('Ingresos del mes');
  });

  it('muestra valores comparativos lado a lado sin porcentajes ni flechas', async () => {
    renderDashboard();

    // Meses en las sublabels (una columna por card comparativa):
    expect((await screen.findAllByText('Este mes')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Mes anterior').length).toBeGreaterThan(0);

    // Sin porcentajes de variación ni flechas de tendencia:
    expect(document.body.textContent).not.toMatch(/%/);
    expect(document.body.textContent).not.toContain('▲');
    expect(document.body.textContent).not.toContain('▼');
  });

  it('isLoading → skeletons visibles (sin hero ni grid)', () => {
    mocks.useComparativaMetricas.mockReturnValue({ actual: undefined, anterior: undefined, isLoading: true, isError: false });

    renderDashboard();

    // Durante loading no se renderiza el hero ni las cards comparativas:
    expect(screen.queryByText('Ingresos del mes')).not.toBeInTheDocument();
    expect(screen.queryByText('Horas trabajadas')).not.toBeInTheDocument();
  });

  it('métricas null → "—" en las columnas (contrato null, nunca 0 ni %)', async () => {
    const vacias = {
      ingresos: null,
      horasTrabajadas: null,
      trabajosTerminados: null,
      presupuestosCreados: null,
      presupuestosAceptados: null,
    };
    mocks.useComparativaMetricas.mockReturnValue({
      actual: vacias,
      anterior: vacias,
      isLoading: false,
      isError: false,
    });

    renderDashboard();

    expect(await screen.findAllByText('—')).not.toHaveLength(0);
    expect(screen.queryByText('%')).not.toBeInTheDocument();
  });
});
