import { apiClient } from './api';
import type { Cliente } from '../types';

interface ClienteBackendDTO {
  id: number;
  nombreCompleto: string;
  cuit?: string;
  balance: number;
  telefono: { $id: string; $values: TelefonoItem[] };
  direccion: { $id: string; $values: DireccionItem[] };
  trabajos: { $id: string; $values: unknown[] };
  presupuestos: { $id: string; $values: unknown[] };
  movimientosBalance: { $id: string; $values: unknown[] };
}

interface TelefonoItem {
  id: number;
  telefono: string;
  descripcion?: string;
}

interface DireccionItem {
  id: number;
  calle: string;
  altura: string;
  piso?: string;
  departamento?: string;
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
  const telefonos = dto.telefono?.$values?.map((t: TelefonoItem) => t.telefono) || [];
  const primeraDireccion = dto.direccion?.$values?.[0];
  const direccionCompleta = primeraDireccion 
    ? `${primeraDireccion.calle} ${primeraDireccion.altura}`
    : undefined;
  
  return {
    id: dto.id,
    nombreCompleto: dto.nombreCompleto,
    telefono: telefonos,
    direccion: direccionCompleta,
    cuit: dto.cuit,
    balance: dto.balance || 0,
    trabajosCount: dto.trabajos?.$values?.length || 0,
    presupuestosCount: dto.presupuestos?.$values?.length || 0,
  };
}

function extractData(response: unknown): ClienteBackendDTO[] {
  const data = response as { $values?: ClienteBackendDTO[] };
  return data.$values || [];
}

export const clientesService = {
  async listar(): Promise<Cliente[]> {
    const response = await apiClient.get<ClienteBackendDTO[]>('/Cliente/ObtenerListaClientes');
    return extractData(response.data).map(mapBackendToFrontend);
  },

  async obtenerPorId(id: number): Promise<Cliente> {
    const response = await apiClient.get<ClienteBackendDTO>('/Cliente/ObtenerClientePorId', {
      params: { idCliente: id },
    });
    return mapBackendToFrontend(response.data);
  },

  async obtenerDetalle(id: number): Promise<Cliente> {
    const response = await apiClient.get<ClienteBackendDTO>('/Cliente/ObtenerDetallePorId', {
      params: { idCliente: id },
    });
    return mapBackendToFrontend(response.data);
  },

  async crear(cliente: CrearClienteRequest): Promise<Cliente> {
    const response = await apiClient.post<ClienteBackendDTO>('/Cliente/CrearCliente', cliente);
    return mapBackendToFrontend(response.data);
  },

  async modificar(id: number, cliente: ModificarClienteRequest): Promise<void> {
    await apiClient.patch(`/Cliente/ModificarCliente?idCliente=${id}`, cliente);
  },

  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/Cliente/EliminarCliente?idCliente=${id}`);
  },

  async buscarSaldosNegativos(): Promise<Cliente[]> {
    const response = await apiClient.get<ClienteBackendDTO[]>('/Cliente/BuscarSaldosNegativos');
    return extractData(response.data).map(mapBackendToFrontend);
  },
};
