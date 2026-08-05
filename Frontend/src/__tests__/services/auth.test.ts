import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/auth';
import { apiClient } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    request: vi.fn(),
  },
}));

describe('authService (issue #99): contrato con el backend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cambiarContrasena', () => {
    // URLSearchParams percent-encoda caracteres no ASCII: ñ -> %C3%B1.
    it('omite contraseñaActual cuando es null (login con código de un solo uso)', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ data: 'Contraseña modificada' });
      await authService.cambiarContrasena(null, 'nueva123');
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Auth/CambiarContrasena?contrase%C3%B1aNueva=nueva123',
        data: '',
      });
    });

    it('incluye contraseñaActual cuando es un string', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ data: 'Contraseña modificada' });
      await authService.cambiarContrasena('actual456', 'nueva123');
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Auth/CambiarContrasena?contrase%C3%B1aActual=actual456&contrase%C3%B1aNueva=nueva123',
        data: '',
      });
    });
  });

  describe('cambiarRol', () => {
    it('envía el valor JSON directo del enum como body (no { rol })', async () => {
      vi.mocked(apiClient.patch).mockResolvedValue({ data: 'Rol modificado' });
      await authService.cambiarRol(3, 'Empleado');
      expect(apiClient.patch).toHaveBeenCalledWith(
        '/Auth/CambiarRol?idUsuario=3',
        JSON.stringify('Empleado'),
      );
    });
  });

  describe('cambiarContrasenaAdmin', () => {
    it('omite contraseñaActual cuando es null y pasa el idUsuario', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ data: 'Contraseña modificada' });
      await authService.cambiarContrasenaAdmin(7, null, 'nueva456');
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Auth/CambiarContrasenaAdmin?idUsuario=7&contrase%C3%B1aNueva=nueva456',
        data: '',
      });
    });
  });

  describe('restaurarContraseña', () => {
    it('hace PATCH al endpoint y devuelve el código de un solo uso', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ data: 'ABC123' });
      const codigo = await authService.restaurarContraseña(7);
      expect(codigo).toBe('ABC123');
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Auth/RestaurarContraseña?idUsuario=7',
        data: '',
      });
    });
  });

  describe('listarUsuarios', () => {
    it('hace GET al endpoint y mapea los usuarios válidos', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          { id: 1, userName: 'admin', rol: 'Administrador' },
          { id: 2, userName: 'juan', rol: 'Empleado' },
        ],
      });
      const usuarios = await authService.listarUsuarios();
      expect(apiClient.get).toHaveBeenCalledWith('/Auth/ListarUsuariosAsync');
      expect(usuarios).toEqual([
        { id: 1, userName: 'admin', rol: 'Administrador' },
        { id: 2, userName: 'juan', rol: 'Empleado' },
      ]);
    });

    it('filtra (fail-closed) usuarios con shape inválido', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: [
          { id: 1, userName: 'admin', rol: 'Administrador' },
          { id: 'no-numero', userName: 'roto', rol: 'Administrador' },
          { userName: 'sin-id', rol: 'Cliente' },
          { id: 4, userName: 'rol-invalido', rol: 'SuperAdmin' },
          'no-objeto',
        ],
      });
      const usuarios = await authService.listarUsuarios();
      expect(usuarios).toEqual([{ id: 1, userName: 'admin', rol: 'Administrador' }]);
    });

    it('devuelve lista vacía si la respuesta no es un array', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ data: { $id: '1' } });
      const usuarios = await authService.listarUsuarios();
      expect(usuarios).toEqual([]);
    });
  });
});
