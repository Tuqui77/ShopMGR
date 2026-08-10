import { describe, it, expect, vi, beforeEach } from 'vitest';
import { telefonosService } from '../../services/telefonos';
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

/** DTO de un teléfono devuelto por el backend. */
function telefonoDTO(overrides: Record<string, unknown> = {}) {
  return {
    id: 5,
    idCliente: 1,
    telefono: '11-2345-6789',
    descripcion: 'Celular',
    ...overrides,
  };
}

describe('telefonosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('crear', () => {
    it('hace POST a CrearTelefonoCliente con teléfono, descripción e idCliente', async () => {
      mockedPost.mockResolvedValue({ data: telefonoDTO() });

      const telefono = await telefonosService.crear(1, '11-2345-6789', 'Celular');

      expect(mockedPost).toHaveBeenCalledWith('/TelefonoCliente/CrearTelefonoCliente', {
        telefono: '11-2345-6789',
        descripcion: 'Celular',
        idCliente: 1,
      });
      expect(telefono).toMatchObject({ id: 5, telefono: '11-2345-6789' });
    });

    it('envía descripcion undefined cuando no se provee', async () => {
      mockedPost.mockResolvedValue({ data: telefonoDTO() });

      await telefonosService.crear(1, '11-0000-0000');

      expect(mockedPost).toHaveBeenCalledWith('/TelefonoCliente/CrearTelefonoCliente', {
        telefono: '11-0000-0000',
        descripcion: undefined,
        idCliente: 1,
      });
    });
  });

  describe('modificar', () => {
    it('hace PATCH a ModificarTelefonoCliente con el id en la URL y el body parcial', async () => {
      mockedPatch.mockResolvedValue({ data: {} });

      await telefonosService.modificar(5, { telefono: '11-9999-9999' });

      expect(mockedPatch).toHaveBeenCalledWith('/TelefonoCliente/ModificarTelefonoCliente?idTelefono=5', {
        telefono: '11-9999-9999',
      });
    });
  });

  describe('eliminar', () => {
    it('hace DELETE a EliminarTelefonoCliente con el id en la URL', async () => {
      mockedDelete.mockResolvedValue({ data: {} });

      await telefonosService.eliminar(5);

      expect(mockedDelete).toHaveBeenCalledWith('/TelefonoCliente/EliminarTelefonoCliente?idTelefono=5');
    });
  });

  describe('obtenerPorId', () => {
    it('hace GET a ObtenerDetallePorId con el param idTelefono', async () => {
      mockedGet.mockResolvedValue({ data: telefonoDTO() });

      const telefono = await telefonosService.obtenerPorId(5);

      expect(mockedGet).toHaveBeenCalledWith('/TelefonoCliente/ObtenerDetallePorId', {
        params: { idTelefono: 5 },
      });
      expect(telefono.id).toBe(5);
    });
  });
});
