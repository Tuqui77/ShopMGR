import { describe, it, expect, vi, beforeEach } from 'vitest';
import { clientesService, type ClienteBackendDTO, type CrearClienteRequest, type ModificarClienteRequest } from '../../services/clientes';
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
const mockedDelete = vi.mocked(apiClient.delete);

/** DTO base del backend (ClienteBackendDTO) con todos los campos del contrato. */
function clienteBackendDTO(overrides: Partial<ReturnType<typeof clienteBackendDTOBase>> = {}) {
  return { ...clienteBackendDTOBase(), ...overrides };
}

function clienteBackendDTOBase() {
  return {
    id: 1,
    nombreCompleto: 'Juan Pérez',
    cuit: '20123456789',
    balance: 5000,
    telefono: [{ id: 1, telefono: '11-2345-6789', descripcion: 'Celular' }],
    direccion: [{ id: 1, calle: 'Calle Falsa', altura: '123' }] as ClienteBackendDTO['direccion'],
    trabajos: [] as ClienteBackendDTO['trabajos'],
    presupuestos: [] as ClienteBackendDTO['presupuestos'],
    movimientosBalance: [],
  };
}

/** Item de trabajo tal como lo devuelve el backend en el detalle. */
function trabajoItem(id: number, titulo: string) {
  return {
    id,
    titulo,
    estado: 'Iniciado',
    fechaInicio: '2026-07-01',
    totalLabor: 12000,
    idCliente: 1,
  };
}

/** Item de presupuesto tal como lo devuelve el backend en el detalle. */
function presupuestoItem(id: number, titulo: string) {
  return {
    id,
    titulo,
    estado: 'Aceptado',
    fecha: '2026-07-01',
    total: 48000,
    idCliente: 1,
  };
}

describe('clientesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listar', () => {
    it('hace GET a ObtenerListaClientes y mapea el DTO al modelo frontend', async () => {
      mockedGet.mockResolvedValue({ data: [clienteBackendDTO()] });

      const clientes = await clientesService.listar();

      expect(mockedGet).toHaveBeenCalledWith('/Cliente/ObtenerListaClientes');
      expect(clientes).toEqual([
        {
          id: 1,
          nombreCompleto: 'Juan Pérez',
          telefono: ['11-2345-6789'],
          direccion: 'Calle Falsa 123',
          cuit: '20123456789',
          balance: 5000,
          trabajosCount: 0,
          presupuestosCount: 0,
        },
      ]);
    });

    it('ordena los clientes por id descendente', async () => {
      mockedGet.mockResolvedValue({
        data: [
          clienteBackendDTO({ id: 2, nombreCompleto: 'Dos' }),
          clienteBackendDTO({ id: 1, nombreCompleto: 'Uno' }),
          clienteBackendDTO({ id: 3, nombreCompleto: 'Tres' }),
        ],
      });

      const clientes = await clientesService.listar();

      expect(clientes.map((c) => c.id)).toEqual([3, 2, 1]);
    });

    it('filtra (fail-closed) ítems sin id o sin nombreCompleto', async () => {
      mockedGet.mockResolvedValue({
        data: [
          clienteBackendDTO(),
          { ...clienteBackendDTO(), id: undefined, nombreCompleto: 'Sin id' },
          { ...clienteBackendDTO(), nombreCompleto: undefined },
          'no-objeto',
        ],
      });

      const clientes = await clientesService.listar();

      expect(clientes).toHaveLength(1);
      expect(clientes[0]?.id).toBe(1);
    });

    it('aplica fallbacks cuando el DTO no trae telefono, direccion ni balance', async () => {
      mockedGet.mockResolvedValue({
        data: [
          {
            id: 7,
            nombreCompleto: 'Sin extras',
            balance: 0,
            telefono: undefined,
            direccion: undefined,
            trabajos: undefined,
            presupuestos: undefined,
            movimientosBalance: [],
          },
        ],
      });

      const [cliente] = await clientesService.listar();

      expect(cliente?.telefono).toEqual([]);
      expect(cliente?.direccion).toBeUndefined();
      expect(cliente?.balance).toBe(0);
      expect(cliente?.trabajosCount).toBe(0);
    });
  });

  describe('obtenerPorId', () => {
    it('hace GET a ObtenerClientePorId con el param idCliente y mapea el DTO', async () => {
      mockedGet.mockResolvedValue({ data: clienteBackendDTO({ id: 5 }) });

      const cliente = await clientesService.obtenerPorId(5);

      expect(mockedGet).toHaveBeenCalledWith('/Cliente/ObtenerClientePorId', {
        params: { idCliente: 5 },
      });
      expect(cliente.id).toBe(5);
      expect(cliente.nombreCompleto).toBe('Juan Pérez');
    });
  });

  describe('obtenerDetalle', () => {
    it('hace GET a ObtenerDetallePorId con el param idCliente y mapea el detalle completo', async () => {
      mockedGet.mockResolvedValue({
        data: clienteBackendDTO({
          id: 5,
          telefono: [
            { id: 1, telefono: '11-2345-6789', descripcion: 'Celular' },
            { id: 2, telefono: '11-0000-0000', descripcion: 'Fijo' },
          ],
          direccion: [
            { id: 1, calle: 'Calle Falsa', altura: '123', piso: '3', departamento: 'B' },
          ],
          trabajos: [trabajoItem(2, 'Trabajo 2'), trabajoItem(1, 'Trabajo 1')],
          presupuestos: [presupuestoItem(2, 'Presu 2'), presupuestoItem(1, 'Presu 1')],
        }),
      });

      const cliente = await clientesService.obtenerDetalle(5);

      expect(mockedGet).toHaveBeenCalledWith('/Cliente/ObtenerDetallePorId', {
        params: { idCliente: 5 },
      });
      expect(cliente.id).toBe(5);
      expect(cliente.telefono).toEqual(['11-2345-6789', '11-0000-0000']);
      expect(cliente.telefonosCompletos).toHaveLength(2);
      expect(cliente.direccionesCompletas).toEqual([
        { id: 1, calle: 'Calle Falsa', altura: '123', piso: '3', departamento: 'B' },
      ]);
      expect(cliente.trabajosRecientes?.map((t) => t.id)).toEqual([2, 1]);
      expect(cliente.presupuestosRecientes?.map((p) => p.id)).toEqual([2, 1]);
    });

    it('limita trabajos y presupuestos recientes a los 10 más nuevos', async () => {
      const trabajos = Array.from({ length: 12 }, (_, i) => trabajoItem(i + 1, `Trabajo ${i + 1}`));
      const presupuestos = Array.from({ length: 12 }, (_, i) => presupuestoItem(i + 1, `Presu ${i + 1}`));
      mockedGet.mockResolvedValue({ data: clienteBackendDTO({ trabajos, presupuestos }) });

      const cliente = await clientesService.obtenerDetalle(5);

      expect(cliente.trabajosRecientes).toHaveLength(10);
      expect(cliente.trabajosRecientes?.map((t) => t.id)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
      expect(cliente.presupuestosRecientes).toHaveLength(10);
      expect(cliente.presupuestosRecientes?.map((p) => p.id)).toEqual([12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
    });

    it('devuelve listas vacías cuando el DTO no trae trabajos ni presupuestos', async () => {
      mockedGet.mockResolvedValue({ data: clienteBackendDTO() });

      const cliente = await clientesService.obtenerDetalle(5);

      expect(cliente.trabajosRecientes).toEqual([]);
      expect(cliente.presupuestosRecientes).toEqual([]);
    });
  });

  describe('crear', () => {
    it('hace POST a CrearCliente con el request completo y devuelve el cliente creado', async () => {
      const request: CrearClienteRequest = {
        nombreCompleto: 'Nuevo Cliente',
        Cuit: '20123456789',
        telefono: [{ telefono: '11-2345-6789', descripcion: 'Celular' }],
        direccion: [{ calle: 'Calle Falsa', altura: '123' }],
      };
      mockedPost.mockResolvedValue({ data: clienteBackendDTO({ id: 9, nombreCompleto: 'Nuevo Cliente' }) });

      const cliente = await clientesService.crear(request);

      expect(mockedPost).toHaveBeenCalledWith('/Cliente/CrearCliente', request);
      expect(cliente.id).toBe(9);
      expect(cliente.nombreCompleto).toBe('Nuevo Cliente');
    });
  });

  describe('modificar', () => {
    it('hace PATCH a ModificarCliente con el id en la URL y el body parcial', async () => {
      const data: ModificarClienteRequest = { nombreCompleto: 'Nombre Actualizado' };
      mockedPatch.mockResolvedValue({ data: {} });

      await clientesService.modificar(3, data);

      expect(mockedPatch).toHaveBeenCalledWith('/Cliente/ModificarCliente?idCliente=3', data);
    });
  });

  describe('eliminar', () => {
    it('hace DELETE a EliminarCliente con el id en la URL', async () => {
      mockedDelete.mockResolvedValue({ data: {} });

      await clientesService.eliminar(3);

      expect(mockedDelete).toHaveBeenCalledWith('/Cliente/EliminarCliente?idCliente=3');
    });
  });

  describe('buscarSaldosNegativos', () => {
    it('hace GET a BuscarSaldosNegativos y mapea los clientes con saldo', async () => {
      mockedGet.mockResolvedValue({
        data: [
          clienteBackendDTO({ id: 1, balance: -500 }),
          clienteBackendDTO({ id: 2, balance: -100 }),
        ],
      });

      const clientes = await clientesService.buscarSaldosNegativos();

      expect(mockedGet).toHaveBeenCalledWith('/Cliente/BuscarSaldosNegativos');
      expect(clientes).toHaveLength(2);
      expect(clientes[0]?.balance).toBe(-500);
    });
  });

  describe('manejo de errores', () => {
    it('propaga el error del backend cuando la petición falla', async () => {
      mockedGet.mockRejectedValue(new Error('Network Error'));

      await expect(clientesService.listar()).rejects.toThrow('Network Error');
    });
  });
});
