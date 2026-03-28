import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTrabajos } from '../hooks/useTrabajos';
import { TrabajoCard } from '../components/TrabajoCard';
import clsx from 'clsx';
import { Wrench, Loader2, ArrowLeft } from 'lucide-react';

type FilterType = 'todos' | 'activos' | 'pendientes' | 'terminados';

export function Trabajos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('cliente');
  const clienteId = clienteIdParam ? parseInt(clienteIdParam, 10) : undefined;
  
  const { data: trabajos = [], isLoading, error } = useTrabajos();
  const [filter, setFilter] = useState<FilterType>('todos');
  
  // Filter by client if provided
  const filtered = trabajos.filter(t => {
    // Filter by client first
    if (clienteId !== undefined && t.clienteId !== clienteId) return false;
    
    // Then apply status filter
    if (filter === 'activos') return t.estado === 'Iniciado';
    if (filter === 'pendientes') return t.estado === 'Pendiente';
    if (filter === 'terminados') return t.estado === 'Terminado';
    return true;
  });
  
  const counts = {
    todos: clienteId !== undefined 
      ? filtered.length 
      : trabajos.length,
    activos: trabajos.filter(t => 
      (clienteId === undefined || t.clienteId === clienteId) && 
      t.estado === 'Iniciado'
    ).length,
    pendientes: trabajos.filter(t => 
      (clienteId === undefined || t.clienteId === clienteId) && 
      t.estado === 'Pendiente'
    ).length,
    terminados: trabajos.filter(t => 
      (clienteId === undefined || t.clienteId === clienteId) && 
      t.estado === 'Terminado'
    ).length,
  };
  
  const handleClearClientFilter = () => {
    setSearchParams({});
  };
  
  const activeTrabajos = filtered.filter(t => t.estado === 'Iniciado');
  const pendingTrabajos = filtered.filter(t => t.estado === 'Pendiente');
  const completedTrabajos = filtered.filter(t => t.estado === 'Terminado');
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <Wrench className="w-12 h-12 mb-4" style={{ color: 'var(--color-danger)', opacity: 0.7 }} />
        <p className="text-lg mb-2" style={{ color: 'var(--color-danger)' }}>
          Error al cargar trabajos
        </p>
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          ¿El backend está corriendo?
        </p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
        {/* Client filter indicator */}
        {clienteId !== undefined && (
          <button
            onClick={handleClearClientFilter}
            className="flex items-center gap-1 text-sm mb-3 hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Ver todos los trabajos
          </button>
        )}
        
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
                    />
                  ))}
                </div>
              </>
            )}
            
            {filtered.length === 0 && clienteId !== undefined && (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
                <p style={{ color: 'var(--color-muted)' }}>No hay trabajos para este cliente</p>
              </div>
            )}
            
            {trabajos.length === 0 && (
              <div className="text-center py-12">
                <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
                <p style={{ color: 'var(--color-muted)' }}>No hay trabajos</p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                  Crea uno desde un cliente
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {filtered.map(trabajo => (
              <TrabajoCard 
                key={trabajo.id} 
                trabajo={trabajo}
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
