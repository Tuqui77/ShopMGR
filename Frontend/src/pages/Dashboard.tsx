import { Settings, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useTrabajos } from '../hooks/useTrabajos';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { formatDate } from '../utils/dateFormat';

export function Dashboard() {
  const navigate = useNavigate();
  const { setShowHoursModal, setSelectedTrabajo } = useStore();
  
  // Obtener trabajos del backend
  const { data: trabajos, isLoading: isLoadingTrabajos } = useTrabajos();
  
  // Obtener métricas calculadas
  const { metricas, isLoading: isLoadingMetricas } = useDashboardMetrics();
  
  const isLoading = isLoadingTrabajos || isLoadingMetricas;
  
  // Filtrar trabajos activos (Iniciado o Pendiente)
  const activeTrabajos = trabajos?.filter(t => t.estado === 'Iniciado' || t.estado === 'Pendiente') || [];
  
  const handleRegisterHours = (trabajo: { id: number; titulo: string; estado: string }) => {
    setSelectedTrabajo(trabajo as any);
    setShowHoursModal(true);
  };
  
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="p-4 safe-area-top lg:pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display">Buenos días, Juan</h1>
            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
              {new Date().toLocaleDateString('es-AR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}, {formatDate(new Date())}
            </p>
          </div>
          <button className="btn-icon">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Metrics - Compact version */}
      <section className="px-4 mb-4">
        <h2 className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>ESTE MES</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-accent)' }} />
          </div>
        ) : metricas ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="card !p-3">
              <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-accent)' }}>
                ${metricas.ingresos >= 1000 ? metricas.ingresos.toLocaleString() : metricas.ingresos}
              </span>
              <span className="text-xs block" style={{ color: 'var(--color-muted)' }}>Ingresos</span>
            </div>
            <div className="card !p-3">
              <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-text)' }}>
                {metricas.horasTrabajadas}
              </span>
              <span className="text-xs block" style={{ color: 'var(--color-muted)' }}>Horas trabajadas</span>
            </div>
            <div className="card !p-3">
              <span className="font-mono text-lg font-bold" style={{ color: 'var(--color-success)' }}>
                {metricas.trabajosTerminados}
              </span>
              <span className="text-xs block" style={{ color: 'var(--color-muted)' }}>Trabajos terminados</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2" style={{ color: 'var(--color-muted)' }}>
            Sin datos
          </div>
        )}
      </section>
      
      {/* Active Jobs - Compact version */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>TRABAJOS ACTIVOS</h2>
          <button 
            className="text-xs" 
            style={{ color: 'var(--color-accent)' }}
            onClick={() => navigate('/trabajos')}
          >
            Ver todos
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-accent)' }} />
          </div>
        ) : activeTrabajos.length > 0 ? (
          <div className="space-y-2">
            {activeTrabajos.slice(0, 4).map(trabajo => (
              <div 
                key={trabajo.id}
                className="card !p-3 flex items-center justify-between cursor-pointer"
                onClick={() => navigate(`/trabajos/${trabajo.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--color-text)' }}>
                    {trabajo.titulo}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--color-muted)' }}>
                    {trabajo.cliente?.nombreCompleto || 'Sin cliente'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`status-dot ${trabajo.estado}`} />
                  <button 
                    className="btn-icon !w-8 !h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegisterHours(trabajo);
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4" style={{ color: 'var(--color-muted)' }}>
            No hay trabajos activos
          </div>
        )}
      </section>
    </div>
  );
}