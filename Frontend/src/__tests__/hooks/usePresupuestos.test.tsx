import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Presupuesto } from '../../types';
import type { CrearPresupuestoRequest } from '../../services/presupuestos';
import {
  usePresupuestos,
  usePresupuesto,
  usePresupuestoDetalle,
  usePresupuestosPorCliente,
  usePresupuestosPorEstado,
  useCrearPresupuesto,
  useModificarPresupuesto,
  useEliminarPresupuesto,
  useAceptarPresupuesto,
  useRechazarPresupuesto,
} from '../../hooks/usePresupuestos';

// ── Mocks ────────────────────────────────────────────────

const presupuestosServiceMock = vi.hoisted(() => ({
  listar: vi.fn(),
  obtenerPorId: vi.fn(),
  obtenerDetalle: vi.fn(),
  obtenerPorCliente: vi.fn(),
  obtenerPorEstado: vi.fn(),
  crear: vi.fn(),
  modificar: vi.fn(),
  eliminar: vi.fn(),
  aceptar: vi.fn(),
  rechazar: vi.fn(),
}));

vi.mock('../../services/presupuestos', () => ({
  presupuestosService: presupuestosServiceMock,
}));

// ── Fixtures ─────────────────────────────────────────────

const presupuesto: Presupuesto = {
  id: 10,
  titulo: 'Presupuesto test',
  descripcion: 'Cambio de embrague',
  estado: 'Pendiente',
  fecha: '2026-08-01',
  cliente: {
    id: 1,
    nombreCompleto: 'Cliente A',
    telefono: [],
    balance: 0,
    trabajosCount: 0,
    presupuestosCount: 0,
  },
  idCliente: 1,
  horasEstimadas: 5,
  costoMateriales: 100,
  costoLabor: 500,
  costoInsumos: 0,
  total: 600,
  materiales: [],
};

const presupuestoPendiente: Presupuesto = { ...presupuesto, id: 8 };

const payloadCrear: CrearPresupuestoRequest = {
  titulo: 'Presupuesto test',
  descripcion: 'Cambio de embrague',
  horasEstimadas: 5,
  idCliente: 1,
  materiales: [],
};

const payloadModificar = { titulo: 'Título nuevo', descripcion: 'Nueva desc', horasEstimadas: 8 };

// ── Helpers ──────────────────────────────────────────────

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function seedQueries(queryClient: QueryClient) {
  queryClient.setQueryData(['presupuestos'], [presupuesto]);
  queryClient.setQueryData(['presupuestos', 10], presupuesto);
  queryClient.setQueryData(['presupuestos', 10, 'detalle'], presupuesto);
  queryClient.setQueryData(['trabajos'], []);
}

async function runMutation<T>(promise: Promise<T>) {
  await act(async () => {
    await promise;
  });
}

describe('usePresupuestos (hooks)', () => {
  let queryClient: QueryClient;
  let wrapper: (props: { children: ReactNode }) => ReturnType<typeof QueryClientProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    wrapper = makeWrapper(queryClient);
  });

  // ── Queries ────────────────────────────────────────────

  describe('queries', () => {
    it('usePresupuestos: lista presupuestos vía service', async () => {
      presupuestosServiceMock.listar.mockResolvedValue([presupuesto]);

      const { result } = renderHook(() => usePresupuestos(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(presupuestosServiceMock.listar).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual([presupuesto]);
    });

    it('usePresupuesto(id): obtiene por id y cachea 30s', async () => {
      presupuestosServiceMock.obtenerPorId.mockResolvedValue(presupuesto);

      const { result } = renderHook(() => usePresupuesto(10), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(presupuestosServiceMock.obtenerPorId).toHaveBeenCalledWith(10);
      expect(result.current.data).toEqual(presupuesto);
    });

    it('usePresupuesto(undefined): deshabilitado y no llama al service', async () => {
      const { result } = renderHook(() => usePresupuesto(undefined), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(presupuestosServiceMock.obtenerPorId).not.toHaveBeenCalled();
    });

    it('usePresupuesto(0): deshabilitado (id debe ser > 0)', async () => {
      const { result } = renderHook(() => usePresupuesto(0), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(presupuestosServiceMock.obtenerPorId).not.toHaveBeenCalled();
    });

    it('usePresupuestoDetalle(id): obtiene detalle completo (staleTime 30s)', async () => {
      presupuestosServiceMock.obtenerDetalle.mockResolvedValue(presupuesto);

      const { result } = renderHook(() => usePresupuestoDetalle(10), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(presupuestosServiceMock.obtenerDetalle).toHaveBeenCalledWith(10);
      expect(result.current.data).toEqual(presupuesto);
    });

    it('usePresupuestoDetalle(undefined): deshabilitado', async () => {
      const { result } = renderHook(() => usePresupuestoDetalle(undefined), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(presupuestosServiceMock.obtenerDetalle).not.toHaveBeenCalled();
    });

    it('usePresupuestosPorCliente(idCliente): obtiene presupuestos del cliente', async () => {
      presupuestosServiceMock.obtenerPorCliente.mockResolvedValue([presupuesto]);

      const { result } = renderHook(() => usePresupuestosPorCliente(1), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(presupuestosServiceMock.obtenerPorCliente).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual([presupuesto]);
    });

    it('usePresupuestosPorCliente(undefined): deshabilitado', async () => {
      const { result } = renderHook(() => usePresupuestosPorCliente(undefined), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(presupuestosServiceMock.obtenerPorCliente).not.toHaveBeenCalled();
    });

    it('usePresupuestosPorEstado(estado): obtiene presupuestos con ese estado', async () => {
      presupuestosServiceMock.obtenerPorEstado.mockResolvedValue([presupuestoPendiente]);

      const { result } = renderHook(() => usePresupuestosPorEstado('Pendiente'), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(presupuestosServiceMock.obtenerPorEstado).toHaveBeenCalledWith('Pendiente');
      expect(result.current.data).toEqual([presupuestoPendiente]);
    });

    it('usePresupuestosPorEstado(undefined): deshabilitado', async () => {
      const { result } = renderHook(() => usePresupuestosPorEstado(undefined), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(presupuestosServiceMock.obtenerPorEstado).not.toHaveBeenCalled();
    });

  });

  // ── Mutations ──────────────────────────────────────────

  describe('mutations', () => {
    it('useCrearPresupuesto: crea e invalida la lista (por prefijo)', async () => {
      presupuestosServiceMock.crear.mockResolvedValue(presupuesto);
      seedQueries(queryClient);

      const { result } = renderHook(() => useCrearPresupuesto(), { wrapper });
      await runMutation(result.current.mutateAsync(payloadCrear));

      expect(presupuestosServiceMock.crear).toHaveBeenCalledWith(payloadCrear);
      expect(queryClient.getQueryState(['presupuestos'])?.isInvalidated).toBe(true);
      // invalidateQueries(['presupuestos']) es por prefijo: alcanza el detalle
      expect(queryClient.getQueryState(['presupuestos', 10, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useModificarPresupuesto: modifica e invalida las 3 claves', async () => {
      presupuestosServiceMock.modificar.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useModificarPresupuesto(), { wrapper });
      await runMutation(result.current.mutateAsync({ id: 10, presupuesto: payloadModificar }));

      expect(presupuestosServiceMock.modificar).toHaveBeenCalledWith(10, payloadModificar);
      expect(queryClient.getQueryState(['presupuestos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['presupuestos', 10])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['presupuestos', 10, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useEliminarPresupuesto: elimina e invalida la lista (por prefijo)', async () => {
      presupuestosServiceMock.eliminar.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useEliminarPresupuesto(), { wrapper });
      await runMutation(result.current.mutateAsync(10));

      expect(presupuestosServiceMock.eliminar).toHaveBeenCalledWith(10);
      expect(queryClient.getQueryState(['presupuestos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['presupuestos', 10, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useAceptarPresupuesto: acepta, invalida presupuestos/trabajos y llama onSuccess', async () => {
      presupuestosServiceMock.aceptar.mockResolvedValue(undefined);
      const onSuccess = vi.fn();
      seedQueries(queryClient);

      const { result } = renderHook(() => useAceptarPresupuesto({ onSuccess }), { wrapper });
      await runMutation(result.current.mutateAsync(10));

      expect(presupuestosServiceMock.aceptar).toHaveBeenCalledWith(10);
      expect(queryClient.getQueryState(['presupuestos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['presupuestos', 10])?.isInvalidated).toBe(true);
      // Aceptar crea el trabajo asociado => también invalida trabajos
      expect(queryClient.getQueryState(['trabajos'])?.isInvalidated).toBe(true);
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('useAceptarPresupuesto: llama onError cuando falla', async () => {
      const error = new Error('Error al aceptar');
      presupuestosServiceMock.aceptar.mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() => useAceptarPresupuesto({ onError }), { wrapper });
      await runMutation(result.current.mutateAsync(10).catch(() => undefined));

      // La mutation de RQ v5 pasa (error, variables, context); solo afirmamos el error.
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]?.[0]).toBe(error);
    });

    it('useRechazarPresupuesto: rechaza e invalida presupuestos y [presupuestos, id]', async () => {
      presupuestosServiceMock.rechazar.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useRechazarPresupuesto(), { wrapper });
      await runMutation(result.current.mutateAsync(10));

      expect(presupuestosServiceMock.rechazar).toHaveBeenCalledWith(10);
      expect(queryClient.getQueryState(['presupuestos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['presupuestos', 10])?.isInvalidated).toBe(true);
      // Rechazar NO invalida trabajos
      expect(queryClient.getQueryState(['trabajos'])?.isInvalidated).toBe(false);
    });

    it('useRechazarPresupuesto: llama onError cuando falla', async () => {
      const error = new Error('Error al rechazar');
      presupuestosServiceMock.rechazar.mockRejectedValue(error);
      const onError = vi.fn();

      const { result } = renderHook(() => useRechazarPresupuesto({ onError }), { wrapper });
      await runMutation(result.current.mutateAsync(10).catch(() => undefined));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0]?.[0]).toBe(error);
    });

  });
});
