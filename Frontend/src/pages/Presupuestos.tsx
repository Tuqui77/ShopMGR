import { useState } from 'react';
import { useStore } from '../store';
import clsx from 'clsx';
import type { Presupuesto } from '../types';
import { Clipboard, Clock } from 'lucide-react';

type FilterType = 'todos' | 'pendientes' | 'aceptados' | 'rechazados';

export function Presupuestos() {
  const { presupuestos } = useStore();
  const [filter, setFilter] = useState<FilterType>('todos');
  
  const filtered = presupuestos.filter(p => {
    if (filter === 'pendientes') return p.estado === 'Pendiente';
    if (filter === 'aceptados') return p.estado === 'Aceptado';
    if (filter === 'rechazados') return p.estado === 'Rechazado';
    return true;
  });
  
  const counts = {
    todos: presupuestos.length,
    pendientes: presupuestos.filter(p => p.estado === 'Pendiente').length,
    aceptados: presupuestos.filter(p => p.estado === 'Aceptado').length,
    rechazados: presupuestos.filter(p => p.estado === 'Rechazado').length,
  };
  
  const getStatusBadge = (estado: Presupuesto['estado']) => {
    switch (estado) {
      case 'Pendiente':
        return <span className="badge badge-pending">Pendiente</span>;
      case 'Aceptado':
        return <span className="badge badge-success">Aceptado</span>;
      case 'Rechazado':
        return <span className="badge badge-danger">Rechazado</span>;
    }
  };
  
  return (
    <div className="min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="p-4 safe-area-top lg:pt-8 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-page)' }}>
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
          <div key={presupuesto.id} className="card">
                <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate" style={{ color: 'var(--color-text)' }}>{presupuesto.titulo}</h3>
                </div>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{presupuesto.cliente.nombreCompleto}</p>
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
                  <button className="btn-secondary text-sm">Enviar</button>
                  <button className="btn-secondary text-sm">Editar</button>
                </>
              )}
            </div>
          </div>
        ))}
        
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Clipboard className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-muted)', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-muted)' }}>No hay presupuestos</p>
          </div>
        )}
      </section>
    </div>
  );
}
