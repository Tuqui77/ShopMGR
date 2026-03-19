import { useState } from 'react';
import { useStore } from '../store';
import { TrabajoCard } from '../components/TrabajoCard';
import clsx from 'clsx';
import { Wrench } from 'lucide-react';

type FilterType = 'todos' | 'activos' | 'pendientes' | 'terminados';

export function Trabajos() {
  const { trabajos, setShowHoursModal, setSelectedTrabajo } = useStore();
  const [filter, setFilter] = useState<FilterType>('todos');
  
  const filtered = trabajos.filter(t => {
    if (filter === 'activos') return t.estado === 'iniciado';
    if (filter === 'pendientes') return t.estado === 'pendiente';
    if (filter === 'terminados') return t.estado === 'terminado';
    return true;
  });
  
  const counts = {
    todos: trabajos.length,
    activos: trabajos.filter(t => t.estado === 'iniciado').length,
    pendientes: trabajos.filter(t => t.estado === 'pendiente').length,
    terminados: trabajos.filter(t => t.estado === 'terminado').length,
  };
  
  const handleRegisterHours = (trabajo: typeof trabajos[0]) => {
    setSelectedTrabajo(trabajo);
    setShowHoursModal(true);
  };
  
  const activeTrabajos = filtered.filter(t => t.estado === 'iniciado');
  const pendingTrabajos = filtered.filter(t => t.estado === 'pendiente');
  const completedTrabajos = filtered.filter(t => t.estado === 'terminado');
  
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        <h1 className="text-xl font-bold font-display mb-4">Trabajos</h1>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: 'todos', label: 'Todos' },
            { key: 'activos', label: 'Activos' },
            { key: 'pendientes', label: 'Pend.' },
            { key: 'terminados', label: 'Termin.' },
          ] as { key: FilterType; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={clsx('filter-pill', filter === f.key && 'active')}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
      </header>
      
      {/* Jobs List */}
      <section className="px-4 space-y-6">
        {filter === 'todos' ? (
          <>
            {activeTrabajos.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>EN CURSO</h2>
                </div>
                <div className="space-y-3">
                  {activeTrabajos.map(trabajo => (
                    <TrabajoCard 
                      key={trabajo.id} 
                      trabajo={trabajo}
                      onRegisterHours={() => handleRegisterHours(trabajo)}
                    />
                  ))}
                </div>
              </>
            )}
            
            {pendingTrabajos.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>PENDIENTES</h2>
                </div>
                <div className="space-y-3">
                  {pendingTrabajos.map(trabajo => (
                    <TrabajoCard 
                      key={trabajo.id} 
                      trabajo={trabajo}
                      onRegisterHours={() => handleRegisterHours(trabajo)}
                    />
                  ))}
                </div>
              </>
            )}
            
            {completedTrabajos.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>TERMINADOS</h2>
                </div>
                <div className="space-y-3">
                  {completedTrabajos.map(trabajo => (
                    <TrabajoCard 
                      key={trabajo.id} 
                      trabajo={trabajo}
                      onRegisterHours={() => handleRegisterHours(trabajo)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {filtered.map(trabajo => (
              <TrabajoCard 
                key={trabajo.id} 
                trabajo={trabajo}
                onRegisterHours={() => handleRegisterHours(trabajo)}
              />
            ))}
            
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
                <p style={{ color: 'var(--color-muted)' }}>No hay trabajos</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
