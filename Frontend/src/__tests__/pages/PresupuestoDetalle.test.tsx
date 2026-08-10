import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useStore } from '../../store';
import { PresupuestoDetalle } from '../../pages/PresupuestoDetalle';
import type { Presupuesto } from '../../types';

// ── Mocks ────────────────────────────────────────────────

const { apiGetMock, apiDeleteMock, aceptarMock, rechazarMock, crearDesdePresupuestoMock, navigateMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiDeleteMock: vi.fn(),
  aceptarMock: vi.fn(),
  rechazarMock: vi.fn(),
  crearDesdePresupuestoMock: vi.fn(),
  navigateMock: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({ id: '10' }),
  useNavigate: () => navigateMock,
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock('../../services/api', () => ({
  apiClient: {
    get: apiGetMock,
    delete: apiDeleteMock,
  },
}));

vi.mock('../../services/presupuestos', () => ({
  presupuestosService: {
    // La página usa usePresupuestoDetalle → presupuestosService.obtenerDetalle.
    // Delegamos en apiGetMock para conservar la aserción del endpoint real.
    obtenerDetalle: (id: number) =>
      apiGetMock('/Presupuestos/ObtenerDetallePresupuesto', { params: { idPresupuesto: id } }).then(
        (res: { data: Record<string, unknown> }) => {
          const dto = res.data;
          const cliente = dto['cliente'] as
            | {
                id: number;
                nombreCompleto: string;
                telefono?: { $values?: { telefono: string }[] };
              }
            | undefined;
          const materiales = (dto['materiales'] as
            | { id: number; descripcion: string; cantidad: number; precio: number }[]
            | undefined) ?? [];
          return {
            ...dto,
            cliente: cliente
              ? {
                  id: cliente.id,
                  nombreCompleto: cliente.nombreCompleto,
                  telefono: cliente.telefono?.$values?.map((t) => t.telefono) ?? [],
                }
              : undefined,
            materiales: materiales.map((m) => ({
              ...m,
              precioUnitario: m.precio,
              subtotal: m.cantidad * m.precio,
            })),
          };
        },
      ),
    aceptar: aceptarMock,
    rechazar: rechazarMock,
  },
}));

vi.mock('../../services/trabajos', () => ({
  trabajosService: {
    crearDesdePresupuesto: crearDesdePresupuestoMock,
  },
}));

vi.mock('../../hooks/useClientes', () => ({
  useClienteDetalle: () => ({ data: undefined }),
}));

vi.mock('../../components/PresupuestoForm', () => ({
  PresupuestoForm: ({ presupuestoId, presupuestoDuplicadoId, isOpen }: { presupuestoId?: number; presupuestoDuplicadoId?: number; isOpen?: boolean }) => (
    <div data-testid="presupuesto-form">
      PresupuestoForm id={presupuestoId} duplicadoId={presupuestoDuplicadoId} isOpen={String(isOpen)}
    </div>
  ),
}));

// ── Fixtures ─────────────────────────────────────────────

// DTO raw del backend con formato {$id, $values} como lo mapea PresupuestoDetalle
const dtoRaw = {
  id: 10,
  titulo: 'Presupuesto detalle',
  descripcion: 'Descripción del presupuesto',
  estado: 'Pendiente',
  fecha: '2026-08-01',
  horasEstimadas: 5,
  costoMateriales: 1000,
  costoLabor: 5000,
  costoInsumos: 200,
  total: 6200,
  cliente: {
    id: 1,
    nombreCompleto: 'Cliente A',
    telefono: { $id: '1', $values: [{ telefono: '11 1234-5678' }] },
  },
  materiales: [{ id: 1, descripcion: 'Aceite', cantidad: 2, precio: 500 }],
};

describe('PresupuestoDetalle (caracterización)', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useStore.setState({ editingPresupuestoId: null, showPresupuestoForm: false });
    apiGetMock.mockResolvedValue({ data: dtoRaw });
  });

  it('carga el detalle con queryKey ["presupuestos", id, "detalle"] y muestra el contenido', async () => {
    render(<PresupuestoDetalle />, { wrapper });

    expect(await screen.findByText('Presupuesto detalle')).toBeInTheDocument();
    expect(screen.getByText('Descripción del presupuesto')).toBeInTheDocument();
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('11 1234-5678')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();

    // Endpoint consultado con el parámetro idPresupuesto
    expect(apiGetMock).toHaveBeenCalledWith('/Presupuestos/ObtenerDetallePresupuesto', {
      params: { idPresupuesto: 10 },
    });
    // queryKey unificada con el hook usePresupuestoDetalle (refactor H5)
    expect(queryClient.getQueryData<Presupuesto>(['presupuestos', 10, 'detalle'])?.titulo).toBe('Presupuesto detalle');
    expect(queryClient.getQueryData(['presupuesto', 10])).toBeUndefined();
  });

  it('duplicar: abre el PresupuestoForm con presupuestoDuplicadoId sin tocar el store', async () => {
    render(<PresupuestoDetalle />, { wrapper });
    await screen.findByText('Presupuesto detalle');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Duplicar' }));

    // El detalle lo precarga el form vía React Query (prop presupuestoDuplicadoId)
    expect(useStore.getState().editingPresupuestoId).toBeNull();
    const form = screen.getByTestId('presupuesto-form');
    expect(form.textContent).toContain('duplicadoId=10');
  });

  it('editar: setea editingPresupuestoId y renderiza PresupuestoForm con las props', async () => {
    render(<PresupuestoDetalle />, { wrapper });
    await screen.findByText('Presupuesto detalle');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));

    expect(useStore.getState().editingPresupuestoId).toBe(10);
    const form = screen.getByTestId('presupuesto-form');
    expect(form.textContent).toContain('id=10');
    expect(form.textContent).toContain('isOpen=true');
  });

  it('aceptar: crea el trabajo primero, acepta el presupuesto y muestra el mensaje de éxito', async () => {
    crearDesdePresupuestoMock.mockResolvedValue(undefined);
    aceptarMock.mockResolvedValue(undefined);

    render(<PresupuestoDetalle />, { wrapper });
    await screen.findByText('Presupuesto detalle');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(screen.getByText('¿Aceptar presupuesto?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Aceptar y crear trabajo' }));

    // Orden: primero el trabajo, después el presupuesto
    await waitFor(() => expect(crearDesdePresupuestoMock).toHaveBeenCalledWith(10));
    expect(aceptarMock).toHaveBeenCalledWith(10);
    expect(await screen.findByText('Presupuesto aceptado y trabajo creado exitosamente')).toBeInTheDocument();
  });

  it('rechazar: confirma y llama presupuestosService.rechazar', async () => {
    rechazarMock.mockResolvedValue(undefined);

    render(<PresupuestoDetalle />, { wrapper });
    await screen.findByText('Presupuesto detalle');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));

    expect(screen.getByText('¿Rechazar presupuesto?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));

    await waitFor(() => expect(rechazarMock).toHaveBeenCalledWith(10));
  });

  it('eliminar: confirma, llama el endpoint y navega a /presupuestos (SPA)', async () => {
    apiDeleteMock.mockResolvedValue(undefined);

    render(<PresupuestoDetalle />, { wrapper });
    await screen.findByText('Presupuesto detalle');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('¿Eliminar presupuesto?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    await waitFor(() =>
      expect(apiDeleteMock).toHaveBeenCalledWith('/Presupuestos/EliminarPresupuesto?idPresupuesto=10'),
    );
    // Navegación client-side (issue #67 F3): sin full page load
    expect(navigateMock).toHaveBeenCalledWith('/presupuestos');
    expect(window.location.href).not.toBe('/presupuestos');
  });

  it('muestra el spinner mientras carga (isLoading)', () => {
    apiGetMock.mockReturnValue(new Promise(() => {}));

    render(<PresupuestoDetalle />, { wrapper });

    expect(screen.queryByText('Detalle del Presupuesto')).toBeNull();
    // El loader es un svg con clase animate-spin
    expect(document.querySelector('.animate-spin')).not.toBeNull();
  });

  it('muestra el error si la carga falla', async () => {
    apiGetMock.mockRejectedValue(new Error('Network Error'));

    render(<PresupuestoDetalle />, { wrapper });

    expect(await screen.findByText('Error al cargar presupuesto')).toBeInTheDocument();
    expect(screen.getByText('¿El backend está corriendo?')).toBeInTheDocument();
  });

  it('si el estado NO es Pendiente, el menú no ofrece Aceptar ni Rechazar', async () => {
    apiGetMock.mockResolvedValue({ data: { ...dtoRaw, estado: 'Aceptado' } });

    render(<PresupuestoDetalle />, { wrapper });
    await screen.findByText('Presupuesto detalle');

    fireEvent.click(screen.getByRole('button', { name: 'Opciones' }));

    expect(screen.queryByRole('button', { name: 'Aceptar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Duplicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
  });
});
