import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { TrabajoDetalle } from '../../pages/TrabajoDetalle';
import type { Trabajo } from '../../types';

// ── Mocks ────────────────────────────────────────────────

const { eliminarMock } = vi.hoisted(() => ({
  eliminarMock: vi.fn(),
}));

vi.mock('../../hooks/useTrabajos', () => ({
  useTrabajoDetalle: () => ({ data: trabajoFixture, isLoading: false, error: null }),
  useTerminarTrabajo: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useIniciarTrabajo: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useEliminarTrabajo: () => ({ mutateAsync: eliminarMock, isPending: false }),
  useSubirFotos: () => ({ mutateAsync: vi.fn() }),
  useEliminarFoto: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../../hooks/useClientes', () => ({
  useClienteDetalle: () => ({ data: undefined }),
}));

vi.mock('../../store', () => ({
  useStore: () => ({
    setShowHoursModal: vi.fn(),
    setSelectedTrabajo: vi.fn(),
    editingTrabajoId: null,
    setEditingTrabajoId: vi.fn(),
    setImageFullscreenOpen: vi.fn(),
  }),
}));

// Componentes hijos pesados: no aportan al flujo de navegación testado.
vi.mock('../../components/TrabajoForm', () => ({ TrabajoForm: () => null }));
vi.mock('../../components/ImageUpload', () => ({ ImageUpload: () => null }));
vi.mock('../../components/HorasTrabajoModal', () => ({ HorasTrabajoModal: () => null }));

// ── Fixtures ─────────────────────────────────────────────

const trabajoFixture: Trabajo = {
  id: 7,
  titulo: 'Cambio de aceite',
  descripcion: 'Aceite y filtro',
  estado: 'Pendiente',
  horasRegistradas: 0,
  horasEstimadas: 2,
  fotosCount: 0,
  fotos: [],
  horasDeTrabajo: [],
  cliente: {
    id: 5,
    nombreCompleto: 'Cliente Test',
    telefono: [],
    balance: 0,
    trabajosCount: 0,
    presupuestosCount: 0,
  },
  clienteId: 5,
};

describe('TrabajoDetalle (caracterización — navegación SPA issue #67 F3)', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  /** Renderiza el detalle dentro de un router con la lista destino stubeada:
   *  si la navegación funciona, /trabajos monta el stub. */
  function renderTrabajoDetalle() {
    return render(
      <MemoryRouter initialEntries={['/trabajos/7']}>
        <Routes>
          <Route path="/trabajos/:id" element={<TrabajoDetalle />} />
          <Route path="/trabajos" element={<div data-testid="lista-trabajos-stub">Lista de trabajos</div>} />
        </Routes>
      </MemoryRouter>,
      { wrapper },
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    eliminarMock.mockResolvedValue(undefined);
  });

  it('carga el detalle del trabajo', async () => {
    renderTrabajoDetalle();

    expect(await screen.findByText('Detalle del Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Cambio de aceite')).toBeInTheDocument();
    expect(screen.getByText('Cliente Test')).toBeInTheDocument();
  });

  it('eliminar: confirma, llama el endpoint y navega a /trabajos (SPA)', async () => {
    renderTrabajoDetalle();
    await screen.findByText('Detalle del Trabajo');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('¿Eliminar trabajo?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    // Navegación client-side: la lista destino se monta sin recargar el bundle
    expect(await screen.findByTestId('lista-trabajos-stub')).toBeInTheDocument();
    expect(eliminarMock).toHaveBeenCalledWith(7);
  });
});
