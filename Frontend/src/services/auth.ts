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
};
