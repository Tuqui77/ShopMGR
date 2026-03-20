import { apiClient } from './api';
import type { Cliente } from '../types';

interface ClienteBackendDTO {
  idCliente: number;
  nombreCompleto: string;
  telefono: string[];
  direccion?: string;
  CUIT?: string;
  balance: number;
  trabajosCount: number;
  presupuestosCount: number;
}

export interface CrearClienteRequest {
  nombreCompleto: string;
  CUIT?: string;
  telefono: string[];
  direccion?: string;
}

export interface ModificarClienteRequest {
  nombreCompleto?: string;
  CUIT?: string;
  telefono?: string[];
  direccion?: string;
}

function mapBackendToFrontend(dto: ClienteBackendDTO): Cliente {
  return {
    id: dto.idCliente,
    nombreCompleto: dto.nombreCompleto,
    telefono: dto.telefono || [],
    direccion: dto.direccion,
    cuit: dto.CUIT,
    balance: dto.balance || 0,
    trabajosCount: dto.trabajosCount || 0,
    presupuestosCount: dto.presupuestosCount || 0,
  };
}

export const clientesService = {
  async listar(): Promise<Cliente[]> {
    const response = await apiClient.get<ClienteBackendDTO[]>('/api/Cliente/ObtenerListaClientes');
    return response.data.map(mapBackendToFrontend);
  },

  async obtenerPorId(id: number): Promise<Cliente> {
    const response = await apiClient.get<ClienteBackendDTO>('/api/Cliente/ObtenerClientePorId', {
      params: { idCliente: id },
    });
    return mapBackendToFrontend(response.data);
  },

  async obtenerDetalle(id: number): Promise<Cliente> {
    const response = await apiClient.get<ClienteBackendDTO>('/api/Cliente/ObtenerDetallePorId', {
      params: { idCliente: id },
    });
    return mapBackendToFrontend(response.data);
  },

  async crear(cliente: CrearClienteRequest): Promise<Cliente> {
    const response = await apiClient.post<ClienteBackendDTO>('/api/Cliente/CrearCliente', cliente);
    return mapBackendToFrontend(response.data);
  },

  async modificar(id: number, cliente: ModificarClienteRequest): Promise<void> {
    await apiClient.patch(`/api/Cliente/ModificarCliente?idCliente=${id}`, cliente);
  },

  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/api/Cliente/EliminarCliente?idCliente=${id}`);
  },

  async buscarSaldosNegativos(): Promise<Cliente[]> {
    const response = await apiClient.get<ClienteBackendDTO[]>('/api/Cliente/BuscarSaldosNegativos');
    return response.data.map(mapBackendToFrontend);
  },
};