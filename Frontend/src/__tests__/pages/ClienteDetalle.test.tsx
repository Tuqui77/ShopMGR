import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import type { ReactNode } from 'react';
import { ClienteDetalle } from '../../pages/ClienteDetalle';
import type { Cliente } from '../../types';

// ── Mocks ────────────────────────────────────────────────

const { eliminarMock } = vi.hoisted(() => ({
  eliminarMock: vi.fn(),
}));

vi.mock('../../hooks/useClientes', () => ({
  useClienteDetalle: () => ({ data: clienteFixture, isLoading: false, error: null }),
  useEliminarCliente: () => ({ mutateAsync: eliminarMock, isPending: false }),
}));

vi.mock('../../store', () => ({
  useStore: () => ({ editingCliente: null, setEditingCliente: vi.fn() }),
}));

// Componentes hijos pesados: no aportan al flujo de navegación testado.
vi.mock('../../components/ClienteForm', () => ({ ClienteForm: () => null }));
vi.mock('../../components/DireccionModal', () => ({ DireccionModal: () => null }));
vi.mock('../../components/TelefonoModal', () => ({ TelefonoModal: () => null }));
vi.mock('../../components/MovimientosClienteModal', () => ({ MovimientosClienteModal: () => null }));

// ── Fixtures ─────────────────────────────────────────────

const clienteFixture: Cliente = {
  id: 5,
  nombreCompleto: 'Cliente Test',
  telefono: [],
  balance: 0,
  trabajosCount: 2,
  presupuestosCount: 1,
  telefonosCompletos: [],
  direccionesCompletas: [],
};

describe('ClienteDetalle (caracterización — navegación SPA issue #67 F3)', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  /** Renderiza el detalle dentro de un router con la lista destino stubeada:
   *  si la navegación funciona, /clientes monta el stub. */
  function renderClienteDetalle() {
    return render(
      <MemoryRouter initialEntries={['/clientes/5']}>
        <Routes>
          <Route path="/clientes/:id" element={<ClienteDetalle />} />
          <Route path="/clientes" element={<div data-testid="lista-clientes-stub">Lista de clientes</div>} />
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

  it('carga el detalle del cliente', async () => {
    renderClienteDetalle();

    expect(await screen.findByText('Detalle del Cliente')).toBeInTheDocument();
    expect(screen.getByText('Cliente Test')).toBeInTheDocument();
  });

  it('eliminar: confirma, llama el endpoint y navega a /clientes (SPA)', async () => {
    renderClienteDetalle();
    await screen.findByText('Detalle del Cliente');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('¿Eliminar cliente?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    // Navegación client-side: la lista destino se monta sin recargar el bundle
    expect(await screen.findByTestId('lista-clientes-stub')).toBeInTheDocument();
    expect(eliminarMock).toHaveBeenCalledWith(5);
  });
});
