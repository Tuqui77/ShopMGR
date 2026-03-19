export type EstadoTrabajo = 'pendiente' | 'iniciado' | 'terminado';
export type EstadoPresupuesto = 'pendiente' | 'aceptado' | 'rechazado';
export type TipoMovimiento = 'pago' | 'cargo' | 'adelanto' | 'compra' | 'ajuste';

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

export interface Trabajo {
  id: number;
  titulo: string;
  estado: EstadoTrabajo;
  fechaInicio?: string;
  fechaFin?: string;
  horasEstimadas: number;
  horasRegistradas: number;
  fotosCount: number;
  cliente: Cliente;
  total: number;
}

export interface HorasRegistradas {
  id: number;
  idTrabajo: number;
  horas: number;
  descripcion: string;
  fecha: string;
  valor: number;
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
