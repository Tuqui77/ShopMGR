import { apiClient } from './api';
import type { LoginRequest, LoginResponse, ResumenUsuario, RolUsuario } from '../types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractErrorMessage(data: unknown): string {
  if (typeof data === 'string' && data.length > 0) return data;
  if (isRecord(data) && typeof data.error === 'string') return data.error;
  return '';
}

interface AxiosLikeError {
  isAxiosError?: boolean;
  response?: { status?: number; data: unknown } | null;
}

/**
 * Extrae el mensaje de error plano del backend (data del response) o '' si no
 * aplica. Cubre los dos formatos del backend: string plano (Ok/BadRequest) y
 * { error: string } (ExceptionHandlingMiddleware).
 */
export function extractAuthErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
    const axiosError = error as AxiosLikeError;
    return extractErrorMessage(axiosError.response?.data);
  }
  return '';
}

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/Auth/IniciarSesion',
      data,
    );
    return response.data;
  },

  async register(data: LoginRequest): Promise<string> {
    const response = await apiClient.post<string>(
      '/Auth/RegistrarUsuario',
      data,
    );
    return response.data;
  },

  async refrescar(): Promise<LoginResponse> {
    // El refresh token viaja como cookie HttpOnly (issue #114): sin body.
    const response = await apiClient.post<LoginResponse>('/Auth/Refrescar');
    return response.data;
  },

  async cerrarSesion(): Promise<void> {
    // La cookie HttpOnly se borra server-side (issue #114): sin body.
    await apiClient.post('/Auth/CerrarSesion');
  },

  /**
   * Cambia la contraseña del usuario logueado. Las credenciales viajan en el
   * body JSON (issue SEV-003/CWE-598: sin query params). El naming del body es
   * sin ñ (contrasenaActual/contrasenaNueva) por decisión del dueño del repo.
   * contraseñaActual es OPCIONAL (string?): cuando el login fue con un código de
   * un solo uso, el backend NO valida la actual y el campo debe omitirse.
   */
  async cambiarContrasena(contraseñaActual: string | null, contraseñaNueva: string): Promise<string> {
    const data = {
      ...(contraseñaActual !== null ? { contrasenaActual: contraseñaActual } : {}),
      contrasenaNueva: contraseñaNueva,
    };
    const response = await apiClient.request<string>({
      method: 'PATCH',
      url: '/Auth/CambiarContrasena',
      data,
    });
    return response.data;
  },

  /**
   * Cambia el rol de un usuario (solo Administrador). El body es el valor JSON
   * directo del enum (string), NO { rol: ... }: el controller usa
   * [FromBody] RolUsuario.
   */
  async cambiarRol(idUsuario: number, nuevoRol: RolUsuario): Promise<string> {
    const response = await apiClient.patch<string>(
      `/Auth/CambiarRol?idUsuario=${idUsuario}`,
      JSON.stringify(nuevoRol),
    );
    return response.data;
  },

  /** Cambia la contraseña de OTRO usuario (solo Administrador). idUsuario y contrasenaNueva viajan en el body JSON (issue SEV-003/CWE-598: sin query params). El DTO Admin no valida contrasenaActual. */
  async cambiarContrasenaAdmin(idUsuario: number, contrasenaNueva: string): Promise<string> {
    const response = await apiClient.request<string>({
      method: 'PATCH',
      url: '/Auth/CambiarContrasenaAdmin',
      data: { idUsuario, contrasenaNueva },
    });
    return response.data;
  },

  /** Genera un código alfanumérico de 6 caracteres de un solo uso para restaurar la contraseña de un usuario. */
  async restaurarContraseña(idUsuario: number): Promise<string> {
    const response = await apiClient.request<string>({
      method: 'PATCH',
      url: `/Auth/RestaurarContraseña?idUsuario=${idUsuario}`,
      data: '',
    });
    return response.data;
  },

  /** Lista los usuarios para la administración (solo Administrador). */
  async listarUsuarios(): Promise<ResumenUsuario[]> {
    const response = await apiClient.get<unknown>('/Auth/ListarUsuariosAsync');
    return (Array.isArray(response.data) ? response.data : []).filter(esResumenUsuario);
  },
};

function esRolUsuario(value: unknown): value is RolUsuario {
  return value === 'Administrador' || value === 'Empleado' || value === 'Cliente';
}

/** Type guard fail-closed para la respuesta de ListarUsuariosAsync. */
function esResumenUsuario(value: unknown): value is ResumenUsuario {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.userName === 'string' &&
    esRolUsuario(value.rol)
  );
}
