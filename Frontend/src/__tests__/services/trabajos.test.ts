import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trabajosService,
  type CrearTrabajoRequest,
  type RegistrarHorasRequest,
  type ModificarHorasRequest,
  type ModificarTrabajoRequest,
} from '../../services/trabajos';
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

/** DTO completo de un trabajo tal como lo devuelve el backend. */
function trabajoBackendDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    titulo: 'Cambio de aceite',
    descripcion: 'Filtro + aceite sintético',
    estado: 'Iniciado',
    fechaInicio: '2026-07-01',
    fechaFin: '2026-07-02',
    totalLabor: 12000,
    horasEstimadas: 4,
    idCliente: 1,
    idPresupuesto: 9,
    cliente: {
      id: 1,
      nombreCompleto: 'Juan Pérez',
      telefono: [{ id: 1, telefono: '11-2345-6789' }],
      direccion: [{ id: 1, calle: 'Calle Falsa', altura: '123' }],
      balance: 100,
      trabajos: [],
      presupuestos: [],
      movimientosBalance: [],
    },
    presupuesto: {
      id: 9,
      titulo: 'Presupuesto 9',
      estado: 'Aceptado',
      fecha: '2026-06-01',
      idCliente: 1,
      materiales: [],
    },
    fotos: [{ id: 4, rutaRelativa: 'trabajos/3/1.jpg', idTrabajo: 3 }],
    horasDeTrabajo: [
      { id: 10, horas: 2, descripcion: 'Desarme', fecha: '2026-07-01', idTrabajo: 3 },
      { id: 11, horas: 1.5, descripcion: 'Armado', fecha: '2026-07-02', idTrabajo: 3 },
    ],
    ...overrides,
  };
}

describe('trabajosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listar', () => {
    it('hace GET a ObtenerListaTrabajos y mapea el DTO al modelo frontend', async () => {
      mockedGet.mockResolvedValue({ data: [trabajoBackendDTO()] });

      const [trabajo] = await trabajosService.listar();

      expect(mockedGet).toHaveBeenCalledWith('/Trabajos/ObtenerListaTrabajos');
      expect(trabajo).toMatchObject({
        id: 3,
        titulo: 'Cambio de aceite',
        estado: 'Iniciado',
        horasRegistradas: 3.5, // suma de horasDeTrabajo
        horasEstimadas: 4,
        fotosCount: 1,
        fotos: [{ id: 4, enlace: '/imagenes/trabajos/3/1.jpg', idTrabajo: 3 }],
        clienteId: 1,
        idPresupuesto: 9,
        cliente: {
          id: 1,
          nombreCompleto: 'Juan Pérez',
          telefono: ['11-2345-6789'],
          direccion: 'Calle Falsa 123',
          balance: 100,
          trabajosCount: 0,
          presupuestosCount: 0,
        },
      });
      expect(trabajo?.horasDeTrabajo).toEqual([
        { id: 10, idTrabajo: 3, horas: 2, descripcion: 'Desarme', fecha: '2026-07-01' },
        { id: 11, idTrabajo: 3, horas: 1.5, descripcion: 'Armado', fecha: '2026-07-02' },
      ]);
    });

    it('ordena los trabajos por id descendente', async () => {
      mockedGet.mockResolvedValue({
        data: [trabajoBackendDTO({ id: 2 }), trabajoBackendDTO({ id: 1 }), trabajoBackendDTO({ id: 4 })],
      });

      const trabajos = await trabajosService.listar();

      expect(trabajos.map((t) => t.id)).toEqual([4, 2, 1]);
    });

    it('filtra ítems sin id numérico', async () => {
      mockedGet.mockResolvedValue({
        data: [trabajoBackendDTO(), { titulo: 'Sin id' }, null, 'no-objeto'],
      });

      const trabajos = await trabajosService.listar();

      expect(trabajos).toHaveLength(1);
      expect(trabajos[0]?.id).toBe(3);
    });

    it('usa horasEstimadas del presupuesto cuando el DTO no las trae', async () => {
      mockedGet.mockResolvedValue({
        data: [trabajoBackendDTO({ horasEstimadas: undefined, presupuesto: { ...trabajoBackendDTO().presupuesto, horasEstimadas: 8 } })],
      });

      const [trabajo] = await trabajosService.listar();

      expect(trabajo?.horasEstimadas).toBe(8);
    });

    it('mapea cliente null como null', async () => {
      mockedGet.mockResolvedValue({ data: [trabajoBackendDTO({ cliente: null })] });

      const [trabajo] = await trabajosService.listar();

      expect(trabajo?.cliente).toBeNull();
    });
  });

  describe('obtenerPorId', () => {
    it('hace GET a ObtenerTrabajoPorId con el param idTrabajo', async () => {
      mockedGet.mockResolvedValue({ data: trabajoBackendDTO({ id: 5 }) });

      const trabajo = await trabajosService.obtenerPorId(5);

      expect(mockedGet).toHaveBeenCalledWith('/Trabajos/ObtenerTrabajoPorId', {
        params: { idTrabajo: 5 },
      });
      expect(trabajo.id).toBe(5);
    });
  });

  describe('obtenerDetalle', () => {
    it('hace GET a ObtenerDetallePorId con el param idTrabajo', async () => {
      mockedGet.mockResolvedValue({ data: trabajoBackendDTO({ id: 6 }) });

      const trabajo = await trabajosService.obtenerDetalle(6);

      expect(mockedGet).toHaveBeenCalledWith('/Trabajos/ObtenerDetallePorId', {
        params: { idTrabajo: 6 },
      });
      expect(trabajo.id).toBe(6);
    });
  });

  describe('obtenerPorCliente', () => {
    it('hace GET a ObtenerTrabajosPorCliente con el param idCliente y ordena desc', async () => {
      mockedGet.mockResolvedValue({ data: [trabajoBackendDTO({ id: 2 }), trabajoBackendDTO({ id: 7 })] });

      const trabajos = await trabajosService.obtenerPorCliente(1);

      expect(mockedGet).toHaveBeenCalledWith('/Trabajos/ObtenerTrabajosPorCliente', {
        params: { idCliente: 1 },
      });
      expect(trabajos.map((t) => t.id)).toEqual([7, 2]);
    });
  });

  describe('obtenerPorEstado', () => {
    it('hace GET a ObtenerTrabajosPorEstado con el param estado', async () => {
      mockedGet.mockResolvedValue({
        data: [trabajoBackendDTO({ estado: 'Pendiente' }), trabajoBackendDTO({ id: 8, estado: 'Pendiente' })],
      });

      const trabajos = await trabajosService.obtenerPorEstado('Pendiente');

      expect(mockedGet).toHaveBeenCalledWith('/Trabajos/ObtenerTrabajosPorEstado', {
        params: { estado: 'Pendiente' },
      });
      expect(trabajos.map((t) => t.id)).toEqual([8, 3]);
    });
  });

  describe('crear', () => {
    it('hace POST a CrearTrabajo con el request y devuelve el trabajo creado', async () => {
      const request: CrearTrabajoRequest = { titulo: 'Nuevo trabajo', idCliente: 1, idPresupuesto: 9 };
      mockedPost.mockResolvedValue({ data: trabajoBackendDTO({ id: 12, titulo: 'Nuevo trabajo' }) });

      const trabajo = await trabajosService.crear(request);

      expect(mockedPost).toHaveBeenCalledWith('/Trabajos/CrearTrabajo', request);
      expect(trabajo.id).toBe(12);
      expect(trabajo.titulo).toBe('Nuevo trabajo');
    });
  });

  describe('modificar', () => {
    it('hace PATCH a ModificarTrabajo con el id en la URL y el body parcial', async () => {
      const data: ModificarTrabajoRequest = { titulo: 'Nuevo título', estado: 'Terminado' };
      mockedPatch.mockResolvedValue({ data: {} });

      await trabajosService.modificar(3, data);

      expect(mockedPatch).toHaveBeenCalledWith('/Trabajos/ModificarTrabajo?idTrabajo=3', data);
    });
  });

  describe('acciones de estado', () => {
    it('iniciar: PATCH a IniciarTrabajo con el id en la URL', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await trabajosService.iniciar(3);

      expect(mockedPatch).toHaveBeenCalledWith('/Trabajos/IniciarTrabajo?idTrabajo=3');
    });

    it('terminar: PATCH a TerminarTrabajo con el id en la URL', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await trabajosService.terminar(3);

      expect(mockedPatch).toHaveBeenCalledWith('/Trabajos/TerminarTrabajo?idTrabajo=3');
    });
  });

  describe('presupuesto asociado', () => {
    it('eliminarPresupuesto: PATCH a EliminarPresupuesto con el id en la URL', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await trabajosService.eliminarPresupuesto(3);

      expect(mockedPatch).toHaveBeenCalledWith('/Trabajos/EliminarPresupuesto?idTrabajo=3');
    });

    it('cambiarPresupuesto: PATCH a CambiarPresupuesto con idTrabajo e idPresupuesto', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await trabajosService.cambiarPresupuesto(3, 15);

      expect(mockedPatch).toHaveBeenCalledWith('/Trabajos/CambiarPresupuesto?idTrabajo=3&idPresupuesto=15');
    });

    it('crearDesdePresupuesto: POST a CrearTrabajoDePresupuesto con el idPresupuesto', async () => {
      mockedPost.mockResolvedValue({ data: {} });

      await trabajosService.crearDesdePresupuesto(15);

      expect(mockedPost).toHaveBeenCalledWith('/Trabajos/CrearTrabajoDePresupuesto?idPresupuesto=15');
    });
  });

  describe('eliminar', () => {
    it('hace DELETE a EliminarTrabajo con el id en la URL', async () => {
      mockedDelete.mockResolvedValue({ data: {} });

      await trabajosService.eliminar(3);

      expect(mockedDelete).toHaveBeenCalledWith('/Trabajos/EliminarTrabajo?idTrabajo=3');
    });
  });

  describe('horas de trabajo', () => {
    it('agregarHoras: POST a AgregarHorasDeTrabajo con el request', async () => {
      const request: RegistrarHorasRequest = { idTrabajo: 3, horas: 2, descripcion: 'Ajuste' };
      mockedPost.mockResolvedValue({ data: {} });

      await trabajosService.agregarHoras(request);

      expect(mockedPost).toHaveBeenCalledWith('/Trabajos/AgregarHorasDeTrabajo', request);
    });

    it('modificarHoras: PATCH a EditarHorasDeTrabajo con el request', async () => {
      const request: ModificarHorasRequest = { id: 10, idTrabajo: 3, horas: 3, descripcion: 'Rehacer', fecha: '2026-07-02' };
      mockedPatch.mockResolvedValue({ data: {} });

      await trabajosService.modificarHoras(request);

      expect(mockedPatch).toHaveBeenCalledWith('/Trabajos/EditarHorasDeTrabajo', request);
    });

    it('eliminarHoras: PATCH a EliminarHorasDeTrabajo con idTrabajo e idHoras', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await trabajosService.eliminarHoras(3, 10);

      expect(mockedPatch).toHaveBeenCalledWith('/Trabajos/EliminarHorasDeTrabajo?idTrabajo=3&idHoras=10');
    });
  });

  describe('fotos', () => {
    it('subirFotos usa apiClient (client con auth interceptors) para subir fotos', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: 'foto-url' });

      const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
      await trabajosService.subirFotos(42, [file]);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(vi.mocked(apiClient.post)).toHaveBeenCalledWith(
        '/Trabajos/AgregarFotosTrabajo?idTrabajo=42',
        expect.any(FormData),
        expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': undefined }) }),
      );

      // Content-Type desactivado: evita que axios serialice el FormData a JSON;
      // el browser setea multipart/form-data con su boundary automáticamente.
      const config = vi.mocked(apiClient.post).mock.calls[0]?.[2];
      expect(config?.headers).toHaveProperty('Content-Type', undefined);
    });

    it('subirFotos devuelve el payload del backend', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: 'http://foto-url' });

      const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
      const result = await trabajosService.subirFotos(7, [file]);

      expect(result).toBe('http://foto-url');
    });

    it('subirFotos acepta una FileList', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: 'ok' });

      const file = new File(['contenido'], 'foto.jpg', { type: 'image/jpeg' });
      // FileList no es construible directamente en jsdom (Illegal constructor);
      // se arma con su prototype real para que `instanceof FileList` sea true.
      const fileList = Object.create(FileList.prototype) as FileList;
      Object.defineProperty(fileList, 'length', { value: 1 });
      Object.defineProperty(fileList, 0, { value: file });
      fileList.item = (index: number) => (index === 0 ? file : null);
      fileList[Symbol.iterator] = () => [file].values();

      await trabajosService.subirFotos(1, fileList);

      const formData = vi.mocked(apiClient.post).mock.calls[0]?.[1];
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get('fotos')).toBe(file);
    });

    it('eliminarFoto: DELETE a EliminarFotoTrabajo con idTrabajo e idImagen', async () => {
      mockedDelete.mockResolvedValue({ data: {} });

      await trabajosService.eliminarFoto(3, 7);

      expect(mockedDelete).toHaveBeenCalledWith('/Trabajos/EliminarFotoTrabajo?idTrabajo=3&idImagen=7');
    });
  });
});
