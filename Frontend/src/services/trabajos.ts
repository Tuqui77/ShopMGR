import { apiClient, uploadClient } from './api';
import type {
  Trabajo,
  TrabajoBackendDTO,
  Cliente,
  ClienteBackendDTO,
  CrearTrabajoRequest,
  RegistrarHorasRequest,
  EstadoTrabajo,
} from '../types';

export interface ModificarTrabajoRequest {
  titulo?: string;
  estado?: EstadoTrabajo;
  idCliente?: number;
  idPresupuesto?: number;
  totalLabor?: number;
}

// ============================================================================
// Tipos internos para el servicio
// ============================================================================

interface TelefonoItem {
  id: number;
  telefono: string;
}

interface DireccionItem {
  id: number;
  calle: string;
  altura: string;
}

interface HorasItem {
  id: number;
  horas: number;
  descripcion: string;
  fecha: string;
  idTrabajo: number;
}

interface FotoItem {
  id: number;
  rutaCompleta: string;
  idTrabajo: number;
}

// Response wrapper de .NET
interface ListResponse<T> {
  $id?: string;
  $values?: T[];
}

// ============================================================================
// Mappers
// ============================================================================

function mapTelefonos(dto: { $id: string; $values: TelefonoItem[] } | undefined): string[] {
  return dto?.$values?.map(t => t.telefono) || [];
}

function mapDireccion(dto: { $id: string; $values: DireccionItem[] } | undefined): string | undefined {
  const primera = dto?.$values?.[0];
  return primera ? `${primera.calle} ${primera.altura}` : undefined;
}

function mapClienteFull(dto: ClienteBackendDTO | null): Cliente | null {
  if (!dto) return null;
  return {
    id: dto.id,
    nombreCompleto: dto.nombreCompleto,
    telefono: mapTelefonos(dto.telefono),
    direccion: mapDireccion(dto.direccion),
    balance: dto.balance || 0,
    trabajosCount: dto.trabajos?.$values?.length || 0,
    presupuestosCount: dto.presupuestos?.$values?.length || 0,
  };
}

function mapTrabajoBackend(dto: TrabajoBackendDTO): Trabajo {
  const horasValues = (dto.horasDeTrabajo?.$values || []) as HorasItem[];
  const fotosValues = (dto.fotos?.$values || []) as FotoItem[];
  const totalHoras = horasValues.reduce((sum, h) => sum + h.horas, 0);
  
  const fotos: Trabajo['fotos'] = fotosValues.map(f => ({
    id: f.id,
    enlace: `/app/imagenes/${f.rutaCompleta}`,
    idTrabajo: f.idTrabajo,
  }));
  
  return {
    id: dto.id,
    titulo: dto.titulo,
    estado: dto.estado,
    fechaInicio: dto.fechaInicio,
    fechaFin: dto.fechaFin,
    totalLabor: dto.totalLabor,
    horasRegistradas: totalHoras,
    horasEstimadas: dto.presupuesto?.horasEstimadas,
    fotosCount: fotosValues.length,
    fotos,
    cliente: mapClienteFull(dto.cliente),
    clienteId: dto.idCliente,
    idPresupuesto: dto.idPresupuesto,
  };
}

// ============================================================================
// Servicio de Trabajos
// ============================================================================

export const trabajosService = {
  /**
   * Obtiene todos los trabajos
   */
  async listar(): Promise<Trabajo[]> {
    const response = await apiClient.get<ListResponse<TrabajoBackendDTO>>('/Trabajos/ObtenerListaTrabajos');
    const rawValues = response.data.$values || [];
    
    // Type guard para validar que un objeto tiene las propiedades mínimas de TrabajoBackendDTO
    const isTrabajoBackendDTO = (obj: unknown): obj is TrabajoBackendDTO => {
      return typeof obj === 'object' && obj !== null && 
        'id' in obj && 'titulo' in obj && 'estado' in obj && 'idCliente' in obj;
    };
    
    // Recolectar todos los trabajos: raíz + anidados en cliente.trabajos
    const allTrabajos: TrabajoBackendDTO[] = [];
    const seenIds = new Set<number>();
    
    for (const item of rawValues) {
      // Skip null/undefined o referencias $ref
      if (!item || typeof item !== 'object') continue;
      if (!isTrabajoBackendDTO(item)) continue;
      
      // Agregar el trabajo de raíz si no está duplicado
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allTrabajos.push(item);
      }
      
      // También extraer trabajos anidados en cliente.trabajos
      if (item.cliente && typeof item.cliente === 'object' && 'trabajos' in item.cliente) {
        const clienteObj = item.cliente as ClienteBackendDTO;
        const clienteTrabajos = clienteObj.trabajos;
        
        if (clienteTrabajos && typeof clienteTrabajos === 'object' && '$values' in clienteTrabajos) {
          for (const trab of clienteTrabajos.$values) {
            if (isTrabajoBackendDTO(trab) && !seenIds.has(trab.id)) {
              seenIds.add(trab.id);
              // Crear una copia del trabajo anidado con el cliente completo del padre
              const trabajoConCliente: TrabajoBackendDTO = {
                ...trab,
                cliente: clienteObj, // Asignar el cliente del trabajo raíz
              };
              allTrabajos.push(trabajoConCliente);
            }
          }
        }
      }
    }
    
    return allTrabajos.map(mapTrabajoBackend);
  },

  /**
   * Obtiene un trabajo por su ID
   */
  async obtenerPorId(id: number): Promise<Trabajo> {
    const response = await apiClient.get<TrabajoBackendDTO>('/Trabajos/ObtenerTrabajoPorId', {
      params: { idTrabajo: id },
    });
    return mapTrabajoBackend(response.data);
  },

  /**
   * Obtiene un trabajo con todas sus relaciones (detalle completo)
   */
  async obtenerDetalle(id: number): Promise<Trabajo> {
    const response = await apiClient.get<TrabajoBackendDTO>('/Trabajos/ObtenerDetallePorId', {
      params: { idTrabajo: id },
    });
    return mapTrabajoBackend(response.data);
  },

  /**
   * Obtiene todos los trabajos de un cliente
   */
  async obtenerPorCliente(idCliente: number): Promise<Trabajo[]> {
    const response = await apiClient.get<ListResponse<TrabajoBackendDTO>>('/Trabajos/ObtenerTrabajosPorCliente', {
      params: { idCliente },
    });
    const values = response.data.$values || [];
    return values.map(mapTrabajoBackend);
  },

  /**
   * Obtiene todos los trabajos con un estado específico
   */
  async obtenerPorEstado(estado: EstadoTrabajo): Promise<Trabajo[]> {
    const response = await apiClient.get<ListResponse<TrabajoBackendDTO>>('/Trabajos/ObtenerTrabajosPorEstado', {
      params: { estado },
    });
    const values = response.data.$values || [];
    return values.map(mapTrabajoBackend);
  },

  /**
   * Crea un nuevo trabajo
   */
  async crear(trabajo: CrearTrabajoRequest): Promise<Trabajo> {
    const response = await apiClient.post<TrabajoBackendDTO>('/Trabajos/CrearTrabajo', trabajo);
    return mapTrabajoBackend(response.data);
  },

  /**
   * Modifica los datos de un trabajo existente
   */
  async modificar(id: number, data: ModificarTrabajoRequest): Promise<void> {
    await apiClient.patch(`/Trabajos/ModificarTrabajo?idTrabajo=${id}`, data);
  },

  /**
   * Termina un trabajo (cambia estado a Terminado y genera cargo en el balance del cliente)
   */
  async terminar(id: number): Promise<void> {
    await apiClient.patch(`/Trabajos/TerminarTrabajo?idTrabajo=${id}`);
  },

  /**
   * Elimina un trabajo
   */
  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/Trabajos/EliminarTrabajo?idTrabajo=${id}`);
  },

  /**
   * Registra horas trabajadas en un trabajo
   */
  async agregarHoras(horas: RegistrarHorasRequest): Promise<void> {
    await apiClient.post('/Trabajos/AgregarHorasDeTrabajo', horas);
  },

  /**
   * Sube fotos a un trabajo
   */
  async subirFotos(idTrabajo: number, fotos: FileList | File[]): Promise<string> {
    const formData = new FormData();
    
    // Convert FileList to array if needed
    const files = fotos instanceof FileList ? Array.from(fotos) : fotos;
    
    files.forEach((file) => {
      formData.append('fotos', file);
    });

    const response = await uploadClient.post(
      `/Trabajos/AgregarFotosTrabajo?idTrabajo=${idTrabajo}`,
      formData
    );
    return response.data;
  },
};

// ============================================================================
// Exports de tipos para uso en hooks
// ============================================================================

export type { CrearTrabajoRequest, RegistrarHorasRequest };
