import { apiClient } from './api';
import type { Cliente } from '../types';

interface ClienteBackendDTO {
  id: number;
  nombreCompleto: string;
  cuit?: string;
  balance: number;
  telefono: { $id: string; $values: TelefonoItem[] };
  direccion: { $id: string; $values: DireccionItem[] };
  trabajos: { $id: string; $values: TrabajoItem[] };
  presupuestos: { $id: string; $values: PresupuestoItem[] };
  movimientosBalance: { $id: string; $values: unknown[] };
}

// Items with basic info for lists
interface TrabajoItem {
  id: number;
  titulo: string;
  estado: string;
  fechaInicio?: string;
  fechaFin?: string;
  totalLabor?: number;
  idCliente: number;
  idPresupuesto?: number;
}

interface PresupuestoItem {
  id: number;
  titulo: string;
  estado: string;
  fecha?: string;
  total?: number;
  idCliente: number;
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
  Cuit?: string;
  telefono: { telefono: string; descripcion: string }[];
  direccion?: { calle: string; altura: string }[];
}

export interface ModificarClienteRequest {
  nombreCompleto?: string;
  Cuit?: string;
  telefono?: { telefono: string; descripcion: string }[];
  direccion?: { calle: string; altura: string }[];
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

function mapBackendToFrontendDetalle(dto: ClienteBackendDTO): Cliente {
  const telefonos = dto.telefono?.$values?.map((t: TelefonoItem) => t.telefono) || [];
  const telefonosCompletos = dto.telefono?.$values || [];
  const direccionesCompletas = dto.direccion?.$values || [];
  const primeraDireccion = dto.direccion?.$values?.[0];
  const direccionCompleta = primeraDireccion 
    ? `${primeraDireccion.calle} ${primeraDireccion.altura}`
    : undefined;
  
  // Map recent trabajos (up to 10, newest first by id desc)
  const trabajosValues = dto.trabajos?.$values || [];
  const trabajosRecientes = trabajosValues
    .sort((a: TrabajoItem, b: TrabajoItem) => b.id - a.id)
    .slice(0, 10)
    .map((t: TrabajoItem) => ({
      id: t.id,
      titulo: t.titulo,
      estado: t.estado as 'Pendiente' | 'Iniciado' | 'Terminado',
      fechaInicio: t.fechaInicio,
      fechaFin: t.fechaFin,
      totalLabor: t.totalLabor,
    }));
  
  // Map recent presupuestos (up to 10, newest first by id desc)
  const presupuestosValues = dto.presupuestos?.$values || [];
  const presupuestosRecientes = presupuestosValues
    .sort((a: PresupuestoItem, b: PresupuestoItem) => b.id - a.id)
    .slice(0, 10)
    .map((p: PresupuestoItem) => ({
      id: p.id,
      titulo: p.titulo,
      estado: p.estado as 'Pendiente' | 'Aceptado' | 'Rechazado',
      fecha: p.fecha,
      total: p.total,
    }));
  
  return {
    id: dto.id,
    nombreCompleto: dto.nombreCompleto,
    telefono: telefonos,
    telefonosCompletos,
    direccionesCompletas,
    direccion: direccionCompleta,
    cuit: dto.cuit,
    balance: dto.balance || 0,
    trabajosCount: dto.trabajos?.$values?.length || 0,
    presupuestosCount: dto.presupuestos?.$values?.length || 0,
    trabajosRecientes,
    presupuestosRecientes,
  };
}

function extractData(response: unknown): ClienteBackendDTO[] {
  const clientesMap = new Map<number, ClienteBackendDTO>();
  const idToObject = new Map<string, unknown>();
  
  // First pass: index all objects by their $id
  const indexObjects = (obj: unknown) => {
    if (typeof obj !== 'object' || obj === null) return;
    const item = obj as Record<string, unknown>;
    
    if ('$id' in item && typeof item.$id === 'string') {
      idToObject.set(item.$id, item);
    }
    
    for (const value of Object.values(item)) {
      if (Array.isArray(value)) {
        value.forEach(indexObjects);
      } else if (typeof value === 'object' && value !== null) {
        indexObjects(value);
      }
    }
  };
  
  // Second pass: extract all unique clients
  const collectClientes = (obj: unknown) => {
    if (typeof obj !== 'object' || obj === null) return;
    const item = obj as Record<string, unknown>;
    
    // Handle $ref - resolve to actual object
    if ('$ref' in item && typeof item.$ref === 'string') {
      const refObj = idToObject.get(item.$ref);
      if (refObj) {
        collectClientes(refObj);
      }
      return;
    }
    
    // Check if this looks like a Cliente object
    if ('id' in item && 'nombreCompleto' in item && 'balance' in item) {
      const id = item.id as number;
      if (id !== undefined && id !== null && !clientesMap.has(id)) {
        clientesMap.set(id, item as unknown as ClienteBackendDTO);
      }
    }
  };
  
  // Process response
  if (typeof response === 'object' && response !== null) {
    const data = response as { $values?: unknown[] };
    const values = data.$values || [];
    
    // First index all objects by $id
    for (const item of values) {
      indexObjects(item);
    }
    
    // Then collect all clients
    for (const item of values) {
      collectClientes(item);
    }
  }
  
  // Sort by ID and return
  return Array.from(clientesMap.values()).sort((a, b) => a.id - b.id);
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
    return mapBackendToFrontendDetalle(response.data);
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
