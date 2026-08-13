import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import { useMetricasMes, usePeriodosMetricas } from '../hooks/useMetricas';
import { MetricCardComparativo } from '../components/MetricCardComparativo';
import { MetricasGrid } from '../components/MetricasGrid';
import { PeriodoSelector } from '../components/PeriodoSelector';
import { metricasGridConfig } from '../components/metricasGridConfig';
import {
  aniosFallback,
  agruparPorAnio,
  formatPeriodo,
  nombreMes,
  normalizarPeriodos,
  parsePeriodo,
  periodoAnterior,
} from '../utils/periodos';
import type { PeriodoMetrica } from '../types';

/**
 * Página /metricas (issue #118): selector de período sincronizado con
 * `?periodo=AAAA-MM` (fuente de verdad = searchParams, §5.4) + hero y grid
 * comparativos compartidos con el Dashboard (cero drift).
 */
export function Metricas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const ahora = new Date();
  const anioActual = ahora.getFullYear();
  const mesActual = ahora.getMonth() + 1;

  const { periodos, isLoading: isLoadingPeriodos } = usePeriodosMetricas();

  const periodosNormalizados = useMemo(() => normalizarPeriodos(periodos ?? []), [periodos]);
  const mesesPorAnio = useMemo(() => agruparPorAnio(periodosNormalizados), [periodosNormalizados]);

  const periodoDesdeUrl = parsePeriodo(searchParams.get('periodo'));

  // Período efectivo (5.2): ?periodo válido → primer período con datos → mes actual.
  const periodoEfectivo: PeriodoMetrica = useMemo(() => {
    if (periodoDesdeUrl) return periodoDesdeUrl;
    const primerPeriodo = periodosNormalizados[0];
    if (primerPeriodo) return primerPeriodo;
    return { anio: anioActual, mes: mesActual };
  }, [periodoDesdeUrl, periodosNormalizados, anioActual, mesActual]);

  // Sincroniza la URL cuando falta ?periodo o es inválido (replace, sin
  // ensuciar el historial). Espera a que los períodos estén resueltos para
  // respetar la regla del default (5.2).
  useEffect(() => {
    if (isLoadingPeriodos || periodoDesdeUrl) return;
    setSearchParams(
      { periodo: formatPeriodo(periodoEfectivo.anio, periodoEfectivo.mes) },
      { replace: true },
    );
  }, [isLoadingPeriodos, periodoDesdeUrl, periodoEfectivo, setSearchParams]);

  // Años disponibles: con datos (endpoint OK) o fallback de 50 años (D2).
  const aniosDisponibles = useMemo(() => {
    const conDatos = [...mesesPorAnio.keys()].sort((a, b) => b - a);
    return conDatos.length > 0 ? conDatos : aniosFallback(anioActual, 50);
  }, [mesesPorAnio, anioActual]);

  // Meses del año seleccionado: con datos (desc) o todos desc en fallback (5.1).
  const mesesDisponibles = useMemo(() => {
    const delAnio = mesesPorAnio.get(periodoEfectivo.anio);
    if (delAnio && delAnio.length > 0) return [...delAnio];
    return Array.from({ length: 12 }, (_, i) => 12 - i);
  }, [mesesPorAnio, periodoEfectivo.anio]);

  const esMesActual =
    periodoEfectivo.anio === anioActual && periodoEfectivo.mes === mesActual;

  // Métricas del período + mes anterior (rollover de año). Mientras cargan los
  // períodos la query queda deshabilitada (evita un fetch innecesario con el
  // default provisional antes de resolver 5.2).
  const anioQuery = isLoadingPeriodos ? undefined : periodoEfectivo.anio;
  const mesQuery = isLoadingPeriodos ? undefined : periodoEfectivo.mes;
  const { data: actual, isLoading: isLoadingActual, isError: isErrorActual, refetch: refetchActual } =
    useMetricasMes(anioQuery, mesQuery);
  const anterior = periodoAnterior(periodoEfectivo.anio, periodoEfectivo.mes);
  const {
    data: datosAnterior,
    isLoading: isLoadingAnterior,
    isError: isErrorAnterior,
    refetch: refetchAnterior,
  } = useMetricasMes(anioQuery === undefined ? undefined : anterior.anio, anioQuery === undefined ? undefined : anterior.mes);

  const isLoading = isLoadingActual || isLoadingAnterior;
  const isError = (isErrorActual || isErrorAnterior) && !isLoading;

  // Empty (4.2): todas las métricas del período en null → nota informativa.
  const todasNull =
    actual !== undefined &&
    actual.ingresos === null &&
    actual.horasTrabajadas === null &&
    actual.trabajosTerminados === null &&
    actual.presupuestosCreados === null &&
    actual.presupuestosAceptados === null;

  const handleReintentar = () => {
    void refetchActual();
    void refetchAnterior();
    void queryClient.invalidateQueries({ queryKey: ['metricas'] });
  };

  const handleCambioPeriodo = (anio: number, mes: number) => {
    setSearchParams({ periodo: formatPeriodo(anio, mes) }, { replace: true });
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8 animate-fade-in">
      {/* ================================================================= */}
      {/* Header                                                           */}
      {/* ================================================================= */}
      <header className="px-4 pt-4 pb-2 safe-area-top lg:pt-8 lg:pb-4">
        <div className="flex items-center gap-2">
          <button className="btn-icon" onClick={() => navigate('/')} aria-label="Volver">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold font-display">Métricas</h1>
        </div>
      </header>

      {/* Anuncia el período en curso al cambiar de mes (a11y 4.1.3). */}
      <p className="sr-only" aria-live="polite">
        Métricas de {nombreMes(periodoEfectivo.mes)} de {periodoEfectivo.anio}
      </p>

      {/* ================================================================= */}
      {/* Selector de período                                               */}
      {/* ================================================================= */}
      <section className="px-4 mb-3">
        <PeriodoSelector
          anio={periodoEfectivo.anio}
          mes={periodoEfectivo.mes}
          aniosDisponibles={aniosDisponibles}
          mesesDisponibles={mesesDisponibles}
          mesesPorAnio={mesesPorAnio}
          esMesActual={esMesActual}
          onChange={handleCambioPeriodo}
          onIrAlMesActual={() => handleCambioPeriodo(anioActual, mesActual)}
          disabled={isLoadingPeriodos}
        />
      </section>

      {/* ================================================================= */}
      {/* Contenido: loading / error / success                              */}
      {/* ================================================================= */}
      {isLoading ? (
        <div className="space-y-3 px-4">
          <div className="card !p-5">
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card !p-3">
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="px-4">
          <div className="card !p-5">
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              No pudimos cargar las métricas
            </p>
            <button type="button" className="btn-secondary mt-3" onClick={handleReintentar}>
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {/* Hero comparativo de ingresos — SIN enlace (el de /metricas no navega). */}
          <MetricCardComparativo
            variant="hero"
            label="Ingresos del mes"
            icono={TrendingUp}
            colorIcono="var(--color-accent)"
            formato="moneda"
            valorActual={actual?.ingresos ?? null}
            valorAnterior={datosAnterior?.ingresos ?? null}
            mesActual={nombreMes(periodoEfectivo.mes)}
            mesAnterior={nombreMes(anterior.mes)}
          />

          {/* Grid comparativo compartido con el Dashboard (cero drift). */}
          <MetricasGrid>
            {metricasGridConfig.map((m) => (
              <MetricCardComparativo
                key={m.key}
                label={m.label}
                icono={m.icono}
                colorIcono={m.colorIcono}
                formato={m.formato}
                valorActual={actual?.[m.key] ?? null}
                valorAnterior={datosAnterior?.[m.key] ?? null}
                mesActual={nombreMes(periodoEfectivo.mes)}
                mesAnterior={nombreMes(anterior.mes)}
              />
            ))}
          </MetricasGrid>

          {todasNull && (
            <p className="text-sm text-center" style={{ color: 'var(--color-muted)' }}>
              Sin actividad registrada en {nombreMes(periodoEfectivo.mes)} {periodoEfectivo.anio}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
