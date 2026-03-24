import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import type { EstadoPresupuesto } from '../types';
import { usePresupuestos, useAceptarPresupuesto, useRechazarPresupuesto } from '../hooks/usePresupuestos';
import { Clipboard, Clock, Loader2, ArrowLeft } from 'lucide-react';

type FilterType = 'todos' | 'pendientes' | 'aceptados' | 'rechazados';

export function Presupuestos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('cliente');
  const clienteId = clienteIdParam ? parseInt(clienteIdParam, 10) : undefined;
  
  const { data: presupuestos, isLoading, error } = usePresupuestos();
  const [filter, setFilter] = useState<FilterType>('todos');
  
  const aceptarMutation = useAceptarPresupuesto();
  const rechazarMutation = useRechazarPresupuesto();
  
  // Filter by client if provided
  const filtered = presupuestos?.filter(p => {
    // Filter by client first
    if (clienteId !== undefined && p.cliente?.id !== clienteId) return false;
    
    // Then apply status filter
    if (filter === 'pendientes') return p.estado === 'Pendiente';
    if (filter === 'aceptados') return p.estado === 'Aceptado';
    if (filter === 'rechazados') return p.estado === 'Rechazado';
    return true;
  }) || [];
  
  const counts = {
    todos: presupuestos?.length || 0,
    pendientes: presupuestos?.filter(p => p.estado === 'Pendiente').length || 0,
    aceptados: presupuestos?.filter(p => p.estado === 'Aceptado').length || 0,
    rechazados: presupuestos?.filter(p => p.estado === 'Rechazado').length || 0,
  };
  
  const handleClearClientFilter = () => {
    setSearchParams({});
  };
  
  const getStatusBadge = (estado: EstadoPresupuesto) => {
    switch (estado) {
      case 'Pendiente':
        return <span className="badge badge-pending">Pendiente</span>;
      case 'Aceptado':
        return <span className="badge badge-success">Aceptado</span>;
      case 'Rechazado':
        return <span className="badge badge-danger">Rechazado</span>;
    }
  };

  const handleAceptar = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    aceptarMutation.mutate(id);
  };

  const handleRechazar = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    rechazarMutation.mutate(id);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24 lg:pb-8 flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: 'var(--color-danger)' }}>Error al cargar presupuestos</p>
        </div>
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
            Ver todos los presupuestos
          </button>
        )}
        
        <h1 className="text-xl font-bold font-display mb-4">Presupuestos</h1>
        
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {([
            { key: 'todos', label: 'Todos' },
            { key: 'pendientes', label: 'Pend.' },
            { key: 'aceptados', label: 'Acept.' },
            { key: 'rechazados', label: 'Rechaz.' },
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
      
      {/* List */}
      <section className="px-4 space-y-3">
        {filtered.map(presupuesto => (
          <Link 
            key={presupuesto.id} 
            to={`/presupuestos/${presupuesto.id}`}
            className="block"
          >
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{presupuesto.titulo}</h3>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{presupuesto.cliente?.nombreCompleto || 'Sin cliente'}</p>
                </div>
                {getStatusBadge(presupuesto.estado)}
              </div>
              
              <div className="mt-3 flex justify-between text-sm">
                <span className="font-mono" style={{ color: 'var(--color-accent)' }}>${presupuesto.total.toLocaleString()}</span>
                <span className="flex items-center gap-1" style={{ color: 'var(--color-muted)' }}><Clock className="w-3 h-3" /> {presupuesto.horasEstimadas}h</span>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary flex-1 text-sm">Ver</button>
                {presupuesto.estado === 'Pendiente' && (
                  <>
                    <button 
                      className="btn-secondary text-sm"
                      onClick={(e) => handleAceptar(presupuesto.id, e)}
                      disabled={aceptarMutation.isPending}
                    >
                      {aceptarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Aceptar'}
                    </button>
                    <button 
                      className="btn-secondary text-sm"
                      onClick={(e) => handleRechazar(presupuesto.id, e)}
                      disabled={rechazarMutation.isPending}
                    >
                      {rechazarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Rechazar'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </Link>
        ))}
        
        {filtered.length === 0 && clienteId !== undefined && (
          <div className="text-center py-12">
            <Clipboard className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-muted)' }}>No hay presupuestos para este cliente</p>
          </div>
        )}
        
        {filtered.length === 0 && clienteId === undefined && (
          <div className="text-center py-12">
            <Clipboard className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-muted)' }}>No hay presupuestos</p>
          </div>
        )}
      </section>
    </div>
  );
}