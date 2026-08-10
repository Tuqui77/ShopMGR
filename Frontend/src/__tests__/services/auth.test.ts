import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService, extractAuthErrorMessage } from '../../services/auth';
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

  describe('login', () => {
    it('hace POST a IniciarSesion con el request y devuelve los tokens', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { accessToken: 'token-abc' },
      });

      const resultado = await authService.login({ userName: 'admin', password: 'secreta' });

      expect(apiClient.post).toHaveBeenCalledWith('/Auth/IniciarSesion', {
        userName: 'admin',
        password: 'secreta',
      });
      expect(resultado).toEqual({ accessToken: 'token-abc' });
    });
  });

  describe('register', () => {
    it('hace POST a RegistrarUsuario con el request y devuelve el mensaje', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: 'Usuario registrado' });

      const mensaje = await authService.register({ userName: 'nuevo', password: '123456' });

      expect(apiClient.post).toHaveBeenCalledWith('/Auth/RegistrarUsuario', {
        userName: 'nuevo',
        password: '123456',
      });
      expect(mensaje).toBe('Usuario registrado');
    });
  });

  describe('refrescar', () => {
    it('hace POST a Refrescar SIN body (cookie HttpOnly) y devuelve los tokens', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { accessToken: 'token-nuevo' },
      });

      const resultado = await authService.refrescar();

      // El refresh token viaja como cookie HttpOnly (issue #114): un solo
      // argumento, sin body ni config.
      expect(apiClient.post).toHaveBeenCalledWith('/Auth/Refrescar');
      expect(resultado).toEqual({ accessToken: 'token-nuevo' });
    });
  });

  describe('cerrarSesion', () => {
    it('hace POST a CerrarSesion SIN body (cookie HttpOnly se borra server-side)', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: 'Sesión cerrada' });

      await authService.cerrarSesion();

      expect(apiClient.post).toHaveBeenCalledWith('/Auth/CerrarSesion');
    });
  });

  describe('cambiarContrasena', () => {
    it('omite contraseñaActual cuando es null (login con código de un solo uso)', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ data: 'Contraseña modificada' });
      await authService.cambiarContrasena(null, 'nueva123');
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Auth/CambiarContrasena',
        data: { contrasenaNueva: 'nueva123' },
      });
    });

    it('incluye contraseñaActual cuando es un string', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ data: 'Contraseña modificada' });
      await authService.cambiarContrasena('actual456', 'nueva123');
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Auth/CambiarContrasena',
        data: { contrasenaActual: 'actual456', contrasenaNueva: 'nueva123' },
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
    it('envía idUsuario y contrasenaNueva en el body JSON', async () => {
      vi.mocked(apiClient.request).mockResolvedValue({ data: 'Contraseña modificada' });
      await authService.cambiarContrasenaAdmin(7, 'nueva456');
      expect(apiClient.request).toHaveBeenCalledWith({
        method: 'PATCH',
        url: '/Auth/CambiarContrasenaAdmin',
        data: { idUsuario: 7, contrasenaNueva: 'nueva456' },
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

describe('extractAuthErrorMessage', () => {
  it('extrae el mensaje plano del backend cuando la data es un string', () => {
    const error = { isAxiosError: true, response: { status: 400, data: 'Contraseña incorrecta' } };

    expect(extractAuthErrorMessage(error)).toBe('Contraseña incorrecta');
  });

  it('extrae el mensaje del formato { error: string } (ExceptionHandlingMiddleware)', () => {
    const error = { isAxiosError: true, response: { status: 400, data: { error: 'Usuario no existe' } } };

    expect(extractAuthErrorMessage(error)).toBe('Usuario no existe');
  });

  it('devuelve string vacío si la data tiene otro formato', () => {
    const error = { isAxiosError: true, response: { status: 400, data: { detail: 'Otro formato' } } };

    expect(extractAuthErrorMessage(error)).toBe('');
  });

  it('devuelve string vacío si el error no tiene response', () => {
    const error = { isAxiosError: true };

    expect(extractAuthErrorMessage(error)).toBe('');
  });

  it('devuelve string vacío si el error no es de axios', () => {
    expect(extractAuthErrorMessage(new Error('boom'))).toBe('');
    expect(extractAuthErrorMessage('string raro')).toBe('');
  });
});
