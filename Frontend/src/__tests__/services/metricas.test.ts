import { describe, it, expect, vi, beforeEach } from 'vitest';
import { metricasService } from '../../services/metricas';
import { apiClient } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);

describe('metricasService (issue #118 — contrato null + períodos)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('obtener(2026, 8) → 5 llamadas en paralelo con fecha 2026-08-01', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: 150000 })
      .mockResolvedValueOnce({ data: 42 })
      .mockResolvedValueOnce({ data: 8 })
      .mockResolvedValueOnce({ data: 12 })
      .mockResolvedValueOnce({ data: 6 });

    const metricas = await metricasService.obtener(2026, 8);

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

  it('formatea meses de un solo dígito con padding de cero (enero → 2026-01-01)', async () => {
    mockedGet.mockResolvedValue({ data: 0 });

    await metricasService.obtener(2026, 1);

    expect(mockedGet).toHaveBeenCalledWith('/Metricas/ObtenerIngresos', { params: { fecha: '2026-01-01' } });
  });

  it('respuestas null → MetricasMes con campos null (contrato null, nunca 0)', async () => {
    mockedGet.mockResolvedValue({ data: null });

    const metricas = await metricasService.obtener(2026, 7);

    expect(metricas).toEqual({
      ingresos: null,
      horasTrabajadas: null,
      trabajosTerminados: null,
      presupuestosCreados: null,
      presupuestosAceptados: null,
    });
  });

  it('campo ausente/undefined se trata como null (defensivo, 6.3)', async () => {
    mockedGet
      .mockResolvedValueOnce({ data: 100 })
      .mockResolvedValueOnce({ data: undefined })
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: 5 })
      .mockResolvedValueOnce({ data: 2 });

    const metricas = await metricasService.obtener(2026, 8);

    expect(metricas.horasTrabajadas).toBeNull();
  });

  it('obtenerPeriodos() → GET /Metricas/ObtenerMesesConDatos y parsea [{anio, mes}]', async () => {
    mockedGet.mockResolvedValue({
      data: { $id: '1', $values: [{ anio: 2026, mes: 8 }, { anio: 2026, mes: 7 }] },
    });

    const periodos = await metricasService.obtenerPeriodos();

    expect(mockedGet).toHaveBeenCalledWith('/Metricas/ObtenerMesesConDatos');
    expect(periodos).toEqual([
      { anio: 2026, mes: 8 },
      { anio: 2026, mes: 7 },
    ]);
  });

  it('obtenerPeriodos() descarta ítems que no cumplen el contrato {anio, mes}', async () => {
    mockedGet.mockResolvedValue({
      data: [{ anio: 2026, mes: 8 }, { anio: '2026', mes: 7 }, null, { anio: 2025, mes: 12 }],
    });

    const periodos = await metricasService.obtenerPeriodos();

    expect(periodos).toEqual([
      { anio: 2026, mes: 8 },
      { anio: 2025, mes: 12 },
    ]);
  });

  it('obtenerPeriodos() parsea strings ISO (DateOnly .NET, contrato real) y preserva el orden', async () => {
    mockedGet.mockResolvedValue({
      data: ['2024-09-01', '2024-10-01', '2026-04-01', '2026-06-01', '2026-07-01', '2026-08-01'],
    });

    const periodos = await metricasService.obtenerPeriodos();

    expect(periodos).toEqual([
      { anio: 2024, mes: 9 },
      { anio: 2024, mes: 10 },
      { anio: 2026, mes: 4 },
      { anio: 2026, mes: 6 },
      { anio: 2026, mes: 7 },
      { anio: 2026, mes: 8 },
    ]);
  });

  it('obtenerPeriodos() soporta contrato mixto: strings ISO + objetos + inválidos descartados', async () => {
    mockedGet.mockResolvedValue({
      data: [
        '2026-08-01',
        { anio: 2026, mes: 7 },
        'no-es-fecha',
        null,
        { anio: '2026', mes: 8 },
        '2024-09-01',
        { anio: 2024, mes: 10 },
      ],
    });

    const periodos = await metricasService.obtenerPeriodos();

    expect(periodos).toEqual([
      { anio: 2026, mes: 8 },
      { anio: 2026, mes: 7 },
      { anio: 2024, mes: 9 },
      { anio: 2024, mes: 10 },
    ]);
  });

  it('obtenerPeriodos() parsea wrapper {$id, $values} con strings ISO', async () => {
    mockedGet.mockResolvedValue({
      data: { $id: '1', $values: ['2026-08-01', '2026-06-01'] },
    });

    const periodos = await metricasService.obtenerPeriodos();

    expect(periodos).toEqual([
      { anio: 2026, mes: 8 },
      { anio: 2026, mes: 6 },
    ]);
  });

  it('obtenerPeriodos() descarta strings ISO inválidos (mes 13, formato incompleto, texto)', async () => {
    mockedGet.mockResolvedValue({
      data: ['2026-13-01', '2026-08', 'hola', '2026-00-01', '2026-08-32'],
    });

    const periodos = await metricasService.obtenerPeriodos();

    expect(periodos).toEqual([]);
  });

  it('obtenerPeriodos() con respuesta vacía/undefined → []', async () => {
    mockedGet.mockResolvedValue({ data: undefined });

    const periodos = await metricasService.obtenerPeriodos();

    expect(periodos).toEqual([]);
  });
});
