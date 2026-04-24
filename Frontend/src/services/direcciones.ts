import { apiClient } from './api';
import type { DireccionItem } from '../types';

export interface ModificarDireccionRequest {
  id?: number;
  idCliente?: number;
  calle?: string;
  altura?: string;
  piso?: string | null;
  departamento?: string | null;
  descripcion?: string | null;
  codigoPostal?: string | null;
  ciudad?: string | null;
}

export interface CrearDireccionRequest {
  idCliente: number;
  calle: string;
  altura: string;
  piso?: string | null;
  departamento?: string | null;
  descripcion?: string | null;
  codigoPostal?: string | null;
  ciudad?: string | null;
}

export const direccionesService = {
  async crear(data: CrearDireccionRequest): Promise<DireccionItem> {
    const response = await apiClient.post<DireccionItem>('/Direccion/CrearDireccion', data);
    return response.data;
  },

  async modificar(id: number, data: ModificarDireccionRequest): Promise<void> {
    await apiClient.patch(`/Direccion/ActualizarDireccion?idDireccion=${id}`, data);
  },

  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/Direccion/EliminarDireccion?idDireccion=${id}`);
  },

  async obtenerPorId(id: number): Promise<DireccionItem> {
    const response = await apiClient.get<DireccionItem>('/Direccion/Obtener detalle por id', {
      params: { idDireccion: id },
    });
    return response.data;
  },
};