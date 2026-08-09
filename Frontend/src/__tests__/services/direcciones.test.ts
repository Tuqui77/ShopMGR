import { describe, it, expect, vi, beforeEach } from 'vitest';
import { direccionesService } from '../../services/direcciones';
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

/** DTO de una dirección devuelto por el backend. */
function direccionDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 3,
    idCliente: 1,
    calle: 'Calle Falsa',
    altura: '123',
    piso: '4',
    departamento: 'B',
    descripcion: 'Casa',
    codigoPostal: '1043',
    ciudad: 'CABA',
    ...overrides,
  };
}

describe('direccionesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('crear', () => {
    it('hace POST a CrearDireccion con el request y devuelve la dirección creada', async () => {
      const request = { idCliente: 1, calle: 'Calle Falsa', altura: '123' };
      mockedPost.mockResolvedValue({ data: direccionDTO() });

      const direccion = await direccionesService.crear(request);

      expect(mockedPost).toHaveBeenCalledWith('/Direccion/CrearDireccion', request);
      expect(direccion).toMatchObject({ id: 3, calle: 'Calle Falsa', altura: '123' });
    });

    it('incluye los campos opcionales cuando vienen', async () => {
      mockedPost.mockResolvedValue({ data: direccionDTO() });

      await direccionesService.crear({
        idCliente: 1,
        calle: 'Av. Siempre Viva',
        altura: '742',
        piso: '2',
        departamento: 'C',
        ciudad: 'CABA',
      });

      expect(mockedPost).toHaveBeenCalledWith(
        '/Direccion/CrearDireccion',
        expect.objectContaining({ piso: '2', departamento: 'C', ciudad: 'CABA' }),
      );
    });
  });

  describe('modificar', () => {
    it('hace PATCH a ActualizarDireccion con el id en la URL y el body parcial', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await direccionesService.modificar(3, { altura: '999' });

      expect(mockedPatch).toHaveBeenCalledWith('/Direccion/ActualizarDireccion?idDireccion=3', { altura: '999' });
    });
  });

  describe('eliminar', () => {
    it('hace DELETE a EliminarDireccion con el id en la URL', async () => {
      mockedDelete.mockResolvedValue({ data: {} });

      await direccionesService.eliminar(3);

      expect(mockedDelete).toHaveBeenCalledWith('/Direccion/EliminarDireccion?idDireccion=3');
    });
  });

  describe('obtenerPorId', () => {
    it('hace GET al endpoint de detalle con el param idDireccion', async () => {
      mockedGet.mockResolvedValue({ data: direccionDTO() });

      const direccion = await direccionesService.obtenerPorId(3);

      expect(mockedGet).toHaveBeenCalledWith('/Direccion/Obtener detalle por id', {
        params: { idDireccion: 3 },
      });
      expect(direccion.id).toBe(3);
    });
  });
});
