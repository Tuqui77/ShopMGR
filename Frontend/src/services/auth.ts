import { apiClient } from './api';
import type { LoginRequest, LoginResponse } from '../types';

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

  async refrescar(refreshToken: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/Auth/Refrescar',
      null,
      { params: { refreshTokenRequest: refreshToken } },
    );
    return response.data;
  },

  async cerrarSesion(refreshToken: string): Promise<void> {
    await apiClient.post('/Auth/CerrarSesion', null, {
      params: { refreshTokenRequest: refreshToken },
    });
  },
};
