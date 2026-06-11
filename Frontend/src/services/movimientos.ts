import { apiClient } from './api';

export type TipoMovimiento = 'Pago' | 'Cargo' | 'Anticipo' | 'Compra' | 'Ajuste';

export interface MovimientoBalanceRequest {
  idCliente: number;
  idTrabajo?: number;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string;
}

export const movimientosService = {
  async crear(data: MovimientoBalanceRequest): Promise<void> {
    await apiClient.post('/Cliente/CrearMovimiento', {
      ...data,
      fecha: new Date().toISOString().split('T')[0],
    });
  },
};