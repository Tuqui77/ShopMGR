import { Settings, Loader2, Clock, TrendingUp, Timer, CheckCircle2, FileText, ClipboardCheck, Check, X, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useTrabajosActivos, useIniciarTrabajo } from '../hooks/useTrabajos';
import { usePresupuestosPorEstado, useAceptarPresupuesto, useRechazarPresupuesto } from '../hooks/usePresupuestos';
import { formatCurrency } from '../utils/dateFormat';
import type { Trabajo } from '../types';

// ============================================================================
// Helpers
// ============================================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
}

function getTodayDate(): string {
  return new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

// ============================================================================
// Dashboard Component
// ============================================================================

export function Dashboard() {
  const navigate = useNavigate();
  const { setShowHoursModal, setSelectedTrabajo } = useStore();
  const { data: metricas, isLoading: isLoadingMetricas } = useDashboardMetrics();
  const { data: trabajosActivos, isLoading: isLoadingTrabajos } = useTrabajosActivos();

  const queryClient = useQueryClient();
  const { data: presupuestosPendientes, isLoading: isLoadingPresupuestos } = usePresupuestosPorEstado('Pendiente');
  const aceptarMutation = useAceptarPresupuesto({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
    },
  });
  const rechazarMutation = useRechazarPresupuesto();
  const iniciarMutation = useIniciarTrabajo();

  const handleRegisterHours = (trabajo: Trabajo) => {
    setSelectedTrabajo(trabajo);
    setShowHoursModal(true);
  };

  return (
    <div className="min-h-screen pb-24 lg:pb-8 animate-fade-in">
      {/* ================================================================= */}
      {/* Header                                                           */}
      {/* ================================================================= */}
      <header className="px-4 pt-4 pb-2 safe-area-top lg:pt-8 lg:pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">
              {getGreeting()}
            </h1>
            <p className="text-sm capitalize" style={{ color: 'var(--color-muted)' }}>
              {getTodayDate()}
            </p>
          </div>
          <button
            className="btn-icon lg:!hidden"
            onClick={() => navigate('/configuracion')}
            aria-label="Configuración"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ================================================================= */}
      {/* Hero Metric — Ingresos del mes                                  */}
      {/* ================================================================= */}
      <section className="px-4 mb-3">
        {isLoadingMetricas ? (
          <div className="card !p-5">
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
            </div>
          </div>
        ) : metricas ? (
          <div
            className="card !p-5 border flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
            style={{
              borderColor: 'var(--color-accent)',
              borderWidth: '1px',
              background: 'var(--color-card)',
            }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Ingresos del mes
              </span>
            </div>
            <span
              className="font-mono text-3xl font-bold lg:text-4xl lg:text-right"
              style={{ color: 'var(--color-accent)' }}
            >
              {formatCurrency(metricas.ingresos)}
            </span>
          </div>
        ) : (
          <div className="card !p-5">
            <div className="text-center py-4" style={{ color: 'var(--color-muted)' }}>
              Sin datos de ingresos
            </div>
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* Secondary Metrics — 2x2 grid                                    */}
      {/* ================================================================= */}
      <section className="px-4 mb-4">
        {isLoadingMetricas ? (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card !p-3">
                <div className="flex justify-center py-3">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : metricas ? (
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {/* Horas trabajadas */}
            <div className="card !p-3 hover:bg-[var(--color-hover)] transition-colors duration-200">
              <div className="flex items-center gap-1.5 mb-1">
                <Timer className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Horas trabajadas</span>
              </div>
              <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {metricas.horasTrabajadas.toFixed(1)}
                <span className="text-xs font-normal" style={{ color: 'var(--color-muted)' }}> hs</span>
              </span>
            </div>

            {/* Trabajos terminados */}
            <div className="card !p-3 hover:bg-[var(--color-hover)] transition-colors duration-200">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--color-success)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Trabajos terminados</span>
              </div>
              <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>
                {metricas.trabajosTerminados}
              </span>
            </div>

            {/* Presupuestos creados */}
            <div className="card !p-3 hover:bg-[var(--color-hover)] transition-colors duration-200">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Presupuestos creados</span>
              </div>
              <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {metricas.presupuestosCreados}
              </span>
            </div>

            {/* Presupuestos aceptados */}
            <div className="card !p-3 hover:bg-[var(--color-hover)] transition-colors duration-200">
              <div className="flex items-center gap-1.5 mb-1">
                <ClipboardCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-info)' }} />
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Presupuestos aceptados</span>
              </div>
              <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-info)' }}>
                {metricas.presupuestosAceptados}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4" style={{ color: 'var(--color-muted)' }}>
            No hay métricas disponibles
          </div>
        )}
      </section>

      {/* ================================================================= */}
      {/* Active Jobs + Pending Budgets (side by side on desktop)        */}
      {/* ================================================================= */}
      <section className="px-4 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* ============================================================= */}
          {/* Left: Active Jobs                                            */}
          {/* ============================================================= */}
          <div className="card !p-3 self-start">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Trabajos activos
              </h2>
              <button
                className="text-xs font-medium hover:bg-[var(--color-hover)] px-2 py-1 rounded-lg transition-colors duration-200"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => navigate('/trabajos')}
              >
                Ver todos
              </button>
            </div>

            {isLoadingTrabajos ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-accent)' }} />
              </div>
            ) : trabajosActivos && trabajosActivos.length > 0 ? (
              <div className="space-y-1.5">
                {trabajosActivos.map((trabajo) => (
                  <div
                    key={trabajo.id}
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--color-hover)] transition-colors duration-200"
                    onClick={() => navigate(`/trabajos/${trabajo.id}`)}
                  >
                    {/* Status indicator */}
                    <span className={`status-dot ${trabajo.estado} flex-shrink-0`} />

                    {/* Job info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{trabajo.titulo}</p>
                      <p className="text-xs truncate leading-tight" style={{ color: 'var(--color-muted)' }}>
                        {trabajo.cliente?.nombreCompleto || 'Sin cliente'}
                      </p>
                    </div>

                    {/* Action buttons */}
                    {trabajo.estado === 'Iniciado' ? (
                      <button
                        className="btn-icon !w-7 !h-7 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegisterHours(trabajo);
                        }}
                        aria-label="Registrar horas"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        className="btn-icon !w-7 !h-7 flex-shrink-0"
                        style={{ color: 'var(--color-success)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          iniciarMutation.mutate(trabajo.id);
                        }}
                        disabled={iniciarMutation.isPending}
                        aria-label="Iniciar trabajo"
                      >
                        {iniciarMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3" style={{ color: 'var(--color-muted)' }}>
                <p className="text-xs">Sin trabajos activos</p>
                <button
                  className="text-xs font-medium mt-1.5 hover:bg-[var(--color-hover)] px-2 py-1 rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--color-accent)' }}
                  onClick={() => navigate('/trabajos')}
                >
                  Crear uno
                </button>
              </div>
            )}
          </div>

          {/* ============================================================= */}
          {/* Right: Pending Budgets                                       */}
          {/* ============================================================= */}
          <div className="card !p-3 self-start">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
                Presupuestos pendientes
              </h2>
              <button
                className="text-xs font-medium hover:bg-[var(--color-hover)] px-2 py-1 rounded-lg transition-colors duration-200"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => navigate('/presupuestos')}
              >
                Ver todos
              </button>
            </div>

            {isLoadingPresupuestos ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-accent)' }} />
              </div>
            ) : presupuestosPendientes && presupuestosPendientes.length > 0 ? (
              <div className="space-y-1.5">
                {presupuestosPendientes.map((presupuesto) => (
                  <div
                    key={presupuesto.id}
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-[var(--color-hover)] transition-colors duration-200"
                    onClick={() => navigate(`/presupuestos/${presupuesto.id}`)}
                  >
                    {/* Budget info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{presupuesto.titulo}</p>
                      <p className="text-xs truncate leading-tight" style={{ color: 'var(--color-muted)' }}>
                        {presupuesto.cliente?.nombreCompleto || 'Sin cliente'} · {formatCurrency(presupuesto.total)}
                      </p>
                    </div>

                    {/* Accept / Reject buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="btn-icon !w-7 !h-7"
                        style={{ color: 'var(--color-success)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          aceptarMutation.mutate(presupuesto.id);
                        }}
                        disabled={aceptarMutation.isPending}
                        aria-label="Aceptar presupuesto"
                      >
                        {aceptarMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        className="btn-icon !w-7 !h-7"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          rechazarMutation.mutate(presupuesto.id, {
                            onSuccess: () => queryClient.invalidateQueries({ queryKey: ['metricas'] }),
                          });
                        }}
                        disabled={rechazarMutation.isPending}
                        aria-label="Rechazar presupuesto"
                      >
                        {rechazarMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3" style={{ color: 'var(--color-muted)' }}>
                <p className="text-xs">Sin presupuestos pendientes</p>
                <button
                  className="text-xs font-medium mt-1.5 hover:bg-[var(--color-hover)] px-2 py-1 rounded-lg transition-colors duration-200"
                  style={{ color: 'var(--color-accent)' }}
                  onClick={() => navigate('/presupuestos')}
                >
                  Crear uno
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
