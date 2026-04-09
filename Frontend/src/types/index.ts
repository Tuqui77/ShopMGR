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
  telefonosCompletos?: TelefonoCompleto[];
  direccionesCompletas?: DireccionCompleta[];
  cuit?: string;
  balance: number;
  trabajosCount: number;
  presupuestosCount: number;
  trabajosRecientes?: TrabajoItem[];
  presupuestosRecientes?: PresupuestoItem[];
}

// Tipos para items en listas (usados en ClienteDetalle)
export interface TelefonoCompleto {
  id: number;
  telefono: string;
  descripcion?: string;
}

export interface DireccionCompleta {
  id: number;
  calle: string;
  altura: string;
  piso?: string;
  departamento?: string;
  descripcion?: string;
  codigoPostal?: string;
}

export interface TrabajoItem {
  id: number;
  titulo: string;
  estado: EstadoTrabajo;
  fechaInicio?: string;
  fechaFin?: string;
  totalLabor?: number;
}

export interface PresupuestoItem {
  id: number;
  titulo: string;
  estado: EstadoPresupuesto;
  fecha?: string;
  total?: number;
}

// DTOs Backend - Cliente
export interface TelefonoItem {
  id: number;
  telefono: string;
  descripcion?: string;
}

export interface DireccionItem {
  id: number;
  calle: string;
  altura: string;
  piso?: string;
  departamento?: string;
  descripcion?: string;
  codigoPostal?: string;
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

// Full backend DTO for detail view
export interface ClienteDetalleBackendDTO {
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
  cliente: Cliente | null;
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
  cliente: ClienteBackendDTO | null;
  presupuesto?: PresupuestoBackendDTO;
  fotos: { $id: string; $values: FotoBackendDTO[] };
  horasDeTrabajo: { $id: string; $values: HorasDeTrabajoBackendDTO[] };
}

export type TrabajoDetalleDTO = TrabajoBackendDTO;

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

// ============================================================================
// REQUEST DTOs
// ============================================================================

export interface CrearPresupuestoRequest {
  titulo: string;
  descripcion?: string;
  horasEstimadas: number;
  idCliente: number;
  materiales?: MaterialRequest[];
}

export interface MaterialRequest {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface ModificarPresupuestoRequest {
  titulo?: string;
  descripcion?: string;
  horasEstimadas?: number;
  estado?: EstadoPresupuesto;
  idCliente?: number;
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
