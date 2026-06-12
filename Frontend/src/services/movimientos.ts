import { apiClient } from './api';
import type { MovimientoBalance, TipoMovimiento } from '../types';

export type { TipoMovimiento };

export interface MovimientoBalanceRequest {
  idCliente: number;
  idTrabajo?: number;
  tipo: TipoMovimiento;
  monto: number;
  descripcion: string;
}

function extractMovimientos(data: unknown): MovimientoBalance[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as MovimientoBalance[];
  const obj = data as Record<string, unknown>;
  if (obj.$values && Array.isArray(obj.$values)) return obj.$values as MovimientoBalance[];
  return [];
}

export const movimientosService = {
  async crear(data: MovimientoBalanceRequest): Promise<void> {
    await apiClient.post('/Cliente/CrearMovimiento', {
      ...data,
      fecha: new Date().toISOString().split('T')[0],
    });
  },

  async obtenerPorCliente(idCliente: number): Promise<MovimientoBalance[]> {
    const response = await apiClient.get('/Cliente/ObtenerMovimientosPorId', {
      params: { idCliente },
    });
    return extractMovimientos(response.data);
  },
};