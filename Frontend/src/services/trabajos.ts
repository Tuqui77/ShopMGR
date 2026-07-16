import { apiClient, uploadClient } from './api';
import type {
  Trabajo,
  TrabajoBackendDTO,
  Cliente,
  ClienteBackendDTO,
  CrearTrabajoRequest,
  RegistrarHorasRequest,
  ModificarHorasRequest,
  HorasDeTrabajo,
  EstadoTrabajo,
} from '../types';

export interface ModificarTrabajoRequest {
  titulo?: string;
  descripcion?: string;
  estado?: EstadoTrabajo;
  idCliente?: number;
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
  rutaRelativa: string;
  idTrabajo: number;
}

// ============================================================================
// Mappers
// ============================================================================

function mapTelefonos(dto: TelefonoItem[] | undefined): string[] {
  return dto?.map(t => t.telefono) || [];
}

function mapDireccion(dto: DireccionItem[] | undefined): string | undefined {
  const primera = dto?.[0];
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
    trabajosCount: dto.trabajos?.length || 0,
    presupuestosCount: dto.presupuestos?.length || 0,
  };
}

function mapTrabajoBackend(dto: TrabajoBackendDTO): Trabajo {
  const horasValues = (dto.horasDeTrabajo || []) as HorasItem[];
  const fotosValues = (dto.fotos || []) as FotoItem[];
  const totalHoras = horasValues.reduce((sum, h) => sum + h.horas, 0);
  
  const fotos: Trabajo['fotos'] = fotosValues.map(f => ({
    id: f.id,
    enlace: `/app/imagenes/${f.rutaRelativa}`,
    idTrabajo: f.idTrabajo,
  }));

  const horasDeTrabajo: HorasDeTrabajo[] = horasValues.map(h => ({
    id: h.id,
    idTrabajo: h.idTrabajo,
    horas: h.horas,
    descripcion: h.descripcion,
    fecha: h.fecha,
  }));
  
  return {
    id: dto.id,
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    estado: dto.estado,
    fechaInicio: dto.fechaInicio,
    fechaFin: dto.fechaFin,
    totalLabor: dto.totalLabor,
    horasRegistradas: totalHoras,
    horasEstimadas: dto.horasEstimadas ?? dto.presupuesto?.horasEstimadas,
    fotosCount: fotosValues.length,
    fotos,
    horasDeTrabajo,
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
    const response = await apiClient.get<TrabajoBackendDTO[]>('/Trabajos/ObtenerListaTrabajos');
    const rawValues = response.data;
    
    return rawValues
      .filter((item): item is TrabajoBackendDTO =>
        typeof item === 'object' && item !== null
        && 'id' in item && typeof (item as TrabajoBackendDTO).id === 'number'
      )
      .map(mapTrabajoBackend)
      .sort((a, b) => b.id - a.id);
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
    const response = await apiClient.get<TrabajoBackendDTO[]>('/Trabajos/ObtenerTrabajosPorCliente', {
      params: { idCliente },
    });
    const values = response.data;
    return values.map(mapTrabajoBackend).sort((a, b) => b.id - a.id);
  },

  /**
   * Obtiene todos los trabajos con un estado específico
   */
  async obtenerPorEstado(estado: EstadoTrabajo): Promise<Trabajo[]> {
    const response = await apiClient.get<TrabajoBackendDTO[]>('/Trabajos/ObtenerTrabajosPorEstado', {
      params: { estado },
    });
    const rawValues = response.data;

    return rawValues
      .filter((item): item is TrabajoBackendDTO =>
        typeof item === 'object' && item !== null
        && 'id' in item && typeof (item as TrabajoBackendDTO).id === 'number'
      )
      .map(mapTrabajoBackend)
      .sort((a, b) => b.id - a.id);
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
   * Inicia un trabajo (cambia estado a Iniciado y setea fecha de inicio)
   */
  async iniciar(id: number): Promise<void> {
    await apiClient.patch(`/Trabajos/IniciarTrabajo?idTrabajo=${id}`);
  },

  /**
   * Elimina el presupuesto asociado a un trabajo
   */
  async eliminarPresupuesto(id: number): Promise<void> {
    await apiClient.patch(`/Trabajos/EliminarPresupuesto?idTrabajo=${id}`);
  },

  /**
   * Cambia el presupuesto asociado a un trabajo
   */
  async cambiarPresupuesto(id: number, idPresupuesto: number): Promise<void> {
    await apiClient.patch(`/Trabajos/CambiarPresupuesto?idTrabajo=${id}&idPresupuesto=${idPresupuesto}`);
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
   * Modifica horas registradas en un trabajo
   */
  async modificarHoras(data: ModificarHorasRequest): Promise<void> {
    await apiClient.patch('/Trabajos/EditarHorasDeTrabajo', data);
  },

  /**
   * Elimina horas registradas de un trabajo
   */
  async eliminarHoras(idTrabajo: number, idHoras: number): Promise<void> {
    await apiClient.patch(`/Trabajos/EliminarHorasDeTrabajo?idTrabajo=${idTrabajo}&idHoras=${idHoras}`);
  },

  /**
   * Crea un trabajo a partir de un presupuesto aceptado
   * (endpoint dedicado en TrabajosController)
   */
  async crearDesdePresupuesto(idPresupuesto: number): Promise<void> {
    await apiClient.post(`/Trabajos/CrearTrabajoDePresupuesto?idPresupuesto=${idPresupuesto}`);
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

  /**
   * Elimina una foto de un trabajo
   */
  async eliminarFoto(idTrabajo: number, idImagen: number): Promise<void> {
    await apiClient.delete(
      `/Trabajos/EliminarFotoTrabajo?idTrabajo=${idTrabajo}&idImagen=${idImagen}`
    );
  },
};

// ============================================================================
// Exports de tipos para uso en hooks
// ============================================================================

export type { CrearTrabajoRequest, RegistrarHorasRequest, ModificarHorasRequest };
