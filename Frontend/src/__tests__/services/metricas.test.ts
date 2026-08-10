import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { metricasService } from '../../services/metricas';
import { apiClient } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('metricasService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('llama a los 5 endpoints en paralelo con la fecha del primer día del mes actual', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 15, 12, 0, 0)); // 2026-08-15

    mockedGet
      .mockResolvedValueOnce({ data: 150000 })
      .mockResolvedValueOnce({ data: 42 })
      .mockResolvedValueOnce({ data: 8 })
      .mockResolvedValueOnce({ data: 12 })
      .mockResolvedValueOnce({ data: 6 });

    const metricas = await metricasService.obtenerTodas();

    const fechaEsperada = '2026-08-01';
    expect(mockedGet).toHaveBeenNthCalledWith(1, '/Metricas/ObtenerIngresos', { params: { fecha: fechaEsperada } });
    expect(mockedGet).toHaveBeenNthCalledWith(2, '/Metricas/ObtenerHoras', { params: { fecha: fechaEsperada } });
    expect(mockedGet).toHaveBeenNthCalledWith(3, '/Metricas/ObtenerTrabajosTerminados', {
      params: { fecha: fechaEsperada },
    });
    expect(mockedGet).toHaveBeenNthCalledWith(4, '/Metricas/ObtenerPresupuestosEntregados', {
      params: { fecha: fechaEsperada },
    });
    expect(mockedGet).toHaveBeenNthCalledWith(5, '/Metricas/ObtenerPresupuestosAceptados', {
      params: { fecha: fechaEsperada },
    });

    expect(metricas).toEqual({
      ingresos: 150000,
      horasTrabajadas: 42,
      trabajosTerminados: 8,
      presupuestosCreados: 12,
      presupuestosAceptados: 6,
    });
  });

  it('formatea meses de un solo dígito con padding de cero (enero → 01)', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5)); // 2026-01-05

    mockedGet.mockResolvedValue({ data: 0 });

    await metricasService.obtenerTodas();

    expect(mockedGet).toHaveBeenCalledWith('/Metricas/ObtenerIngresos', { params: { fecha: '2026-01-01' } });
  });
});
