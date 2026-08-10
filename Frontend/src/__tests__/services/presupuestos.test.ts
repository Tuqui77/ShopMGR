import { describe, it, expect, vi, beforeEach } from 'vitest';
import { presupuestosService } from '../../services/presupuestos';
import { apiClient } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPatch = vi.mocked(apiClient.patch);
const mockedDelete = vi.mocked(apiClient.delete);
const mockedRequest = vi.mocked(apiClient.request);

/** Cliente embebido en el DTO de detalle. */
function clienteDetalle() {
  return {
    id: 1,
    nombreCompleto: 'Juan Pérez',
    telefono: [{ id: 1, telefono: '11-2345-6789', descripcion: 'Celular' }],
    direccion: [{ id: 1, calle: 'Calle Falsa', altura: '123' }],
    balance: 100,
    trabajos: [],
    presupuestos: [],
    movimientosBalance: [],
  };
}

/** DTO de la vista de lista (ListarPresupuestos). */
function listaDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 2,
    titulo: 'Reparación completa',
    nombreCliente: 'Juan Pérez',
    idCliente: 1,
    horasEstimadas: 12,
    total: 48000,
    estado: 'Pendiente',
    ...overrides,
  };
}

/** DTO de detalle completo (ObtenerPresupuestoPorId / Detalle). */
function detalleDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 2,
    titulo: 'Reparación completa',
    descripcion: 'Cambio de distribución',
    estado: 'Aceptado',
    fecha: '2026-07-01',
    idCliente: 1,
    costoHora: 3000,
    horasEstimadas: 12,
    costoMateriales: 10000,
    costoLabor: 36000,
    costoInsumos: 2000,
    total: 48000,
    cliente: clienteDetalle(),
    materiales: [
      { id: 1, descripcion: 'Filtro de aceite', cantidad: 2, precio: 1500, subtotal: 3000 },
    ],
    ...overrides,
  };
}

describe('presupuestosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listar', () => {
    it('hace GET a ListarPresupuestos y mapea el DTO de lista', async () => {
      mockedGet.mockResolvedValue({ data: [listaDTO()] });

      const [presupuesto] = await presupuestosService.listar();

      expect(mockedGet).toHaveBeenCalledWith('/Presupuestos/ListarPresupuestos');
      expect(presupuesto).toMatchObject({
        id: 2,
        titulo: 'Reparación completa',
        estado: 'Pendiente',
        cliente: { id: 1, nombreCompleto: 'Juan Pérez' },
        horasEstimadas: 12,
        total: 48000,
        idCliente: 1,
        materiales: [],
      });
    });

    it('ordena los presupuestos por id descendente', async () => {
      mockedGet.mockResolvedValue({ data: [listaDTO({ id: 2 }), listaDTO({ id: 5 }), listaDTO({ id: 1 })] });

      const presupuestos = await presupuestosService.listar();

      expect(presupuestos.map((p) => p.id)).toEqual([5, 2, 1]);
    });

    it('aplica fallbacks cuando el DTO de lista no trae datos', async () => {
      mockedGet.mockResolvedValue({ data: [{ id: 9, nombreCliente: '' }] });

      const [presupuesto] = await presupuestosService.listar();

      expect(presupuesto).toMatchObject({
        id: 9,
        titulo: '',
        estado: 'Pendiente',
        cliente: { id: 0, nombreCompleto: '' },
        horasEstimadas: 0,
        total: 0,
      });
    });
  });

  describe('obtenerPorId', () => {
    it('hace GET a ObtenerPresupuestoPorId con el param idPresupuesto y mapea el detalle', async () => {
      mockedGet.mockResolvedValue({ data: detalleDTO() });

      const presupuesto = await presupuestosService.obtenerPorId(2);

      expect(mockedGet).toHaveBeenCalledWith('/Presupuestos/ObtenerPresupuestoPorId', {
        params: { idPresupuesto: 2 },
      });
      expect(presupuesto).toMatchObject({
        id: 2,
        titulo: 'Reparación completa',
        estado: 'Aceptado',
        fecha: '2026-07-01',
        horasEstimadas: 12,
        costoMateriales: 10000,
        costoLabor: 36000,
        costoInsumos: 2000,
        total: 48000,
        cliente: { id: 1, nombreCompleto: 'Juan Pérez' },
        materiales: [{ id: 1, descripcion: 'Filtro de aceite', cantidad: 2, precioUnitario: 1500, subtotal: 3000 }],
      });
    });
  });

  describe('obtenerDetalle', () => {
    it('hace GET a ObtenerDetallePresupuesto con el param idPresupuesto', async () => {
      mockedGet.mockResolvedValue({ data: detalleDTO({ id: 7 }) });

      const presupuesto = await presupuestosService.obtenerDetalle(7);

      expect(mockedGet).toHaveBeenCalledWith('/Presupuestos/ObtenerDetallePresupuesto', {
        params: { idPresupuesto: 7 },
      });
      expect(presupuesto.id).toBe(7);
    });

    it('usa el campo Precio (mayúscula) como precioUnitario cuando precio no viene', async () => {
      mockedGet.mockResolvedValue({
        data: detalleDTO({
          materiales: [{ id: 1, descripcion: 'Insumo', cantidad: 1, Precio: 2500, subtotal: 2500 }],
        }),
      });

      const presupuesto = await presupuestosService.obtenerDetalle(2);

      expect(presupuesto.materiales[0]?.precioUnitario).toBe(2500);
    });

    it('mapea cliente con referencia circular ($ref) al fallback con idCliente', async () => {
      mockedGet.mockResolvedValue({ data: detalleDTO({ idCliente: 2, cliente: { $ref: '3' } }) });

      const presupuesto = await presupuestosService.obtenerDetalle(2);

      expect(presupuesto.cliente).toEqual({
        id: 2,
        nombreCompleto: '',
        telefono: [],
        balance: 0,
        trabajosCount: 0,
        presupuestosCount: 0,
      });
    });
  });

  describe('obtenerPorCliente', () => {
    it('hace GET a ObtenerPresupuestosPorCliente con el param idCliente y ordena desc', async () => {
      mockedGet.mockResolvedValue({ data: [detalleDTO({ id: 2 }), detalleDTO({ id: 4 })] });

      const presupuestos = await presupuestosService.obtenerPorCliente(1);

      expect(mockedGet).toHaveBeenCalledWith('/Presupuestos/ObtenerPresupuestosPorCliente', {
        params: { idCliente: 1 },
      });
      expect(presupuestos.map((p) => p.id)).toEqual([4, 2]);
    });
  });

  describe('obtenerPorEstado', () => {
    it('hace GET a ObtenerPresupuestosEstado con el param estado', async () => {
      mockedGet.mockResolvedValue({ data: [detalleDTO({ estado: 'Rechazado' })] });

      const presupuestos = await presupuestosService.obtenerPorEstado('Rechazado');

      expect(mockedGet).toHaveBeenCalledWith('/Presupuestos/ObtenerPresupuestosEstado', {
        params: { estado: 'Rechazado' },
      });
      expect(presupuestos[0]?.estado).toBe('Rechazado');
    });
  });

  describe('crear', () => {
    it('hace POST a CrearPresupuesto con el request y devuelve el presupuesto creado', async () => {
      const request = {
        titulo: 'Nuevo presupuesto',
        horasEstimadas: 10,
        idCliente: 1,
        descripcion: 'Detalle',
        materiales: [{ descripcion: 'Material 1', cantidad: 1, Precio: 1000 }],
      };
      mockedPost.mockResolvedValue({ data: detalleDTO({ id: 12, titulo: 'Nuevo presupuesto' }) });

      const presupuesto = await presupuestosService.crear(request);

      expect(mockedPost).toHaveBeenCalledWith('/Presupuestos/CrearPresupuesto', request);
      expect(presupuesto.id).toBe(12);
      expect(presupuesto.titulo).toBe('Nuevo presupuesto');
    });
  });

  describe('modificar', () => {
    it('hace PATCH a ActualizarPresupuesto con el id en la URL y el body parcial', async () => {
      const data = { titulo: 'Título actualizado' };
      mockedPatch.mockResolvedValue({ data: {} });

      await presupuestosService.modificar(2, data);

      expect(mockedPatch).toHaveBeenCalledWith('/Presupuestos/ActualizarPresupuesto?idPresupuesto=2', data);
    });
  });

  describe('eliminar', () => {
    it('hace DELETE a EliminarPresupuesto con el id en la URL', async () => {
      mockedDelete.mockResolvedValue({ data: {} });

      await presupuestosService.eliminar(2);

      expect(mockedDelete).toHaveBeenCalledWith('/Presupuestos/EliminarPresupuesto?idPresupuesto=2');
    });
  });

  describe('aceptar y rechazar', () => {
    it('aceptar: PATCH a AceptarPresupuesto con el id en la URL', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await presupuestosService.aceptar(2);

      expect(mockedPatch).toHaveBeenCalledWith('/Presupuestos/AceptarPresupuesto?idPresupuesto=2');
    });

    it('rechazar: PATCH a RechazarPresupuesto con el id en la URL', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await presupuestosService.rechazar(2);

      expect(mockedPatch).toHaveBeenCalledWith('/Presupuestos/RechazarPresupuesto?idPresupuesto=2');
    });

    it('aceptar extrae el mensaje del formato { error } del middleware', async () => {
      mockedPatch.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { error: 'No se puede aceptar' } },
      });

      await expect(presupuestosService.aceptar(2)).rejects.toThrow('No se puede aceptar');
    });

    it('extrae el mensaje del formato { detail } (ProblemDetails)', async () => {
      mockedPatch.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { title: 'Bad Request', detail: 'Detalle del problema' } },
      });

      await expect(presupuestosService.rechazar(2)).rejects.toThrow('Detalle del problema');
    });

    it('extrae el mensaje del formato { message }', async () => {
      mockedPatch.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { message: 'Mensaje genérico' } },
      });

      await expect(presupuestosService.aceptar(2)).rejects.toThrow('Mensaje genérico');
    });

    it('extrae el primer error del formato { errors: { campo: [...] } }', async () => {
      mockedPatch.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { errors: { titulo: ['El título es obligatorio', 'Muy corto'] } } },
      });

      await expect(presupuestosService.aceptar(2)).rejects.toThrow('El título es obligatorio');
    });

    it('usa el status como fallback cuando la respuesta no tiene data', async () => {
      mockedPatch.mockRejectedValue({
        isAxiosError: true,
        response: { status: 500 },
      });

      await expect(presupuestosService.aceptar(2)).rejects.toThrow('Error 500');
    });

    it('devuelve "Error de conexión" cuando el error no tiene response', async () => {
      mockedPatch.mockRejectedValue({ isAxiosError: true });

      await expect(presupuestosService.aceptar(2)).rejects.toThrow('Error de conexión');
    });
  });

  describe('costo hora de trabajo', () => {
    it('obtenerCostoHora: GET a ObtenerCostoHoraDeTrabajo y devuelve el número', async () => {
      mockedGet.mockResolvedValue({ data: 3000 });

      const costo = await presupuestosService.obtenerCostoHora();

      expect(mockedGet).toHaveBeenCalledWith('/Presupuestos/ObtenerCostoHoraDeTrabajo');
      expect(costo).toBe(3000);
    });

    it('actualizarCostoHora: PATCH vía request con nuevoCosto en la URL y data vacía', async () => {
      mockedRequest.mockResolvedValue({ data: 'Costo actualizado' });

      await presupuestosService.actualizarCostoHora(5000);

      expect(mockedRequest).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Presupuestos/ActualizarCostoHoraDeTrabajo?nuevoCosto=5000',
        data: '',
      });
    });
  });
});
