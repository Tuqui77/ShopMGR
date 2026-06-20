import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import type { EstadoPresupuesto } from '../types';
import { usePresupuestos, usePresupuestosPorCliente } from '../hooks/usePresupuestos';
import { useCliente } from '../hooks/useClientes';
import { Clipboard, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '../utils/dateFormat';

type FilterType = 'todos' | 'pendientes' | 'aceptados' | 'rechazados';

export function Presupuestos() {
  const [searchParams] = useSearchParams();
  const clienteIdParam = searchParams.get('cliente');
  const clienteId = clienteIdParam ? parseInt(clienteIdParam, 10) : undefined;
  
  // Use the correct hook based on whether we're filtering by client
  const allPresupuestosQuery = usePresupuestos();
  const clientPresupuestosQuery = usePresupuestosPorCliente(clienteId);
  const { data: clienteData } = useCliente(clienteId);
  const presupuestos = clienteId !== undefined ? clientPresupuestosQuery.data : allPresupuestosQuery.data;
  const isLoading = clienteId !== undefined ? clientPresupuestosQuery.isLoading : allPresupuestosQuery.isLoading;
  const error = clienteId !== undefined ? clientPresupuestosQuery.error : allPresupuestosQuery.error;
  
  const [filter, setFilter] = useState<FilterType>('todos');
  
  // Filter by status (backend already filters by client if clienteId is provided)
  const filtered = presupuestos?.filter(p => {
    if (filter === 'pendientes') return p.estado === 'Pendiente';
    if (filter === 'aceptados') return p.estado === 'Aceptado';
    if (filter === 'rechazados') return p.estado === 'Rechazado';
    return true;
  }) || [];
  
  const allData = presupuestos || [];
  const counts = {
    todos: allData.length,
    pendientes: allData.filter(p => p.estado === 'Pendiente').length,
    aceptados: allData.filter(p => p.estado === 'Aceptado').length,
    rechazados: allData.filter(p => p.estado === 'Rechazado').length,
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
        <div className="flex items-center gap-3 mb-4">
          {clienteId !== undefined ? (
            <Link to={`/clientes/${clienteId}`} className="p-2 -ml-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors">
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text)' }} />
            </Link>
          ) : (
            <div className="p-2 -ml-2" />
          )}
          <h1 className="text-xl font-bold font-display flex-1">
            {clienteId !== undefined && clienteData ? `Presupuestos · ${clienteData.nombreCompleto}` : 'Presupuestos'}
          </h1>
        </div>
        
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
            <div className="card hover:bg-[var(--color-hover)] transition-colors duration-200">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{presupuesto.titulo}</h3>
                  {clienteId === undefined && (
                    <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{presupuesto.cliente?.nombreCompleto || 'Sin cliente'}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-sm" style={{ color: 'var(--color-accent)' }}>{formatCurrency(presupuesto.total)}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted)' }}><Clock className="w-3 h-3" /> {presupuesto.horasEstimadas}h</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {getStatusBadge(presupuesto.estado)}
                </div>
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