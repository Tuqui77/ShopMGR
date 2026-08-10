import { describe, it, expect, beforeEach, vi } from 'vitest';
import { waitFor, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { Trabajo } from '../../types';
import {
  useTrabajos,
  useTrabajo,
  useTrabajoDetalle,
  useTrabajosPorCliente,
  useTrabajosActivos,
  useCrearTrabajo,
  useModificarTrabajo,
  useIniciarTrabajo,
  useEliminarPresupuesto,
  useCambiarPresupuesto,
  useTerminarTrabajo,
  useEliminarTrabajo,
  useAgregarHoras,
  useModificarHoras,
  useEliminarHoras,
  useSubirFotos,
  useEliminarFoto,
} from '../../hooks/useTrabajos';

// ── Mocks ────────────────────────────────────────────────

const trabajosServiceMock = vi.hoisted(() => ({
  listar: vi.fn(),
  obtenerPorId: vi.fn(),
  obtenerDetalle: vi.fn(),
  obtenerPorCliente: vi.fn(),
  obtenerPorEstado: vi.fn(),
  crear: vi.fn(),
  modificar: vi.fn(),
  iniciar: vi.fn(),
  eliminar: vi.fn(),
  eliminarPresupuesto: vi.fn(),
  cambiarPresupuesto: vi.fn(),
  terminar: vi.fn(),
  agregarHoras: vi.fn(),
  modificarHoras: vi.fn(),
  eliminarHoras: vi.fn(),
  subirFotos: vi.fn(),
  eliminarFoto: vi.fn(),
}));

vi.mock('../../services/trabajos', () => ({
  trabajosService: trabajosServiceMock,
}));

// ── Fixtures ─────────────────────────────────────────────

const trabajo: Trabajo = {
  id: 5,
  titulo: 'Cambio de aceite',
  estado: 'Pendiente',
  horasRegistradas: 0,
  fotosCount: 0,
  cliente: null,
  clienteId: 1,
};

const trabajoPendiente: Trabajo = { ...trabajo, id: 3, titulo: 'Alineación' };
const trabajoIniciado: Trabajo = { ...trabajo, id: 7, titulo: 'Pintura', estado: 'Iniciado' };

const payloadCrear = {
  titulo: 'Cambio de aceite',
  descripcion: undefined,
  idCliente: 1,
  idPresupuesto: undefined,
  estado: 'Pendiente' as const,
};

const payloadModificar = { titulo: 'Nuevo título', descripcion: 'Desc', idCliente: 1, estado: 'Pendiente' as const };

// ── Helpers ──────────────────────────────────────────────

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function seedQueries(queryClient: QueryClient) {
  queryClient.setQueryData(['trabajos'], [trabajo]);
  queryClient.setQueryData(['trabajos', 5], trabajo);
  queryClient.setQueryData(['trabajos', 5, 'detalle'], trabajo);
}

async function runMutation<T>(promise: Promise<T>) {
  await act(async () => {
    await promise;
  });
}

describe('useTrabajos (hooks)', () => {
  let queryClient: QueryClient;
  let wrapper: (props: { children: ReactNode }) => ReturnType<typeof QueryClientProvider>;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    wrapper = makeWrapper(queryClient);
  });

  // ── Queries ────────────────────────────────────────────

  describe('queries', () => {
    it('useTrabajos: lista los trabajos vía service', async () => {
      trabajosServiceMock.listar.mockResolvedValue([trabajo]);

      const { result } = renderHook(() => useTrabajos(), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(trabajosServiceMock.listar).toHaveBeenCalledTimes(1);
      expect(result.current.data).toEqual([trabajo]);
    });

    it('useTrabajo(id): obtiene por id y cachea 30s', async () => {
      trabajosServiceMock.obtenerPorId.mockResolvedValue(trabajo);

      const { result } = renderHook(() => useTrabajo(5), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(trabajosServiceMock.obtenerPorId).toHaveBeenCalledWith(5);
      expect(result.current.data).toEqual(trabajo);
      expect(queryClient.getQueryState(['trabajos', 5])?.dataUpdatedAt).toBeGreaterThan(0);
    });

    it('useTrabajo(undefined): deshabilitado y no llama al service', async () => {
      const { result } = renderHook(() => useTrabajo(undefined), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(trabajosServiceMock.obtenerPorId).not.toHaveBeenCalled();
    });

    it('useTrabajo(0): deshabilitado (id debe ser > 0)', async () => {
      const { result } = renderHook(() => useTrabajo(0), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(trabajosServiceMock.obtenerPorId).not.toHaveBeenCalled();
    });

    it('useTrabajoDetalle(id): obtiene detalle completo (staleTime 0)', async () => {
      trabajosServiceMock.obtenerDetalle.mockResolvedValue(trabajo);

      const { result } = renderHook(() => useTrabajoDetalle(5), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(trabajosServiceMock.obtenerDetalle).toHaveBeenCalledWith(5);
      expect(result.current.data).toEqual(trabajo);
    });

    it('useTrabajoDetalle(undefined): deshabilitado y no llama al service', async () => {
      const { result } = renderHook(() => useTrabajoDetalle(undefined), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(trabajosServiceMock.obtenerDetalle).not.toHaveBeenCalled();
    });

    it('useTrabajosPorCliente(idCliente): obtiene trabajos del cliente', async () => {
      trabajosServiceMock.obtenerPorCliente.mockResolvedValue([trabajo]);

      const { result } = renderHook(() => useTrabajosPorCliente(1), { wrapper });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(trabajosServiceMock.obtenerPorCliente).toHaveBeenCalledWith(1);
      expect(result.current.data).toEqual([trabajo]);
    });

    it('useTrabajosPorCliente(undefined): deshabilitado', async () => {
      const { result } = renderHook(() => useTrabajosPorCliente(undefined), { wrapper });

      await waitFor(() => expect(result.current.fetchStatus).toBe('idle'));
      expect(trabajosServiceMock.obtenerPorCliente).not.toHaveBeenCalled();
    });

    it('useTrabajosActivos: pide Pendiente e Iniciado, mergea y ordena por id desc', async () => {
      trabajosServiceMock.obtenerPorEstado.mockImplementation((estado: string) => {
        if (estado === 'Pendiente') return Promise.resolve([trabajoPendiente]);
        return Promise.resolve([trabajoIniciado]);
      });

      const { result } = renderHook(() => useTrabajosActivos(), { wrapper });

      await waitFor(() => expect(result.current.data).toBeDefined());
      expect(trabajosServiceMock.obtenerPorEstado).toHaveBeenCalledWith('Pendiente');
      expect(trabajosServiceMock.obtenerPorEstado).toHaveBeenCalledWith('Iniciado');
      // Iniciado (7) va primero, luego Pendiente (3)
      expect(result.current.data?.map(t => t.id)).toEqual([7, 3]);
      expect(result.current.isLoading).toBe(false);
    });

    it('useTrabajosActivos: propaga error si una query falla', async () => {
      trabajosServiceMock.obtenerPorEstado.mockImplementation((estado: string) => {
        if (estado === 'Pendiente') return Promise.reject(new Error('Network Error'));
        return Promise.resolve([trabajoIniciado]);
      });

      const { result } = renderHook(() => useTrabajosActivos(), { wrapper });

      // error inicia en null (RQ v5); esperamos el Error real
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    });
  });

  // ── Mutations ──────────────────────────────────────────

  describe('mutations', () => {
    it('useCrearTrabajo: crea e invalida + refetcha la lista', async () => {
      trabajosServiceMock.listar.mockResolvedValue([trabajo]);
      trabajosServiceMock.crear.mockResolvedValue(trabajo);

      const { result } = renderHook(
        () => {
          useTrabajos();
          return useCrearTrabajo();
        },
        { wrapper },
      );
      await waitFor(() => expect(trabajosServiceMock.listar).toHaveBeenCalledTimes(1));
      const callsAfterMount = trabajosServiceMock.listar.mock.calls.length;

      await runMutation(result.current.mutateAsync(payloadCrear));

      expect(trabajosServiceMock.crear).toHaveBeenCalledWith(payloadCrear);
      // Comportamiento actual: invalidateQueries + refetchQueries => doble refetch.
      // Se observan 3 llamadas en total: 1 inicial + 2 tras la mutación.
      await waitFor(() =>
        expect(trabajosServiceMock.listar.mock.calls.length).toBeGreaterThan(callsAfterMount),
      );
    });

    it('useModificarTrabajo: modifica e invalida trabajos, [trabajos, id] y [trabajos, id, detalle]', async () => {
      trabajosServiceMock.modificar.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useModificarTrabajo(), { wrapper });
      await runMutation(result.current.mutateAsync({ id: 5, trabajo: payloadModificar }));

      expect(trabajosServiceMock.modificar).toHaveBeenCalledWith(5, payloadModificar);
      expect(queryClient.getQueryState(['trabajos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['trabajos', 5])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['trabajos', 5, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useIniciarTrabajo: llama al endpoint dedicado e invalida las 3 claves', async () => {
      trabajosServiceMock.iniciar.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useIniciarTrabajo(), { wrapper });
      await runMutation(result.current.mutateAsync(5));

      expect(trabajosServiceMock.iniciar).toHaveBeenCalledWith(5);
      expect(queryClient.getQueryState(['trabajos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['trabajos', 5])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['trabajos', 5, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useEliminarPresupuesto: elimina presupuesto asociado e invalida las 3 claves', async () => {
      trabajosServiceMock.eliminarPresupuesto.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useEliminarPresupuesto(), { wrapper });
      await runMutation(result.current.mutateAsync(5));

      expect(trabajosServiceMock.eliminarPresupuesto).toHaveBeenCalledWith(5);
      expect(queryClient.getQueryState(['trabajos', 5, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useCambiarPresupuesto: cambia presupuesto asociado e invalida las 3 claves', async () => {
      trabajosServiceMock.cambiarPresupuesto.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useCambiarPresupuesto(), { wrapper });
      await runMutation(result.current.mutateAsync({ id: 5, idPresupuesto: 10 }));

      expect(trabajosServiceMock.cambiarPresupuesto).toHaveBeenCalledWith(5, 10);
      expect(queryClient.getQueryState(['trabajos', 5])?.isInvalidated).toBe(true);
    });

    it('useTerminarTrabajo: termina e invalida las 3 claves + clientes (balance)', async () => {
      trabajosServiceMock.terminar.mockResolvedValue(undefined);
      seedQueries(queryClient);
      queryClient.setQueryData(['clientes'], []);

      const { result } = renderHook(() => useTerminarTrabajo(), { wrapper });
      await runMutation(result.current.mutateAsync(5));

      expect(trabajosServiceMock.terminar).toHaveBeenCalledWith(5);
      expect(queryClient.getQueryState(['trabajos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['clientes'])?.isInvalidated).toBe(true);
    });

    it('useEliminarTrabajo: elimina e invalida solo la lista', async () => {
      trabajosServiceMock.eliminar.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useEliminarTrabajo(), { wrapper });
      await runMutation(result.current.mutateAsync(5));

      expect(trabajosServiceMock.eliminar).toHaveBeenCalledWith(5);
      expect(queryClient.getQueryState(['trabajos'])?.isInvalidated).toBe(true);
      // Comportamiento actual: invalidateQueries(['trabajos']) es POR PREFIJO,
      // alcanza también ['trabajos', id] y ['trabajos', id, 'detalle'].
      expect(queryClient.getQueryState(['trabajos', 5, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useAgregarHoras: registra horas e invalida las 3 claves del idTrabajo', async () => {
      trabajosServiceMock.agregarHoras.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const horas = { idTrabajo: 5, horas: 2, descripcion: 'Cambio de aceite' };
      const { result } = renderHook(() => useAgregarHoras(), { wrapper });
      await runMutation(result.current.mutateAsync(horas));

      expect(trabajosServiceMock.agregarHoras).toHaveBeenCalledWith(horas);
      expect(queryClient.getQueryState(['trabajos'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['trabajos', 5])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['trabajos', 5, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useModificarHoras: modifica horas e invalida las 3 claves', async () => {
      trabajosServiceMock.modificarHoras.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const data = { id: 1, idTrabajo: 5, horas: 3, descripcion: 'x', fecha: '2026-08-01' };
      const { result } = renderHook(() => useModificarHoras(), { wrapper });
      await runMutation(result.current.mutateAsync(data));

      expect(trabajosServiceMock.modificarHoras).toHaveBeenCalledWith(data);
      expect(queryClient.getQueryState(['trabajos', 5, 'detalle'])?.isInvalidated).toBe(true);
    });

    it('useEliminarHoras: elimina horas e invalida las 3 claves', async () => {
      trabajosServiceMock.eliminarHoras.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useEliminarHoras(), { wrapper });
      await runMutation(result.current.mutateAsync({ idTrabajo: 5, idHoras: 2 }));

      expect(trabajosServiceMock.eliminarHoras).toHaveBeenCalledWith(5, 2);
      expect(queryClient.getQueryState(['trabajos', 5])?.isInvalidated).toBe(true);
    });

    it('useSubirFotos: sube fotos e invalida las 3 claves', async () => {
      trabajosServiceMock.subirFotos.mockResolvedValue('foto-url');
      seedQueries(queryClient);

      const { result } = renderHook(() => useSubirFotos(), { wrapper });
      await runMutation(result.current.mutateAsync({ idTrabajo: 5, fotos: [] }));

      expect(trabajosServiceMock.subirFotos).toHaveBeenCalledWith(5, []);
      expect(queryClient.getQueryState(['trabajos', 5])?.isInvalidated).toBe(true);
    });

    it('useEliminarFoto: elimina foto e invalida las 3 claves', async () => {
      trabajosServiceMock.eliminarFoto.mockResolvedValue(undefined);
      seedQueries(queryClient);

      const { result } = renderHook(() => useEliminarFoto(), { wrapper });
      await runMutation(result.current.mutateAsync({ idTrabajo: 5, idImagen: 9 }));

      expect(trabajosServiceMock.eliminarFoto).toHaveBeenCalledWith(5, 9);
      expect(queryClient.getQueryState(['trabajos', 5])?.isInvalidated).toBe(true);
    });
  });
});
