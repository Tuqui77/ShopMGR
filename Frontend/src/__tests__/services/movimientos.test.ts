import { describe, it, expect, vi, beforeEach } from 'vitest';
import { movimientosService } from '../../services/movimientos';
import { apiClient } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPatch = vi.mocked(apiClient.patch);

/** DTO de un movimiento de balance devuelto por el backend. */
function movimientoDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 4,
    idCliente: 1,
    tipo: 'Pago',
    monto: 5000,
    descripcion: 'Seña',
    fecha: '2026-07-10',
    ...overrides,
  };
}

describe('movimientosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractMovimientos (helper privado, vía obtenerPorCliente)', () => {
    it('parsea una respuesta con formato $values (colección .NET)', async () => {
      mockedGet.mockResolvedValue({
        data: { $id: '1', $values: [movimientoDTO({ id: 2 }), movimientoDTO({ id: 1 })] },
      });

      const movimientos = await movimientosService.obtenerPorCliente(1);

      expect(movimientos.map((m) => m.id)).toEqual([2, 1]);
    });

    it('parsea un array directo y lo ordena por id descendente', async () => {
      mockedGet.mockResolvedValue({ data: [movimientoDTO({ id: 3 }), movimientoDTO({ id: 9 })] });

      const movimientos = await movimientosService.obtenerPorCliente(1);

      expect(movimientos.map((m) => m.id)).toEqual([9, 3]);
    });

    it('devuelve lista vacía cuando la respuesta es null', async () => {
      mockedGet.mockResolvedValue({ data: null });

      const movimientos = await movimientosService.obtenerPorCliente(1);

      expect(movimientos).toEqual([]);
    });

    it('devuelve lista vacía cuando el formato no es un array ni tiene $values', async () => {
      mockedGet.mockResolvedValue({ data: { $id: '1' } });

      const movimientos = await movimientosService.obtenerPorCliente(1);

      expect(movimientos).toEqual([]);
    });
  });

  describe('crear', () => {
    it('hace POST a CrearMovimiento con el request y usa la fecha provista', async () => {
      mockedPost.mockResolvedValue({ data: 'Movimiento creado' });

      await movimientosService.crear({
        idCliente: 1,
        tipo: 'Pago',
        monto: 5000,
        descripcion: 'Seña',
        fecha: '2026-07-10',
      });

      expect(mockedPost).toHaveBeenCalledWith('/Cliente/CrearMovimiento', {
        idCliente: 1,
        tipo: 'Pago',
        monto: 5000,
        descripcion: 'Seña',
        fecha: '2026-07-10',
      });
    });

    it('completa la fecha con la de hoy (YYYY-MM-DD) cuando no viene', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0)); // 2026-08-15
      mockedPost.mockResolvedValue({ data: 'Movimiento creado' });

      try {
        await movimientosService.crear({
          idCliente: 1,
          tipo: 'Cargo',
          monto: 2000,
          descripcion: 'Insumo',
        });

        expect(mockedPost).toHaveBeenCalledWith('/Cliente/CrearMovimiento', {
          idCliente: 1,
          tipo: 'Cargo',
          monto: 2000,
          descripcion: 'Insumo',
          fecha: '2026-08-15',
        });
      } finally {
        vi.useRealTimers();
      }
    });

    it('incluye idTrabajo opcional cuando viene en el request', async () => {
      mockedPost.mockResolvedValue({ data: 'Movimiento creado' });

      await movimientosService.crear({
        idCliente: 1,
        idTrabajo: 9,
        tipo: 'Pago',
        monto: 3000,
        descripcion: 'Pago parcial',
      });

      expect(mockedPost).toHaveBeenCalledWith('/Cliente/CrearMovimiento', expect.objectContaining({ idTrabajo: 9 }));
    });
  });

  describe('obtenerPorCliente', () => {
    it('hace GET a ObtenerMovimientosPorId con el param idCliente', async () => {
      mockedGet.mockResolvedValue({ data: [] });

      await movimientosService.obtenerPorCliente(1);

      expect(mockedGet).toHaveBeenCalledWith('/Cliente/ObtenerMovimientosPorId', {
        params: { idCliente: 1 },
      });
    });
  });

  describe('modificar', () => {
    it('hace PATCH a EditarMovimiento con el body completo', async () => {
      mockedPatch.mockResolvedValue({ data: 'Movimiento editado' });

      await movimientosService.modificar({
        id: 4,
        idCliente: 1,
        tipo: 'Pago',
        monto: 6000,
        descripcion: 'Seña actualizada',
        fecha: '2026-07-12',
      });

      expect(mockedPatch).toHaveBeenCalledWith('/Cliente/EditarMovimiento', {
        id: 4,
        idCliente: 1,
        tipo: 'Pago',
        monto: 6000,
        descripcion: 'Seña actualizada',
        fecha: '2026-07-12',
      });
    });
  });

  describe('eliminar', () => {
    it('hace PATCH a EliminarMovimiento con null y los params en la query', async () => {
      mockedPatch.mockResolvedValue({ data: 'Movimiento eliminado' });

      await movimientosService.eliminar(4, 1);

      expect(mockedPatch).toHaveBeenCalledWith('/Cliente/EliminarMovimiento', null, {
        params: { idMovimiento: 4, idCliente: 1 },
      });
    });
  });
});
