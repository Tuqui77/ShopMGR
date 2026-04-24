import { apiClient } from './api';
import type { TelefonoCompleto } from '../types';

export interface ModificarTelefonoRequest {
  telefono?: string;
  descripcion?: string | null;
}

export const telefonosService = {
  async crear(idCliente: number, telefono: string, descripcion?: string): Promise<TelefonoCompleto> {
    const response = await apiClient.post<TelefonoCompleto>('/TelefonoCliente/CrearTelefonoCliente', {
      telefono,
      descripcion,
      idCliente,
    });
    return response.data;
  },

  async modificar(id: number, data: ModificarTelefonoRequest): Promise<void> {
    await apiClient.patch(`/TelefonoCliente/ModificarTelefonoCliente?idTelefono=${id}`, data);
  },

  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/TelefonoCliente/EliminarTelefonoCliente?idTelefono=${id}`);
  },

  async obtenerPorId(id: number): Promise<TelefonoCompleto> {
    const response = await apiClient.get<TelefonoCompleto>('/TelefonoCliente/ObtenerDetallePorId', {
      params: { idTelefono: id },
    });
    return response.data;
  },
};