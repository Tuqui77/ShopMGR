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
  const data = response as { $values?: unknown[] };
  const values = data.$values || [];
  
  const seen = new Set<number>();
  const clientes: ClienteBackendDTO[] = [];
  
  const collectClientes = (obj: unknown) => {
    if (typeof obj !== 'object' || obj === null) return;
    const item = obj as Record<string, unknown>;
    
    // Check if this looks like a Cliente object
    if ('id' in item && 'nombreCompleto' in item && 'balance' in item) {
      const id = item.id as number;
      if (id !== undefined && id !== null && !seen.has(id)) {
        seen.add(id);
        clientes.push(item as unknown as ClienteBackendDTO);
      }
    }
    
    // Recurse into nested objects and arrays
    for (const value of Object.values(item)) {
      if (Array.isArray(value)) {
        value.forEach(collectClientes);
      } else if (typeof value === 'object') {
        collectClientes(value);
      }
    }
  };
  
  // Process all values
  for (const item of values) {
    collectClientes(item);
  }
  
  // Sort by ID
  return clientes.sort((a, b) => (a.id || 0) - (b.id || 0));
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
