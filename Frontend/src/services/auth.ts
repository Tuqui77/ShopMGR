import { apiClient } from './api';
import type { LoginRequest, LoginResponse, RolUsuario } from '../types';

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

  /** Cambia la contraseña del usuario logueado (query params, sin body). */
  async cambiarContrasena(contraseñaActual: string, contraseñaNueva: string): Promise<string> {
    // Los query params viajan como URLSearchParams (patrón de ActualizarCostoHoraDeTrabajo).
    const params = new URLSearchParams();
    params.append('contraseñaActual', contraseñaActual);
    params.append('contraseñaNueva', contraseñaNueva);
    const response = await apiClient.request<string>({
      method: 'PATCH',
      url: `/Auth/CambiarContrasena?${params.toString()}`,
      data: '', // String vacío en lugar de undefined
    });
    return response.data;
  },

  /** Cambia el rol del usuario logueado. El body es el valor JSON directo del enum (string). */
  async cambiarRol(nuevoRol: RolUsuario): Promise<string> {
    // [FromBody] RolUsuario espera el valor directo ("Cliente"), no { nuevoRol: "Cliente" }.
    const response = await apiClient.patch<string>('/Auth/CambiarRol', JSON.stringify(nuevoRol));
    return response.data;
  },
};
