import { Zap, Clipboard, Settings, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { MetricCard } from '../components/MetricCard';
import { TrabajoCard } from '../components/TrabajoCard';
import { useTrabajos } from '../hooks/useTrabajos';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

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
              })}
            </p>
          </div>
          <button className="btn-icon">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      {/* Quick Actions */}
      <section className="px-4 mb-6 space-y-3">
        <button 
          onClick={() => setShowHoursModal(true)}
          className="quick-action w-full"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 20%, transparent)' }}>
            <Zap className="w-6 h-6" style={{ color: 'var(--color-accent)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold">Registrar Horas</p>
            <p className="text-sm">Registro rápido</p>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
        </button>
        
        <button 
          className="quick-action w-full"
          onClick={() => navigate('/clientes')}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-info) 20%, transparent)' }}>
            <Clipboard className="w-6 h-6" style={{ color: 'var(--color-info)' }} />
          </div>
          <div className="flex-1 text-left">
            <p className="font-semibold">Nuevo Trabajo</p>
            <p className="text-sm">Crear desde cliente</p>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
        </button>
      </section>
      
      {/* Metrics */}
      <section className="px-4 mb-6">
        <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--color-muted)' }}>MÉTRICAS DEL MES</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
          </div>
        ) : metricas ? (
          <div className="flex gap-3">
            <MetricCard 
              value={metricas.ingresos} 
              label="Ingresos" 
              prefix="$"
              change={metricas.cambiosIngresos || undefined}
            />
            <MetricCard 
              value={metricas.horasTrabajadas} 
              label="Trabajadas" 
              change={metricas.cambiosHoras || undefined}
            />
            <MetricCard 
              value={metricas.trabajosTerminados} 
              label="Terminados" 
              change={metricas.cambiosTerminados || undefined}
            />
          </div>
        ) : (
          <div className="text-center py-4" style={{ color: 'var(--color-muted)' }}>
            No hay datos disponibles
          </div>
        )}
      </section>
      
      {/* Active Jobs */}
      <section className="px-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>TRABAJOS ACTIVOS</h2>
          <button 
            className="text-sm" 
            style={{ color: 'var(--color-accent)' }}
            onClick={() => navigate('/trabajos')}
          >
            Ver todos →
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--color-accent)' }} />
          </div>
        ) : activeTrabajos.length > 0 ? (
          <div className="space-y-3">
            {activeTrabajos.slice(0, 3).map(trabajo => (
              <TrabajoCard 
                key={trabajo.id} 
                trabajo={trabajo}
                onRegisterHours={() => handleRegisterHours(trabajo)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8" style={{ color: 'var(--color-muted)' }}>
            No hay trabajos activos
          </div>
        )}
      </section>
    </div>
  );
}