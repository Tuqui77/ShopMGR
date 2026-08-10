import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useStore } from '../../store';
import { PresupuestoForm } from '../../components/PresupuestoForm';
import type { Cliente, Presupuesto, MaterialRequest } from '../../types';
import type { CrearPresupuestoRequest } from '../../services/presupuestos';

// ── Mocks ────────────────────────────────────────────────

const { crearMutateAsync, modificarMutateAsync, useClientesMock, usePresupuestoDetalleMock } = vi.hoisted(() => ({
  crearMutateAsync: vi.fn(),
  modificarMutateAsync: vi.fn(),
  useClientesMock: vi.fn(),
  usePresupuestoDetalleMock: vi.fn(),
}));

vi.mock('../../hooks/useClientes', () => ({
  useClientes: () => useClientesMock(),
}));

vi.mock('../../hooks/usePresupuestos', () => ({
  useCrearPresupuesto: () => ({ mutateAsync: crearMutateAsync, isPending: false }),
  useModificarPresupuesto: () => ({ mutateAsync: modificarMutateAsync, isPending: false }),
  usePresupuestoDetalle: (id: number | undefined) => usePresupuestoDetalleMock(id),
}));

// ── Fixtures ─────────────────────────────────────────────

const cliente: Cliente = {
  id: 1,
  nombreCompleto: 'Cliente A',
  telefono: ['11 1234-5678'],
  balance: 0,
  trabajosCount: 0,
  presupuestosCount: 0,
};

const clienteB: Cliente = { ...cliente, id: 2, nombreCompleto: 'Cliente B', telefono: [] };

const presupuestoOriginal: Presupuesto = {
  id: 10,
  titulo: 'Título original',
  descripcion: '',
  estado: 'Pendiente',
  fecha: '2026-08-01',
  cliente,
  idCliente: 1,
  horasEstimadas: 5,
  costoMateriales: 0,
  costoLabor: 0,
  costoInsumos: 0,
  total: 0,
  materiales: [],
};

// ── Helpers ──────────────────────────────────────────────

async function obtenerPayloadCrear(): Promise<CrearPresupuestoRequest> {
  await waitFor(() => expect(crearMutateAsync).toHaveBeenCalledTimes(1));
  return crearMutateAsync.mock.calls[0][0] as CrearPresupuestoRequest;
}

describe('PresupuestoForm (caracterización)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({ showPresupuestoForm: true });
    useClientesMock.mockReturnValue({ data: [cliente, clienteB] });
    usePresupuestoDetalleMock.mockReturnValue({ data: undefined });
    // No resolver nunca el mutateAsync evita que el submit dispare el
    // setTimeout(1500ms) que cerraría el store a mitad de test.
    crearMutateAsync.mockReturnValue(new Promise(() => {}));
    modificarMutateAsync.mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no renderiza nada si isOpen es false (prop sobre el store)', () => {
    useStore.setState({ showPresupuestoForm: true });
    render(<PresupuestoForm isOpen={false} />);
    expect(screen.queryByText('Seleccionar Cliente')).toBeNull();
  });

  it('renderiza desde el store: muestra el paso de selección de cliente con la lista', () => {
    render(<PresupuestoForm />);
    expect(screen.getByText('Seleccionar Cliente')).toBeInTheDocument();
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
  });

  it('valida el título: no envía y muestra el error', async () => {
    render(<PresupuestoForm />);

    fireEvent.click(screen.getByText('Cliente A'));
    // Paso datos con título vacío
    fireEvent.click(screen.getByRole('button', { name: 'Crear Presupuesto' }));

    expect(await screen.findByText('El título es requerido')).toBeInTheDocument();
    expect(crearMutateAsync).not.toHaveBeenCalled();
  });

  it('crear: envía descripcion: undefined (clave presente) si la descripción queda vacía', async () => {
    render(<PresupuestoForm />);

    fireEvent.click(screen.getByText('Cliente A'));
    fireEvent.change(screen.getByPlaceholderText('Reparación de motor'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear Presupuesto' }));

    const payload = await obtenerPayloadCrear();
    expect(payload).toEqual({
      titulo: 'Cambio de aceite',
      descripcion: undefined,
      horasEstimadas: 0,
      idCliente: 1,
      materiales: [],
    });
    // Comportamiento actual: la clave descripcion se envía con valor undefined
    expect('descripcion' in payload).toBe(true);
    expect(payload.descripcion).toBeUndefined();
  });

  it('crear: envía la descripción y el material con el campo Precio (mapeo de campos)', async () => {
    render(<PresupuestoForm />);

    fireEvent.click(screen.getByText('Cliente A'));

    // Título y descripción
    fireEvent.change(screen.getByPlaceholderText('Reparación de motor'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.change(screen.getByPlaceholderText('Detalles del trabajo...'), {
      target: { value: 'Cambio completo' },
    });

    // Material: los spinbuttons en el paso datos son [horas, cantidad, precio]
    const [horasInput, cantidadInput, precioInput] = screen.getAllByRole('spinbutton');
    fireEvent.change(horasInput, { target: { value: '2' } });
    fireEvent.change(screen.getByPlaceholderText('Material'), { target: { value: 'Filtro de aceite' } });
    fireEvent.change(cantidadInput, { target: { value: '2' } });
    fireEvent.change(precioInput, { target: { value: '1500' } });
    fireEvent.click(screen.getByRole('button', { name: /agregar material/i }));

    fireEvent.click(screen.getByRole('button', { name: 'Crear Presupuesto' }));

    const payload = await obtenerPayloadCrear();
    expect(payload.descripcion).toBe('Cambio completo');
    expect(payload.horasEstimadas).toBe(2);
    // El material se mapea con el campo "Precio" (mayúscula), no "precioUnitario"
    expect(payload.materiales).toEqual([
      { descripcion: 'Filtro de aceite', cantidad: 2, Precio: 1500 },
    ]);
  });

  it('editar: puebla desde el presupuesto y envía descripcion: null si queda vacía', async () => {
    usePresupuestoDetalleMock.mockReturnValue({ data: presupuestoOriginal });
    render(<PresupuestoForm presupuestoId={10} />);

    // El useEffect puebla el form y pasa al paso datos
    const botonActualizar = await screen.findByRole('button', { name: 'Actualizar' });
    expect(screen.getByDisplayValue('Título original')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();

    fireEvent.click(botonActualizar);

    await waitFor(() => expect(modificarMutateAsync).toHaveBeenCalledTimes(1));
    const args = modificarMutateAsync.mock.calls[0] as [{ id: number; presupuesto: Record<string, unknown> }];
    expect(args[0].id).toBe(10);
    expect(args[0].presupuesto).toEqual({
      titulo: 'Título original',
      descripcion: null, // al editar se envía null, no undefined
      horasEstimadas: 5,
      idCliente: 1,
      materiales: [],
    });
  });

  it('editar: mapea los materiales del presupuesto a Precio: precioUnitario', async () => {
    const originalConMateriales: Presupuesto = {
      ...presupuestoOriginal,
      materiales: [
        { id: 1, descripcion: 'Aceite', cantidad: 3, precioUnitario: 500, subtotal: 1500 },
      ],
    };
    usePresupuestoDetalleMock.mockReturnValue({ data: originalConMateriales });
    render(<PresupuestoForm presupuestoId={10} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Actualizar' }));

    await waitFor(() => expect(modificarMutateAsync).toHaveBeenCalledTimes(1));
    const args = modificarMutateAsync.mock.calls[0] as [{ presupuesto: { materiales: MaterialRequest[] } }];
    expect(args[0].presupuesto.materiales).toEqual([
      { descripcion: 'Aceite', cantidad: 3, Precio: 500 },
    ]);
  });

  it('duplicar: precarga desde el detalle del origen vía React Query y crea una copia', async () => {
    useStore.setState({ showPresupuestoForm: true });
    const presupuestoOrigen: Presupuesto = {
      ...presupuestoOriginal,
      titulo: 'Presupuesto original duplicado',
      descripcion: 'Descripción duplicada',
      horasEstimadas: 3,
      materiales: [{ id: 1, descripcion: 'Aceite', cantidad: 1, precioUnitario: 500, subtotal: 500 }],
    };
    usePresupuestoDetalleMock.mockImplementation((id: number | undefined) =>
      id === 10 ? { data: presupuestoOrigen } : { data: undefined },
    );
    render(<PresupuestoForm presupuestoDuplicadoId={10} />);

    // El effect precarga el detalle del origen y pasa directo al paso datos
    expect(await screen.findByRole('button', { name: 'Crear Copia' })).toBeInTheDocument();
    expect(screen.getByText('Duplicar Presupuesto')).toBeInTheDocument();
    // El título se antepone "Copia de "
    expect(screen.getByDisplayValue('Copia de Presupuesto original duplicado')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Descripción duplicada')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Crear Copia' }));

    const payload = await obtenerPayloadCrear();
    expect(payload).toEqual({
      titulo: 'Copia de Presupuesto original duplicado',
      descripcion: 'Descripción duplicada',
      horasEstimadas: 3,
      idCliente: 1,
      materiales: [{ descripcion: 'Aceite', cantidad: 1, Precio: 500 }],
    });
  });

  it('cierra el modal actualizando el store (setShowPresupuestoForm(false))', () => {
    render(<PresupuestoForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));

    expect(useStore.getState().showPresupuestoForm).toBe(false);
  });

  it('submit exitoso: muestra "¡Listo!" y llama onSuccess tras 1500ms', async () => {
    vi.useFakeTimers();
    crearMutateAsync.mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    render(<PresupuestoForm onSuccess={onSuccess} />);
    fireEvent.click(screen.getByText('Cliente A'));
    fireEvent.change(screen.getByPlaceholderText('Reparación de motor'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear Presupuesto' }));

    // Flush microtasks: mutateAsync resuelto → setShowSuccess(true)
    await act(async () => {});
    expect(screen.getByText('¡Listo!')).toBeInTheDocument();
    expect(screen.getByText('Presupuesto creado')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(useStore.getState().showPresupuestoForm).toBe(false);
  });
});
