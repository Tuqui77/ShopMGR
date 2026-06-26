import { apiClient } from './api';
import type { Cliente } from '../types';

interface ClienteBackendDTO {
  id: number;
  nombreCompleto: string;
  cuit?: string;
  balance: number;
  telefono: TelefonoItem[];
  direccion: DireccionItem[];
  trabajos: TrabajoItem[];
  presupuestos: PresupuestoItem[];
  movimientosBalance: unknown[];
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
  Cuit?: string | null;
  telefono?: { telefono: string; descripcion: string }[];
  direccion?: { calle: string; altura: string }[];
}

function mapBackendToFrontend(dto: ClienteBackendDTO): Cliente {
  const telefonos = dto.telefono?.map((t: TelefonoItem) => t.telefono) || [];
  const primeraDireccion = dto.direccion?.[0];
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
    trabajosCount: dto.trabajos?.length || 0,
    presupuestosCount: dto.presupuestos?.length || 0,
  };
}

function mapBackendToFrontendDetalle(dto: ClienteBackendDTO): Cliente {
  const telefonos = dto.telefono?.map((t: TelefonoItem) => t.telefono) || [];
  const telefonosCompletos = dto.telefono || [];
  const direccionesCompletas = dto.direccion || [];
  const primeraDireccion = dto.direccion?.[0];
  const direccionCompleta = primeraDireccion 
    ? `${primeraDireccion.calle} ${primeraDireccion.altura}`
    : undefined;
  
  // Map recent trabajos (up to 10, newest first by id desc)
  const trabajosValues = dto.trabajos || [];
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
  const presupuestosValues = dto.presupuestos || [];
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
    trabajosCount: dto.trabajos?.length || 0,
    presupuestosCount: dto.presupuestos?.length || 0,
    trabajosRecientes,
    presupuestosRecientes,
  };
}

function extractData(items: ClienteBackendDTO[]): ClienteBackendDTO[] {
  return items.filter(c => c.id != null && c.nombreCompleto != null);
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

  async modificar(id: number, data: ModificarClienteRequest): Promise<void> {
    await apiClient.patch(`/Cliente/ModificarCliente?idCliente=${id}`, data);
  },

  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/Cliente/EliminarCliente?idCliente=${id}`);
  },

  async buscarSaldosNegativos(): Promise<Cliente[]> {
    const response = await apiClient.get<ClienteBackendDTO[]>('/Cliente/BuscarSaldosNegativos');
    return extractData(response.data).map(mapBackendToFrontend);
  },
};
