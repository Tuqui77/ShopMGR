import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTrabajos, useTrabajosPorCliente } from '../hooks/useTrabajos';
import { useCliente } from '../hooks/useClientes';
import { TrabajoCard } from '../components/TrabajoCard';
import clsx from 'clsx';
import { Wrench, Loader2, ArrowLeft } from 'lucide-react';

type FilterType = 'todos' | 'activos' | 'pendientes' | 'terminados';

export function Trabajos() {
  const [searchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('cliente');
  const clienteId = clienteIdParam ? parseInt(clienteIdParam, 10) : undefined;
  
  const allTrabajosQuery = useTrabajos();
  const clientTrabajosQuery = useTrabajosPorCliente(clienteId);
  const { data: clienteData } = useCliente(clienteId);
  const trabajos = clienteId !== undefined ? clientTrabajosQuery.data ?? [] : allTrabajosQuery.data ?? [];
  const isLoading = clienteId !== undefined ? clientTrabajosQuery.isLoading : allTrabajosQuery.isLoading;
  const error = clienteId !== undefined ? clientTrabajosQuery.error : allTrabajosQuery.error;
  
  const [filter, setFilter] = useState<FilterType>('todos');
  
  // Apply status filter only (backend already filters by client when clienteId is set)
  const filtered = trabajos.filter(t => {
    if (filter === 'activos') return t.estado === 'Iniciado';
    if (filter === 'pendientes') return t.estado === 'Pendiente';
    if (filter === 'terminados') return t.estado === 'Terminado';
    return true;
  });
  
  const counts = {
    todos: trabajos.length,
    activos: trabajos.filter(t => t.estado === 'Iniciado').length,
    pendientes: trabajos.filter(t => t.estado === 'Pendiente').length,
    terminados: trabajos.filter(t => t.estado === 'Terminado').length,
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
        <div className="flex items-center gap-3 mb-4">
          {clienteId !== undefined ? (
            <Link to={`/clientes/${clienteId}`} className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
            </Link>
          ) : (
            <div className="p-2 -ml-2" />
          )}
          <h1 className="text-xl font-bold font-display flex-1">
            {clienteId !== undefined && clienteData ? `Trabajos · ${clienteData.nombreCompleto}` : 'Trabajos'}
          </h1>
        </div>
        
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
                  <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>En curso</h2>
                </div>
                <div className="space-y-3">
                  {activeTrabajos.map(trabajo => (
                    <TrabajoCard 
                      key={trabajo.id} 
                      trabajo={trabajo}
                      hideClientName={clienteId !== undefined}
                    />
                  ))}
                </div>
              </>
            )}
            
            {pendingTrabajos.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Pendientes</h2>
                </div>
                <div className="space-y-3">
                  {pendingTrabajos.map(trabajo => (
                    <TrabajoCard 
                      key={trabajo.id} 
                      trabajo={trabajo}
                      hideClientName={clienteId !== undefined}
                    />
                  ))}
                </div>
              </>
            )}
            
            {completedTrabajos.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-medium" style={{ color: 'var(--color-muted)' }}>Terminados</h2>
                </div>
                <div className="space-y-3">
                  {completedTrabajos.map(trabajo => (
                    <TrabajoCard 
                      key={trabajo.id} 
                      trabajo={trabajo}
                      hideClientName={clienteId !== undefined}
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
            
            {trabajos.length === 0 && clienteId === undefined && (
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
                hideClientName={clienteId !== undefined}
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
