import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useStore } from '../../store';
import { TrabajoForm } from '../../components/TrabajoForm';
import type { Cliente, Presupuesto, Trabajo } from '../../types';
import type { CrearTrabajoRequest } from '../../services/trabajos';

// ── Mocks ────────────────────────────────────────────────

const {
  useClientesMock,
  useTrabajoMock,
  crearMutateAsync,
  modificarMutateAsync,
  cambiarPresupuestoMutateAsync,
  eliminarPresupuestoMutateAsync,
  usePresupuestosPorClienteMock,
  usePresupuestoMock,
  movimientosCrearMock,
} = vi.hoisted(() => ({
  useClientesMock: vi.fn(),
  useTrabajoMock: vi.fn(),
  crearMutateAsync: vi.fn(),
  modificarMutateAsync: vi.fn(),
  cambiarPresupuestoMutateAsync: vi.fn(),
  eliminarPresupuestoMutateAsync: vi.fn(),
  usePresupuestosPorClienteMock: vi.fn(),
  usePresupuestoMock: vi.fn(),
  movimientosCrearMock: vi.fn(),
}));

vi.mock('../../hooks/useClientes', () => ({
  useClientes: () => useClientesMock(),
}));

vi.mock('../../hooks/useTrabajos', () => ({
  useTrabajo: (id: number | undefined) => useTrabajoMock(id),
  useCrearTrabajo: () => ({ mutateAsync: crearMutateAsync, isPending: false }),
  useModificarTrabajo: () => ({ mutateAsync: modificarMutateAsync, isPending: false }),
  useCambiarPresupuesto: () => ({ mutateAsync: cambiarPresupuestoMutateAsync, isPending: false }),
  useEliminarPresupuesto: () => ({ mutateAsync: eliminarPresupuestoMutateAsync, isPending: false }),
}));

vi.mock('../../hooks/usePresupuestos', () => ({
  usePresupuestosPorCliente: (idCliente: number | undefined) => usePresupuestosPorClienteMock(idCliente),
  usePresupuesto: (id: number | undefined) => usePresupuestoMock(id),
}));

vi.mock('../../services/movimientos', () => ({
  movimientosService: { crear: movimientosCrearMock },
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

const presupuestoAceptado: Presupuesto = {
  id: 3,
  titulo: 'Presupuesto A',
  descripcion: '',
  estado: 'Aceptado',
  fecha: '2026-08-01',
  cliente,
  idCliente: 1,
  horasEstimadas: 4,
  costoMateriales: 0,
  costoLabor: 0,
  costoInsumos: 0,
  total: 5000,
  materiales: [],
};

const presupuestoPendiente: Presupuesto = {
  ...presupuestoAceptado,
  id: 4,
  titulo: 'Presupuesto P',
  estado: 'Pendiente',
  horasEstimadas: 2,
  total: 3000,
};

const presupuestoRechazado: Presupuesto = {
  ...presupuestoAceptado,
  id: 5,
  titulo: 'Presupuesto R',
  estado: 'Rechazado',
  total: 1000,
};

const trabajoOriginal: Trabajo = {
  id: 5,
  titulo: 'Trabajo original',
  descripcion: 'Descripción original',
  estado: 'Iniciado',
  horasRegistradas: 0,
  fotosCount: 0,
  cliente: null,
  clienteId: 1,
  idPresupuesto: 3,
};

// ── Helpers ──────────────────────────────────────────────

async function obtenerPayloadCrear(): Promise<CrearTrabajoRequest> {
  await waitFor(() => expect(crearMutateAsync).toHaveBeenCalledTimes(1));
  return crearMutateAsync.mock.calls[0][0] as CrearTrabajoRequest;
}

async function seleccionarClienteYEnviar(titulo = 'Cambio de aceite'): Promise<void> {
  fireEvent.change(screen.getByPlaceholderText('Ej: Cambio de aceite'), {
    target: { value: titulo },
  });
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Crear' }));
  await waitFor(() => expect(crearMutateAsync).toHaveBeenCalledTimes(1));
}

describe('TrabajoForm (caracterización)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useStore.setState({ showTrabajoForm: true });
    useClientesMock.mockReturnValue({ data: [cliente, clienteB], isLoading: false });
    useTrabajoMock.mockReturnValue({ data: undefined, isLoading: false });
    usePresupuestosPorClienteMock.mockReturnValue({ data: [] });
    usePresupuestoMock.mockReturnValue({ data: undefined });
    // No resolver nunca el mutateAsync evita que el submit cierre el store (onCloseCallback)
    crearMutateAsync.mockReturnValue(new Promise(() => {}));
    modificarMutateAsync.mockReturnValue(new Promise(() => {}));
    cambiarPresupuestoMutateAsync.mockReturnValue(new Promise(() => {}));
    eliminarPresupuestoMutateAsync.mockReturnValue(new Promise(() => {}));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('no renderiza nada si isOpen es false (prop sobre el store)', () => {
    useStore.setState({ showTrabajoForm: true });
    render(<TrabajoForm isOpen={false} />);
    expect(screen.queryByText('Nuevo Trabajo')).toBeNull();
  });

  it('renderiza desde el store en modo crear: header, clientes, estado y botones', () => {
    render(<TrabajoForm />);
    expect(screen.getByText('Nuevo Trabajo')).toBeInTheDocument();
    expect(screen.getByText('Seleccionar cliente...')).toBeInTheDocument();
    expect(screen.getByText('Cliente A')).toBeInTheDocument();
    expect(screen.getByText('Cliente B')).toBeInTheDocument();
    expect(screen.getByText('Estado inicial')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pendiente' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'En curso' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('crear: valida título y cliente requeridos sin enviar', async () => {
    render(<TrabajoForm />);

    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('El título es requerido')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un cliente')).toBeInTheDocument();
    expect(crearMutateAsync).not.toHaveBeenCalled();
    expect(movimientosCrearMock).not.toHaveBeenCalled();
  });

  it('crear: payload básico sin anticipo ni presupuesto (descripcion e idPresupuesto undefined)', async () => {
    render(<TrabajoForm />);

    await seleccionarClienteYEnviar();

    const payload = await obtenerPayloadCrear();
    expect(payload).toEqual({
      titulo: 'Cambio de aceite',
      descripcion: undefined,
      idCliente: 1,
      idPresupuesto: undefined,
      estado: 'Pendiente',
    });
    expect(movimientosCrearMock).not.toHaveBeenCalled();
  });

  it('crear: filtra presupuestos del cliente (solo Aceptado/Pendiente) y envía idPresupuesto', async () => {
    usePresupuestosPorClienteMock.mockReturnValue({
      data: [presupuestoAceptado, presupuestoPendiente, presupuestoRechazado],
    });
    render(<TrabajoForm />);

    // Aparece el select de presupuesto al seleccionar un cliente
    fireEvent.change(screen.getByPlaceholderText('Ej: Cambio de aceite'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });

    expect(screen.getByText('Presupuesto asociado (opcional)')).toBeInTheDocument();
    expect(usePresupuestosPorClienteMock).toHaveBeenLastCalledWith(1);
    expect(screen.getByText('Sin presupuesto')).toBeInTheDocument();
    expect(screen.getByText(/Presupuesto A - \$/)).toBeInTheDocument();
    expect(screen.getByText(/Presupuesto P - \$/)).toBeInTheDocument();
    // El presupuesto Rechazado no se ofrece como opción
    expect(screen.queryByText(/Presupuesto R - \$/)).toBeNull();

    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    const payload = await obtenerPayloadCrear();
    expect(payload.idPresupuesto).toBe(3);
  });

  it('crear: con anticipo registra el movimiento ANTES de crear el trabajo', async () => {
    movimientosCrearMock.mockResolvedValue(undefined);
    render(<TrabajoForm />);

    fireEvent.change(screen.getByPlaceholderText('Ej: Cambio de aceite'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Registrar anticipo para materiales/ }));
    fireEvent.change(screen.getByPlaceholderText('Monto del anticipo'), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    await waitFor(() => expect(crearMutateAsync).toHaveBeenCalledTimes(1));

    expect(movimientosCrearMock).toHaveBeenCalledWith({
      idCliente: 1,
      tipo: 'Anticipo',
      monto: 5000,
      descripcion: 'Entrega para la compra de materiales e insumos',
    });
    // Orden: primero el movimiento, después el trabajo
    const ordenMovimiento = movimientosCrearMock.mock.invocationCallOrder[0] ?? 0;
    const ordenTrabajo = crearMutateAsync.mock.invocationCallOrder[0] ?? 0;
    expect(ordenMovimiento).toBeLessThan(ordenTrabajo);
  });

  it('crear: anticipo sin monto muestra el error y no envía nada', async () => {
    render(<TrabajoForm />);

    fireEvent.change(screen.getByPlaceholderText('Ej: Cambio de aceite'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Registrar anticipo para materiales/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('Ingresa el monto del anticipo')).toBeInTheDocument();
    expect(movimientosCrearMock).not.toHaveBeenCalled();
    expect(crearMutateAsync).not.toHaveBeenCalled();
  });

  it('crear: si falla el anticipo muestra error y no crea el trabajo', async () => {
    movimientosCrearMock.mockRejectedValue(new Error('boom'));
    render(<TrabajoForm />);

    fireEvent.change(screen.getByPlaceholderText('Ej: Cambio de aceite'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Registrar anticipo para materiales/ }));
    fireEvent.change(screen.getByPlaceholderText('Monto del anticipo'), {
      target: { value: '5000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByText('Error al registrar anticipo. Intenta de nuevo.')).toBeInTheDocument();
    expect(crearMutateAsync).not.toHaveBeenCalled();
  });

  it('editar: puebla desde el trabajo y envía payload sin idPresupuesto', async () => {
    useTrabajoMock.mockReturnValue({ data: trabajoOriginal, isLoading: false });
    usePresupuestosPorClienteMock.mockReturnValue({ data: [presupuestoAceptado] });
    render(<TrabajoForm trabajoId={5} />);

    // El form se puebla con los datos del trabajo
    const botonActualizar = await screen.findByRole('button', { name: 'Actualizar' });
    expect(screen.getByDisplayValue('Trabajo original')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Descripción original')).toBeInTheDocument();
    // Estado 'Iniciado' → botón 'En curso' activo
    expect(screen.getByRole('button', { name: 'En curso' })).toBeInTheDocument();
    // No hay checkbox de anticipo en edición
    expect(screen.queryByRole('checkbox', { name: /Registrar anticipo para materiales/ })).toBeNull();

    fireEvent.click(botonActualizar);

    await waitFor(() => expect(modificarMutateAsync).toHaveBeenCalledTimes(1));
    const args = modificarMutateAsync.mock.calls[0] as [{ id: number; trabajo: Record<string, unknown> }];
    expect(args[0].id).toBe(5);
    expect(args[0].trabajo).toEqual({
      titulo: 'Trabajo original',
      descripcion: 'Descripción original',
      idCliente: 1,
      estado: 'Iniciado',
    });
    // Comportamiento actual: al editar NO se envía el idPresupuesto
    expect(args[0].trabajo).not.toHaveProperty('idPresupuesto');
    expect(crearMutateAsync).not.toHaveBeenCalled();
  });

  it('editar: muestra el presupuesto actual y permite cambiarlo', async () => {
    useTrabajoMock.mockReturnValue({ data: trabajoOriginal, isLoading: false });
    // Mock stateful: solo devuelve el presupuesto si hay id
    usePresupuestoMock.mockImplementation((id: number | undefined) => ({
      data: id ? presupuestoAceptado : undefined,
    }));
    usePresupuestosPorClienteMock.mockReturnValue({
      data: [presupuestoAceptado, presupuestoPendiente],
    });
    render(<TrabajoForm trabajoId={5} />);

    // Display del presupuesto actual
    expect(await screen.findByText('Presupuesto A')).toBeInTheDocument();
    expect(screen.getByText(/4h estimadas/)).toBeInTheDocument();

    // Abre el selector
    fireEvent.click(screen.getByRole('button', { name: /Cambiar/ }));
    expect(screen.getByText('Cambiar presupuesto')).toBeInTheDocument();

    // Click en el item del selector (el segundo botón con "Presupuesto A")
    const itemPresupuesto = screen
      .getAllByRole('button')
      .find((b) => b.textContent?.includes('Presupuesto A') && b.textContent?.includes('4h ·'));
    expect(itemPresupuesto).toBeDefined();
    fireEvent.click(itemPresupuesto!);

    await waitFor(() => expect(cambiarPresupuestoMutateAsync).toHaveBeenCalledTimes(1));
    expect(cambiarPresupuestoMutateAsync).toHaveBeenCalledWith({ id: 5, idPresupuesto: 3 });
  });

  it('editar: permite quitar el presupuesto asociado', async () => {
    eliminarPresupuestoMutateAsync.mockResolvedValue(undefined);
    useTrabajoMock.mockReturnValue({ data: trabajoOriginal, isLoading: false });
    // Mock stateful: al quitar el presupuesto, usePresupuesto(undefined) devuelve sin data
    usePresupuestoMock.mockImplementation((id: number | undefined) => ({
      data: id ? presupuestoAceptado : undefined,
    }));
    usePresupuestosPorClienteMock.mockReturnValue({ data: [presupuestoAceptado] });
    render(<TrabajoForm trabajoId={5} />);

    fireEvent.click(await screen.findByRole('button', { name: /Cambiar/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Quitar presupuesto' }));

    await waitFor(() => expect(eliminarPresupuestoMutateAsync).toHaveBeenCalledTimes(1));
    expect(eliminarPresupuestoMutateAsync).toHaveBeenCalledWith(5);
    // El selector se cierra y el display vuelve a "Sin presupuesto"
    await waitFor(() => expect(screen.getByText('Sin presupuesto')).toBeInTheDocument());
    expect(screen.queryByText('Quitar presupuesto')).toBeNull();
  });

  it('submit exitoso: llama onSuccess y cierra el store (sin mensaje intermedio)', async () => {
    vi.useFakeTimers();
    crearMutateAsync.mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    render(<TrabajoForm onSuccess={onSuccess} />);
    fireEvent.change(screen.getByPlaceholderText('Ej: Cambio de aceite'), {
      target: { value: 'Cambio de aceite' },
    });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear' }));

    // Flush microtasks: mutateAsync resuelto → onSuccess y cierre inmediatos
    await act(async () => {});
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(useStore.getState().showTrabajoForm).toBe(false);

    // Avanzar el setTimeout(200ms) de reset del form
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });

  it('cierra el modal con Cancelar actualizando el store', () => {
    vi.useFakeTimers();
    render(<TrabajoForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(useStore.getState().showTrabajoForm).toBe(false);
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });

  it('cierra el modal con la tecla Escape', () => {
    vi.useFakeTimers();
    render(<TrabajoForm />);
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(useStore.getState().showTrabajoForm).toBe(false);
    act(() => {
      vi.advanceTimersByTime(300);
    });
  });
});
