// Enums (coinciden con backend .NET)
export type EstadoTrabajo = 'Pendiente' | 'Iniciado' | 'Terminado';
export type EstadoPresupuesto = 'Pendiente' | 'Aceptado' | 'Rechazado';
export type TipoMovimiento = 'Pago' | 'Cargo' | 'Anticipo' | 'Compra' | 'Ajuste';

// ============================================================================
// CLIENTE
// ============================================================================

export interface Cliente {
  id: number;
  nombreCompleto: string;
  telefono: string[];
  direccion?: string;
  cuit?: string;
  balance: number;
  trabajosCount: number;
  presupuestosCount: number;
}

// DTOs Backend - Cliente
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

export interface ClienteBackendDTO {
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

// ============================================================================
// TRABAJO
// ============================================================================

export interface Trabajo {
  id: number;
  titulo: string;
  estado: EstadoTrabajo;
  fechaInicio?: string;
  fechaFin?: string;
  horasRegistradas: number;
  horasEstimadas?: number;
  totalLabor?: number;
  fotosCount: number;
  cliente: Cliente;
  clienteId: number;
  idPresupuesto?: number;
}

// DTOs Backend - Trabajo
export interface TrabajoBackendDTO {
  id: number;
  titulo: string;
  estado: EstadoTrabajo;
  fechaInicio?: string;
  fechaFin?: string;
  totalLabor?: number;
  idCliente: number;
  idPresupuesto?: number;
  cliente: ClienteBackendDTO;
  presupuesto?: PresupuestoBackendDTO;
  fotos: { $id: string; $values: FotoBackendDTO[] };
  horasDeTrabajo: { $id: string; $values: HorasDeTrabajoBackendDTO[] };
}

export interface TrabajoDetalleDTO extends TrabajoBackendDTO {
  // Ya incluye todas las relaciones del backend
}

export interface CrearTrabajoRequest {
  titulo: string;
  idCliente: number;
  idPresupuesto?: number;
  estado?: EstadoTrabajo;
}

export interface ModificarTrabajoRequest {
  titulo?: string;
  idCliente?: number;
  idPresupuesto?: number;
  estado?: EstadoTrabajo;
}

// ============================================================================
// HORAS DE TRABAJO
// ============================================================================

export interface HorasDeTrabajo {
  id: number;
  idTrabajo: number;
  horas: number;
  descripcion: string;
  fecha: string;
}

// Alias para compatibilidad con código existente
export type HorasRegistradas = HorasDeTrabajo & { valor?: number };

export interface HorasDeTrabajoBackendDTO {
  id: number;
  horas: number;
  descripcion: string;
  fecha: string;
  idTrabajo: number;
}

export interface RegistrarHorasRequest {
  idTrabajo: number;
  horas: number;
  descripcion: string;
  fecha?: string;
}

// ============================================================================
// FOTOS
// ============================================================================

export interface Foto {
  id: number;
  enlace: string;
  idTrabajo: number;
}

export interface FotoBackendDTO {
  id: number;
  enlace: string;
  idTrabajo: number;
}

// ============================================================================
// PRESUPUESTO
// ============================================================================

export interface MaterialBackendDTO {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface PresupuestoBackendDTO {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoPresupuesto;
  fecha: string;
  idCliente: number;
  costoHora?: number;
  horasEstimadas?: number;
  costoMateriales?: number;
  costoLabor?: number;
  costoInsumos?: number;
  total?: number;
  cliente?: ClienteBackendDTO;
  materiales: { $id: string; $values: MaterialBackendDTO[] };
}

export interface Presupuesto {
  id: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoPresupuesto;
  fecha: string;
  cliente: Cliente;
  horasEstimadas: number;
  costoMateriales: number;
  costoLabor: number;
  costoInsumos: number;
  total: number;
  materiales: Material[];
}

export interface Material {
  id: number;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface MovimientoBalance {
  id: number;
  idCliente: number;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string;
  fecha: string;
  idTrabajo?: number;
}

export interface MetricasMes {
  ingresos: number;
  horasTrabajadas: number;
  trabajosTerminados: number;
  cambiosIngresos: number;
  cambiosHoras: number;
  cambiosTerminados: number;
}
